const attendanceService = require('../services/attendanceService');

const checkIn = async (req, res, next) => {
    try {
        const attendance = await attendanceService.checkIn(
            req.user.organisationId, req.user.userId, req.body
        );
        res.status(201).json({ success: true, data: attendance });
    } catch (error) {
        next(error);
    }
};

const checkOut = async (req, res, next) => {
    try {
        const attendance = await attendanceService.checkOut(req.user.organisationId, req.user.userId);
        res.json({ success: true, data: attendance });
    } catch (error) {
        next(error);
    }
};

const getMyAttendance = async (req, res, next) => {
    try {
        const result = await attendanceService.getMyAttendance(
            req.user.organisationId, req.user.userId, req.query
        );
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const getAllAttendance = async (req, res, next) => {
    try {
        const result = await attendanceService.getAllAttendance(req.user.organisationId, req.query);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

module.exports = { checkIn, checkOut, getMyAttendance, getAllAttendance };
