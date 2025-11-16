# Tutorial 05: MySQL Backup and Restore

## Objectives

- Learn different backup strategies (logical vs physical)
- Master mysqldump for logical backups
- Implement automated backup scripts
- Perform point-in-time recovery
- Test restore procedures
- Implement backup best practices

## Backup Strategies

### Logical Backups (mysqldump)
**Pros**: Portable, human-readable, selective backup
**Cons**: Slower for large databases
**Best for**: Databases < 100GB

### Physical Backups (file copy/Percona XtraBackup)
**Pros**: Fast, efficient for large databases
**Cons**: Less portable
**Best for**: Large production databases

### Binary Log Backups
**Pros**: Point-in-time recovery
**Cons**: Requires base backup + logs
**Best for**: Critical data recovery

## mysqldump Basics

```bash
# Full database backup
mysqldump -u root -p --databases mydb > backup.sql

# All databases
mysqldump -u root -p --all-databases > full-backup.sql

# Single table
mysqldump -u root -p mydb users > users-backup.sql

# With routines and triggers
mysqldump -u root -p --routines --triggers --databases mydb > backup.sql

# Compressed backup
mysqldump -u root -p --all-databases | gzip > backup.sql.gz
```

## Automated Backup Script

**scripts/backup.sh**:
```bash
#!/bin/bash

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Full backup
docker-compose exec -T mysql mysqldump \
    -u root -p${MYSQL_ROOT_PASSWORD} \
    --all-databases \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    | gzip > "${BACKUP_DIR}/full-backup-${DATE}.sql.gz"

# Delete old backups
find ${BACKUP_DIR} -name "*.sql.gz" -mtime +${RETENTION_DAYS} -delete

echo "Backup completed: full-backup-${DATE}.sql.gz"
```

## Restore Procedures

```bash
# Restore full backup
zcat backup.sql.gz | mysql -u root -p

# Restore specific database
mysql -u root -p mydb < mydb-backup.sql

# Restore with Docker
docker-compose exec -T mysql mysql -u root -p < backup.sql
```

## Point-in-Time Recovery

```bash
# 1. Restore base backup
mysql -u root -p < base-backup.sql

# 2. Apply binary logs up to specific time
mysqlbinlog --stop-datetime="2024-01-15 10:30:00" \
    mysql-bin.000001 mysql-bin.000002 | mysql -u root -p

# 3. Verify data
mysql -u root -p -e "SELECT COUNT(*) FROM mydb.users;"
```

## Best Practices

1. **Test restores regularly**
2. **Keep multiple backup copies** (3-2-1 rule)
3. **Automate backups** with cron
4. **Monitor backup success**
5. **Encrypt sensitive backups**
6. **Store backups offsite**

## Verification

```bash
# Run backup
./scripts/backup.sh

# Test restore
./scripts/restore.sh backup-20240115.sql.gz

# Verify data integrity
./scripts/verify-backup.sh
```

## Next Steps

**Tutorial 06: Monitoring** - Learn to monitor MySQL performance, queries, and resource usage.

---

**Congratulations!** You can now backup and restore MySQL databases confidently!
