const { query } = require('../src/utils/database');

const fixWeeklyItems = async () => {
  try {
    console.log('Fixing weekly items that were incorrectly migrated...');

    // Update items that have day_of_week set to be weekly recurring
    await query(`
      UPDATE scheduler_items 
      SET recurrence_type = 'weekly',
          item_start_date = CURRENT_DATE
      WHERE day_of_week IS NOT NULL 
        AND recurrence_type = 'one-time'
    `);
    console.log('✅ Fixed weekly items');

    // Show the updated items
    const result = await query(`
      SELECT id, title, day_of_week, recurrence_type, item_start_date 
      FROM scheduler_items 
      WHERE day_of_week IS NOT NULL 
      LIMIT 5
    `);
    console.log('Updated items:', result.rows);

    console.log('🎉 Weekly items fix completed successfully!');
  } catch (error) {
    console.error('❌ Fix failed:', error);
    throw error;
  }
};

// Run fix if this file is executed directly
if (require.main === module) {
  fixWeeklyItems()
    .then(() => {
      console.log('Fix completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixWeeklyItems };