const { query } = require('../src/utils/database');

const addMissingColumns = async () => {
  try {
    console.log('🔄 Starting database migration to add missing columns...');

    // Check if columns already exist and add them if they don't
    const columnsToAdd = [
      {
        table: 'scheduler_items',
        column: 'item_start_date',
        definition: 'DATE'
      },
      {
        table: 'scheduler_items',
        column: 'item_end_date',
        definition: 'DATE'
      },
      {
        table: 'scheduler_items',
        column: 'next_occurrence',
        definition: 'DATE'
      },
      {
        table: 'scheduler_items',
        column: 'color',
        definition: "VARCHAR(20) DEFAULT 'blue'"
      }
    ];

    for (const { table, column, definition } of columnsToAdd) {
      try {
        // Check if column exists
        const columnExists = await query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = $1
            AND column_name = $2
          );
        `, [table, column]);

        if (!columnExists.rows[0].exists) {
          // Add the column
          await query(`
            ALTER TABLE ${table} 
            ADD COLUMN ${column} ${definition}
          `);
          console.log(`✅ Added column ${column} to ${table} table`);
        } else {
          console.log(`ℹ️ Column ${column} already exists in ${table} table`);
        }
      } catch (error) {
        console.error(`❌ Error adding column ${column} to ${table}:`, error.message);
      }
    }

    console.log('✅ Database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    throw error;
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  addMissingColumns()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = addMissingColumns;