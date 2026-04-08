const express = require('express');
const router = express.Router();
const { register, verifyOtp, login, refresh, logout, setPassword } = require('../controllers/authController');
const { loginLimiter, registerLimiter } = require('../middlewares/rateLimiter');
const auth = require('../middlewares/auth');

router.post('/register', registerLimiter, register);
router.post('/verify-otp', registerLimiter, verifyOtp);
router.post('/login', loginLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', auth, logout);
router.post('/set-password', setPassword);

module.exports = router;
