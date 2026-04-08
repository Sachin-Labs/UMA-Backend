const express = require('express');
const router = express.Router();
const { getOrganisation, updateOrganisation } = require('../controllers/organisationController');
const auth = require('../middlewares/auth');
const { authorize } = require('../middlewares/roles');
const { ROLES } = require('../config/constants');

router.use(auth);

router.get('/', authorize(ROLES.ADMIN), getOrganisation);
router.put('/', authorize(ROLES.ADMIN), updateOrganisation);

module.exports = router;
