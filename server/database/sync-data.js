const { exportData } = require('./export-data');
const { importData } = require('./import-data');
const { backupLocal } = require('./backup-local');
const path = require('path');
require('dotenv').config();

// Main sync function
const syncData = async (options = {}) => {
  try {
    console.log('🔄 Starting data synchronization...\n');
    
    // Step 1: Backup local data if requested
    if (options.backup) {
      console.log('💾 Creating backup of local data...');
      try {
        await backupLocal({ silent: true });
        console.log('✅ Local backup created\n');
      } catch (error) {
        console.error('⚠️  Backup failed:', error.message);
        if (!options.force) {
          throw new Error('Backup failed. Use --force to continue anyway.');
        }
      }
    }
    
    // Step 2: Export from production
    console.log('📤 Exporting from production...');
    const exportPath = await exportData({
      ...options,
      filename: `sync-${new Date().toISOString().split('T')[0]}.json`
    });
    console.log('');
    
    // Step 3: Import to local
    console.log('📥 Importing to local database...');
    const importStats = await importData(path.basename(exportPath), {
      clear: options.clear,
      preserveIds: options.preserveIds,
      verbose: options.verbose
    });
    
    console.log('\n🎉 Synchronization completed successfully!');
    
    return {
      exportPath,
      importStats
    };
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
    throw error;
  }
};

// Selective sync function
const selectiveSync = async (options = {}) => {
  try {
    console.log('🎯 Starting selective synchronization...\n');
    
    const { Pool } = require('pg');
    const fs = require('fs').promises;
    
    // Create production pool
    const productionUrl = process.env.PRODUCTION_DATABASE_URL || process.env.DATABASE_URL;
    if (!productionUrl) {
      throw new Error('PRODUCTION_DATABASE_URL not found');
    }
    
    const pool = new Pool({
      connectionString: productionUrl,
      ssl: productionUrl.includes('railway') ? { rejectUnauthorized: false } : false
    });
    
    const exportData = {
      _metadata: {
        exportDate: new Date().toISOString(),
        source: 'production-selective',
        type: 'selective'
      }
    };
    
    // Selective export based on options
    if (options.userId) {
      console.log(`📌 Syncing data for user ID: ${options.userId}`);
      
      // Get user
      const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [options.userId]);
      exportData.users = userResult.rows;
      
      // Get user's schedulers
      const schedulerResult = await pool.query('SELECT * FROM schedulers WHERE user_id = $1', [options.userId]);
      exportData.schedulers = schedulerResult.rows;
      
      // Get scheduler items
      if (schedulerResult.rows.length > 0) {
        const schedulerIds = schedulerResult.rows.map(s => s.id);
        const itemsResult = await pool.query(
          'SELECT * FROM scheduler_items WHERE scheduler_id = ANY($1::int[])',
          [schedulerIds]
        );
        exportData.scheduler_items = itemsResult.rows;
        
        // Get interactions
        const interactionsResult = await pool.query(
          'SELECT * FROM user_interactions WHERE scheduler_id = ANY($1::int[])',
          [schedulerIds]
        );
        exportData.user_interactions = interactionsResult.rows;
      }
    }
    
    if (options.schedulerId) {
      console.log(`📌 Syncing scheduler ID: ${options.schedulerId}`);
      
      // Get scheduler
      const schedulerResult = await pool.query('SELECT * FROM schedulers WHERE id = $1', [options.schedulerId]);
      exportData.schedulers = schedulerResult.rows;
      
      // Get scheduler items
      const itemsResult = await pool.query('SELECT * FROM scheduler_items WHERE scheduler_id = $1', [options.schedulerId]);
      exportData.scheduler_items = itemsResult.rows;
      
      // Get creator
      if (schedulerResult.rows.length > 0) {
        const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [schedulerResult.rows[0].user_id]);
        exportData.users = userResult.rows;
      }
    }
    
    if (options.dateFrom || options.dateTo) {
      console.log(`📌 Syncing by date range: ${options.dateFrom || 'beginning'} to ${options.dateTo || 'now'}`);
      
      let whereClause = [];
      let params = [];
      let paramCount = 0;
      
      if (options.dateFrom) {
        paramCount++;
        whereClause.push(`created_at >= $${paramCount}`);
        params.push(options.dateFrom);
      }
      
      if (options.dateTo) {
        paramCount++;
        whereClause.push(`created_at <= $${paramCount}`);
        params.push(options.dateTo);
      }
      
      const schedulerResult = await pool.query(
        `SELECT * FROM schedulers WHERE ${whereClause.join(' AND ')}`,
        params
      );
      exportData.schedulers = schedulerResult.rows;
      
      // Get related data
      if (schedulerResult.rows.length > 0) {
        const schedulerIds = schedulerResult.rows.map(s => s.id);
        const userIds = [...new Set(schedulerResult.rows.map(s => s.user_id))];
        
        const userResult = await pool.query('SELECT * FROM users WHERE id = ANY($1::int[])', [userIds]);
        exportData.users = userResult.rows;
        
        const itemsResult = await pool.query('SELECT * FROM scheduler_items WHERE scheduler_id = ANY($1::int[])', [schedulerIds]);
        exportData.scheduler_items = itemsResult.rows;
      }
    }
    
    await pool.end();
    
    // Save selective export
    const EXPORT_DIR = path.join(__dirname, 'exports');
    await fs.mkdir(EXPORT_DIR, { recursive: true });
    
    const filename = `selective-sync-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(EXPORT_DIR, filename);
    
    await fs.writeFile(filepath, JSON.stringify(exportData, null, 2), 'utf8');
    
    console.log(`✅ Selective export completed: ${filepath}\n`);
    
    // Import to local
    if (!options.exportOnly) {
      const { importData } = require('./import-data');
      await importData(filename, {
        clear: false, // Don't clear for selective sync
        preserveIds: true,
        verbose: options.verbose
      });
    }
    
    console.log('\n🎉 Selective sync completed!');
    
  } catch (error) {
    console.error('❌ Selective sync failed:', error);
    throw error;
  }
};

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--backup':
        options.backup = true;
        break;
      case '--clear':
        options.clear = true;
        break;
      case '--preserve-ids':
        options.preserveIds = true;
        break;
      case '--anonymize':
        options.anonymize = true;
        break;
      case '--force':
        options.force = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--user-id':
        options.userId = parseInt(args[++i]);
        break;
      case '--scheduler-id':
        options.schedulerId = parseInt(args[++i]);
        break;
      case '--date-from':
        options.dateFrom = args[++i];
        break;
      case '--date-to':
        options.dateTo = args[++i];
        break;
      case '--export-only':
        options.exportOnly = true;
        break;
      case '--help':
        console.log(`
🔄 Data Synchronization Tool

Usage: npm run sync-data [options]

Options:
  --backup         Create backup before sync
  --clear          Clear local data before import
  --preserve-ids   Preserve original IDs
  --anonymize      Anonymize sensitive data
  --force          Continue even if backup fails
  --verbose        Show detailed output

Selective Sync Options:
  --user-id <id>        Sync specific user's data
  --scheduler-id <id>   Sync specific scheduler
  --date-from <date>    Sync from date (YYYY-MM-DD)
  --date-to <date>      Sync to date (YYYY-MM-DD)
  --export-only         Only export, don't import

Examples:
  npm run sync-data
  npm run sync-data -- --backup --clear
  npm run sync-data -- --user-id 1
  npm run sync-data -- --scheduler-id 5
  npm run sync-data -- --date-from 2024-01-01
  npm run sync-data -- --anonymize --backup
        `);
        process.exit(0);
    }
  }
  
  // Determine which sync to run
  const isSelective = options.userId || options.schedulerId || options.dateFrom || options.dateTo;
  
  const syncFunction = isSelective ? selectiveSync : syncData;
  
  syncFunction(options)
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Sync failed:', error.message);
      process.exit(1);
    });
}

module.exports = { syncData, selectiveSync };