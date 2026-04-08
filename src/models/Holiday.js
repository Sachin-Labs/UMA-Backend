const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
    organisationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organisation',
        required: true,
        index: true,
    },
    date: {
        type: String, // YYYY-MM-DD
        required: true,
    },
    title: {
        type: String,
        required: [true, 'Holiday title is required'],
        trim: true,
        maxlength: 200,
    },
}, {
    timestamps: true,
});

holidaySchema.index({ organisationId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Holiday', holidaySchema);
