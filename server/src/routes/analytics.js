const express = require('express');
const { query } = require('../utils/database');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/analytics/popular
// @desc    Get popularity rankings with detailed metrics
// @access  Public
router.get('/popular', async (req, res) => {
  try {
    const { limit = 10, category, timeframe = 'all' } = req.query;

    let timeFilter = '';
    let params = [parseInt(limit)];
    let paramCount = 1;

    // Add time-based filtering
    if (timeframe !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (timeframe) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days
      }

      timeFilter = `AND ui.created_at >= $${paramCount + 1}`;
      params.push(startDate.toISOString());
      paramCount++;
    }

    // Add category filter
    if (category) {
      timeFilter += ` AND s.category = $${paramCount + 1}`;
      params.push(category);
      paramCount++;
    }

    const sql = `
      SELECT 
        s.id,
        s.title,
        s.description,
        s.category,
        s.created_at,
        u.username as creator_name,
        COUNT(CASE WHEN ui.interaction_type = 'use' THEN 1 END) as usage_count,
        COUNT(CASE WHEN ui.interaction_type = 'like' THEN 1 END) as like_count,
        COUNT(CASE WHEN ui.interaction_type = 'share' THEN 1 END) as share_count,
        EXTRACT(EPOCH FROM (NOW() - s.created_at)) / 86400 as days_since_creation
      FROM schedulers s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN user_interactions ui ON s.id = ui.scheduler_id ${timeFilter}
      WHERE s.is_public = true
      GROUP BY s.id, s.title, s.description, s.category, s.created_at, u.username
      ORDER BY usage_count DESC, like_count DESC, share_count DESC
      LIMIT $1
    `;

    const result = await query(sql, params);

    // Calculate popularity scores
    const schedulersWithScores = result.rows.map(scheduler => {
      const usageScore = Math.min(scheduler.usage_count / 100, 1) * 0.4;
      const socialScore = Math.min((scheduler.like_count + scheduler.share_count) / 50, 1) * 0.3;
      const recencyScore = Math.max(0, 1 - (scheduler.days_since_creation / 365)) * 0.1;
      const qualityScore = scheduler.usage_count > 0 ? 0.05 : 0;

      const popularityScore = usageScore + socialScore + recencyScore + qualityScore;

      return {
        ...scheduler,
        popularity_score: Math.round(popularityScore * 100) / 100
      };
    });

    // Sort by popularity score
    schedulersWithScores.sort((a, b) => b.popularity_score - a.popularity_score);

    res.json({
      success: true,
      data: schedulersWithScores,
      timeframe,
      category: category || 'all'
    });

  } catch (error) {
    console.error('Get popular schedulers error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/analytics/trending
// @desc    Get trending schedulers (recent activity)
// @access  Public
router.get('/trending', async (req, res) => {
  try {
    const { limit = 10, days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const sql = `
      SELECT 
        s.id,
        s.title,
        s.description,
        s.category,
        s.created_at,
        u.username as creator_name,
        COUNT(CASE WHEN ui.interaction_type = 'use' THEN 1 END) as recent_usage,
        COUNT(CASE WHEN ui.interaction_type = 'like' THEN 1 END) as recent_likes,
        COUNT(CASE WHEN ui.interaction_type = 'share' THEN 1 END) as recent_shares,
        COUNT(ui.id) as total_recent_activity
      FROM schedulers s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN user_interactions ui ON s.id = ui.scheduler_id 
        AND ui.created_at >= $1
      WHERE s.is_public = true
      GROUP BY s.id, s.title, s.description, s.category, s.created_at, u.username
      HAVING COUNT(ui.id) > 0
      ORDER BY total_recent_activity DESC, recent_usage DESC
      LIMIT $2
    `;

    const result = await query(sql, [startDate.toISOString(), parseInt(limit)]);

    res.json({
      success: true,
      data: result.rows,
      period_days: parseInt(days)
    });

  } catch (error) {
    console.error('Get trending schedulers error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/analytics/categories
// @desc    Get category statistics
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const sql = `
      SELECT 
        s.category,
        COUNT(s.id) as scheduler_count,
        COUNT(CASE WHEN ui.interaction_type = 'use' THEN 1 END) as total_usage,
        COUNT(CASE WHEN ui.interaction_type = 'like' THEN 1 END) as total_likes,
        COUNT(CASE WHEN ui.interaction_type = 'share' THEN 1 END) as total_shares
      FROM schedulers s
      LEFT JOIN user_interactions ui ON s.id = ui.scheduler_id
      WHERE s.is_public = true AND s.category IS NOT NULL
      GROUP BY s.category
      ORDER BY total_usage DESC, scheduler_count DESC
    `;

    const result = await query(sql);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get category analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/analytics/user/:id
// @desc    Get user analytics
// @access  Private
router.get('/user/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is requesting their own analytics or is admin
    if (req.user.id !== parseInt(id)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Get user's schedulers and their performance
    const schedulersResult = await query(`
      SELECT 
        s.id,
        s.title,
        s.category,
        s.created_at,
        COUNT(CASE WHEN ui.interaction_type = 'use' THEN 1 END) as usage_count,
        COUNT(CASE WHEN ui.interaction_type = 'like' THEN 1 END) as like_count,
        COUNT(CASE WHEN ui.interaction_type = 'share' THEN 1 END) as share_count
      FROM schedulers s
      LEFT JOIN user_interactions ui ON s.id = ui.scheduler_id
      WHERE s.user_id = $1
      GROUP BY s.id, s.title, s.category, s.created_at
      ORDER BY usage_count DESC
    `, [id]);

    // Get user's interaction statistics
    const interactionsResult = await query(`
      SELECT 
        interaction_type,
        COUNT(*) as count
      FROM user_interactions
      WHERE user_id = $1
      GROUP BY interaction_type
    `, [id]);

    // Get user's total statistics
    const statsResult = await query(`
      SELECT 
        COUNT(DISTINCT s.id) as total_schedulers,
        COUNT(CASE WHEN s.is_public = true THEN 1 END) as public_schedulers,
        COUNT(CASE WHEN s.is_public = false THEN 1 END) as private_schedulers
      FROM schedulers s
      WHERE s.user_id = $1
    `, [id]);

    const stats = statsResult.rows[0];
    const interactions = {};
    interactionsResult.rows.forEach(row => {
      interactions[row.interaction_type] = parseInt(row.count);
    });

    res.json({
      success: true,
      data: {
        schedulers: schedulersResult.rows,
        interactions,
        stats
      }
    });

  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/analytics/overview
// @desc    Get overall platform statistics
// @access  Public
router.get('/overview', async (req, res) => {
  try {
    // Get total counts
    const countsResult = await query(`
      SELECT 
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT s.id) as total_schedulers,
        COUNT(DISTINCT si.id) as total_scheduler_items,
        COUNT(DISTINCT ui.id) as total_interactions
      FROM users u
      LEFT JOIN schedulers s ON u.id = s.user_id
      LEFT JOIN scheduler_items si ON s.id = si.scheduler_id
      LEFT JOIN user_interactions ui ON s.id = ui.scheduler_id
    `);

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivityResult = await query(`
      SELECT 
        COUNT(DISTINCT u.id) as new_users,
        COUNT(DISTINCT s.id) as new_schedulers,
        COUNT(DISTINCT ui.id) as new_interactions
      FROM users u
      LEFT JOIN schedulers s ON u.id = s.user_id AND s.created_at >= $1
      LEFT JOIN user_interactions ui ON s.id = ui.scheduler_id AND ui.created_at >= $1
      WHERE u.created_at >= $1 OR s.created_at >= $1 OR ui.created_at >= $1
    `, [thirtyDaysAgo.toISOString()]);

    // Get top categories
    const categoriesResult = await query(`
      SELECT 
        s.category,
        COUNT(s.id) as scheduler_count
      FROM schedulers s
      WHERE s.is_public = true AND s.category IS NOT NULL
      GROUP BY s.category
      ORDER BY scheduler_count DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        overview: countsResult.rows[0],
        recent_activity: recentActivityResult.rows[0],
        top_categories: categoriesResult.rows
      }
    });

  } catch (error) {
    console.error('Get overview analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router; 