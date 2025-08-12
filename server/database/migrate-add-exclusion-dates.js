const { query } = require('../src/utils/database');

const addExclusionDates = async () => {
  try {
    console.log('🔄 Adding exclusion_dates column to scheduler_items table...');
    
    // Check if the column already exists
    const checkColumn = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'scheduler_items' 
      AND column_name = 'exclusion_dates'
    `);
    
    if (checkColumn.rows.length > 0) {
      console.log('✅ Column exclusion_dates already exists');
      return;
    }
    
    // Add the exclusion_dates column
    // This will store an array of dates when this recurring item should NOT occur
    // Stored as JSONB for flexibility and query performance
    await query(`
      ALTER TABLE scheduler_items 
      ADD COLUMN exclusion_dates JSONB DEFAULT '[]'::jsonb
    `);
    
    console.log('✅ Added exclusion_dates column successfully');
    
    // Add an index for better query performance
    await query(`
      CREATE INDEX IF NOT EXISTS idx_scheduler_items_exclusion_dates 
      ON scheduler_items USING GIN (exclusion_dates)
    `);
    
    console.log('✅ Added index on exclusion_dates column');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  addExclusionDates()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = addExclusionDates;