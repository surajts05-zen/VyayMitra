# VyayMitra Production Deployment & Operational Runbook

This guide covers deploying and operating VyayMitra in a production environment using **PostgreSQL**, **Node.js (NestJS)**, and **Nginx / Static Web Hosting**.

---

## 1. System Architecture

```mermaid
graph TD
    Client[Web Browser / Mobile] -->|HTTPS :443| Nginx[Nginx Reverse Proxy]
    Nginx -->|Static Assets / Single Page App| WebDist[/apps/web/dist]
    Nginx -->|API Requests /api/*| NestAPI[NestJS API Server :3001]
    NestAPI -->|Prisma ORM Connection Pool| Postgres[(PostgreSQL 16+ vyaymitradb)]
    NestAPI -->|HMAC-SHA256 Token Storage| S3[(Receipt Object Storage / Local S3)]
```

---

## 2. Database Setup (PostgreSQL)

### 2.1 Database Credentials
- **Host**: `localhost` (or managed RDS / Cloud SQL endpoint)
- **Port**: `5432`
- **Database Name**: `vyaymitradb`
- **Username**: `vyaymitrausr`
- **Password**: `123456`
- **Connection URI**:
  ```bash
  postgresql://vyaymitrausr:123456@localhost:5432/vyaymitradb?schema=public
  ```

### 2.2 Schema Push & Migrations
To initialize or update the production database schema:
```bash
# Push schema directly
pnpm dlx prisma db push

# Or run official migration workflow
pnpm db:migrate
```

### 2.3 Seed Production Reference Data
Populate default tenants, multi-currency exchange tables, standard Indian GST tax codes, GL accounts, and initial administrators:
```bash
pnpm db:seed
```

---

## 3. Production Environment Configuration (`.env.production`)

Create `.env.production` in the project root:

```ini
# Node & Runtime
NODE_ENV=production
PORT=3001
APP_URL=https://vyaymitra.yourdomain.com
API_URL=https://vyaymitra.yourdomain.com/api

# Database (PostgreSQL)
DATABASE_URL="postgresql://vyaymitrausr:123456@localhost:5432/vyaymitradb?schema=public&connection_limit=20"

# Authentication (JWT)
JWT_SECRET="generate-a-secure-64-character-hex-string-for-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Storage (S3 / MinIO Object Storage)
S3_ENDPOINT="https://s3.ap-south-1.amazonaws.com"
S3_BUCKET="vyaymitra-prod-receipts"
S3_ACCESS_KEY="YOUR_AWS_ACCESS_KEY"
S3_SECRET_KEY="YOUR_AWS_SECRET_KEY"
S3_REGION="ap-south-1"
USE_LOCAL_STORAGE=false

# Zoho Books Integration (Server-side secrets only)
ZOHO_CLIENT_ID="1000.PROD_CLIENT_ID"
ZOHO_CLIENT_SECRET="PROD_CLIENT_SECRET"
ZOHO_REDIRECT_URI="https://vyaymitra.yourdomain.com/api/v1/integrations/zoho-books/callback"
ZOHO_TOKEN_ENCRYPTION_KEY="64-character-hex-key-for-aes-256-gcm-encryption"

# Rate Limiting & Proxy
TRUST_PROXY=true
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000
```

---

## 4. Building the Application

Execute monorepo builds:
```bash
# Install production dependencies
pnpm install --frozen-lockfile

# Generate Prisma Client
pnpm db:generate

# Build both backend (NestJS) and frontend (Vite React)
pnpm build
```
Build outputs:
- **API**: `apps/api/dist/src/main.js`
- **Web**: `apps/web/dist/`

---

## 5. Process Management (PM2 Runbook)

Create `ecosystem.config.cjs`:
```javascript
module.exports = {
  apps: [
    {
      name: 'vyaymitra-api',
      script: 'apps/api/dist/src/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      max_memory_restart: '1G',
      listen_timeout: 10000,
      kill_timeout: 5000,
    },
  ],
};
```

Start and persist:
```bash
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup
```

---

## 6. Nginx Reverse Proxy Configuration

Create `/etc/nginx/sites-available/vyaymitra.conf`:
```nginx
server {
    listen 80;
    server_name vyaymitra.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name vyaymitra.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/vyaymitra.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vyaymitra.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    root /var/www/vyaymitra/apps/web/dist;
    index index.html;

    # Static UI SPA
    location / {
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, no-cache";
    }

    # Static Assets (Vite chunk hashing)
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API Reverse Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 15M;
    }
}
```

---

## 7. Health & Monitoring Endpoints

Verify operational status:
- **API Liveness**: `GET /api/health`
- **V1 API Health**: `GET /api/v1/health`
- **OpenAPI Schema**: `GET /api/openapi.json`
- **Swagger Docs**: `GET /api/docs` (disable in public environments via `ENABLE_API_DOCS=false`)
