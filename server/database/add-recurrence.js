const { query } = require('../src/utils/database');

const addRecurrenceFields = async () => {
  try {
    console.log('Adding recurrence fields to schedulers table...');

    // Add recurrence fields to schedulers table
    await query(`
      ALTER TABLE schedulers 
      ADD COLUMN IF NOT EXISTS recurrence_type VARCHAR(20) DEFAULT 'one-time',
      ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS start_date DATE,
      ADD COLUMN IF NOT EXISTS end_date DATE,
      ADD COLUMN IF NOT EXISTS next_occurrence DATE
    `);
    console.log('✅ Recurrence fields added to schedulers table');

    // Update existing schedulers to have default recurrence
    await query(`
      UPDATE schedulers 
      SET recurrence_type = 'one-time', 
          start_date = created_at::date,
          next_occurrence = created_at::date
      WHERE recurrence_type IS NULL
    `);
    console.log('✅ Updated existing schedulers with default recurrence');

    console.log('🎉 Recurrence schema update completed successfully!');
  } catch (error) {
    console.error('❌ Schema update failed:', error);
    throw error;
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  addRecurrenceFields()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addRecurrenceFields };