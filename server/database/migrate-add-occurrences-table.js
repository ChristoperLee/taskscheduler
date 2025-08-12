const { query } = require('../src/utils/database');

const createOccurrencesTable = async () => {
  try {
    console.log('🔄 Creating scheduler_item_occurrences table...');
    
    // Create the occurrences table
    await query(`
      CREATE TABLE IF NOT EXISTS scheduler_item_occurrences (
        id SERIAL PRIMARY KEY,
        scheduler_item_id INTEGER REFERENCES scheduler_items(id) ON DELETE CASCADE,
        occurrence_date DATE NOT NULL,
        is_deleted BOOLEAN DEFAULT false,
        is_modified BOOLEAN DEFAULT false,
        modified_title VARCHAR(100),
        modified_description TEXT,
        modified_start_time TIME,
        modified_end_time TIME,
        modified_color VARCHAR(20),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        -- Ensure we don't have duplicate occurrences for the same item and date
        UNIQUE(scheduler_item_id, occurrence_date)
      )
    `);
    
    console.log('✅ Created scheduler_item_occurrences table');
    
    // Add indexes for better query performance
    await query(`
      CREATE INDEX IF NOT EXISTS idx_occurrences_item_id 
      ON scheduler_item_occurrences(scheduler_item_id);
      
      CREATE INDEX IF NOT EXISTS idx_occurrences_date 
      ON scheduler_item_occurrences(occurrence_date);
      
      CREATE INDEX IF NOT EXISTS idx_occurrences_deleted 
      ON scheduler_item_occurrences(is_deleted);
      
      CREATE INDEX IF NOT EXISTS idx_occurrences_item_date 
      ON scheduler_item_occurrences(scheduler_item_id, occurrence_date, is_deleted);
    `);
    
    console.log('✅ Added indexes on occurrences table');
    
    // Add a trigger to update the updated_at timestamp
    await query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    
    await query(`
      DROP TRIGGER IF EXISTS update_occurrences_updated_at ON scheduler_item_occurrences;
      
      CREATE TRIGGER update_occurrences_updated_at 
      BEFORE UPDATE ON scheduler_item_occurrences 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
    
    console.log('✅ Added updated_at trigger');
    
    // Migrate existing exclusion_dates to occurrences table
    console.log('🔄 Migrating existing exclusion dates...');
    
    const itemsWithExclusions = await query(`
      SELECT id, exclusion_dates 
      FROM scheduler_items 
      WHERE exclusion_dates IS NOT NULL 
      AND exclusion_dates != '[]'::jsonb
    `);
    
    let migratedCount = 0;
    for (const item of itemsWithExclusions.rows) {
      if (item.exclusion_dates && Array.isArray(item.exclusion_dates)) {
        for (const date of item.exclusion_dates) {
          try {
            await query(`
              INSERT INTO scheduler_item_occurrences 
              (scheduler_item_id, occurrence_date, is_deleted)
              VALUES ($1, $2, true)
              ON CONFLICT (scheduler_item_id, occurrence_date) DO NOTHING
            `, [item.id, date]);
            migratedCount++;
          } catch (err) {
            console.error(`Failed to migrate exclusion date ${date} for item ${item.id}:`, err.message);
          }
        }
      }
    }
    
    if (migratedCount > 0) {
      console.log(`✅ Migrated ${migratedCount} exclusion dates to occurrences table`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Function to generate occurrences for a recurring item
const generateOccurrences = async (itemId, startDate, endDate, recurrenceType, dayOfWeek, interval = 1) => {
  const occurrences = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  while (current <= end) {
    // Check if this date matches the recurrence pattern
    let shouldAdd = false;
    
    switch (recurrenceType) {
      case 'daily':
        shouldAdd = true;
        break;
        
      case 'weekly':
        // Check if it's the right day of week
        const currentDayOfWeek = current.getDay() === 0 ? 7 : current.getDay();
        shouldAdd = currentDayOfWeek === dayOfWeek;
        break;
        
      case 'bi-weekly':
        // Check if it's the right day and right week
        const weeksDiff = Math.floor((current - new Date(startDate)) / (7 * 24 * 60 * 60 * 1000));
        const currentDayBiWeekly = current.getDay() === 0 ? 7 : current.getDay();
        shouldAdd = currentDayBiWeekly === dayOfWeek && weeksDiff % 2 === 0;
        break;
        
      case 'monthly':
        // Check if it's the right day of month
        const startDateObj = new Date(startDate);
        shouldAdd = current.getDate() === startDateObj.getDate();
        break;
        
      case 'quarterly':
        // Check if it's the right day and right quarter
        const monthsDiff = (current.getFullYear() - new Date(startDate).getFullYear()) * 12 
                        + current.getMonth() - new Date(startDate).getMonth();
        const startDateQuarterly = new Date(startDate);
        shouldAdd = current.getDate() === startDateQuarterly.getDate() && monthsDiff % 3 === 0;
        break;
    }
    
    if (shouldAdd) {
      occurrences.push(current.toISOString().split('T')[0]);
    }
    
    // Move to next day
    current.setDate(current.getDate() + 1);
  }
  
  return occurrences;
};

// Run migration if this file is executed directly
if (require.main === module) {
  createOccurrencesTable()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { createOccurrencesTable, generateOccurrences };