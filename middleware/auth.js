const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - Verify JWT Token
const protect = async (req, res, next) => {
    let token;

    // Check for token in headers
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Not authorized to access this route. Please login.'
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from token
        req.user = await User.findById(decoded.id);

        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'User not found. Token is invalid.'
            });
        }

        if (!req.user.isActive) {
            return res.status(401).json({
                success: false,
                error: 'User account is deactivated.'
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: 'Not authorized. Invalid token.'
        });
    }
};

module.exports = { protect };