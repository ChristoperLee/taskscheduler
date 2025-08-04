const { pool } = require('./utils/database');
const fs = require('fs').promises;
const path = require('path');

async function setupDatabaseOnce() {
  try {
    // Check if tables exist
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (result.rows[0].exists) {
      console.log('✅ Database tables already exist');
      return;
    }
    
    console.log('📦 Setting up database tables...');
    
    // Read and execute setup.sql
    const setupSQL = await fs.readFile(
      path.join(__dirname, '../database/setup.sql'),
      'utf8'
    );
    
    await pool.query(setupSQL);
    console.log('✅ Database setup complete!');
    
    // Optionally seed with sample data
    const seedSQL = await fs.readFile(
      path.join(__dirname, '../database/seed.sql'),
      'utf8'
    );
    
    await pool.query(seedSQL);
    console.log('🌱 Database seeded with sample data');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    // Don't throw - let the app start anyway
  }
}

// Run setup
setupDatabaseOnce();

module.exports = setupDatabaseOnce;