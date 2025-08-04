const express = require('express');
const router = express.Router();
const createTables = require('../../database/setup');
const seedData = require('../../database/seed');

// Temporary setup route - REMOVE IN PRODUCTION
router.get('/setup-database', async (req, res) => {
  try {
    const { pool } = require('../utils/database');
    
    // Check if tables already exist
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (result.rows[0].exists) {
      // Tables exist, check if they have data
      const userCount = await pool.query('SELECT COUNT(*) FROM users');
      if (userCount.rows[0].count > 0) {
        return res.json({ 
          success: true, 
          message: 'Database already set up with data!',
          userCount: userCount.rows[0].count
        });
      }
      
      // Tables exist but no data, just seed
      console.log('🌱 Seeding database...');
      await seedData();
      return res.json({ 
        success: true, 
        message: 'Database seeded successfully!' 
      });
    }
    
    // Tables don't exist, create and seed
    console.log('🔧 Running database setup...');
    await createTables();
    console.log('🌱 Seeding database...');
    await seedData();
    res.json({ 
      success: true, 
      message: 'Database setup and seeding complete!' 
    });
  } catch (error) {
    console.error('Setup failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;