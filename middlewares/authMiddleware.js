const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify if the user is authenticated via JWT
exports.protect = async (req, res, next) => {
    try {
        let token;

        // Check for token in the Authorization header (Format: Bearer <token>)
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: 'Not authorized to access this route. No token provided.' });
        }

        // Verify token signature
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch user from database to ensure account still exists and token matches (MP5 validation match)
        const user = await User.findByPk(decoded.id);
        if (!user) {
            return res.status(401).json({ message: 'The user belonging to this token no longer exists.' });
        }

        // Verify account is active (MP6 restriction enforcement)
        if (user.status === 'deactivated') {
            return res.status(403).json({ message: 'Access denied. Account is deactivated.' });
        }

        // Attach user info to the request object for subsequent middlewares/controllers
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Not authorized. Invalid or expired token.', error: error.message });
    }
};

// Like protect but never blocks — just attaches req.user if a valid token is present.
// Used on public routes that behave differently for authenticated admins/staff.
exports.optionalProtect = async (req, res, next) => {
    try {
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findByPk(decoded.id);
            if (user && user.status !== 'deactivated') req.user = user;
        }
    } catch (_) { /* invalid/expired token — treat as unauthenticated */ }
    next();
};

// Middleware to restrict access to specific roles (Fulfills Quiz 6)
exports.authorize = (...roles) => {
    return (req, res, next) => {
        // req.user is set by the protect middleware executed beforehand
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Access denied. Role '${req.user ? req.user.role : 'guest'}' is not authorized to access this resource.` 
            });
        }
        next();
    };
};