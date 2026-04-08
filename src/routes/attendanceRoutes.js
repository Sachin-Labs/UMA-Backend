const express = require('express');
const router = express.Router();
const { checkIn, checkOut, getMyAttendance, getAllAttendance } = require('../controllers/attendanceController');
const auth = require('../middlewares/auth');
const { authorize } = require('../middlewares/roles');
const { ROLES } = require('../config/constants');

router.use(auth);

router.post('/check-in', authorize(ROLES.EMPLOYEE), checkIn);
router.patch('/check-out', authorize(ROLES.EMPLOYEE), checkOut);
router.get('/my', authorize(ROLES.EMPLOYEE), getMyAttendance);
router.get('/', authorize(ROLES.ADMIN, ROLES.HR), getAllAttendance);

module.exports = router;
