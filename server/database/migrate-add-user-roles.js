const { query } = require('../src/utils/database');

const addUserRoles = async () => {
  try {
    console.log('🔄 Starting database migration to add user roles...');

    // Check if role column exists
    const roleColumnExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
        AND column_name = 'role'
      );
    `);

    if (!roleColumnExists.rows[0].exists) {
      // Add the role column with default value 'user'
      await query(`
        ALTER TABLE users 
        ADD COLUMN role VARCHAR(20) DEFAULT 'user'
      `);
      console.log('✅ Added role column to users table');
      
      // Check constraint to ensure valid roles
      await query(`
        ALTER TABLE users 
        ADD CONSTRAINT valid_role CHECK (role IN ('user', 'admin', 'moderator'))
      `);
      console.log('✅ Added role validation constraint');
    } else {
      console.log('ℹ️ Role column already exists in users table');
    }

    // Check if is_active column exists (for admin to enable/disable users)
    const isActiveColumnExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
        AND column_name = 'is_active'
      );
    `);

    if (!isActiveColumnExists.rows[0].exists) {
      await query(`
        ALTER TABLE users 
        ADD COLUMN is_active BOOLEAN DEFAULT true
      `);
      console.log('✅ Added is_active column to users table');
    } else {
      console.log('ℹ️ is_active column already exists in users table');
    }

    // Check if last_login column exists
    const lastLoginColumnExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
        AND column_name = 'last_login'
      );
    `);

    if (!lastLoginColumnExists.rows[0].exists) {
      await query(`
        ALTER TABLE users 
        ADD COLUMN last_login TIMESTAMP
      `);
      console.log('✅ Added last_login column to users table');
    } else {
      console.log('ℹ️ last_login column already exists in users table');
    }

    console.log('✅ User roles migration completed successfully!');
    
  } catch (error) {
    console.error('❌ User roles migration failed:', error);
    throw error;
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  addUserRoles()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = addUserRoles;