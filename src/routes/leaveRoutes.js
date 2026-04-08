const express = require('express');
const router = express.Router();
const { apply, getMyLeaves, getAllLeaves, approve, reject } = require('../controllers/leaveController');
const auth = require('../middlewares/auth');
const { authorize } = require('../middlewares/roles');
const { ROLES } = require('../config/constants');

router.use(auth);

router.post('/', authorize(ROLES.EMPLOYEE), apply);
router.get('/my', authorize(ROLES.EMPLOYEE), getMyLeaves);
router.get('/', authorize(ROLES.ADMIN, ROLES.HR), getAllLeaves);
router.patch('/:id/approve', authorize(ROLES.ADMIN, ROLES.HR), approve);
router.patch('/:id/reject', authorize(ROLES.ADMIN, ROLES.HR), reject);

module.exports = router;
