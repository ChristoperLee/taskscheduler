const { pool } = require('./utils/database');

async function setupDatabaseOnce() {
  try {
    // Check if tables exist
    const tablesResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (!tablesResult.rows[0].exists) {
      console.log('📦 Setting up database tables...');
      
      // Import and run the setup function
      const createTables = require('../database/setup');
      await createTables();
      
      console.log('✅ Database tables created');
    } else {
      console.log('✅ Database tables already exist');
    }
    
    // Check if we have any users (to determine if we need to seed)
    const usersResult = await pool.query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(usersResult.rows[0].count);
    
    if (userCount === 0) {
      // Only seed if database is empty
      console.log('🌱 Seeding database with sample data...');
      const seedDatabase = require('../database/seed');
      await seedDatabase();
      console.log('✅ Database seeding complete!');
    } else {
      console.log(`✅ Database already has ${userCount} users, skipping seed`);
    }
    
  } catch (error) {
    console.error('⚠️ Database setup check failed:', error.message);
    // Don't throw - let the app start anyway
    // This allows the app to run even if setup has issues
  }
}

// Run setup
setupDatabaseOnce();

module.exports = setupDatabaseOnce;