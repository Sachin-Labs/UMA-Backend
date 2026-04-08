# AMS Backend — Attendance Management System API

A Node.js + Express backend for the Multi-Tenant Attendance Management System.

## Tech Stack
- **Framework:** Node.js + Express
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT (Access + Refresh Token)
- **Security:** Helmet + CORS + Rate Limiter
- **Logs:** Winston
- **Email:** Pluggable (SendGrid, SMTP, or Console for dev)

## Quick Start
1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Setup environment:**
   - Copy `.env.example` to `.env`
   - Update `MONGODB_URI` with your connection string.
   - Update `CLIENT_URL` to point to your frontend (e.g., your Vercel URL).
3. **Run development server:**
   ```bash
   npm run dev
   ```

## Deployment (Render)
This project is ready for Render.
- Set `PORT` (Render handles this automatically).
- Set `MONGODB_URI` and `CLIENT_URL` in environment variables.
- Ensure `NODE_ENV` is set to `production`.
- Start Command: `npm run start`
