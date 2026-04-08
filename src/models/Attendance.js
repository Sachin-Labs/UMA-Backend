const mongoose = require('mongoose');
const { WORK_TYPES, ATTENDANCE_STATUS } = require('../config/constants');

const attendanceSchema = new mongoose.Schema({
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
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        default: null,
    },
    date: {
        type: String, // YYYY-MM-DD
        required: true,
        index: true,
    },
    checkIn: {
        type: Date,
        required: true,
    },
    checkOut: {
        type: Date,
        default: null,
    },
    workType: {
        type: String,
        enum: Object.values(WORK_TYPES),
        required: true,
    },
    locationAtCheckIn: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
    },
    distanceAtCheckIn: {
        type: Number, // meters
        default: null,
    },
    locationValidated: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: Object.values(ATTENDANCE_STATUS),
        default: ATTENDANCE_STATUS.PRESENT,
    },
    totalWorkingMinutes: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

// Prevent double check-in for same day
attendanceSchema.index({ organisationId: 1, userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
