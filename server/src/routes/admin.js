const express = require('express');
const { query } = require('../utils/database');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/admin/users
// @desc    Get all users (admin only)
// @access  Admin
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const { limit = 50, offset = 0, search } = req.query;
    
    let sql = `
      SELECT u.id, u.username, u.email, u.role, u.created_at, u.updated_at,
             COUNT(s.id) as scheduler_count,
             COALESCE(SUM(s.usage_count), 0) as total_views,
             COALESCE(SUM(s.like_count), 0) as total_likes
      FROM users u
      LEFT JOIN schedulers s ON u.id = s.user_id
    `;
    
    const params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      sql += ` WHERE (u.username ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    sql += ` GROUP BY u.id, u.username, u.email, u.role, u.created_at, u.updated_at
             ORDER BY u.created_at DESC 
             LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(sql, params);

    // Get total count
    let countSql = 'SELECT COUNT(*) FROM users';
    let countParams = [];
    if (search) {
      countSql += ' WHERE (username ILIKE $1 OR email ILIKE $1)';
      countParams.push(`%${search}%`);
    }

    const countResult = await query(countSql, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/admin/schedulers
// @desc    Get all schedulers (admin only)
// @access  Admin
router.get('/schedulers', protect, authorize('admin'), async (req, res) => {
  try {
    const { limit = 50, offset = 0, search, category, user_id } = req.query;
    
    let sql = `
      SELECT s.*, u.username as creator_name,
             (SELECT COUNT(*) FROM user_interactions WHERE scheduler_id = s.id AND interaction_type = 'like') as like_count,
             (SELECT COUNT(*) FROM user_interactions WHERE scheduler_id = s.id AND interaction_type = 'use') as usage_count,
             (SELECT COUNT(*) FROM user_interactions WHERE scheduler_id = s.id AND interaction_type = 'share') as share_count
      FROM schedulers s
      JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      sql += ` AND (s.title ILIKE $${paramCount} OR s.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (category) {
      paramCount++;
      sql += ` AND s.category = $${paramCount}`;
      params.push(category);
    }

    if (user_id) {
      paramCount++;
      sql += ` AND s.user_id = $${paramCount}`;
      params.push(parseInt(user_id));
    }

    sql += ` ORDER BY s.created_at DESC 
             LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(sql, params);

    // Get total count
    let countSql = 'SELECT COUNT(*) FROM schedulers s WHERE 1=1';
    let countParams = [];
    let countParamCount = 0;

    if (search) {
      countParamCount++;
      countSql += ` AND (s.title ILIKE $${countParamCount} OR s.description ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    if (category) {
      countParamCount++;
      countSql += ` AND s.category = $${countParamCount}`;
      countParams.push(category);
    }

    if (user_id) {
      countParamCount++;
      countSql += ` AND s.user_id = $${countParamCount}`;
      countParams.push(parseInt(user_id));
    }

    const countResult = await query(countSql, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total
      }
    });

  } catch (error) {
    console.error('Get admin schedulers error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/admin/stats
// @desc    Get platform statistics (admin only)
// @access  Admin
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    // Get user stats
    const userStats = await query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_30d
      FROM users
    `);

    // Get scheduler stats
    const schedulerStats = await query(`
      SELECT 
        COUNT(*) as total_schedulers,
        COUNT(CASE WHEN is_public = true THEN 1 END) as public_schedulers,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_schedulers_30d,
        AVG(usage_count) as avg_usage_count
      FROM schedulers
    `);

    // Get interaction stats
    const interactionStats = await query(`
      SELECT 
        COUNT(*) as total_interactions,
        COUNT(CASE WHEN interaction_type = 'like' THEN 1 END) as total_likes,
        COUNT(CASE WHEN interaction_type = 'use' THEN 1 END) as total_uses,
        COUNT(CASE WHEN interaction_type = 'share' THEN 1 END) as total_shares,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as interactions_30d
      FROM user_interactions
    `);

    // Get top categories
    const categoryStats = await query(`
      SELECT category, COUNT(*) as count
      FROM schedulers 
      WHERE category IS NOT NULL AND category != ''
      GROUP BY category 
      ORDER BY count DESC 
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        users: userStats.rows[0],
        schedulers: schedulerStats.rows[0],
        interactions: interactionStats.rows[0],
        categories: categoryStats.rows
      }
    });

  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role (admin only)
// @access  Admin
router.put('/users/:id/role', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    const validRoles = ['user', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be user or admin'
      });
    }

    // Check if user exists
    const userResult = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update user role
    const result = await query(
      'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, username, email, role, updated_at',
      [role, id]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: `User role updated to ${role}`
    });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user (admin only)
// @access  Admin
router.delete('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting self
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account'
      });
    }

    // Check if user exists
    const userResult = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Delete user (cascade will delete schedulers and interactions)
    await query('DELETE FROM users WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   DELETE /api/admin/schedulers/:id
// @desc    Delete any scheduler (admin only)
// @access  Admin
router.delete('/schedulers/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if scheduler exists
    const schedulerResult = await query('SELECT * FROM schedulers WHERE id = $1', [id]);
    if (schedulerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Scheduler not found'
      });
    }

    // Delete scheduler (cascade will delete items and interactions)
    await query('DELETE FROM schedulers WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Scheduler deleted successfully'
    });

  } catch (error) {
    console.error('Delete scheduler error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;