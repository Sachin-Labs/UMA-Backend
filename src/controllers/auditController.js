const AuditLog = require('../models/AuditLog');

const getAuditLogs = async (req, res, next) => {
    try {
        const { page = 1, limit = 50, entityType, action } = req.query;
        const query = { organisationId: req.user.organisationId };
        if (entityType) query.entityType = entityType;
        if (action) query.action = action;

        const total = await AuditLog.countDocuments(query);
        const logs = await AuditLog.find(query)
            .populate('performedBy', 'name email')
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({
            success: true,
            data: { logs, total, page: Number(page), totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getAuditLogs };
