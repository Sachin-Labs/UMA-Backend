const mongoose = require('mongoose');
const { WORK_MODES } = require('../config/constants');

const teamSchema = new mongoose.Schema({
    organisationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organisation',
        required: true,
        index: true,
    },
    name: {
        type: String,
        required: [true, 'Team name is required'],
        trim: true,
        maxlength: 100,
    },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        address: { type: String, default: '' },
    },
    radius: {
        type: Number,
        required: true,
        min: 50,
        default: 200, // meters
    },
    workMode: {
        type: String,
        enum: Object.values(WORK_MODES),
        default: WORK_MODES.ONSITE,
    },
    maxWFHDaysPerMonth: {
        type: Number,
        default: 0,
        min: 0,
    },
    officeHours: {
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
    },
}, {
    timestamps: true,
});

teamSchema.index({ organisationId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Team', teamSchema);
