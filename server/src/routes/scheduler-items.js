const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../utils/database');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   PUT /api/scheduler-items/:id/exclude-date
// @desc    Add an exclusion date to a recurring scheduler item
// @access  Private
router.put('/:id/exclude-date', protect, [
  body('date').isISO8601().withMessage('Valid date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { date } = req.body;

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
    const exclusionDate = new Date(date).toISOString().split('T')[0];

    // Get current exclusion dates
    let exclusionDates = item.exclusion_dates || [];

    // Add the new date if it's not already excluded
    if (!exclusionDates.includes(exclusionDate)) {
      exclusionDates.push(exclusionDate);
      
      // Update the item with new exclusion dates
      const updateResult = await query(`
        UPDATE scheduler_items 
        SET exclusion_dates = $1
        WHERE id = $2
        RETURNING *
      `, [JSON.stringify(exclusionDates), id]);

      res.json({
        success: true,
        data: updateResult.rows[0],
        message: `Date ${exclusionDate} excluded from recurring item`
      });
    } else {
      res.json({
        success: true,
        message: 'Date already excluded',
        data: item
      });
    }

  } catch (error) {
    console.error('Add exclusion date error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   DELETE /api/scheduler-items/:id/exclude-date
// @desc    Remove an exclusion date from a recurring scheduler item
// @access  Private
router.delete('/:id/exclude-date', protect, [
  body('date').isISO8601().withMessage('Valid date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { date } = req.body;

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

    // Parse the date to ensure consistent format
    const exclusionDate = new Date(date).toISOString().split('T')[0];

    // Get current exclusion dates
    let exclusionDates = item.exclusion_dates || [];

    // Remove the date if it exists
    const newExclusionDates = exclusionDates.filter(d => d !== exclusionDate);
    
    if (newExclusionDates.length !== exclusionDates.length) {
      // Update the item with new exclusion dates
      const updateResult = await query(`
        UPDATE scheduler_items 
        SET exclusion_dates = $1
        WHERE id = $2
        RETURNING *
      `, [JSON.stringify(newExclusionDates), id]);

      res.json({
        success: true,
        data: updateResult.rows[0],
        message: `Date ${exclusionDate} removed from exclusions`
      });
    } else {
      res.json({
        success: true,
        message: 'Date was not excluded',
        data: item
      });
    }

  } catch (error) {
    console.error('Remove exclusion date error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;