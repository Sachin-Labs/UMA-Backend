const express = require('express');
const router = express.Router();
const { create, list, getById, update, remove, getMyTeam } = require('../controllers/teamController');
const auth = require('../middlewares/auth');
const { authorize } = require('../middlewares/roles');
const { ROLES } = require('../config/constants');

router.use(auth);

router.get('/my', authorize(ROLES.EMPLOYEE, ROLES.HR, ROLES.ADMIN), getMyTeam);
router.post('/', authorize(ROLES.ADMIN, ROLES.HR), create);
router.get('/', authorize(ROLES.ADMIN, ROLES.HR), list);
router.get('/:id', authorize(ROLES.ADMIN, ROLES.HR), getById);
router.put('/:id', authorize(ROLES.ADMIN, ROLES.HR), update);
router.delete('/:id', authorize(ROLES.ADMIN, ROLES.HR), remove);

module.exports = router;
