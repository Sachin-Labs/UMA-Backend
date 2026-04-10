const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../utils/logger');

/**
 * Production-grade email service using Nodemailer.
 *
 * Supports 3 provider modes via EMAIL_PROVIDER env var:
 *   - 'console'  : Logs email to terminal (dev, no SMTP needed)
 *   - 'ethereal' : Fake SMTP + clickable preview URL (local testing)
 *   - 'smtp'     : Real SMTP delivery (Brevo / any provider)
 *
 * Features: connection pooling, rate limiting, dedup cooldown,
 *           retry with backoff, email validation, error classification.
 */
class EmailService {
    constructor() {
        this.provider = env.EMAIL_PROVIDER;
        this.from = env.EMAIL_FROM;
        this.transporter = null;
        this.ready = false;

        // --- Rate limiting (token bucket) ---
        this.rateLimitMax = 10;          // max burst
        this.rateLimitTokens = this.rateLimitMax;
        this.rateLimitPerSecond = 10;    // refill rate
        this._startTokenRefill();

        // --- Dedup cooldown (in-memory) ---
        this.dedupMap = new Map();       // key -> timestamp
        this.dedupCooldownMs = 5 * 60 * 1000; // 5 minutes
        this._startDedupCleanup();

        // Initialise transport (async, non-blocking)
        this._initTransport();
    }

    // -------------------------------------------------------
    //  Transport Initialisation
    // -------------------------------------------------------

    async _initTransport() {
        try {
            if (this.provider === 'ethereal') {
                // Auto-generate a disposable test account
                const testAccount = await nodemailer.createTestAccount();
                this.transporter = nodemailer.createTransport({
                    host: testAccount.smtp.host,
                    port: testAccount.smtp.port,
                    secure: testAccount.smtp.secure,
                    auth: {
                        user: testAccount.user,
                        pass: testAccount.pass,
                    },
                    connectionTimeout: 10000,
                    greetingTimeout: 10000,
                });
                this.ready = true;
                logger.info(`📧 Ethereal email active — preview inbox: https://ethereal.email/login`);
                logger.info(`   Ethereal credentials — user: ${testAccount.user}, pass: ${testAccount.pass}`);

            } else if (this.provider === 'smtp') {
                if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
                    logger.error('❌ SMTP config missing: SMTP_HOST, SMTP_USER, SMTP_PASS are required when EMAIL_PROVIDER=smtp');
                    return;
                }
                this.transporter = nodemailer.createTransport({
                    host: env.SMTP_HOST,
                    port: env.SMTP_PORT,
                    secure: env.SMTP_PORT === 465,
                    auth: {
                        user: env.SMTP_USER,
                        pass: env.SMTP_PASS,
                    },
                    pool: true,
                    maxConnections: 5,
                    connectionTimeout: 10000,
                    greetingTimeout: 10000,
                });

                // Verify connection on startup
                await this.transporter.verify();
                this.ready = true;
                logger.info(`✅ SMTP transport verified (${env.SMTP_HOST}:${env.SMTP_PORT})`);

            } else {
                // console mode — no transport needed
                this.ready = true;
                logger.info('📧 Email provider: console (emails logged to terminal)');
            }
        } catch (error) {
            logger.error(`❌ Email transport init failed: ${error.message}`);
            // Server still starts — emails will fail gracefully
        }
    }

    // -------------------------------------------------------
    //  Core Send Method
    // -------------------------------------------------------

    async send({ to, subject, html, text }) {
        // 1. Validate email
        if (!this._isValidEmail(to)) {
            throw new Error(`Invalid recipient email: ${to}`);
        }

        // 2. Dedup check
        const dedupKey = `${to}::${subject}`;
        if (this._isDuplicate(dedupKey)) {
            logger.warn(`⚠️ Duplicate email skipped (cooldown active): ${to} — "${subject}"`);
            return { skipped: true, reason: 'duplicate_cooldown' };
        }

        // 3. Console mode — just log
        if (this.provider === 'console') {
            return this._sendToConsole({ to, subject, html, text });
        }

        // 4. Check transport readiness
        if (!this.ready || !this.transporter) {
            logger.error('❌ Email transport not ready. Email not sent.');
            throw new Error('Email transport not initialised');
        }

        // 5. Rate limit
        await this._waitForRateLimit();

        // 6. Send with retry
        const message = { from: this.from, to, subject, html, text };
        const result = await this._sendWithRetry(message, 3);

        // 7. Record dedup
        this.dedupMap.set(dedupKey, Date.now());

        return result;
    }

    // -------------------------------------------------------
    //  Send Strategies
    // -------------------------------------------------------

    async _sendWithRetry(message, maxRetries) {
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const info = await this.transporter.sendMail(message);
                logger.info(`📧 Email sent to ${message.to} (attempt ${attempt})`);

                // Ethereal: log the preview URL
                if (this.provider === 'ethereal') {
                    const previewUrl = nodemailer.getTestMessageUrl(info);
                    logger.info(`🔗 Preview: ${previewUrl}`);
                }

                return { success: true, messageId: info.messageId };
            } catch (error) {
                lastError = error;

                if (this._isPermanentError(error)) {
                    logger.error(`❌ Permanent email error (attempt ${attempt}): ${error.message}`);
                    throw error; // Don't retry auth/validation failures
                }

                if (attempt < maxRetries) {
                    const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
                    logger.warn(`⚠️ Email attempt ${attempt} failed, retrying in ${delay}ms: ${error.message}`);
                    await this._sleep(delay);
                }
            }
        }

        logger.error(`❌ Email to ${message.to} failed after ${maxRetries} attempts: ${lastError.message}`);
        throw lastError;
    }

    _sendToConsole({ to, subject, html, text }) {
        logger.info('--- EMAIL (Console Provider) ---');
        logger.info(`To: ${to}`);
        logger.info(`From: ${this.from}`);
        logger.info(`Subject: ${subject}`);
        logger.info(`Body: ${text || html}`);
        logger.info('--- END EMAIL ---');
        return { success: true, provider: 'console' };
    }

    // -------------------------------------------------------
    //  Rate Limiting (Token Bucket)
    // -------------------------------------------------------

    _startTokenRefill() {
        this._refillInterval = setInterval(() => {
            this.rateLimitTokens = Math.min(this.rateLimitMax, this.rateLimitTokens + this.rateLimitPerSecond);
        }, 1000);
        // Allow process to exit
        if (this._refillInterval.unref) this._refillInterval.unref();
    }

    async _waitForRateLimit() {
        while (this.rateLimitTokens <= 0) {
            await this._sleep(100);
        }
        this.rateLimitTokens--;
    }

    // -------------------------------------------------------
    //  Dedup Cooldown
    // -------------------------------------------------------

    _isDuplicate(key) {
        const lastSent = this.dedupMap.get(key);
        if (!lastSent) return false;
        return (Date.now() - lastSent) < this.dedupCooldownMs;
    }

    _startDedupCleanup() {
        // Clean expired entries every 5 minutes
        this._cleanupInterval = setInterval(() => {
            const now = Date.now();
            for (const [key, timestamp] of this.dedupMap) {
                if (now - timestamp >= this.dedupCooldownMs) {
                    this.dedupMap.delete(key);
                }
            }
        }, this.dedupCooldownMs);
        if (this._cleanupInterval.unref) this._cleanupInterval.unref();
    }

    // -------------------------------------------------------
    //  Validation & Helpers
    // -------------------------------------------------------

    _isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    _isPermanentError(error) {
        // SMTP codes 4xx are transient, 5xx are permanent
        const code = error.responseCode || 0;
        if (code >= 500 && code < 600) return true;
        // Auth failures
        if (error.code === 'EAUTH') return true;
        return false;
    }

    _sanitize(str) {
        if (typeof str !== 'string') return str;
        return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // -------------------------------------------------------
    //  Pre-built Email Methods (public API unchanged)
    // -------------------------------------------------------

    async sendInvite({ to, organisationName, inviteLink }) {
        const safeName = this._sanitize(organisationName);
        return this.send({
            to,
            subject: `You've been invited to join ${safeName} on UMA`,
            html: `
                <h2>Welcome to ${safeName}!</h2>
                <p>You've been invited to join the User Management & Attendance System.</p>
                <p><a href="${inviteLink}">Click here to set up your account</a></p>
            `,
            text: `You've been invited to join ${organisationName}. Visit: ${inviteLink}`,
        });
    }

    async sendPasswordReset({ to, resetLink }) {
        return this.send({
            to,
            subject: 'Password Reset Request - UMA',
            html: `
                <h2>Password Reset</h2>
                <p>You requested a password reset. Click the link below:</p>
                <p><a href="${resetLink}">Reset Password</a></p>
                <p>This link expires in 1 hour.</p>
            `,
            text: `Reset your password: ${resetLink}`,
        });
    }

    async sendLeaveNotification({ to, employeeName, leaveType, startDate, endDate, status }) {
        const safeName = this._sanitize(employeeName);
        return this.send({
            to,
            subject: `Leave ${status} - ${safeName}`,
            html: `
                <h2>Leave ${status}</h2>
                <p><strong>Employee:</strong> ${safeName}</p>
                <p><strong>Type:</strong> ${this._sanitize(leaveType)}</p>
                <p><strong>Period:</strong> ${startDate} to ${endDate}</p>
                <p><strong>Status:</strong> ${status}</p>
            `,
            text: `Leave ${status} for ${employeeName}: ${leaveType} from ${startDate} to ${endDate}`,
        });
    }

    async sendSubscriptionWarning({ to, organisationName, expiryDate }) {
        const safeName = this._sanitize(organisationName);
        return this.send({
            to,
            subject: `Subscription Expiring Soon - ${safeName}`,
            html: `
                <h2>Subscription Expiry Warning</h2>
                <p>Your subscription for <strong>${safeName}</strong> expires on <strong>${expiryDate}</strong>.</p>
                <p>Please renew to avoid service interruption.</p>
            `,
            text: `Subscription for ${organisationName} expires on ${expiryDate}. Please renew.`,
        });
    }

    async sendOtp({ to, otp }) {
        return this.send({
            to,
            subject: 'Your UMA Verification Code',
            html: `
                <h2>Email Verification</h2>
                <p>Your verification code is:</p>
                <h1 style="letter-spacing: 8px; font-size: 36px; text-align: center; background: #f4f4f4; padding: 16px; border-radius: 8px;">${this._sanitize(otp)}</h1>
                <p>This code expires in <strong>10 minutes</strong>.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `,
            text: `Your UMA verification code is: ${otp}. It expires in 10 minutes.`,
        });
    }
}

module.exports = new EmailService();
