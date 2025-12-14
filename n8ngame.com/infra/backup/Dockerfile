FROM alpine:latest

# Install tools (Added tzdata for Timezone support)
RUN apk add --no-cache postgresql-client aws-cli bash tar curl tzdata

# Create backup script
WORKDIR /scripts
COPY backup.sh /scripts/backup.sh
RUN chmod +x /scripts/backup.sh

# Run via Cron
# Add crontab (Run at 03:00 daily)
RUN echo "0 3 * * * /scripts/backup.sh >> /var/log/cron.log 2>&1" > /etc/crontabs/root

# Foreground cron
CMD ["crond", "-f", "-d", "8"]
