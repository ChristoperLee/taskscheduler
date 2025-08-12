# Database Data Management Tools

This directory contains utilities for managing data between production and local environments.

## Prerequisites

1. **Environment Variables**: Set up your `.env` file with:
   ```env
   # Local database
   DATABASE_URL=postgresql://username:password@localhost:5432/taskscheduler
   
   # Production database (Railway)
   PRODUCTION_DATABASE_URL=postgresql://postgres:xxx@xxx.railway.app:5432/railway
   ```

2. **Directory Structure**: The tools use these directories:
   - `database/exports/` - Stores exported data files
   - `database/backups/` - Stores local database backups

## Available Commands

### 1. Export Production Data
Pull all data from your Railway production database:

```bash
# Export all data
npm run export-prod

# Export with anonymized user data
npm run export-prod -- --anonymize

# Export limited rows (useful for large databases)
npm run export-prod -- --limit 100

# Export specific table only
npm run export-prod -- --table users

# Export with custom filename
npm run export-prod -- --filename my-export.json
```

### 2. Import to Local Database
Import exported data into your local database:

```bash
# Import latest export
npm run import-local

# Import specific file
npm run import-local -- --file production-export-2024-01-15.json

# Clear local data before import
npm run import-local -- --clear

# Preserve original IDs from production
npm run import-local -- --clear --preserve-ids
```

### 3. Sync Production to Local
One-command sync from production to local:

```bash
# Basic sync (exports from production and imports to local)
npm run sync-data

# Sync with backup and clear
npm run sync-data -- --backup --clear

# Sync with anonymized data
npm run sync-data -- --anonymize --backup
```

### 4. Selective Sync
Sync specific data:

```bash
# Sync specific user's data
npm run sync-data -- --user-id 1

# Sync specific scheduler
npm run sync-data -- --scheduler-id 5

# Sync by date range
npm run sync-data -- --date-from 2024-01-01 --date-to 2024-01-31

# Export only without importing
npm run sync-data -- --scheduler-id 5 --export-only
```

### 5. Backup Local Database
Create backups of your local database:

```bash
# Create backup
npm run backup-local

# List all backups
npm run backup-list

# Restore from backup
npm run backup-restore local-backup-2024-01-15-10-30-00.json

# Restore with clear
npm run backup-restore local-backup-2024-01-15-10-30-00.json -- --clear

# Keep only 5 most recent backups
npm run backup-local -- --max-backups 5
```

## Common Workflows

### Pull All Production Data for Local Testing
```bash
# 1. Backup your local data first
npm run backup-local

# 2. Sync all production data to local
npm run sync-data -- --backup --clear --preserve-ids

# 3. Your local database now mirrors production!
```

### Pull Specific User's Data
```bash
# Get a specific user's schedulers for debugging
npm run sync-data -- --user-id 123
```

### Safe Experimentation
```bash
# 1. Create a backup
npm run backup-local

# 2. Do your experiments...

# 3. Restore if needed
npm run backup-list  # See available backups
npm run backup-restore local-backup-2024-01-15-10-30-00.json -- --clear
```

### Export for Analysis
```bash
# Export anonymized data for analysis
npm run export-prod -- --anonymize --preserve-admin

# The exported JSON file can be analyzed with any tool
```

## File Formats

### Export File Structure
```json
{
  "users": [...],
  "schedulers": [...],
  "scheduler_items": [...],
  "user_interactions": [...],
  "_metadata": {
    "exportDate": "2024-01-15T10:30:00.000Z",
    "source": "production",
    "statistics": {
      "users": 150,
      "schedulers": 500,
      "scheduler_items": 2000,
      "user_interactions": 5000
    }
  }
}
```

## Security Notes

1. **Never commit** export or backup files to git
2. **Anonymize data** when sharing exports
3. **Keep production URL** secure and never commit to repository
4. Export/backup directories are gitignored by default

## Troubleshooting

### Connection Issues
- Ensure `PRODUCTION_DATABASE_URL` is set correctly
- Railway databases require SSL - this is handled automatically
- Check your local PostgreSQL is running

### Import Failures
- Foreign key constraints: Use `--clear` flag to clear data first
- ID conflicts: Use `--preserve-ids` with `--clear`
- Large datasets: Use `--limit` flag when exporting

### Backup Issues
- Disk space: Old backups are auto-deleted (configure with `--max-backups`)
- Permissions: Ensure write access to `database/backups/`

## Advanced Usage

### Custom Export Queries
Edit `export-data.js` to add custom WHERE clauses:

```javascript
// Example: Export only active users
const users = await exportTable(pool, 'users', {
  where: "is_active = true",
  anonymize: true
});
```

### Automated Sync
Add to cron for regular syncs:

```bash
# Daily sync at 2 AM
0 2 * * * cd /path/to/project && npm run sync-data -- --backup --anonymize
```

## Support

For issues or questions about these tools, check:
1. The error messages - they're designed to be helpful
2. The `--verbose` flag for detailed output
3. The `--help` flag on any command