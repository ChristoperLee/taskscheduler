const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../utils/database');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/schedulers/popular
// @desc    Get top popular schedulers
// @access  Public
router.get('/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Simple query first
    const sql = `
      SELECT s.*, u.username as creator_name
      FROM schedulers s
      JOIN users u ON s.user_id = u.id
      WHERE s.is_public = true
      ORDER BY s.usage_count DESC, s.like_count DESC, s.share_count DESC
      LIMIT $1
    `;

    const result = await query(sql, [parseInt(limit)]);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get popular schedulers error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/schedulers/my
// @desc    Get current user's schedulers
// @access  Private
router.get('/my', protect, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const sql = `
      SELECT s.*, u.username as creator_name,
             (SELECT COUNT(*) FROM user_interactions WHERE scheduler_id = s.id AND interaction_type = 'like') as like_count,
             (SELECT COUNT(*) FROM user_interactions WHERE scheduler_id = s.id AND interaction_type = 'use') as usage_count,
             (SELECT COUNT(*) FROM user_interactions WHERE scheduler_id = s.id AND interaction_type = 'share') as share_count
      FROM schedulers s
      JOIN users u ON s.user_id = u.id
      WHERE s.user_id = $1
      ORDER BY s.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await query(sql, [req.user.id, parseInt(limit), parseInt(offset)]);

    // Get total count for pagination
    const countResult = await query('SELECT COUNT(*) FROM schedulers WHERE user_id = $1', [req.user.id]);
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
    console.error('Get my schedulers error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/schedulers
// @desc    Get all schedulers (with filters)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, search, limit = 20, offset = 0 } = req.query;
    
    let sql = `
      SELECT s.*, u.username as creator_name,
             (SELECT COUNT(*) FROM user_interactions WHERE scheduler_id = s.id AND interaction_type = 'like') as like_count,
             (SELECT COUNT(*) FROM user_interactions WHERE scheduler_id = s.id AND interaction_type = 'use') as usage_count,
             (SELECT COUNT(*) FROM user_interactions WHERE scheduler_id = s.id AND interaction_type = 'share') as share_count
      FROM schedulers s
      JOIN users u ON s.user_id = u.id
      WHERE s.is_public = true
    `;
    
    const params = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      sql += ` AND s.category = $${paramCount}`;
      params.push(category);
    }

    if (search) {
      paramCount++;
      sql += ` AND (s.title ILIKE $${paramCount} OR s.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    sql += ` ORDER BY s.usage_count DESC, s.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: result.rows.length
      }
    });

  } catch (error) {
    console.error('Get schedulers error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/schedulers/:id
// @desc    Get specific scheduler with items
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get scheduler details
    const schedulerResult = await query(`
      SELECT s.*, u.username as creator_name,
             (SELECT COUNT(*) FROM user_interactions WHERE scheduler_id = s.id AND interaction_type = 'like') as like_count,
             (SELECT COUNT(*) FROM user_interactions WHERE scheduler_id = s.id AND interaction_type = 'use') as usage_count,
             (SELECT COUNT(*) FROM user_interactions WHERE scheduler_id = s.id AND interaction_type = 'share') as share_count
      FROM schedulers s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = $1
    `, [id]);

    if (schedulerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Scheduler not found'
      });
    }

    const scheduler = schedulerResult.rows[0];

    // Get scheduler items
    const itemsResult = await query(`
      SELECT * FROM scheduler_items 
      WHERE scheduler_id = $1 
      ORDER BY day_of_week, start_time, order_index
    `, [id]);

    // For each item, get deleted occurrences and add them to exclusion_dates
    for (let item of itemsResult.rows) {
      // Get deleted occurrences for this item
      const deletedOccurrences = await query(`
        SELECT occurrence_date 
        FROM scheduler_item_occurrences 
        WHERE scheduler_item_id = $1 AND is_deleted = true
      `, [item.id]);
      
      // Convert to exclusion_dates array for backward compatibility
      item.exclusion_dates = deletedOccurrences.rows.map(occ => {
        const date = new Date(occ.occurrence_date);
        return date.toISOString().split('T')[0];
      });
    }

    scheduler.items = itemsResult.rows;

    // Get all modified/deleted occurrences for this scheduler
    const occurrencesResult = await query(`
      SELECT sio.* 
      FROM scheduler_item_occurrences sio
      JOIN scheduler_items si ON sio.scheduler_item_id = si.id
      WHERE si.scheduler_id = $1
      AND (sio.is_deleted = true OR sio.is_modified = true)
    `, [id]);

    // Create a map of occurrences by item_id and date
    const occurrencesMap = {};
    for (const occ of occurrencesResult.rows) {
      // Format date as YYYY-MM-DD
      const dateStr = new Date(occ.occurrence_date).toISOString().split('T')[0];
      const key = `${occ.scheduler_item_id}_${dateStr}`;
      occurrencesMap[key] = occ;
    }
    
    scheduler.occurrences = occurrencesMap;

    res.json({
      success: true,
      data: scheduler
    });

  } catch (error) {
    console.error('Get scheduler error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/schedulers/:id/daily/:date
// @desc    Get daily view data for a scheduler
// @access  Public
router.get('/:id/daily/:date', async (req, res) => {
  try {
    const { id, date } = req.params;
    
    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = new Date(date).getDay();

    const result = await query(`
      SELECT si.*, s.title as scheduler_title, s.description as scheduler_description
      FROM scheduler_items si
      JOIN schedulers s ON si.scheduler_id = s.id
      WHERE si.scheduler_id = $1 AND si.day_of_week = $2
      ORDER BY si.start_time, si.order_index
    `, [id, dayOfWeek]);

    res.json({
      success: true,
      data: {
        date,
        dayOfWeek,
        items: result.rows
      }
    });

  } catch (error) {
    console.error('Get daily view error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/schedulers/:id/weekly/:week
// @desc    Get weekly view data for a scheduler
// @access  Public
router.get('/:id/weekly/:week', async (req, res) => {
  try {
    const { id, week } = req.params;
    
    // Parse week parameter (format: YYYY-WW)
    const [year, weekNum] = week.split('-');
    const startDate = new Date(year, 0, 1 + (weekNum - 1) * 7);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const result = await query(`
      SELECT si.*, s.title as scheduler_title
      FROM scheduler_items si
      JOIN schedulers s ON si.scheduler_id = s.id
      WHERE si.scheduler_id = $1
      ORDER BY si.day_of_week, si.start_time, si.order_index
    `, [id]);

    // Group items by day
    const weeklyData = {};
    for (let i = 0; i < 7; i++) {
      weeklyData[i] = [];
    }

    result.rows.forEach(item => {
      if (item.day_of_week !== null) {
        weeklyData[item.day_of_week].push(item);
      }
    });

    res.json({
      success: true,
      data: {
        week,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        days: weeklyData
      }
    });

  } catch (error) {
    console.error('Get weekly view error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/schedulers/:id/monthly/:month
// @desc    Get monthly view data for a scheduler
// @access  Public
router.get('/:id/monthly/:month', async (req, res) => {
  try {
    const { id, month } = req.params;
    
    // Parse month parameter (format: YYYY-MM)
    const [year, monthNum] = month.split('-');
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0);

    const result = await query(`
      SELECT si.*, s.title as scheduler_title
      FROM scheduler_items si
      JOIN schedulers s ON si.scheduler_id = s.id
      WHERE si.scheduler_id = $1
      ORDER BY si.day_of_week, si.start_time, si.order_index
    `, [id]);

    // Get all occurrences for this month
    const occurrencesResult = await query(`
      SELECT sio.*, si.day_of_week 
      FROM scheduler_item_occurrences sio
      JOIN scheduler_items si ON sio.scheduler_item_id = si.id
      WHERE si.scheduler_id = $1 
      AND sio.occurrence_date >= $2 
      AND sio.occurrence_date <= $3
      AND (sio.is_deleted = true OR sio.is_modified = true)
    `, [id, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]);

    // Create a map of occurrences by item_id and date
    const occurrencesMap = {};
    for (const occ of occurrencesResult.rows) {
      const key = `${occ.scheduler_item_id}_${occ.occurrence_date}`;
      occurrencesMap[key] = occ;
    }

    // Group items by day of week
    const monthlyData = {};
    for (let i = 0; i < 7; i++) {
      monthlyData[i] = result.rows.filter(item => item.day_of_week === i);
    }

    res.json({
      success: true,
      data: {
        month,
        year: parseInt(year),
        monthNum: parseInt(monthNum),
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        daysInMonth: endDate.getDate(),
        days: monthlyData,
        occurrences: occurrencesMap
      }
    });

  } catch (error) {
    console.error('Get monthly view error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/schedulers
// @desc    Create new scheduler
// @access  Private
router.post('/', protect, [
  body('title')
    .isLength({ min: 1, max: 100 })
    .withMessage('Title is required and must be less than 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('category')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Category must be less than 50 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Debug logging
    console.log('🔍 CREATE SCHEDULER REQUEST:');
    console.log('Body:', JSON.stringify(req.body, null, 2));

    const { 
      title, 
      description, 
      category, 
      is_public = true, 
      items = [] 
    } = req.body;
    
    // Create scheduler
    const schedulerResult = await query(`
      INSERT INTO schedulers (user_id, title, description, category, is_public)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [req.user.id, title, description, category, is_public]);

    const scheduler = schedulerResult.rows[0];

    // Create scheduler items if provided
    if (items.length > 0) {
      console.log(`📝 Creating ${items.length} items...`);
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        console.log(`📋 Item ${i + 1}:`, JSON.stringify(item, null, 2));
        
        // Calculate next occurrence for the item
        let next_occurrence = item.item_start_date || item.start_date || new Date().toISOString().split('T')[0];
        
        console.log(`📅 Calculated next_occurrence: ${next_occurrence}`);
        
        await query(`
          INSERT INTO scheduler_items (
            scheduler_id, title, description, start_time, end_time, 
            day_of_week, start_date, end_date, priority, order_index,
            recurrence_type, recurrence_interval, item_start_date, item_end_date, next_occurrence, color, exclusion_dates
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        `, [
          scheduler.id,
          item.title,
          item.description,
          item.start_time,
          item.end_time,
          item.day_of_week,
          item.start_date,
          null, // end_date column - keeping null for now
          item.priority || 1,
          item.order_index || i,
          item.recurrence_type || 'one-time',
          item.recurrence_interval || 1,
          item.item_start_date,
          item.item_end_date,
          next_occurrence,
          item.color || 'blue',
          JSON.stringify(item.exclusion_dates || [])
        ]);
      }
    }

    res.status(201).json({
      success: true,
      data: scheduler
    });

  } catch (error) {
    console.error('Create scheduler error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    // Check if it's a missing column error
    if (error.message && error.message.includes('column') && error.message.includes('does not exist')) {
      // Try to run migration
      try {
        console.log('🔄 Missing column detected, attempting automatic migration...');
        const addMissingColumns = require('../../database/migrate-add-missing-columns');
        await addMissingColumns();
        console.log('✅ Migration completed, please retry the create');
        return res.status(500).json({
          success: false,
          error: 'Database schema was outdated. Migration completed. Please retry your request.',
          needsRetry: true
        });
      } catch (migrationError) {
        console.error('❌ Automatic migration failed:', migrationError);
      }
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   PUT /api/schedulers/:id
// @desc    Update scheduler
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      category, 
      is_public, 
      items 
    } = req.body;

    // Check if scheduler exists
    let existingResult;
    
    // Admin can edit any scheduler
    if (req.user.role === 'admin') {
      existingResult = await query(
        'SELECT * FROM schedulers WHERE id = $1',
        [id]
      );
    } else {
      // Regular users can only edit their own schedulers
      existingResult = await query(
        'SELECT * FROM schedulers WHERE id = $1 AND user_id = $2',
        [id, req.user.id]
      );
    }

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Scheduler not found or access denied'
      });
    }

    // Update scheduler
    const updateResult = await query(`
      UPDATE schedulers 
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          category = COALESCE($3, category),
          is_public = COALESCE($4, is_public),
          updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `, [title, description, category, is_public, id]);

    const scheduler = updateResult.rows[0];

    // Update items if provided
    if (items) {
      // Delete existing items
      await query('DELETE FROM scheduler_items WHERE scheduler_id = $1', [id]);

      // Create new items
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        console.log(`🎨 Backend processing item ${i + 1}:`, {
          title: item.title,
          color: item.color,
          target_date: item.target_date,
          fullItem: item
        });
        
        try {
          // Handle both new format (target_date) and legacy format
          const targetDate = item.target_date || item.start_date || item.item_start_date;
          const endDate = item.end_date || item.item_end_date;
          
          // Calculate next occurrence for the item
          let next_occurrence = targetDate || new Date().toISOString().split('T')[0];
          
          // For backward compatibility, set start_date and item_start_date based on recurrence_type
          const startDate = item.recurrence_type === 'one-time' ? targetDate : item.start_date;
          const itemStartDate = item.recurrence_type !== 'one-time' ? targetDate : item.item_start_date;
          const itemEndDate = item.recurrence_type !== 'one-time' ? endDate : item.item_end_date;
          
          console.log(`📝 Inserting item ${i + 1} with values:`, {
            scheduler_id: scheduler.id,
            title: item.title,
            description: item.description,
            start_time: item.start_time,
            end_time: item.end_time,
            day_of_week: item.day_of_week,
            start_date: startDate,
            end_date: null,
            priority: item.priority || 1,
            order_index: item.order_index || i,
            recurrence_type: item.recurrence_type || 'one-time',
            recurrence_interval: item.recurrence_interval || 1,
            item_start_date: itemStartDate,
            item_end_date: itemEndDate,
            next_occurrence: next_occurrence,
            color: item.color || 'blue'
          });
          
          await query(`
            INSERT INTO scheduler_items (
              scheduler_id, title, description, start_time, end_time, 
              day_of_week, start_date, end_date, priority, order_index,
              recurrence_type, recurrence_interval, item_start_date, item_end_date, next_occurrence, color, exclusion_dates
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          `, [
            scheduler.id,
            item.title,
            item.description,
            item.start_time,
            item.end_time,
            item.day_of_week,
            startDate,
            null, // end_date column - keeping null for now
            item.priority || 1,
            item.order_index || i,
            item.recurrence_type || 'one-time',
            item.recurrence_interval || 1,
            itemStartDate,
            itemEndDate,
            next_occurrence,
            item.color || 'blue',
            JSON.stringify(item.exclusion_dates || [])
          ]);
          
          console.log(`✅ Successfully inserted item ${i + 1}`);
        } catch (itemError) {
          console.error(`❌ Error inserting item ${i + 1}:`, itemError);
          console.error('Item data that caused error:', item);
          throw itemError; // Re-throw to be caught by outer try-catch
        }
      }
    }

    res.json({
      success: true,
      data: scheduler
    });

  } catch (error) {
    console.error('Update scheduler error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    // Check if it's a missing column error
    if (error.message && error.message.includes('column') && error.message.includes('does not exist')) {
      // Try to run migration
      try {
        console.log('🔄 Missing column detected, attempting automatic migration...');
        const addMissingColumns = require('../../database/migrate-add-missing-columns');
        await addMissingColumns();
        console.log('✅ Migration completed, please retry the update');
        return res.status(500).json({
          success: false,
          error: 'Database schema was outdated. Migration completed. Please retry your request.',
          needsRetry: true
        });
      } catch (migrationError) {
        console.error('❌ Automatic migration failed:', migrationError);
      }
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   DELETE /api/schedulers/:id
// @desc    Delete scheduler
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if scheduler exists
    let existingResult;
    
    // Admin can edit any scheduler
    if (req.user.role === 'admin') {
      existingResult = await query(
        'SELECT * FROM schedulers WHERE id = $1',
        [id]
      );
    } else {
      // Regular users can only edit their own schedulers
      existingResult = await query(
        'SELECT * FROM schedulers WHERE id = $1 AND user_id = $2',
        [id, req.user.id]
      );
    }

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Scheduler not found or access denied'
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

// @route   POST /api/schedulers/:id/like
// @desc    Like/unlike a scheduler
// @access  Private
router.post('/:id/like', protect, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if scheduler exists
    const schedulerResult = await query(
      'SELECT * FROM schedulers WHERE id = $1',
      [id]
    );

    if (schedulerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Scheduler not found'
      });
    }

    // Check if user already liked
    const existingLike = await query(
      'SELECT * FROM user_interactions WHERE user_id = $1 AND scheduler_id = $2 AND interaction_type = $3',
      [req.user.id, id, 'like']
    );

    if (existingLike.rows.length > 0) {
      // Unlike
      await query(
        'DELETE FROM user_interactions WHERE user_id = $1 AND scheduler_id = $2 AND interaction_type = $3',
        [req.user.id, id, 'like']
      );

      res.json({
        success: true,
        message: 'Scheduler unliked',
        liked: false
      });
    } else {
      // Like
      await query(
        'INSERT INTO user_interactions (user_id, scheduler_id, interaction_type) VALUES ($1, $2, $3)',
        [req.user.id, id, 'like']
      );

      res.json({
        success: true,
        message: 'Scheduler liked',
        liked: true
      });
    }

  } catch (error) {
    console.error('Like scheduler error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/schedulers/:id/use
// @desc    Mark scheduler as used
// @access  Private
router.post('/:id/use', protect, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if scheduler exists
    const schedulerResult = await query(
      'SELECT * FROM schedulers WHERE id = $1',
      [id]
    );

    if (schedulerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Scheduler not found'
      });
    }

    // Record usage
    await query(
      'INSERT INTO user_interactions (user_id, scheduler_id, interaction_type) VALUES ($1, $2, $3)',
      [req.user.id, id, 'use']
    );

    res.json({
      success: true,
      message: 'Scheduler usage recorded'
    });

  } catch (error) {
    console.error('Use scheduler error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router; 