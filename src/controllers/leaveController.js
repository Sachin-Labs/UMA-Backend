const leaveService = require('../services/leaveService');

const apply = async (req, res, next) => {
    try {
        const leave = await leaveService.apply(req.user.organisationId, req.user.userId, req.body);
        res.status(201).json({ success: true, data: leave });
    } catch (error) {
        next(error);
    }
};

const getMyLeaves = async (req, res, next) => {
    try {
        const result = await leaveService.getMyLeaves(req.user.organisationId, req.user.userId, req.query);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const getAllLeaves = async (req, res, next) => {
    try {
        const result = await leaveService.getAllLeaves(req.user.organisationId, req.query);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const approve = async (req, res, next) => {
    try {
        const leave = await leaveService.approve(req.user.organisationId, req.params.id, req.user.userId);
        res.json({ success: true, data: leave });
    } catch (error) {
        next(error);
    }
};

const reject = async (req, res, next) => {
    try {
        const leave = await leaveService.reject(req.user.organisationId, req.params.id, req.user.userId);
        res.json({ success: true, data: leave });
    } catch (error) {
        next(error);
    }
};

module.exports = { apply, getMyLeaves, getAllLeaves, approve, reject };
