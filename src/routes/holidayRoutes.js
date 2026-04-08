const express = require('express');
const router = express.Router();
const { create, list, remove } = require('../controllers/holidayController');
const auth = require('../middlewares/auth');
const { authorize } = require('../middlewares/roles');
const { ROLES } = require('../config/constants');

router.use(auth);

router.post('/', authorize(ROLES.ADMIN), create);
router.get('/', list); // all authenticated users can see holidays
router.delete('/:id', authorize(ROLES.ADMIN), remove);

module.exports = router;
