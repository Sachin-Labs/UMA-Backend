const Organisation = require('../models/Organisation');
const AppError = require('../utils/AppError');
const { PLAN_LIMITS } = require('../config/constants');

/**
 * Check if the organisation's subscription is valid and not expired.
 */
const checkSubscription = async (req, res, next) => {
    try {
        const org = await Organisation.findById(req.user.organisationId);
        if (!org) {
            return next(new AppError('Organisation not found.', 404));
        }

        if (org.subscriptionExpiry && new Date(org.subscriptionExpiry) < new Date()) {
            return next(new AppError('Subscription expired. Please renew your plan.', 403));
        }

        req.organisation = org;
        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Check if the organisation can add more employees based on their plan.
 */
const checkEmployeeLimit = async (req, res, next) => {
    try {
        const org = req.organisation || await Organisation.findById(req.user.organisationId);
        if (!org) {
            return next(new AppError('Organisation not found.', 404));
        }

        const User = require('../models/User');
        const activeUserCount = await User.countDocuments({
            organisationId: org._id,
            isActive: true,
        });

        const limit = PLAN_LIMITS[org.subscriptionPlan] || PLAN_LIMITS.FREE;
        if (activeUserCount >= limit) {
            return next(new AppError(`Employee limit reached for ${org.subscriptionPlan} plan (max ${limit}).`, 403));
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = { checkSubscription, checkEmployeeLimit };
