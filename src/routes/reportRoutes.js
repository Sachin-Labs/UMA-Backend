const express = require('express');
const router = express.Router();
const { downloadAttendanceReport } = require('../controllers/reportController');
const auth = require('../middlewares/auth');
const { authorize } = require('../middlewares/roles');
const { ROLES } = require('../config/constants');

router.use(auth);

router.get('/attendance', authorize(ROLES.ADMIN, ROLES.HR), downloadAttendanceReport);

module.exports = router;
