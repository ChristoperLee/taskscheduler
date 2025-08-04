#!/bin/bash

# TaskScheduler Database Backup Script
# Creates backups of the taskscheduler database with timestamp

set -e  # Exit on any error

# Configuration
DB_NAME="taskscheduler"
DB_USER="chrislee"
BACKUP_DIR="/Users/chrislee/Project/TaskScheduler/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
MAX_BACKUPS=10  # Keep only the 10 most recent backups

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🗄️  TaskScheduler Database Backup${NC}"
echo "=================================================="

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Backup filenames
FULL_BACKUP="${BACKUP_DIR}/taskscheduler_full_${TIMESTAMP}.sql"
SCHEMA_BACKUP="${BACKUP_DIR}/taskscheduler_schema_${TIMESTAMP}.sql"
DATA_BACKUP="${BACKUP_DIR}/taskscheduler_data_${TIMESTAMP}.sql"
COMPRESSED_BACKUP="${BACKUP_DIR}/taskscheduler_compressed_${TIMESTAMP}.dump"

echo -e "${YELLOW}📊 Checking database status...${NC}"
# Check if database exists and get info
DB_INFO=$(psql -U "$DB_USER" -d "$DB_NAME" -t -c "
SELECT 
    pg_size_pretty(pg_database_size('$DB_NAME')) as db_size,
    (SELECT count(*) FROM users) as user_count,
    (SELECT count(*) FROM schedulers) as scheduler_count,
    (SELECT count(*) FROM scheduler_items) as item_count
")

echo "Database: $DB_NAME"
echo "Info: $DB_INFO"
echo ""

# 1. Full Database Backup (Schema + Data)
echo -e "${YELLOW}📦 Creating full backup...${NC}"
pg_dump -U "$DB_USER" -d "$DB_NAME" --no-password > "$FULL_BACKUP"
echo -e "${GREEN}✅ Full backup created: $(basename "$FULL_BACKUP")${NC}"

# 2. Schema-only Backup
echo -e "${YELLOW}🏗️  Creating schema backup...${NC}"
pg_dump -U "$DB_USER" -d "$DB_NAME" --schema-only --no-password > "$SCHEMA_BACKUP"
echo -e "${GREEN}✅ Schema backup created: $(basename "$SCHEMA_BACKUP")${NC}"

# 3. Data-only Backup
echo -e "${YELLOW}📊 Creating data-only backup...${NC}"
pg_dump -U "$DB_USER" -d "$DB_NAME" --data-only --no-password > "$DATA_BACKUP"
echo -e "${GREEN}✅ Data-only backup created: $(basename "$DATA_BACKUP")${NC}"

# 4. Compressed Backup (Custom format)
echo -e "${YELLOW}🗜️  Creating compressed backup...${NC}"
pg_dump -U "$DB_USER" -d "$DB_NAME" -Fc --no-password > "$COMPRESSED_BACKUP"
echo -e "${GREEN}✅ Compressed backup created: $(basename "$COMPRESSED_BACKUP")${NC}"

# Show backup sizes
echo ""
echo -e "${BLUE}📋 Backup Summary:${NC}"
ls -lh "$BACKUP_DIR"/*${TIMESTAMP}* | while read line; do
    echo "  $line"
done

# Clean up old backups (keep only the most recent ones)
echo ""
echo -e "${YELLOW}🧹 Cleaning up old backups (keeping $MAX_BACKUPS most recent)...${NC}"
cd "$BACKUP_DIR"
ls -t taskscheduler_full_*.sql | tail -n +$((MAX_BACKUPS + 1)) | xargs rm -f 2>/dev/null || true
ls -t taskscheduler_schema_*.sql | tail -n +$((MAX_BACKUPS + 1)) | xargs rm -f 2>/dev/null || true
ls -t taskscheduler_data_*.sql | tail -n +$((MAX_BACKUPS + 1)) | xargs rm -f 2>/dev/null || true
ls -t taskscheduler_compressed_*.dump | tail -n +$((MAX_BACKUPS + 1)) | xargs rm -f 2>/dev/null || true

echo -e "${GREEN}🎉 Backup completed successfully!${NC}"
echo ""
echo -e "${BLUE}💡 Usage Tips:${NC}"
echo "  • Full backup: Complete restore with schema and data"
echo "  • Schema backup: Restore table structure only"
echo "  • Data backup: Restore data only (requires existing schema)"
echo "  • Compressed backup: Space-efficient, use with pg_restore"
echo ""
echo -e "${BLUE}🔄 To restore:${NC}"
echo "  psql -U $DB_USER -d $DB_NAME < $FULL_BACKUP"
echo "  pg_restore -U $DB_USER -d $DB_NAME $COMPRESSED_BACKUP"