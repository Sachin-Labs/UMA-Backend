const AppError = require('../utils/AppError');

/**
 * Role-based access control middleware.
 * @param  {...string} allowedRoles - Roles that are permitted access
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return next(new AppError('Access denied. Insufficient permissions.', 403));
        }
        next();
    };
};

module.exports = { authorize };
