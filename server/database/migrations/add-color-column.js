const { query } = require('../../src/utils/database');

async function addColorColumn() {
  try {
    console.log('🎨 Adding color column to scheduler_items table...');
    
    // Add color column to scheduler_items table
    await query(`
      ALTER TABLE scheduler_items 
      ADD COLUMN IF NOT EXISTS color VARCHAR(20) DEFAULT 'blue'
    `);
    
    console.log('✅ Color column added successfully');
    
    // Update existing records to have default blue color
    await query(`
      UPDATE scheduler_items 
      SET color = 'blue' 
      WHERE color IS NULL
    `);
    
    console.log('✅ Existing records updated with default blue color');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  addColorColumn()
    .then(() => {
      console.log('🎉 Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addColorColumn };