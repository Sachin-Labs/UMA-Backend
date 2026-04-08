const Holiday = require('../models/Holiday');
const AppError = require('../utils/AppError');

class HolidayService {
    async create(organisationId, data) {
        return Holiday.create({ ...data, organisationId });
    }

    async list(organisationId, { year } = {}) {
        const query = { organisationId };
        if (year) {
            query.date = { $gte: `${year}-01-01`, $lte: `${year}-12-31` };
        }
        return Holiday.find(query).sort({ date: 1 });
    }

    async delete(organisationId, holidayId) {
        const holiday = await Holiday.findOneAndDelete({ _id: holidayId, organisationId });
        if (!holiday) throw new AppError('Holiday not found.', 404);
        return holiday;
    }
}

module.exports = new HolidayService();
