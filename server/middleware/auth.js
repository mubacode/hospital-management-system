const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hospital_system_jwt_secret_key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token.' });
  }
};

// Role-based authorization middleware
const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    // If no roles specified, allow all authenticated users
    if (roles.length === 0) {
      return next();
    }

    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Forbidden: You do not have permission to access this resource' 
      });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  authorize
};