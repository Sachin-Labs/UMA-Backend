const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditController');
const auth = require('../middlewares/auth');
const { authorize } = require('../middlewares/roles');
const { ROLES } = require('../config/constants');

router.use(auth);

router.get('/', authorize(ROLES.ADMIN), getAuditLogs);

module.exports = router;
