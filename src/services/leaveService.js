const Leave = require('../models/Leave');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { createAuditLog } = require('../utils/auditLogger');
const emailService = require('../emails/emailService');
const { LEAVE_STATUS, ROLES } = require('../config/constants');

class LeaveService {
    async apply(organisationId, userId, data) {
        if (new Date(data.startDate) > new Date(data.endDate)) {
            throw new AppError('Start date must be before or equal to end date.', 400);
        }

        // Check for overlapping leaves
        const overlap = await Leave.findOne({
            organisationId,
            userId,
            status: { $ne: LEAVE_STATUS.REJECTED },
            $or: [
                { startDate: { $lte: data.endDate }, endDate: { $gte: data.startDate } },
            ],
        });
        if (overlap) {
            throw new AppError('You already have a leave request overlapping these dates.', 400);
        }

        const leave = await Leave.create({
            organisationId,
            userId,
            leaveType: data.leaveType,
            startDate: data.startDate,
            endDate: data.endDate,
            reason: data.reason,
        });

        await createAuditLog({
            organisationId,
            action: 'LEAVE_APPLIED',
            performedBy: userId,
            entityType: 'Leave',
            entityId: leave._id,
            metadata: { leaveType: data.leaveType, startDate: data.startDate, endDate: data.endDate },
        });

        return leave;
    }

    async getMyLeaves(organisationId, userId, { status, page = 1, limit = 20 } = {}) {
        const query = { organisationId, userId };
        if (status) query.status = status;

        const total = await Leave.countDocuments(query);
        const leaves = await Leave.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        return { leaves, total, page: Number(page), totalPages: Math.ceil(total / limit) };
    }

    async getAllLeaves(organisationId, { status, userId, page = 1, limit = 50 } = {}) {
        const query = { organisationId };
        if (status) query.status = status;
        if (userId) query.userId = userId;

        const total = await Leave.countDocuments(query);
        const leaves = await Leave.find(query)
            .populate('userId', 'name email')
            .populate('approvedBy', 'name')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        return { leaves, total, page: Number(page), totalPages: Math.ceil(total / limit) };
    }

    async approve(organisationId, leaveId, approvedBy) {
        const leave = await Leave.findOne({ _id: leaveId, organisationId });
        if (!leave) throw new AppError('Leave not found.', 404);
        if (leave.status !== LEAVE_STATUS.PENDING) {
            throw new AppError(`Leave is already ${leave.status}.`, 400);
        }

        leave.status = LEAVE_STATUS.APPROVED;
        leave.approvedBy = approvedBy;
        await leave.save();

        // Notify employee
        const employee = await User.findById(leave.userId);
        if (employee) {
            await emailService.sendLeaveNotification({
                to: employee.email,
                employeeName: employee.name,
                leaveType: leave.leaveType,
                startDate: leave.startDate,
                endDate: leave.endDate,
                status: 'APPROVED',
            });
        }

        await createAuditLog({
            organisationId,
            action: 'LEAVE_APPROVED',
            performedBy: approvedBy,
            entityType: 'Leave',
            entityId: leave._id,
        });

        return leave;
    }

    async reject(organisationId, leaveId, rejectedBy) {
        const leave = await Leave.findOne({ _id: leaveId, organisationId });
        if (!leave) throw new AppError('Leave not found.', 404);
        if (leave.status !== LEAVE_STATUS.PENDING) {
            throw new AppError(`Leave is already ${leave.status}.`, 400);
        }

        leave.status = LEAVE_STATUS.REJECTED;
        leave.approvedBy = rejectedBy;
        await leave.save();

        const employee = await User.findById(leave.userId);
        if (employee) {
            await emailService.sendLeaveNotification({
                to: employee.email,
                employeeName: employee.name,
                leaveType: leave.leaveType,
                startDate: leave.startDate,
                endDate: leave.endDate,
                status: 'REJECTED',
            });
        }

        await createAuditLog({
            organisationId,
            action: 'LEAVE_REJECTED',
            performedBy: rejectedBy,
            entityType: 'Leave',
            entityId: leave._id,
        });

        return leave;
    }
}

module.exports = new LeaveService();
