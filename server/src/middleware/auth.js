const jwt = require('jsonwebtoken');
const { query } = require('../utils/database');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database - try to get role if it exists
    let result;
    try {
      // First try with role column
      result = await query(
        'SELECT id, username, email, role, created_at FROM users WHERE id = $1',
        [decoded.id]
      );
    } catch (error) {
      // If role column doesn't exist, use basic query
      result = await query(
        'SELECT id, username, email, created_at FROM users WHERE id = $1',
        [decoded.id]
      );
    }

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // If user doesn't have a role field, they're a regular user
    const userRole = req.user.role || 'user';
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: `User role ${userRole} is not authorized to access this route`
      });
    }

    next();
  };
};

module.exports = { protect, authorize }; 