#!/bin/bash

# TaskScheduler Database Restore Script
# Restores the taskscheduler database from backup files

set -e  # Exit on any error

# Configuration
DB_NAME="taskscheduler"
DB_USER="chrislee"
BACKUP_DIR="/Users/chrislee/Project/TaskScheduler/backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 TaskScheduler Database Restore${NC}"
echo "=================================================="

# Function to list available backups
list_backups() {
    echo -e "${YELLOW}📁 Available backup files:${NC}"
    echo ""
    
    echo -e "${BLUE}Full Backups (Schema + Data):${NC}"
    ls -la "$BACKUP_DIR"/taskscheduler_full_*.sql 2>/dev/null | tail -5 || echo "  No full backups found"
    
    echo ""
    echo -e "${BLUE}Compressed Backups:${NC}"
    ls -la "$BACKUP_DIR"/taskscheduler_compressed_*.dump 2>/dev/null | tail -5 || echo "  No compressed backups found"
    
    echo ""
    echo -e "${BLUE}Schema-only Backups:${NC}"
    ls -la "$BACKUP_DIR"/taskscheduler_schema_*.sql 2>/dev/null | tail -3 || echo "  No schema backups found"
    
    echo ""
    echo -e "${BLUE}Data-only Backups:${NC}"
    ls -la "$BACKUP_DIR"/taskscheduler_data_*.sql 2>/dev/null | tail -3 || echo "  No data backups found"
}

# Function to restore from full backup
restore_full() {
    local backup_file="$1"
    
    echo -e "${YELLOW}⚠️  WARNING: This will completely replace the current database!${NC}"
    echo -e "${RED}All existing data will be lost!${NC}"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        echo -e "${YELLOW}❌ Restore cancelled${NC}"
        exit 0
    fi
    
    echo -e "${YELLOW}🗑️  Dropping existing database...${NC}"
    psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
    
    echo -e "${YELLOW}🆕 Creating new database...${NC}"
    psql -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;"
    
    echo -e "${YELLOW}📥 Restoring from backup...${NC}"
    psql -U "$DB_USER" -d "$DB_NAME" < "$backup_file"
    
    echo -e "${GREEN}✅ Database restored successfully!${NC}"
}

# Function to restore from compressed backup
restore_compressed() {
    local backup_file="$1"
    
    echo -e "${YELLOW}⚠️  WARNING: This will completely replace the current database!${NC}"
    echo -e "${RED}All existing data will be lost!${NC}"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        echo -e "${YELLOW}❌ Restore cancelled${NC}"
        exit 0
    fi
    
    echo -e "${YELLOW}🗑️  Dropping existing database...${NC}"
    psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
    
    echo -e "${YELLOW}🆕 Creating new database...${NC}"
    psql -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;"
    
    echo -e "${YELLOW}📥 Restoring from compressed backup...${NC}"
    pg_restore -U "$DB_USER" -d "$DB_NAME" "$backup_file"
    
    echo -e "${GREEN}✅ Database restored successfully!${NC}"
}

# Function to get latest backup
get_latest_backup() {
    local backup_type="$1"
    case "$backup_type" in
        "full")
            ls -t "$BACKUP_DIR"/taskscheduler_full_*.sql 2>/dev/null | head -1
            ;;
        "compressed")
            ls -t "$BACKUP_DIR"/taskscheduler_compressed_*.dump 2>/dev/null | head -1
            ;;
        *)
            echo ""
            ;;
    esac
}

# Main menu
if [ $# -eq 0 ]; then
    echo -e "${BLUE}Select restore option:${NC}"
    echo "1. Restore from latest full backup"
    echo "2. Restore from latest compressed backup"
    echo "3. Restore from specific backup file"
    echo "4. List all available backups"
    echo "5. Exit"
    echo ""
    read -p "Enter your choice (1-5): " choice
    
    case $choice in
        1)
            latest_full=$(get_latest_backup "full")
            if [ -n "$latest_full" ]; then
                echo -e "${BLUE}Latest full backup: $(basename "$latest_full")${NC}"
                restore_full "$latest_full"
            else
                echo -e "${RED}❌ No full backups found${NC}"
                exit 1
            fi
            ;;
        2)
            latest_compressed=$(get_latest_backup "compressed")
            if [ -n "$latest_compressed" ]; then
                echo -e "${BLUE}Latest compressed backup: $(basename "$latest_compressed")${NC}"
                restore_compressed "$latest_compressed"
            else
                echo -e "${RED}❌ No compressed backups found${NC}"
                exit 1
            fi
            ;;
        3)
            list_backups
            echo ""
            read -p "Enter the full path to backup file: " backup_file
            if [ ! -f "$backup_file" ]; then
                echo -e "${RED}❌ File not found: $backup_file${NC}"
                exit 1
            fi
            
            if [[ "$backup_file" == *.dump ]]; then
                restore_compressed "$backup_file"
            elif [[ "$backup_file" == *.sql ]]; then
                restore_full "$backup_file"
            else
                echo -e "${RED}❌ Unsupported file format${NC}"
                exit 1
            fi
            ;;
        4)
            list_backups
            ;;
        5)
            echo -e "${YELLOW}👋 Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Invalid choice${NC}"
            exit 1
            ;;
    esac
elif [ $# -eq 1 ]; then
    # Restore from specified file
    backup_file="$1"
    if [ ! -f "$backup_file" ]; then
        echo -e "${RED}❌ File not found: $backup_file${NC}"
        exit 1
    fi
    
    if [[ "$backup_file" == *.dump ]]; then
        restore_compressed "$backup_file"
    elif [[ "$backup_file" == *.sql ]]; then
        restore_full "$backup_file"
    else
        echo -e "${RED}❌ Unsupported file format${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Usage: $0 [backup_file]${NC}"
    exit 1
fi

# Verify restoration
echo ""
echo -e "${BLUE}🔍 Verifying restoration...${NC}"
DB_INFO=$(psql -U "$DB_USER" -d "$DB_NAME" -t -c "
SELECT 
    (SELECT count(*) FROM users) as user_count,
    (SELECT count(*) FROM schedulers) as scheduler_count,
    (SELECT count(*) FROM scheduler_items) as item_count
")
echo "Restored database info: $DB_INFO"
echo ""
echo -e "${GREEN}🎉 Restoration completed successfully!${NC}"