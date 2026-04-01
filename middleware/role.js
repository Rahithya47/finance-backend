// Role-based access control middleware

// Define permissions for each role
const rolePermissions = {
    viewer: ['read'],
    analyst: ['read', 'analyze'],
    admin: ['read', 'analyze', 'create', 'update', 'delete', 'manage_users']
};

// Check if user has required permission
const authorize = (...requiredPermissions) => {
    return (req, res, next) => {
        const userRole = req.user.role;
        const userPermissions = rolePermissions[userRole] || [];

        // Check if user has at least one of the required permissions
        const hasPermission = requiredPermissions.some(permission =>
            userPermissions.includes(permission)
        );

        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                error: `Access denied. Role '${userRole}' does not have permission to perform this action.`,
                requiredPermissions,
                yourPermissions: userPermissions
            });
        }

        next();
    };
};

// Restrict to specific roles
const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: `Access denied. This action is restricted to: ${roles.join(', ')}`,
                yourRole: req.user.role
            });
        }
        next();
    };
};

module.exports = { authorize, restrictTo, rolePermissions };