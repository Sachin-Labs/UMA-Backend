const logger = require('../utils/logger');

const errorHandler = (err, req, res, _next) => {
    const statusCode = err.statusCode || 500;
    const message = err.isOperational ? err.message : 'Internal server error';

    logger.error(`${statusCode} - ${err.message}`, {
        stack: err.stack,
        path: req.originalUrl,
        method: req.method,
    });

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

module.exports = errorHandler;
