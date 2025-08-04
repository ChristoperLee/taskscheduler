const { pool } = require('./utils/database');

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
    
    // Import and run the setup function
    const createTables = require('../database/setup');
    await createTables();
    
    // Import and run the seed function
    console.log('🌱 Seeding database with sample data...');
    const seedDatabase = require('../database/seed');
    await seedDatabase();
    
    console.log('✅ Database setup and seeding complete!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    // Don't throw - let the app start anyway
  }
}

// Run setup
setupDatabaseOnce();

module.exports = setupDatabaseOnce;