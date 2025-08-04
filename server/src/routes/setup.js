const express = require('express');
const router = express.Router();
const createTables = require('../../database/setup');
const seedData = require('../../database/seed');

// Temporary setup route - REMOVE IN PRODUCTION
router.get('/setup-database', async (req, res) => {
  try {
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