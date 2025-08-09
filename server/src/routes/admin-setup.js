const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { query } = require('../utils/database');

// @route   GET /api/admin-setup/check
// @desc    Check if admin exists and role column exists
// @access  Public (temporary for setup)
router.get('/check', async (req, res) => {
  try {
    // Check if role column exists
    const roleColumnCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
        AND column_name = 'role'
      );
    `);
    
    const roleColumnExists = roleColumnCheck.rows[0].exists;
    
    // Check if admin user exists
    const adminCheck = await query(
      "SELECT * FROM users WHERE username = 'admin' OR email = 'admin@taskscheduler.com'"
    );
    
    const adminExists = adminCheck.rows.length > 0;
    const adminHasRole = adminExists && adminCheck.rows[0].role === 'admin';
    
    res.json({
      success: true,
      data: {
        roleColumnExists,
        adminExists,
        adminHasRole,
        adminUser: adminExists ? {
          username: adminCheck.rows[0].username,
          email: adminCheck.rows[0].email,
          role: adminCheck.rows[0].role || 'not set'
        } : null
      }
    });
  } catch (error) {
    console.error('Check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/admin-setup/fix
// @desc    Automatically fix admin setup issues
// @access  Public (temporary for setup)
router.get('/fix', async (req, res) => {
  try {
    const steps = [];
    
    // Step 1: Check and add role column if needed
    const roleColumnCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
        AND column_name = 'role'
      );
    `);
    
    if (!roleColumnCheck.rows[0].exists) {
      await query(`
        ALTER TABLE users 
        ADD COLUMN role VARCHAR(20) DEFAULT 'user'
      `);
      steps.push('Added role column to users table');
      
      // Add constraint
      try {
        await query(`
          ALTER TABLE users 
          ADD CONSTRAINT valid_role CHECK (role IN ('user', 'admin', 'moderator'))
        `);
        steps.push('Added role validation constraint');
      } catch (err) {
        // Constraint might already exist
        console.log('Constraint may already exist:', err.message);
      }
    } else {
      steps.push('Role column already exists');
    }
    
    // Step 2: Check and add is_active column if needed
    const isActiveCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
        AND column_name = 'is_active'
      );
    `);
    
    if (!isActiveCheck.rows[0].exists) {
      await query(`
        ALTER TABLE users 
        ADD COLUMN is_active BOOLEAN DEFAULT true
      `);
      steps.push('Added is_active column to users table');
    } else {
      steps.push('is_active column already exists');
    }
    
    // Step 3: Check and add last_login column if needed
    const lastLoginCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
        AND column_name = 'last_login'
      );
    `);
    
    if (!lastLoginCheck.rows[0].exists) {
      await query(`
        ALTER TABLE users 
        ADD COLUMN last_login TIMESTAMP
      `);
      steps.push('Added last_login column to users table');
    } else {
      steps.push('last_login column already exists');
    }
    
    // Step 4: Create or update admin user
    const adminCheck = await query(
      "SELECT * FROM users WHERE username = 'admin' OR email = 'admin@taskscheduler.com'"
    );
    
    if (adminCheck.rows.length === 0) {
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await query(
        'INSERT INTO users (username, email, password_hash, role, is_active) VALUES ($1, $2, $3, $4, $5)',
        ['admin', 'admin@taskscheduler.com', hashedPassword, 'admin', true]
      );
      steps.push('Created admin user (username: admin, password: admin123)');
    } else {
      // Update existing user to admin
      await query(
        "UPDATE users SET role = 'admin', is_active = true WHERE username = 'admin' OR email = 'admin@taskscheduler.com'"
      );
      steps.push('Updated existing admin user role to admin');
    }
    
    res.json({
      success: true,
      message: 'Admin setup completed successfully!',
      steps,
      credentials: {
        username: 'admin',
        email: 'admin@taskscheduler.com',
        password: 'admin123'
      }
    });
  } catch (error) {
    console.error('Fix error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;