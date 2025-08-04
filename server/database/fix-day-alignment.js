const { query } = require('../src/utils/database');

const fixDayAlignment = async () => {
  try {
    console.log('Fixing day-of-week alignment for recurring items...');

    // Get all recurring items with misaligned dates
    const result = await query(`
      SELECT id, title, recurrence_type, day_of_week, item_start_date 
      FROM scheduler_items 
      WHERE recurrence_type != 'one-time' 
        AND day_of_week IS NOT NULL
        AND item_start_date IS NOT NULL
    `);

    console.log(`Found ${result.rows.length} recurring items to check`);

    for (const item of result.rows) {
      const startDate = new Date(item.item_start_date);
      const jsDay = startDate.getDay() || 7; // Convert Sunday (0) to 7
      const expectedDay = item.day_of_week;

      console.log(`\nItem: ${item.title}`);
      console.log(`  Expected day_of_week: ${expectedDay} (${['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][expectedDay]})`);
      console.log(`  Current start date: ${startDate.toDateString()} (JS day: ${jsDay})`);

      if (jsDay !== expectedDay) {
        // Calculate the next occurrence of the correct day
        const today = new Date();
        const todayDay = today.getDay() || 7; // Convert Sunday (0) to 7
        let nextCorrectDay = new Date(today);
        
        // Find next occurrence of the expected day
        const daysUntilTarget = (expectedDay - todayDay + 7) % 7;
        if (daysUntilTarget === 0) {
          // If today is the expected day, use today or next week
          if (todayDay === expectedDay) {
            nextCorrectDay = new Date(today);
          } else {
            nextCorrectDay.setDate(today.getDate() + 7);
          }
        } else {
          nextCorrectDay.setDate(today.getDate() + daysUntilTarget);
        }

        const newDateStr = nextCorrectDay.toISOString().split('T')[0];
        console.log(`  Updating to: ${nextCorrectDay.toDateString()} (${newDateStr})`);

        await query(
          'UPDATE scheduler_items SET item_start_date = $1 WHERE id = $2',
          [newDateStr, item.id]
        );
      } else {
        console.log(`  ✓ Already aligned correctly`);
      }
    }

    // Show updated results
    const updatedResult = await query(`
      SELECT title, recurrence_type, day_of_week, item_start_date 
      FROM scheduler_items 
      WHERE recurrence_type != 'one-time' 
      LIMIT 5
    `);

    console.log('\n📅 Updated recurring items:');
    updatedResult.rows.forEach(item => {
      const date = new Date(item.item_start_date);
      const jsDay = date.getDay() || 7;
      console.log(`- ${item.title} (${item.recurrence_type}): day_of_week=${item.day_of_week}, date=${date.toDateString()} (JS day: ${jsDay}) ${jsDay === item.day_of_week ? '✓' : '❌'}`);
    });

    console.log('\n✅ Day alignment fix completed!');
  } catch (error) {
    console.error('❌ Fix failed:', error);
    throw error;
  }
};

// Run fix if this file is executed directly
if (require.main === module) {
  fixDayAlignment()
    .then(() => {
      console.log('Fix completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixDayAlignment };