# Deployment Guide for UM890 Pro

This guide assumes you are running Ubuntu or a similar Linux distribution (or WSL on Windows).

## Prerequisites
- [Docker](https://docs.docker.com/engine/install/) and [Docker Compose](https://docs.docker.com/compose/install/) installed.
- A domain name (e.g., `game.example.com`) pointing to your server's public IP.
- Ports `80` and `443` opened on your router/firewall.

## 1. Setup

1.  Clone this repository to your server.
2.  Edit `nginx/conf.d/default.conf`:
    - Replace `example.com` with your actual domain name in the `server_name` directive (line 3).

## 2. Start (HTTP)

Start the containers to generate the initial files and serve over HTTP:

```bash
docker-compose up -d
```

Verify your site is accessible at `http://your-domain.com`.

## 3. SSL Certificate (HTTPS)

Run Certbot to request a certificate:

```bash
docker-compose run --rm certbot certonly --webroot --webroot-path /var/www/certbot -d your-domain.com
```
*(Replace `your-domain.com` with your actual domain)*

If successful, you will see a message about the certificate being saved to `/etc/letsencrypt/live/...`.

## 4. Finalize Nginx Config

1.  Edit `nginx/conf.d/default.conf` again:
    - Uncomment the `return 301 https://$host$request_uri;` line in the HTTP block.
    - Comment out the `proxy_pass` block in the HTTP block.
    - Uncomment the entire SSL server block (at the bottom).
    - Replace `example.com` with your domain in the SSL block (`server_name` and `ssl_certificate` paths).
2.  Reload Nginx:

```bash
docker-compose exec nginx nginx -s reload
```

Now your site should be secure at `https://your-domain.com`.

## Maintenance

- **Update**: `git pull` -> `docker-compose build` -> `docker-compose up -d`
- **Logs**: `docker-compose logs -f`
