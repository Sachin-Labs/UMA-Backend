const AuditLog = require('../models/AuditLog');
const logger = require('./logger');

/**
 * Create an audit log entry.
 * @param {Object} params
 * @param {string} params.organisationId
 * @param {string} params.action - e.g. 'USER_CREATED', 'ATTENDANCE_CHECKED_IN'
 * @param {string} params.performedBy - userId
 * @param {string} params.entityType - e.g. 'User', 'Attendance'
 * @param {string} params.entityId
 * @param {Object} [params.metadata] - additional context
 */
const createAuditLog = async ({ organisationId, action, performedBy, entityType, entityId, metadata = {} }) => {
    try {
        await AuditLog.create({
            organisationId,
            action,
            performedBy,
            entityType,
            entityId,
            metadata,
        });
    } catch (error) {
        logger.error('Failed to create audit log:', error.message);
    }
};

module.exports = { createAuditLog };
