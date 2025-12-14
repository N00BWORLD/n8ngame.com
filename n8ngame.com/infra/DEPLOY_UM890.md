# UM890 Implementation Guide (Subdomain Architecture)

## 1. Prerequisites
- **Domain**: Point `n8ngame.com`, `n8n.n8ngame.com`, `api.n8ngame.com`, and `studio.n8ngame.com` to Server IP.
- **Docker**: Installed.
- **Ports**: 80/443 Open.

## 2. Directory & Env
```bash
mkdir -p /opt/n8ngame/infra
git clone https://github.com/Start-Node-One/n8ngame.com.git /opt/n8ngame/src
cp -r /opt/n8ngame/src/infra/* /opt/n8ngame/infra/
cd /opt/n8ngame/infra
cp .env.example .env
nano .env # Set Passwords!

# Generate Supabase JWTs:
# You can use https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys
# Or basic command:
# JWT_SECRET=$(openssl rand -hex 32)
# ANON_KEY=$(jwt encode --secret $JWT_SECRET --alg HS256 '{"role":"anon","iss":"supabase","iat":1700000000,"exp":2000000000}')
# SERVICE_ROLE_KEY=$(jwt encode --secret $JWT_SECRET --alg HS256 '{"role":"service_role","iss":"supabase","iat":1700000000,"exp":2000000000}')
# (Replace with actual JWT creation or online tools)
```

## 3. SSL Setup (First Run)
Since we need Certs for Nginx to start SSL, but Nginx is needed for Certbot validation (Webroot).
1. Comment out SSL sections in `nginx/conf.d/default.conf` effectively leaving only Port 80 blocks.
2. `docker compose up -d proxy`
3. Request Certs:
   ```bash
   docker compose run --rm certbot certonly --webroot --webroot-path /var/www/certbot \
     -d n8ngame.com -d www.n8ngame.com -d n8n.n8ngame.com \
     -d api.n8ngame.com -d studio.n8ngame.com -d auth.n8ngame.com
   ```
4. Restore `nginx/conf.d/default.conf` SSL sections.
5. `docker compose restart proxy`

## 4. Verify & Monitor
Run Health Checks:
```bash
# Frontend
curl -I https://n8ngame.com/
# API
curl https://n8ngame.com/api/health
# n8n
curl -I https://n8n.n8ngame.com/
# Supabase API
curl https://api.n8ngame.com/rest/v1/
# Supabase Studio
curl -I https://studio.n8ngame.com/
```

- **Backup Test**: `docker compose run --rm backup /scripts/backup.sh`

## 5. Schema Migration & Verification (10-B)
Migrations are automatically applied on container start via `/docker-entrypoint-initdb.d`.
To verify manual application or check status:

1. **Connect to DB**:
   ```bash
   docker compose exec supabase-db psql -U postgres
   ```

2. **Verify Tables**:
   ```sql
   \dt public.*
   -- Should list: profiles, blueprints, blueprint_versions, inventory
   ```

3. **Verify RLS**:
   ```sql
   select tablename, rowsecurity from pg_tables where schemaname = 'public';
   -- rowsecurity should be true for all
   ```

4. **Verify Access (Test Scenario)**:
   ```sql
   -- As Postgres (Admin)
   insert into public.blueprints (id, user_id, title) values ('uuid-1', 'auth-uuid', 'Admin Created');
   
   -- As User (Simulate RLS)
   set role authenticated;
   set request.jwt.claim.sub = 'auth-uuid'; -- Mock User ID
   select * from public.blueprints; -- Should see row
   
   set request.jwt.claim.sub = 'other-uuid';
   select * from public.blueprints; -- Should see NOTHING
   ```

