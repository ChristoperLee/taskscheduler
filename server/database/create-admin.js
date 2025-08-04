const bcrypt = require('bcryptjs');
const { query } = require('../src/utils/database');

const createAdminUser = async () => {
  try {
    console.log('Creating admin user...');

    const adminUsername = 'admin';
    const adminEmail = 'admin@taskscheduler.com';
    const adminPassword = 'admin123'; // Change this to a secure password

    // Check if admin user already exists
    const existingUser = await query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [adminUsername, adminEmail]
    );

    if (existingUser.rows.length > 0) {
      console.log('❌ Admin user already exists');
      return;
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    // Create admin user
    const result = await query(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, role, created_at
    `, [adminUsername, adminEmail, hashedPassword, 'admin']);

    const adminUser = result.rows[0];

    console.log('✅ Admin user created successfully!');
    console.log('Admin Details:');
    console.log(`  ID: ${adminUser.id}`);
    console.log(`  Username: ${adminUser.username}`);
    console.log(`  Email: ${adminUser.email}`);
    console.log(`  Role: ${adminUser.role}`);
    console.log(`  Created: ${adminUser.created_at}`);
    console.log('');
    console.log('Login credentials:');
    console.log(`  Username: ${adminUsername}`);
    console.log(`  Password: ${adminPassword}`);
    console.log('');
    console.log('⚠️  Please change the password after first login!');

  } catch (error) {
    console.error('❌ Failed to create admin user:', error);
    throw error;
  }
};

// Run script if executed directly
if (require.main === module) {
  createAdminUser()
    .then(() => {
      console.log('Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createAdminUser };