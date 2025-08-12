const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Configuration
const EXPORT_DIR = path.join(__dirname, 'exports');
const TABLES_TO_EXPORT = ['users', 'schedulers', 'scheduler_items', 'user_interactions'];

// Create connection to production database
const createProductionPool = () => {
  const productionUrl = process.env.PRODUCTION_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!productionUrl) {
    throw new Error('PRODUCTION_DATABASE_URL not found in environment variables');
  }
  
  console.log('🔗 Connecting to production database...');
  
  return new Pool({
    connectionString: productionUrl,
    ssl: productionUrl.includes('railway') ? { rejectUnauthorized: false } : false
  });
};

// Export a single table
const exportTable = async (pool, tableName, options = {}) => {
  try {
    console.log(`📊 Exporting table: ${tableName}...`);
    
    let query = `SELECT * FROM ${tableName}`;
    const params = [];
    
    // Add optional filters
    if (options.where) {
      query += ` WHERE ${options.where}`;
    }
    
    if (options.orderBy) {
      query += ` ORDER BY ${options.orderBy}`;
    } else {
      // Default ordering by id if exists
      query += ` ORDER BY id`;
    }
    
    if (options.limit) {
      query += ` LIMIT ${options.limit}`;
    }
    
    const result = await pool.query(query, params);
    
    // Anonymize sensitive data if requested
    let data = result.rows;
    if (options.anonymize && tableName === 'users') {
      data = data.map((user, index) => ({
        ...user,
        email: `user${user.id}@example.com`,
        password_hash: 'REDACTED',
        username: options.preserveAdmin && user.role === 'admin' 
          ? user.username 
          : `user_${user.id}`
      }));
    }
    
    console.log(`✅ Exported ${data.length} rows from ${tableName}`);
    return data;
    
  } catch (error) {
    console.error(`❌ Error exporting ${tableName}:`, error.message);
    throw error;
  }
};

// Main export function
const exportData = async (options = {}) => {
  const pool = createProductionPool();
  const exportData = {};
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  
  try {
    // Create export directory if it doesn't exist
    await fs.mkdir(EXPORT_DIR, { recursive: true });
    
    console.log('🚀 Starting data export from production...\n');
    
    // Get database statistics first
    const stats = {};
    for (const table of TABLES_TO_EXPORT) {
      const countResult = await pool.query(`SELECT COUNT(*) FROM ${table}`);
      stats[table] = parseInt(countResult.rows[0].count);
      console.log(`📈 ${table}: ${stats[table]} rows`);
    }
    console.log('');
    
    // Export each table
    for (const table of TABLES_TO_EXPORT) {
      const tableOptions = {
        ...options,
        orderBy: 'id' // Ensure consistent ordering
      };
      
      // Special handling for large tables
      if (table === 'user_interactions' && stats[table] > 10000) {
        console.log(`⚠️  Large table detected (${stats[table]} rows). Consider using --limit flag`);
      }
      
      exportData[table] = await exportTable(pool, table, tableOptions);
    }
    
    // Save metadata
    exportData._metadata = {
      exportDate: new Date().toISOString(),
      source: 'production',
      statistics: stats,
      options: options,
      tables: TABLES_TO_EXPORT
    };
    
    // Save to file
    const filename = options.filename || `production-export-${timestamp}.json`;
    const filepath = path.join(EXPORT_DIR, filename);
    
    await fs.writeFile(
      filepath,
      JSON.stringify(exportData, null, 2),
      'utf8'
    );
    
    // Create a 'latest' symlink for convenience
    const latestPath = path.join(EXPORT_DIR, 'latest.json');
    try {
      await fs.unlink(latestPath);
    } catch (e) {
      // Ignore if doesn't exist
    }
    await fs.symlink(filename, latestPath);
    
    console.log(`\n✅ Export completed successfully!`);
    console.log(`📁 Data saved to: ${filepath}`);
    console.log(`📊 Total exported:`);
    Object.entries(stats).forEach(([table, count]) => {
      console.log(`   - ${table}: ${count} rows`);
    });
    
    return filepath;
    
  } catch (error) {
    console.error('❌ Export failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--anonymize':
        options.anonymize = true;
        break;
      case '--preserve-admin':
        options.preserveAdmin = true;
        break;
      case '--limit':
        options.limit = parseInt(args[++i]);
        break;
      case '--table':
        options.table = args[++i];
        break;
      case '--where':
        options.where = args[++i];
        break;
      case '--filename':
        options.filename = args[++i];
        break;
      case '--help':
        console.log(`
📊 Production Data Export Tool

Usage: npm run export-prod [options]

Options:
  --anonymize       Anonymize sensitive user data (emails, passwords)
  --preserve-admin  Keep admin usernames when anonymizing
  --limit <n>       Limit number of rows per table
  --table <name>    Export specific table only
  --where <clause>  Add WHERE clause to filter data
  --filename <name> Custom export filename
  --help           Show this help message

Examples:
  npm run export-prod
  npm run export-prod -- --anonymize
  npm run export-prod -- --limit 100
  npm run export-prod -- --table users --where "created_at > '2024-01-01'"
        `);
        process.exit(0);
    }
  }
  
  // Handle single table export
  if (options.table) {
    TABLES_TO_EXPORT.length = 0;
    TABLES_TO_EXPORT.push(options.table);
  }
  
  exportData(options)
    .then(() => {
      console.log('\n🎉 Export complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Export failed:', error.message);
      process.exit(1);
    });
}

module.exports = { exportData, exportTable };