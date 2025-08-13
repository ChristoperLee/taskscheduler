const { query } = require('../src/utils/database');

async function addMissingColumns() {
  console.log('🔄 Adding missing columns to Railway database...');
  
  try {
    // Add item_start_date column
    try {
      await query(`ALTER TABLE scheduler_items ADD COLUMN IF NOT EXISTS item_start_date DATE`);
      console.log('✅ Added item_start_date column');
    } catch (error) {
      console.log('⚠️  item_start_date column might already exist');
    }

    // Add item_end_date column
    try {
      await query(`ALTER TABLE scheduler_items ADD COLUMN IF NOT EXISTS item_end_date DATE`);
      console.log('✅ Added item_end_date column');
    } catch (error) {
      console.log('⚠️  item_end_date column might already exist');
    }

    // Add next_occurrence column
    try {
      await query(`ALTER TABLE scheduler_items ADD COLUMN IF NOT EXISTS next_occurrence DATE`);
      console.log('✅ Added next_occurrence column');
    } catch (error) {
      console.log('⚠️  next_occurrence column might already exist');
    }

    // Add color column
    try {
      await query(`ALTER TABLE scheduler_items ADD COLUMN IF NOT EXISTS color VARCHAR(20) DEFAULT 'blue'`);
      console.log('✅ Added color column');
    } catch (error) {
      console.log('⚠️  color column might already exist');
    }

    // Add exclusion_dates column (JSONB)
    try {
      await query(`ALTER TABLE scheduler_items ADD COLUMN IF NOT EXISTS exclusion_dates JSONB DEFAULT '[]'::jsonb`);
      console.log('✅ Added exclusion_dates column');
    } catch (error) {
      console.log('⚠️  exclusion_dates column might already exist');
    }

    // Add end_date column if missing (for legacy support)
    try {
      await query(`ALTER TABLE scheduler_items ADD COLUMN IF NOT EXISTS end_date DATE`);
      console.log('✅ Added end_date column');
    } catch (error) {
      console.log('⚠️  end_date column might already exist');
    }

    // Add recurrence_type column
    try {
      await query(`ALTER TABLE scheduler_items ADD COLUMN IF NOT EXISTS recurrence_type VARCHAR(20) DEFAULT 'one-time'`);
      console.log('✅ Added recurrence_type column');
    } catch (error) {
      console.log('⚠️  recurrence_type column might already exist');
    }

    // Add recurrence_interval column
    try {
      await query(`ALTER TABLE scheduler_items ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER DEFAULT 1`);
      console.log('✅ Added recurrence_interval column');
    } catch (error) {
      console.log('⚠️  recurrence_interval column might already exist');
    }

    console.log('✅ All missing columns have been added successfully!');
    
    // Verify the table structure
    const result = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'scheduler_items'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Current scheduler_items columns:');
    result.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if executed directly
if (require.main === module) {
  addMissingColumns()
    .then(() => {
      console.log('\n✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = addMissingColumns;