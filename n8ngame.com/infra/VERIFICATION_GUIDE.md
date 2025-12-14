# Infra Verification Checklist (10 Minutes)

Run these commands on the **UM890 Server** (where Docker is installed) to verify the setup before moving to Phase 4.

## 1. Certbot Dry-Run (SSL)
Verify that SSL renewal will work.
```bash
cd /opt/n8ngame/infra
# This ensures nginx (proxy) allows the challenge through
docker compose run --rm certbot renew --dry-run
```
**Success Criteria**: Output says "Congratulations, all simulated renewals succeeded".

## 2. Full Stack Restart
Verify everything comes up clean from scratch.
```bash
docker compose down
docker compose up -d
docker compose ps
```
**Success Criteria**: All containers (proxy, api, n8n, postgres, redis, frontend) state is `Up`.

## 3. Backup Test
Verify the backup container works.
```bash
# 1. Run Backup Script
docker compose run --rm backup /scripts/backup.sh

# 2. Check S3 (if aws-cli configured on host) or Check Logs
# The script output should say "[DATE] Backup Complete!"
```

## 4. Restore Rehearsal
Verify we can read the backup.
```bash
# 1. Shell into backup container
docker compose run --rm --entrypoint /bin/bash backup

# 2. Only download and list files (Don't overwrite DB yet if live)
export TIMESTAMP=$(date +%Y%m%d) # or specific folder name you saw in step 3
mkdir -p /tmp/verify
aws s3 cp --recursive s3://$S3_BUCKET/backups/$TIMESTAMP /tmp/verify

ls -lh /tmp/verify
# Should see: n8ngame.dump, n8n.dump, n8n-data.tar.gz
exit
```
**Success Criteria**: Files are successfully downloaded and have non-zero size.
