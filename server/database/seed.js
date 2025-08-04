const bcrypt = require('bcryptjs');
const { query } = require('../src/utils/database');

const seedData = async () => {
  try {
    console.log('Seeding database with sample data...');

    // Create sample users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const users = [
      { username: 'john_doe', email: 'john@example.com', password: hashedPassword },
      { username: 'jane_smith', email: 'jane@example.com', password: hashedPassword },
      { username: 'mike_wilson', email: 'mike@example.com', password: hashedPassword },
      { username: 'sarah_jones', email: 'sarah@example.com', password: hashedPassword },
      { username: 'alex_brown', email: 'alex@example.com', password: hashedPassword }
    ];

    const userIds = [];
    for (const user of users) {
      const result = await query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
        [user.username, user.email, user.password]
      );
      userIds.push(result.rows[0].id);
    }
    console.log('✅ Sample users created');

    // Create sample schedulers
    const schedulers = [
      {
        user_id: userIds[0],
        title: 'Productive Workday Schedule',
        description: 'A comprehensive schedule for maximum productivity during work hours',
        category: 'work',
        usage_count: 1250,
        like_count: 89,
        share_count: 45
      },
      {
        user_id: userIds[1],
        title: 'Morning Routine for Success',
        description: 'Start your day right with this proven morning routine',
        category: 'personal',
        usage_count: 2100,
        like_count: 156,
        share_count: 78
      },
      {
        user_id: userIds[2],
        title: 'Student Study Schedule',
        description: 'Balanced study schedule for academic success',
        category: 'education',
        usage_count: 890,
        like_count: 67,
        share_count: 34
      },
      {
        user_id: userIds[3],
        title: 'Fitness and Wellness Plan',
        description: 'Complete fitness routine with meal planning and recovery',
        category: 'health',
        usage_count: 1560,
        like_count: 123,
        share_count: 67
      },
      {
        user_id: userIds[4],
        title: 'Creative Writing Daily',
        description: 'Daily schedule for developing writing skills and creativity',
        category: 'creative',
        usage_count: 720,
        like_count: 45,
        share_count: 23
      },
      {
        user_id: userIds[0],
        title: 'Weekend Family Time',
        description: 'Balanced weekend schedule for family activities and relaxation',
        category: 'family',
        usage_count: 980,
        like_count: 78,
        share_count: 41
      },
      {
        user_id: userIds[1],
        title: 'Entrepreneur Daily Routine',
        description: 'High-performance schedule for entrepreneurs and business owners',
        category: 'business',
        usage_count: 1340,
        like_count: 112,
        share_count: 58
      },
      {
        user_id: userIds[2],
        title: 'Remote Work Productivity',
        description: 'Optimized schedule for remote work and home office productivity',
        category: 'work',
        usage_count: 1100,
        like_count: 89,
        share_count: 47
      }
    ];

    const schedulerIds = [];
    for (const scheduler of schedulers) {
      const result = await query(
        `INSERT INTO schedulers (user_id, title, description, category, usage_count, like_count, share_count) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [scheduler.user_id, scheduler.title, scheduler.description, scheduler.category, 
         scheduler.usage_count, scheduler.like_count, scheduler.share_count]
      );
      schedulerIds.push(result.rows[0].id);
    }
    console.log('✅ Sample schedulers created');

    // Create sample scheduler items
    const schedulerItems = [
      // Productive Workday Schedule items
      { scheduler_id: schedulerIds[0], title: 'Morning Planning', start_time: '08:00', end_time: '08:30', day_of_week: 1, priority: 1 },
      { scheduler_id: schedulerIds[0], title: 'Deep Work Session 1', start_time: '08:30', end_time: '10:30', day_of_week: 1, priority: 2 },
      { scheduler_id: schedulerIds[0], title: 'Break & Coffee', start_time: '10:30', end_time: '10:45', day_of_week: 1, priority: 3 },
      { scheduler_id: schedulerIds[0], title: 'Team Meeting', start_time: '11:00', end_time: '12:00', day_of_week: 1, priority: 2 },
      { scheduler_id: schedulerIds[0], title: 'Lunch Break', start_time: '12:00', end_time: '13:00', day_of_week: 1, priority: 3 },
      { scheduler_id: schedulerIds[0], title: 'Deep Work Session 2', start_time: '13:00', end_time: '15:00', day_of_week: 1, priority: 2 },
      { scheduler_id: schedulerIds[0], title: 'Email & Communication', start_time: '15:00', end_time: '16:00', day_of_week: 1, priority: 1 },
      { scheduler_id: schedulerIds[0], title: 'End of Day Review', start_time: '16:30', end_time: '17:00', day_of_week: 1, priority: 1 },

      // Morning Routine items
      { scheduler_id: schedulerIds[1], title: 'Wake Up', start_time: '06:00', end_time: '06:15', day_of_week: 1, priority: 1 },
      { scheduler_id: schedulerIds[1], title: 'Hydration & Stretching', start_time: '06:15', end_time: '06:30', day_of_week: 1, priority: 2 },
      { scheduler_id: schedulerIds[1], title: 'Exercise', start_time: '06:30', end_time: '07:15', day_of_week: 1, priority: 2 },
      { scheduler_id: schedulerIds[1], title: 'Shower & Get Ready', start_time: '07:15', end_time: '07:45', day_of_week: 1, priority: 1 },
      { scheduler_id: schedulerIds[1], title: 'Breakfast', start_time: '07:45', end_time: '08:15', day_of_week: 1, priority: 1 },
      { scheduler_id: schedulerIds[1], title: 'Reading/Planning', start_time: '08:15', end_time: '08:30', day_of_week: 1, priority: 2 },

      // Student Study Schedule items
      { scheduler_id: schedulerIds[2], title: 'Morning Review', start_time: '09:00', end_time: '10:00', day_of_week: 1, priority: 2 },
      { scheduler_id: schedulerIds[2], title: 'Math Study', start_time: '10:00', end_time: '11:30', day_of_week: 1, priority: 1 },
      { scheduler_id: schedulerIds[2], title: 'Break', start_time: '11:30', end_time: '12:00', day_of_week: 1, priority: 3 },
      { scheduler_id: schedulerIds[2], title: 'Science Study', start_time: '12:00', end_time: '13:30', day_of_week: 1, priority: 1 },
      { scheduler_id: schedulerIds[2], title: 'Lunch', start_time: '13:30', end_time: '14:00', day_of_week: 1, priority: 3 },
      { scheduler_id: schedulerIds[2], title: 'Literature Study', start_time: '14:00', end_time: '15:30', day_of_week: 1, priority: 2 },
      { scheduler_id: schedulerIds[2], title: 'Homework Time', start_time: '16:00', end_time: '18:00', day_of_week: 1, priority: 1 }
    ];

    for (const item of schedulerItems) {
      await query(
        `INSERT INTO scheduler_items (scheduler_id, title, start_time, end_time, day_of_week, priority) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [item.scheduler_id, item.title, item.start_time, item.end_time, item.day_of_week, item.priority]
      );
    }
    console.log('✅ Sample scheduler items created');

    // Create sample user interactions
    const interactions = [
      { user_id: userIds[1], scheduler_id: schedulerIds[0], interaction_type: 'like' },
      { user_id: userIds[2], scheduler_id: schedulerIds[0], interaction_type: 'like' },
      { user_id: userIds[3], scheduler_id: schedulerIds[0], interaction_type: 'use' },
      { user_id: userIds[4], scheduler_id: schedulerIds[0], interaction_type: 'share' },
      { user_id: userIds[0], scheduler_id: schedulerIds[1], interaction_type: 'like' },
      { user_id: userIds[2], scheduler_id: schedulerIds[1], interaction_type: 'use' },
      { user_id: userIds[3], scheduler_id: schedulerIds[1], interaction_type: 'like' },
      { user_id: userIds[4], scheduler_id: schedulerIds[1], interaction_type: 'use' },
      { user_id: userIds[0], scheduler_id: schedulerIds[2], interaction_type: 'like' },
      { user_id: userIds[1], scheduler_id: schedulerIds[2], interaction_type: 'use' },
      { user_id: userIds[3], scheduler_id: schedulerIds[3], interaction_type: 'like' },
      { user_id: userIds[4], scheduler_id: schedulerIds[3], interaction_type: 'use' }
    ];

    for (const interaction of interactions) {
      await query(
        'INSERT INTO user_interactions (user_id, scheduler_id, interaction_type) VALUES ($1, $2, $3)',
        [interaction.user_id, interaction.scheduler_id, interaction.interaction_type]
      );
    }
    console.log('✅ Sample user interactions created');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Sample Data Summary:');
    console.log(`- Users: ${userIds.length}`);
    console.log(`- Schedulers: ${schedulerIds.length}`);
    console.log(`- Scheduler Items: ${schedulerItems.length}`);
    console.log(`- User Interactions: ${interactions.length}`);
    console.log('\n🔑 Default login credentials:');
    console.log('Username: john_doe, Password: password123');

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedData()
    .then(() => {
      console.log('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedData }; 