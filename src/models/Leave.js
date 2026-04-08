const mongoose = require('mongoose');
const { LEAVE_TYPES, LEAVE_STATUS } = require('../config/constants');

const leaveSchema = new mongoose.Schema({
    organisationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organisation',
        required: true,
        index: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    leaveType: {
        type: String,
        enum: Object.values(LEAVE_TYPES),
        required: true,
    },
    startDate: {
        type: String, // YYYY-MM-DD
        required: true,
    },
    endDate: {
        type: String, // YYYY-MM-DD
        required: true,
    },
    reason: {
        type: String,
        required: [true, 'Reason is required'],
        maxlength: 500,
    },
    status: {
        type: String,
        enum: Object.values(LEAVE_STATUS),
        default: LEAVE_STATUS.PENDING,
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
}, {
    timestamps: true,
});

leaveSchema.index({ organisationId: 1, userId: 1, startDate: 1 });

module.exports = mongoose.model('Leave', leaveSchema);
