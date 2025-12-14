#!/bin/bash
set -e

# Error Handling
handle_error() {
    echo "!!! BACKUP FAILED !!!"
    # Optional: Send webhook alert here
    exit 1
}
trap 'handle_error' ERR

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/tmp/backup_$TIMESTAMP"
S3_PATH="s3://$S3_BUCKET/backups/$TIMESTAMP"

echo "[$TIMESTAMP] Starting Backup..."

mkdir -p $BACKUP_DIR

# 1. Postgres Dump
echo "Dumping Postgres..."
PGPASSWORD=$PGPASSWORD pg_dump -h $PGHOST -U $PGUSER -d n8ngame -Fc > "$BACKUP_DIR/n8ngame.dump"
PGPASSWORD=$PGPASSWORD pg_dump -h $PGHOST -U $PGUSER -d n8n -Fc > "$BACKUP_DIR/n8n.dump"

# 2. n8n Files
# Volume mounted at /backup/n8n-data
# We archive the contents.
echo "Compressing n8n data..."
tar -czf "$BACKUP_DIR/n8n-data.tar.gz" -C /backup n8n-data

# 3. Upload to S3
echo "Uploading to S3..."
aws s3 cp --recursive $BACKUP_DIR $S3_PATH
if [ $? -eq 0 ]; then
    echo "Upload Success."
else
    echo "Upload Failed."
    exit 1
fi

# 4. Cleanup
rm -rf $BACKUP_DIR

echo "[$TIMESTAMP] Backup Complete!"
