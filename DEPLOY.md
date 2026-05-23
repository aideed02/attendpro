# AttendPro — Deployment Guide

---

## Option 1: VPS / Ubuntu Server (Recommended)
Best for: DigitalOcean, Hetzner, Vultr, Linode, AWS EC2

### Step 1 — Get a server
- Minimum: **1 vCPU, 1GB RAM, 20GB SSD**
- Recommended: **2 vCPU, 2GB RAM** (~$6–12/mo on Hetzner/DigitalOcean)
- OS: **Ubuntu 22.04 LTS**

### Step 2 — Connect & update
```bash
ssh root@YOUR_SERVER_IP

apt update && apt upgrade -y
apt install -y git curl ufw
```

### Step 3 — Install Docker
```bash
curl -fsSL https://get.docker.com | sh
apt install -y docker-compose-plugin
systemctl enable docker
```

### Step 4 — Firewall
```bash
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable
```

### Step 5 — Upload your project
```bash
# On your LOCAL machine:
scp attendance-system.zip root@YOUR_SERVER_IP:/root/

# Back on the SERVER:
unzip attendance-system.zip
cd attendance-system
```

### Step 6 — Configure environment
```bash
cp backend/.env.example backend/.env
nano backend/.env
```

Edit these values:
```env
DATABASE_URL="postgresql://postgres:CHANGE_PASSWORD@db:5432/attendance_db"
JWT_SECRET="generate-a-long-random-string-here"
FRONTEND_URL="http://YOUR_SERVER_IP"   # or https://yourdomain.com
PORT=5000
NODE_ENV=production
```

Also update docker-compose.yml postgres password to match:
```bash
nano docker-compose.yml
# Change: POSTGRES_PASSWORD: password  →  POSTGRES_PASSWORD: CHANGE_PASSWORD
```

### Step 7 — Build & launch
```bash
docker compose up -d --build

# Run database migrations + seed
docker compose exec backend npx prisma migrate deploy
docker compose exec backend node src/prisma/seed.js
```

### Step 8 — Verify
```bash
docker compose ps          # all services should be "Up"
docker compose logs -f     # watch logs
curl http://localhost:5000/api/health
```

Visit: **http://YOUR_SERVER_IP**
Login: admin@techcorp.com / admin123

---

## Option 2: Add HTTPS with a Domain (Strongly Recommended)

### Prerequisites
- A domain name (e.g. attend.yourcompany.com)
- DNS A record pointing to your server IP

### Install Nginx + Certbot
```bash
apt install -y nginx certbot python3-certbot-nginx
```

### Create Nginx config
```bash
nano /etc/nginx/sites-available/attendpro
```

Paste this (replace YOUR_DOMAIN):
```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/attendpro /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### Get SSL certificate (free)
```bash
certbot --nginx -d YOUR_DOMAIN
# Follow prompts — it auto-configures HTTPS
```

### Update .env with HTTPS
```bash
nano backend/.env
# FRONTEND_URL="https://YOUR_DOMAIN"

docker compose restart backend
```

Visit: **https://YOUR_DOMAIN** 🔒

---

## Option 3: Railway (Zero-server, easiest)

### Deploy backend
1. Go to https://railway.app → New Project → Deploy from GitHub
2. Connect your repo
3. Add a **PostgreSQL** plugin
4. Set environment variables:
   - `DATABASE_URL` → (Railway auto-fills from Postgres plugin)
   - `JWT_SECRET` → any long random string
   - `FRONTEND_URL` → your frontend URL
   - `NODE_ENV` → production
5. Set start command: `npm start`
6. Run migrations: open Railway shell → `npx prisma migrate deploy && node src/prisma/seed.js`

### Deploy frontend
1. New service → GitHub repo → set root to `/frontend`
2. Build command: `npm run build`
3. Start command: `npx serve dist`
4. Set env: `VITE_API_URL=https://your-backend.railway.app`

---

## Option 4: Render (Free tier available)

### Backend (Web Service)
- Build: `cd backend && npm install && npx prisma generate`
- Start: `npm start`
- Add PostgreSQL database from Render dashboard
- Environment vars: same as above

### Frontend (Static Site)
- Build: `cd frontend && npm install && npm run build`
- Publish dir: `frontend/dist`
- Env: `VITE_API_URL=https://your-backend.onrender.com`

---

## Useful Commands (after deployment)

```bash
# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Restart a service
docker compose restart backend

# Update after code changes
git pull
docker compose up -d --build backend

# Database backup
docker compose exec db pg_dump -U postgres attendance_db > backup.sql

# Restore backup
cat backup.sql | docker compose exec -T db psql -U postgres attendance_db

# Open database shell
docker compose exec db psql -U postgres attendance_db

# Reset admin password
docker compose exec backend node -e "
const {PrismaClient}=require('@prisma/client');
const bcrypt=require('bcryptjs');
const p=new PrismaClient();
bcrypt.hash('newpassword123',12).then(h=>p.admin.update({where:{email:'admin@techcorp.com'},data:{password:h}})).then(console.log)
"
```

---

## Security Checklist Before Going Live

- [ ] Change default admin password (admin123)
- [ ] Set a strong JWT_SECRET (32+ random chars)
- [ ] Set strong database password
- [ ] Enable HTTPS (Certbot)
- [ ] Set FRONTEND_URL to your actual domain
- [ ] Remove seed data or change demo credentials
- [ ] Set up daily database backups

### Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# or
openssl rand -hex 32
```
