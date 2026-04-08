const mongoose = require('mongoose');
const { SUBSCRIPTION_PLANS } = require('../config/constants');

const organisationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Organisation name is required'],
        trim: true,
        maxlength: 100,
    },
    subscriptionPlan: {
        type: String,
        enum: Object.values(SUBSCRIPTION_PLANS),
        default: SUBSCRIPTION_PLANS.FREE,
    },
    subscriptionExpiry: {
        type: Date,
        default: null,
    },
    officeLocation: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
        address: { type: String, default: '' },
    },
    officeHours: {
        startTime: { type: String, default: '09:00' },
        endTime: { type: String, default: '18:00' },
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Organisation', organisationSchema);
