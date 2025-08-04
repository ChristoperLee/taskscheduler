# TaskScheduler Database Backup Guide

This guide explains how to backup and restore your TaskScheduler PostgreSQL database.

## 📁 Backup Location
All backups are stored in: `/Users/chrislee/Project/TaskScheduler/backups/`

## 🚀 Quick Commands

### Create Backup
```bash
# Using npm script (recommended)
npm run backup-db

# Or run script directly
./backup-database.sh

# Manual pg_dump command
pg_dump -U chrislee -d taskscheduler > backup.sql
```

### Restore Database
```bash
# Using npm script (interactive menu)
npm run restore-db

# Or run script directly
./restore-database.sh

# Manual restore
psql -U chrislee -d taskscheduler < backup.sql
```

## 📦 Backup Types Created

### 1. **Full Backup** (Schema + Data)
- **File**: `taskscheduler_full_YYYYMMDD_HHMMSS.sql`
- **Contains**: Complete database structure and all data
- **Use for**: Complete database restoration
- **Size**: ~15KB (current database)

### 2. **Schema-only Backup**
- **File**: `taskscheduler_schema_YYYYMMDD_HHMMSS.sql`
- **Contains**: Table structures, indexes, constraints only
- **Use for**: Recreating database structure
- **Size**: ~9KB

### 3. **Data-only Backup**
- **File**: `taskscheduler_data_YYYYMMDD_HHMMSS.sql`
- **Contains**: All data without schema
- **Use for**: Importing data into existing database
- **Size**: ~7KB

### 4. **Compressed Backup**
- **File**: `taskscheduler_compressed_YYYYMMDD_HHMMSS.dump`
- **Contains**: Complete database in compressed binary format
- **Use for**: Space-efficient storage and faster restore
- **Size**: ~17KB (compressed)

## 🛠️ Manual Backup Commands

### Full Database Backup
```bash
pg_dump -U chrislee -d taskscheduler > taskscheduler_backup.sql
```

### Schema-only Backup
```bash
pg_dump -U chrislee -d taskscheduler --schema-only > taskscheduler_schema.sql
```

### Data-only Backup
```bash
pg_dump -U chrislee -d taskscheduler --data-only > taskscheduler_data.sql
```

### Compressed Backup
```bash
pg_dump -U chrislee -d taskscheduler -Fc > taskscheduler.dump
```

### Specific Table Backup
```bash
# Backup just the schedulers table
pg_dump -U chrislee -d taskscheduler -t schedulers > schedulers_backup.sql

# Backup multiple tables
pg_dump -U chrislee -d taskscheduler -t users -t schedulers > user_scheduler_backup.sql
```

## 🔄 Restore Commands

### Restore Full Database
```bash
# Drop and recreate database
psql -U chrislee -d postgres -c "DROP DATABASE IF EXISTS taskscheduler;"
psql -U chrislee -d postgres -c "CREATE DATABASE taskscheduler;"

# Restore from backup
psql -U chrislee -d taskscheduler < taskscheduler_backup.sql
```

### Restore from Compressed Backup
```bash
# Drop and recreate database
psql -U chrislee -d postgres -c "DROP DATABASE IF EXISTS taskscheduler;"
psql -U chrislee -d postgres -c "CREATE DATABASE taskscheduler;"

# Restore from compressed backup
pg_restore -U chrislee -d taskscheduler taskscheduler.dump
```

### Restore Specific Table
```bash
# Restore only schedulers table (database must exist)
psql -U chrislee -d taskscheduler < schedulers_backup.sql
```

## ⚠️ Important Notes

### Before Restoring
1. **Backup Current Data**: Always backup current database before restoring
2. **Stop Application**: Stop the TaskScheduler application to prevent conflicts
3. **Check Dependencies**: Ensure no other processes are using the database

### Security Considerations
- Backup files contain sensitive data (user emails, passwords)
- Store backups in secure locations
- Consider encrypting backup files for production

### Regular Backup Schedule
- **Development**: Before major changes
- **Production**: Daily automated backups recommended
- **Before Deployment**: Always backup before deploying new versions

## 🔍 Verify Backup/Restore

### Check Database Contents
```bash
# Connect to database
psql -U chrislee -d taskscheduler

# Check table counts
SELECT 
    (SELECT count(*) FROM users) as users,
    (SELECT count(*) FROM schedulers) as schedulers,
    (SELECT count(*) FROM scheduler_items) as items,
    (SELECT count(*) FROM user_interactions) as interactions;

# Check recent data
SELECT id, title, created_at FROM schedulers ORDER BY created_at DESC LIMIT 5;
```

### Database Size
```bash
psql -U chrislee -d taskscheduler -c "SELECT pg_size_pretty(pg_database_size('taskscheduler'));"
```

## 🚨 Emergency Recovery

### If Database is Corrupted
1. Stop TaskScheduler application
2. Use latest full backup to restore
3. Check application functionality
4. If issues persist, contact system administrator

### Quick Recovery Commands
```bash
# Emergency restore from latest backup
latest_backup=$(ls -t /Users/chrislee/Project/TaskScheduler/backups/taskscheduler_full_*.sql | head -1)
psql -U chrislee -d postgres -c "DROP DATABASE IF EXISTS taskscheduler;"
psql -U chrislee -d postgres -c "CREATE DATABASE taskscheduler;"
psql -U chrislee -d taskscheduler < "$latest_backup"
```

## 📊 Current Database Info
- **Database Name**: taskscheduler
- **User**: chrislee
- **Current Size**: ~9MB
- **Tables**: users, schedulers, scheduler_items, user_interactions
- **Current Data**: 13 users, 8 schedulers, 16 schedule items

## 🛡️ Backup Best Practices

1. **Regular Backups**: Set up automated daily backups
2. **Multiple Locations**: Store backups in multiple locations
3. **Test Restores**: Regularly test backup restoration
4. **Version Control**: Keep multiple backup versions
5. **Documentation**: Document backup procedures
6. **Monitoring**: Monitor backup success/failure
7. **Encryption**: Encrypt sensitive backup data

---

**Last Updated**: August 2, 2025
**Database Version**: PostgreSQL 14.18