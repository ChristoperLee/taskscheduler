const { query } = require('../src/utils/database');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Configuration
const EXPORT_DIR = path.join(__dirname, 'exports');

// Clear existing data from tables
const clearTables = async (tables) => {
  console.log('🗑️  Clearing existing data...');
  
  // Clear in reverse order to respect foreign key constraints
  const reversedTables = [...tables].reverse();
  
  for (const table of reversedTables) {
    try {
      await query(`DELETE FROM ${table}`);
      
      // Reset sequence for primary key
      await query(`
        SELECT setval(
          pg_get_serial_sequence('${table}', 'id'),
          1,
          false
        )
      `).catch(() => {
        // Some tables might not have serial id
      });
      
      console.log(`   ✅ Cleared ${table}`);
    } catch (error) {
      console.error(`   ⚠️  Error clearing ${table}:`, error.message);
    }
  }
};

// Import data into a table
const importTable = async (tableName, data, options = {}) => {
  if (!data || data.length === 0) {
    console.log(`   ⏭️  No data to import for ${tableName}`);
    return 0;
  }
  
  console.log(`📥 Importing ${data.length} rows into ${tableName}...`);
  
  let imported = 0;
  let failed = 0;
  
  for (const row of data) {
    try {
      // Get column names and values
      const columns = Object.keys(row).filter(col => col !== 'id' || options.preserveIds);
      const values = columns.map(col => row[col]);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      
      let insertQuery;
      if (options.preserveIds && row.id) {
        // Insert with specific ID
        insertQuery = `
          INSERT INTO ${tableName} (${columns.join(', ')})
          VALUES (${placeholders})
          ON CONFLICT (id) DO UPDATE SET
          ${columns.filter(c => c !== 'id').map(c => `${c} = EXCLUDED.${c}`).join(', ')}
        `;
      } else {
        // Let database generate ID
        const nonIdColumns = columns.filter(c => c !== 'id');
        const nonIdValues = nonIdColumns.map(c => row[c]);
        const nonIdPlaceholders = nonIdColumns.map((_, i) => `$${i + 1}`).join(', ');
        
        insertQuery = `
          INSERT INTO ${tableName} (${nonIdColumns.join(', ')})
          VALUES (${nonIdPlaceholders})
        `;
        values.length = 0;
        values.push(...nonIdValues);
      }
      
      await query(insertQuery, values);
      imported++;
      
    } catch (error) {
      failed++;
      if (options.verbose) {
        console.error(`   ❌ Failed to import row:`, error.message);
        console.error('   Row data:', row);
      }
    }
  }
  
  // Update sequence if we preserved IDs
  if (options.preserveIds && imported > 0) {
    try {
      const maxId = Math.max(...data.map(r => r.id || 0));
      await query(`
        SELECT setval(
          pg_get_serial_sequence('${tableName}', 'id'),
          ${maxId},
          true
        )
      `);
    } catch (e) {
      // Table might not have serial id
    }
  }
  
  console.log(`   ✅ Imported ${imported} rows (${failed} failed)`);
  return imported;
};

// Main import function
const importData = async (filename, options = {}) => {
  try {
    // Determine file path
    let filepath;
    if (filename === 'latest') {
      filepath = path.join(EXPORT_DIR, 'latest.json');
    } else if (path.isAbsolute(filename)) {
      filepath = filename;
    } else {
      filepath = path.join(EXPORT_DIR, filename);
    }
    
    console.log(`📂 Reading export file: ${filepath}\n`);
    
    // Read the export file
    const fileContent = await fs.readFile(filepath, 'utf8');
    const exportData = JSON.parse(fileContent);
    
    // Extract metadata
    const metadata = exportData._metadata || {};
    delete exportData._metadata;
    
    console.log('📊 Export Information:');
    console.log(`   Date: ${metadata.exportDate || 'Unknown'}`);
    console.log(`   Source: ${metadata.source || 'Unknown'}`);
    if (metadata.statistics) {
      console.log('   Statistics:');
      Object.entries(metadata.statistics).forEach(([table, count]) => {
        console.log(`     - ${table}: ${count} rows`);
      });
    }
    console.log('');
    
    // Determine tables to import
    const tables = metadata.tables || Object.keys(exportData);
    
    // Clear existing data if requested
    if (options.clear) {
      await clearTables(tables);
      console.log('');
    }
    
    // Import data
    console.log('🚀 Starting data import...\n');
    
    const importStats = {};
    
    // Import in correct order for foreign key constraints
    const orderedTables = ['users', 'schedulers', 'scheduler_items', 'user_interactions'];
    
    for (const table of orderedTables) {
      if (exportData[table]) {
        importStats[table] = await importTable(table, exportData[table], options);
      }
    }
    
    // Import any remaining tables not in the ordered list
    for (const table of tables) {
      if (!orderedTables.includes(table) && exportData[table]) {
        importStats[table] = await importTable(table, exportData[table], options);
      }
    }
    
    console.log('\n✅ Import completed successfully!');
    console.log('📊 Import Statistics:');
    Object.entries(importStats).forEach(([table, count]) => {
      console.log(`   - ${table}: ${count} rows imported`);
    });
    
    return importStats;
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  }
};

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  let filename = 'latest';
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--clear':
        options.clear = true;
        break;
      case '--preserve-ids':
        options.preserveIds = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--file':
        filename = args[++i];
        break;
      case '--help':
        console.log(`
📥 Local Data Import Tool

Usage: npm run import-local [options]

Options:
  --file <name>    Import specific file (default: latest.json)
  --clear          Clear existing data before import
  --preserve-ids   Preserve original IDs from export
  --verbose        Show detailed error messages
  --help          Show this help message

Examples:
  npm run import-local
  npm run import-local -- --clear
  npm run import-local -- --file production-export-2024-01-15.json
  npm run import-local -- --clear --preserve-ids

Files are read from: server/database/exports/
        `);
        process.exit(0);
      default:
        if (!args[i].startsWith('--')) {
          filename = args[i];
        }
    }
  }
  
  importData(filename, options)
    .then(() => {
      console.log('\n🎉 Import complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Import failed:', error.message);
      process.exit(1);
    });
}

module.exports = { importData, importTable, clearTables };