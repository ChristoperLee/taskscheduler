const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../utils/database');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   DELETE /api/scheduler-items/:id/occurrence/:date
// @desc    Delete a specific occurrence of a scheduler item
// @access  Private
router.delete('/:id/occurrence/:date', protect, async (req, res) => {
  try {
    const { id, date } = req.params;

    // Get the scheduler item and verify ownership
    const itemResult = await query(`
      SELECT si.*, s.user_id 
      FROM scheduler_items si
      JOIN schedulers s ON si.scheduler_id = s.id
      WHERE si.id = $1
    `, [id]);

    if (itemResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Scheduler item not found'
      });
    }

    const item = itemResult.rows[0];

    // Check if user owns the scheduler or is admin
    if (item.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Parse the date to ensure consistent format (YYYY-MM-DD)
    const occurrenceDate = new Date(date).toISOString().split('T')[0];

    // Check if an occurrence record exists
    const existingOccurrence = await query(`
      SELECT * FROM scheduler_item_occurrences 
      WHERE scheduler_item_id = $1 AND occurrence_date = $2
    `, [id, occurrenceDate]);

    if (existingOccurrence.rows.length > 0) {
      // Update existing occurrence to mark as deleted
      await query(`
        UPDATE scheduler_item_occurrences 
        SET is_deleted = true, updated_at = NOW()
        WHERE scheduler_item_id = $1 AND occurrence_date = $2
      `, [id, occurrenceDate]);
    } else {
      // Create a new occurrence record marked as deleted
      await query(`
        INSERT INTO scheduler_item_occurrences 
        (scheduler_item_id, occurrence_date, is_deleted)
        VALUES ($1, $2, true)
        ON CONFLICT (scheduler_item_id, occurrence_date) 
        DO UPDATE SET is_deleted = true, updated_at = NOW()
      `, [id, occurrenceDate]);
    }

    res.json({
      success: true,
      message: `Occurrence on ${occurrenceDate} has been deleted`
    });

  } catch (error) {
    console.error('Delete occurrence error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/scheduler-items/:id/occurrence/:date
// @desc    Restore or modify a specific occurrence
// @access  Private
router.put('/:id/occurrence/:date', protect, async (req, res) => {
  try {
    const { id, date } = req.params;
    const { restore, modifications } = req.body;

    // Get the scheduler item and verify ownership
    const itemResult = await query(`
      SELECT si.*, s.user_id 
      FROM scheduler_items si
      JOIN schedulers s ON si.scheduler_id = s.id
      WHERE si.id = $1
    `, [id]);

    if (itemResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Scheduler item not found'
      });
    }

    const item = itemResult.rows[0];

    // Check if user owns the scheduler or is admin
    if (item.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const occurrenceDate = new Date(date).toISOString().split('T')[0];

    if (restore) {
      // Restore a deleted occurrence
      await query(`
        UPDATE scheduler_item_occurrences 
        SET is_deleted = false, updated_at = NOW()
        WHERE scheduler_item_id = $1 AND occurrence_date = $2
      `, [id, occurrenceDate]);
      
      res.json({
        success: true,
        message: `Occurrence on ${occurrenceDate} has been restored`
      });
    } else if (modifications) {
      // Modify a specific occurrence
      const updateFields = [];
      const values = [];
      let paramCount = 2;

      if (modifications.title !== undefined) {
        updateFields.push(`modified_title = $${++paramCount}`);
        values.push(modifications.title);
      }
      if (modifications.description !== undefined) {
        updateFields.push(`modified_description = $${++paramCount}`);
        values.push(modifications.description);
      }
      if (modifications.start_time !== undefined) {
        updateFields.push(`modified_start_time = $${++paramCount}`);
        values.push(modifications.start_time);
      }
      if (modifications.end_time !== undefined) {
        updateFields.push(`modified_end_time = $${++paramCount}`);
        values.push(modifications.end_time);
      }
      if (modifications.color !== undefined) {
        updateFields.push(`modified_color = $${++paramCount}`);
        values.push(modifications.color);
      }
      if (modifications.notes !== undefined) {
        updateFields.push(`notes = $${++paramCount}`);
        values.push(modifications.notes);
      }

      if (updateFields.length > 0) {
        const existingOccurrence = await query(`
          SELECT * FROM scheduler_item_occurrences 
          WHERE scheduler_item_id = $1 AND occurrence_date = $2
        `, [id, occurrenceDate]);

        if (existingOccurrence.rows.length > 0) {
          // Update existing occurrence
          await query(`
            UPDATE scheduler_item_occurrences 
            SET ${updateFields.join(', ')}, is_modified = true, updated_at = NOW()
            WHERE scheduler_item_id = $1 AND occurrence_date = $2
          `, [id, occurrenceDate, ...values]);
        } else {
          // Create new occurrence with modifications
          await query(`
            INSERT INTO scheduler_item_occurrences 
            (scheduler_item_id, occurrence_date, is_modified, ${updateFields.map(f => f.split(' = ')[0]).join(', ')})
            VALUES ($1, $2, true, ${values.map((_, i) => `$${i + 3}`).join(', ')})
          `, [id, occurrenceDate, ...values]);
        }

        res.json({
          success: true,
          message: `Occurrence on ${occurrenceDate} has been modified`
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'No modifications provided'
        });
      }
    } else {
      res.status(400).json({
        success: false,
        error: 'No action specified (restore or modifications required)'
      });
    }

  } catch (error) {
    console.error('Update occurrence error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/scheduler-items/:id/occurrences
// @desc    Get all occurrences for a scheduler item (including deleted/modified)
// @access  Public
router.get('/:id/occurrences', async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date, include_deleted } = req.query;

    let queryStr = `
      SELECT * FROM scheduler_item_occurrences 
      WHERE scheduler_item_id = $1
    `;
    const params = [id];
    let paramCount = 1;

    if (start_date) {
      queryStr += ` AND occurrence_date >= $${++paramCount}`;
      params.push(start_date);
    }

    if (end_date) {
      queryStr += ` AND occurrence_date <= $${++paramCount}`;
      params.push(end_date);
    }

    if (!include_deleted || include_deleted !== 'true') {
      queryStr += ` AND is_deleted = false`;
    }

    queryStr += ` ORDER BY occurrence_date`;

    const result = await query(queryStr, params);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get occurrences error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;