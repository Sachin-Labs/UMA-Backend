const reportService = require('../services/reportService');

const downloadAttendanceReport = async (req, res, next) => {
    try {
        const buffer = await reportService.generateAttendanceReport(req.user.organisationId, req.query);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=attendance_report.xlsx');
        res.send(buffer);
    } catch (error) {
        next(error);
    }
};

module.exports = { downloadAttendanceReport };
