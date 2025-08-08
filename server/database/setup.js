const { query } = require('../src/utils/database');

const createTables = async () => {
  try {
    console.log('Creating database tables...');

    // Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Users table created');

    // Create schedulers table
    await query(`
      CREATE TABLE IF NOT EXISTS schedulers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(100) NOT NULL,
        description TEXT,
        category VARCHAR(50),
        is_public BOOLEAN DEFAULT true,
        usage_count INTEGER DEFAULT 0,
        like_count INTEGER DEFAULT 0,
        share_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Schedulers table created');

    // Create scheduler_items table
    await query(`
      CREATE TABLE IF NOT EXISTS scheduler_items (
        id SERIAL PRIMARY KEY,
        scheduler_id INTEGER REFERENCES schedulers(id) ON DELETE CASCADE,
        title VARCHAR(100) NOT NULL,
        description TEXT,
        start_time TIME,
        end_time TIME,
        day_of_week INTEGER,
        start_date DATE,
        end_date DATE,
        recurrence_type VARCHAR(20) DEFAULT 'none',
        recurrence_interval INTEGER DEFAULT 1,
        priority INTEGER DEFAULT 1,
        order_index INTEGER,
        item_start_date DATE,
        item_end_date DATE,
        next_occurrence DATE,
        color VARCHAR(20) DEFAULT 'blue',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Scheduler items table created');

    // Create user_interactions table
    await query(`
      CREATE TABLE IF NOT EXISTS user_interactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        scheduler_id INTEGER REFERENCES schedulers(id) ON DELETE CASCADE,
        interaction_type VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, scheduler_id, interaction_type)
      )
    `);
    console.log('✅ User interactions table created');

    // Create indexes for better performance
    await query(`
      CREATE INDEX IF NOT EXISTS idx_schedulers_user_id ON schedulers(user_id);
      CREATE INDEX IF NOT EXISTS idx_schedulers_category ON schedulers(category);
      CREATE INDEX IF NOT EXISTS idx_schedulers_usage_count ON schedulers(usage_count DESC);
      CREATE INDEX IF NOT EXISTS idx_scheduler_items_scheduler_id ON scheduler_items(scheduler_id);
      CREATE INDEX IF NOT EXISTS idx_scheduler_items_day_of_week ON scheduler_items(day_of_week);
      CREATE INDEX IF NOT EXISTS idx_user_interactions_scheduler_id ON user_interactions(scheduler_id);
      CREATE INDEX IF NOT EXISTS idx_user_interactions_type ON user_interactions(interaction_type);
    `);
    console.log('✅ Database indexes created');

    console.log('🎉 Database setup completed successfully!');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }
};

// Run setup if this file is executed directly
if (require.main === module) {
  createTables()
    .then(() => {
      console.log('Setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

module.exports = createTables; 