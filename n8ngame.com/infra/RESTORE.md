# UM890 Restore Procedure

This document describes how to restore the system from S3 backups.

## 1. Prerequisites
- **Backup File**: Locate the desired timestamp folder in S3 (e.g., `backups/20251214_030000`).
- **AWS CLI**: Configure credentials on the server or use the backup container.

## 2. Download Backup
```bash
# Example using the backup container environment (interactive)
docker compose run --rm --entrypoint /bin/bash backup

# Inside container:
export TIMESTAMP="20251214_030000"
mkdir -p /tmp/restore
aws s3 cp --recursive s3://$S3_BUCKET/backups/$TIMESTAMP /tmp/restore
```

## 3. Restore Postgres
**WARNING**: This overwrites existing data. Stop services first (`docker compose stop n8n api`).

```bash
# Inside backup container or host with pg_restore
# 1. Restore n8n internal DB
PGPASSWORD=$PGPASSWORD pg_restore -h $PGHOST -U $PGUSER -d n8n --clean --if-exists /tmp/restore/n8n.dump

# 2. Restore Game DB
PGPASSWORD=$PGPASSWORD pg_restore -h $PGHOST -U $PGUSER -d n8ngame --clean --if-exists /tmp/restore/n8ngame.dump
```

## 4. Restore n8n Data (Files)
```bash
# Extract tar to volume mount
# Note: backup container mounts n8n_data at /backup/n8n-data

# Clean existing (Optional but recommended)
rm -rf /backup/n8n-data/*

# Extract
tar -xzf /tmp/restore/n8n-data.tar.gz -C /
# The tar was created with -C /backup n8n-data, so it contains `n8n-data/` prefix?
# Check backup.sh: `tar -czf ... -C /backup n8n-data` -> archives `n8n-data/config...`
# So extracting to /backup will restore /backup/n8n-data
tar -xzf /tmp/restore/n8n-data.tar.gz -C /backup
```

## 5. Restart Services
```bash
exit # Exit container
docker compose start postgres n8n api
docker compose logs -f n8n
```
