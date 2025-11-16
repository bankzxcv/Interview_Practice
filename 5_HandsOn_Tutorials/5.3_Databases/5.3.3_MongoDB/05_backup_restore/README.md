# Tutorial 05: MongoDB Backup & Restore

## mongodump/mongorestore

```bash
# Full backup
mongodump --uri="mongodb://admin:pass@localhost:27017" --out=/backup

# Restore
mongorestore --uri="mongodb://admin:pass@localhost:27017" /backup

# Specific database
mongodump --db=myapp --out=/backup/myapp

# Compressed backup
mongodump --archive=/backup/backup.gz --gzip
```

## Automated Backup Script
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --archive=/backups/backup-${DATE}.gz --gzip
find /backups -mtime +7 -delete
```

**Next**: Tutorial 06 - Monitoring
