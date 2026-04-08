const holidayService = require('../services/holidayService');

const create = async (req, res, next) => {
    try {
        const holiday = await holidayService.create(req.user.organisationId, req.body);
        res.status(201).json({ success: true, data: holiday });
    } catch (error) {
        next(error);
    }
};

const list = async (req, res, next) => {
    try {
        const holidays = await holidayService.list(req.user.organisationId, req.query);
        res.json({ success: true, data: holidays });
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        await holidayService.delete(req.user.organisationId, req.params.id);
        res.json({ success: true, message: 'Holiday deleted.' });
    } catch (error) {
        next(error);
    }
};

module.exports = { create, list, remove };
