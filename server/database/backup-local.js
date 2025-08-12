const { query } = require('../src/utils/database');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Configuration
const BACKUP_DIR = path.join(__dirname, 'backups');
const TABLES_TO_BACKUP = ['users', 'schedulers', 'scheduler_items', 'user_interactions'];

// Export a single table from local database
const backupTable = async (tableName) => {
  try {
    const result = await query(`SELECT * FROM ${tableName} ORDER BY id`);
    return result.rows;
  } catch (error) {
    console.error(`⚠️  Error backing up ${tableName}:`, error.message);
    return [];
  }
};

// Main backup function
const backupLocal = async (options = {}) => {
  try {
    // Create backup directory if it doesn't exist
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    
    if (!options.silent) {
      console.log('💾 Starting local database backup...\n');
    }
    
    const backupData = {};
    const stats = {};
    
    // Get statistics and backup each table
    for (const table of TABLES_TO_BACKUP) {
      const data = await backupTable(table);
      backupData[table] = data;
      stats[table] = data.length;
      
      if (!options.silent) {
        console.log(`   ✅ Backed up ${table}: ${data.length} rows`);
      }
    }
    
    // Add metadata
    backupData._metadata = {
      backupDate: new Date().toISOString(),
      source: 'local',
      statistics: stats,
      tables: TABLES_TO_BACKUP
    };
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    const filename = `local-backup-${timestamp}-${time}.json`;
    const filepath = path.join(BACKUP_DIR, filename);
    
    // Save backup
    await fs.writeFile(
      filepath,
      JSON.stringify(backupData, null, 2),
      'utf8'
    );
    
    // Keep only last N backups
    const maxBackups = options.maxBackups || 10;
    const files = await fs.readdir(BACKUP_DIR);
    const backupFiles = files
      .filter(f => f.startsWith('local-backup-') && f.endsWith('.json'))
      .sort()
      .reverse();
    
    if (backupFiles.length > maxBackups) {
      const toDelete = backupFiles.slice(maxBackups);
      for (const file of toDelete) {
        await fs.unlink(path.join(BACKUP_DIR, file));
        if (!options.silent) {
          console.log(`   🗑️  Deleted old backup: ${file}`);
        }
      }
    }
    
    if (!options.silent) {
      console.log(`\n✅ Backup completed: ${filepath}`);
      console.log(`📊 Total backed up:`);
      Object.entries(stats).forEach(([table, count]) => {
        console.log(`   - ${table}: ${count} rows`);
      });
    }
    
    return filepath;
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  }
};

// Restore from backup
const restoreBackup = async (filename, options = {}) => {
  try {
    // Determine file path
    let filepath;
    if (path.isAbsolute(filename)) {
      filepath = filename;
    } else {
      filepath = path.join(BACKUP_DIR, filename);
    }
    
    console.log(`📂 Reading backup file: ${filepath}\n`);
    
    // Read the backup file
    const fileContent = await fs.readFile(filepath, 'utf8');
    const backupData = JSON.parse(fileContent);
    
    // Use import function to restore
    const { importData } = require('./import-data');
    
    // Save backup to exports directory temporarily
    const EXPORT_DIR = path.join(__dirname, 'exports');
    await fs.mkdir(EXPORT_DIR, { recursive: true });
    const tempFile = path.join(EXPORT_DIR, `restore-${Date.now()}.json`);
    await fs.writeFile(tempFile, fileContent, 'utf8');
    
    // Import the data
    const result = await importData(path.basename(tempFile), {
      clear: options.clear,
      preserveIds: true,
      verbose: options.verbose
    });
    
    // Clean up temp file
    await fs.unlink(tempFile);
    
    console.log('\n✅ Restore completed successfully!');
    
    return result;
    
  } catch (error) {
    console.error('❌ Restore failed:', error);
    throw error;
  }
};

// List available backups
const listBackups = async () => {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    
    const files = await fs.readdir(BACKUP_DIR);
    const backupFiles = files
      .filter(f => f.startsWith('local-backup-') && f.endsWith('.json'))
      .sort()
      .reverse();
    
    if (backupFiles.length === 0) {
      console.log('📭 No backups found');
      return [];
    }
    
    console.log('📚 Available backups:\n');
    
    for (const file of backupFiles) {
      const filepath = path.join(BACKUP_DIR, file);
      const stats = await fs.stat(filepath);
      const size = (stats.size / 1024).toFixed(2);
      
      // Try to read metadata
      try {
        const content = await fs.readFile(filepath, 'utf8');
        const data = JSON.parse(content);
        const metadata = data._metadata || {};
        
        console.log(`📁 ${file}`);
        console.log(`   Size: ${size} KB`);
        console.log(`   Date: ${metadata.backupDate || 'Unknown'}`);
        if (metadata.statistics) {
          const total = Object.values(metadata.statistics).reduce((a, b) => a + b, 0);
          console.log(`   Rows: ${total}`);
        }
        console.log('');
      } catch (e) {
        console.log(`📁 ${file} (${size} KB)\n`);
      }
    }
    
    return backupFiles;
    
  } catch (error) {
    console.error('❌ Error listing backups:', error);
    throw error;
  }
};

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const options = {};
  
  // Parse options
  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '--max-backups':
        options.maxBackups = parseInt(args[++i]);
        break;
      case '--clear':
        options.clear = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--silent':
        options.silent = true;
        break;
      case '--help':
        console.log(`
💾 Local Database Backup Tool

Usage: npm run backup-local [command] [options]

Commands:
  create          Create a new backup (default)
  restore <file>  Restore from backup file
  list           List available backups

Options:
  --max-backups <n>  Keep only N most recent backups (default: 10)
  --clear           Clear existing data before restore
  --verbose         Show detailed output
  --silent          Minimal output (for automation)
  --help           Show this help message

Examples:
  npm run backup-local
  npm run backup-local create -- --max-backups 5
  npm run backup-local list
  npm run backup-local restore local-backup-2024-01-15.json
  npm run backup-local restore local-backup-2024-01-15.json -- --clear
        `);
        process.exit(0);
    }
  }
  
  // Execute command
  switch (command) {
    case 'restore':
      const filename = args[1];
      if (!filename) {
        console.error('❌ Please specify a backup file to restore');
        process.exit(1);
      }
      restoreBackup(filename, options)
        .then(() => {
          console.log('\n🎉 Restore complete!');
          process.exit(0);
        })
        .catch((error) => {
          console.error('\n💥 Restore failed:', error.message);
          process.exit(1);
        });
      break;
      
    case 'list':
      listBackups()
        .then(() => {
          process.exit(0);
        })
        .catch((error) => {
          console.error('\n💥 List failed:', error.message);
          process.exit(1);
        });
      break;
      
    case 'create':
    default:
      backupLocal(options)
        .then(() => {
          if (!options.silent) {
            console.log('\n🎉 Backup complete!');
          }
          process.exit(0);
        })
        .catch((error) => {
          console.error('\n💥 Backup failed:', error.message);
          process.exit(1);
        });
  }
}

module.exports = { backupLocal, restoreBackup, listBackups };