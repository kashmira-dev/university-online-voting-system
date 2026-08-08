const jwt = require('jsonwebtoken');

const authMiddleware = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_university_voting_key_2026!');
      req.user = decoded;

      // Role RBAC check if allowedRoles provided
      if (allowedRoles.length > 0) {
        const userRole = decoded.role || decoded.user_type;
        const hasPermission = allowedRoles.some(role => 
          role === userRole || 
          (role === 'student_voter' && (userRole === 'Student' || userRole === 'student_voter'))
        );

        if (!hasPermission) {
          return res.status(403).json({ 
            success: false, 
            message: `Access Denied: Role '${userRole}' does not have permission for this resource.` 
          });
        }
      }

      next();
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token.', error: err.message });
    }
  };
};

module.exports = authMiddleware;