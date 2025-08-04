const { query } = require('../src/utils/database');

const moveRecurrenceToItems = async () => {
  try {
    console.log('Moving recurrence fields from schedulers to scheduler_items table...');

    // Add recurrence fields to scheduler_items table
    await query(`
      ALTER TABLE scheduler_items 
      ADD COLUMN IF NOT EXISTS recurrence_type VARCHAR(20) DEFAULT 'one-time',
      ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS item_start_date DATE,
      ADD COLUMN IF NOT EXISTS item_end_date DATE,
      ADD COLUMN IF NOT EXISTS next_occurrence DATE
    `);
    console.log('✅ Recurrence fields added to scheduler_items table');

    // Migrate existing recurrence data from schedulers to their items
    await query(`
      UPDATE scheduler_items 
      SET recurrence_type = s.recurrence_type,
          recurrence_interval = s.recurrence_interval,
          item_start_date = s.start_date,
          item_end_date = s.end_date,
          next_occurrence = s.next_occurrence
      FROM schedulers s
      WHERE scheduler_items.scheduler_id = s.id
        AND s.recurrence_type IS NOT NULL
    `);
    console.log('✅ Migrated recurrence data from schedulers to items');

    // Update items without recurrence to have default values
    await query(`
      UPDATE scheduler_items 
      SET recurrence_type = 'one-time',
          recurrence_interval = 1,
          item_start_date = COALESCE(start_date::date, CURRENT_DATE),
          next_occurrence = COALESCE(start_date::date, CURRENT_DATE)
      WHERE recurrence_type IS NULL
    `);
    console.log('✅ Updated items without recurrence to have default values');

    // Remove recurrence fields from schedulers table (optional - keep commented for safety)
    /*
    await query(`
      ALTER TABLE schedulers 
      DROP COLUMN IF EXISTS recurrence_type,
      DROP COLUMN IF EXISTS recurrence_interval,
      DROP COLUMN IF EXISTS start_date,
      DROP COLUMN IF EXISTS end_date,
      DROP COLUMN IF EXISTS next_occurrence
    `);
    console.log('✅ Removed recurrence fields from schedulers table');
    */

    console.log('🎉 Recurrence migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  moveRecurrenceToItems()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { moveRecurrenceToItems };