const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    otp: {
        type: String,
        required: true,
    },
    // Store registration data so we can create the account after verification
    name: { type: String, required: true },
    password: { type: String, required: true }, // Already hashed
    organisationName: { type: String, required: true },
    attempts: {
        type: Number,
        default: 0,
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    },
}, { timestamps: true });

// TTL index — MongoDB auto-deletes expired documents
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Unique email — only one pending OTP per email at a time
otpSchema.index({ email: 1 }, { unique: true });

// Hash OTP before saving (so it's not stored in plain text)
otpSchema.pre('save', async function (next) {
    if (!this.isModified('otp')) return next();
    this.otp = await bcrypt.hash(this.otp, 10);
    next();
});

otpSchema.methods.compareOtp = async function (candidateOtp) {
    return bcrypt.compare(candidateOtp, this.otp);
};

module.exports = mongoose.model('Otp', otpSchema);
