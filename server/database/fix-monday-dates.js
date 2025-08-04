const { query } = require('../src/utils/database');

const fixMondayDates = async () => {
  try {
    // Find next Monday from today
    const today = new Date();
    console.log('Today:', today.toDateString(), 'Day:', today.getDay());
    
    // Calculate next Monday
    let nextMonday = new Date(today);
    const daysUntilMonday = (1 - today.getDay() + 7) % 7; // Days until Monday
    if (daysUntilMonday === 0 && today.getDay() !== 1) {
      nextMonday.setDate(today.getDate() + 7); // Next Monday if today is not Monday
    } else {
      nextMonday.setDate(today.getDate() + daysUntilMonday);
    }
    
    console.log('Next Monday:', nextMonday.toDateString(), 'Day:', nextMonday.getDay());
    
    // Update all items with day_of_week = 1 to start on next Monday
    const mondayStr = nextMonday.toISOString().split('T')[0];
    console.log('Setting Monday items to start on:', mondayStr);
    
    await query('UPDATE scheduler_items SET item_start_date = $1 WHERE day_of_week = 1', [mondayStr]);
    
    // Show updated items
    const result = await query('SELECT title, recurrence_type, day_of_week, item_start_date FROM scheduler_items WHERE day_of_week = 1');
    console.log('Updated Monday items:');
    result.rows.forEach(item => {
      const date = new Date(item.item_start_date);
      console.log(`- ${item.title} (${item.recurrence_type}): ${date.toDateString()} (day ${date.getDay()})`);
    });
    
    console.log('✅ Monday dates fixed!');
  } catch (error) {
    console.error('❌ Fix failed:', error);
    throw error;
  }
};

// Run fix if this file is executed directly
if (require.main === module) {
  fixMondayDates()
    .then(() => {
      console.log('Fix completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixMondayDates };