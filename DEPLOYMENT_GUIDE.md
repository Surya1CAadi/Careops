# CareOps Deployment Guide

## Overview
This guide covers deploying your CareOps platform to production. The stack consists of:
- **Frontend**: React + Vite + TypeScript
- **Backend**: Node.js + Express + TypeScript + Prisma
- **Database**: PostgreSQL

---

## Deployment Options

### Option 1: Railway (Recommended - Easiest)
Railway can host your entire stack in one place with automatic deployments.

#### Setup Steps:

1. **Sign up at [Railway.app](https://railway.app)**

2. **Deploy Database:**
   - Click "New Project" → "Provision PostgreSQL"
   - Copy the `DATABASE_URL` from the PostgreSQL service

3. **Deploy Backend:**
   - Click "New" → "GitHub Repo" → Select your backend folder
   - Add environment variables:
     ```
     DATABASE_URL=<your-postgres-url>
     JWT_SECRET=<generate-secure-random-string>
     JWT_REFRESH_SECRET=<generate-another-secure-string>
     NODE_ENV=production
     PORT=3001
     FRONTEND_URL=<your-frontend-url>
     ```
   - Railway will auto-detect Node.js and run `npm install && npm run build && npm start`
   - Add custom start command if needed: `npm run build && node dist/index.js`

4. **Deploy Frontend:**
   - Click "New" → "GitHub Repo" → Select your frontend folder
   - Add environment variables:
     ```
     VITE_API_URL=<your-backend-url>/api
     ```
   - Railway will auto-detect Vite and build/serve it

5. **Run Migrations:**
   - In Railway backend service, go to "Settings" → "Custom Start Command"
   - Run once: `npx prisma migrate deploy && node dist/index.js`

---

### Option 2: Vercel (Frontend) + Render (Backend + Database)

#### Frontend on Vercel:

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy Frontend:**
   ```bash
   cd frontend
   vercel
   ```

3. **Set Environment Variables in Vercel Dashboard:**
   ```
   VITE_API_URL=https://your-backend.onrender.com/api
   ```

#### Backend + Database on Render:

1. **Sign up at [Render.com](https://render.com)**

2. **Create PostgreSQL Database:**
   - Dashboard → "New PostgreSQL"
   - Copy "Internal Database URL"

3. **Create Web Service:**
   - Dashboard → "New Web Service"
   - Connect your GitHub repo (backend folder)
   - Settings:
     - **Environment**: Node
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `node dist/index.js`
     - **Environment Variables**:
       ```
       DATABASE_URL=<internal-database-url>
       JWT_SECRET=<secure-random-string>
       JWT_REFRESH_SECRET=<another-secure-string>
       NODE_ENV=production
       PORT=10000
       FRONTEND_URL=https://your-frontend.vercel.app
       ```

4. **Run Migrations:**
   - Render Dashboard → Shell tab
   - Run: `npx prisma migrate deploy`

---

### Option 3: Netlify (Frontend) + Railway (Backend + Database)

#### Frontend on Netlify:

1. **Create `netlify.toml` in frontend folder:**
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. **Deploy:**
   - Connect GitHub repo to Netlify
   - Set build settings as above
   - Add environment variable: `VITE_API_URL=<backend-url>/api`

#### Backend on Railway:
   - Follow Railway backend setup from Option 1

---

## Pre-Deployment Checklist

### Backend Preparation:

1. **Update `package.json` scripts:**
   ```json
   "scripts": {
     "build": "tsc",
     "start": "node dist/index.js",
     "dev": "nodemon src/index.ts",
     "migrate": "prisma migrate deploy"
   }
   ```

2. **Create production Prisma client generation:**
   Add to `package.json`:
   ```json
   "scripts": {
     "postinstall": "prisma generate"
   }
   ```

3. **Update CORS settings** in `backend/src/index.ts`:
   ```typescript
   app.use(cors({
     origin: process.env.FRONTEND_URL || 'http://localhost:5173',
     credentials: true,
   }));
   ```

4. **Verify environment variables are loaded:**
   ```typescript
   if (!process.env.DATABASE_URL) {
     throw new Error('DATABASE_URL is not defined');
   }
   ```

### Frontend Preparation:

1. **Update API URL handling** in `frontend/src/services/api.ts`:
   ```typescript
   const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
   ```

2. **Build test locally:**
   ```bash
   cd frontend
   npm run build
   ```
   Check the `dist` folder is created successfully.

### Database:

1. **Backup your local database:**
   ```bash
   pg_dump -U postgres -d mydb > backup.sql
   ```

2. **Test migrations:**
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

---

## Environment Variables Required

### Backend (.env in production):
```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars

# Server
NODE_ENV=production
PORT=3001

# CORS
FRONTEND_URL=https://your-frontend-domain.com
```

### Frontend (.env.production):
```env
VITE_API_URL=https://your-backend-domain.com/api
```

---

## Post-Deployment Steps

1. **Run Database Migrations:**
   ```bash
   npx prisma migrate deploy
   ```

2. **Seed Initial Data (if needed):**
   ```bash
   npx prisma db seed
   ```

3. **Test Authentication:**
   - Visit your frontend URL
   - Try registering a new account
   - Verify JWT tokens are working

4. **Test Core Features:**
   - Complete onboarding flow
   - Create test contacts
   - Create test bookings
   - Test forms, inventory, inbox, settings

5. **Monitor Logs:**
   - Railway: Check service logs in dashboard
   - Render: Check logs tab
   - Vercel/Netlify: Check function logs

---

## Production Optimizations

### Backend:

1. **Enable compression:**
   ```bash
   npm install compression
   ```
   ```typescript
   import compression from 'compression'
   app.use(compression())
   ```

2. **Rate limiting:**
   ```bash
   npm install express-rate-limit
   ```
   ```typescript
   import rateLimit from 'express-rate-limit'
   
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   })
   app.use('/api/', limiter)
   ```

3. **Helmet for security:**
   ```bash
   npm install helmet
   ```
   ```typescript
   import helmet from 'helmet'
   app.use(helmet())
   ```

### Frontend:

1. **Optimize build size:**
   - Remove unused dependencies
   - Use code splitting
   - Enable gzip compression

2. **Update `vite.config.ts`:**
   ```typescript
   export default defineConfig({
     build: {
       rollupOptions: {
         output: {
           manualChunks: {
             vendor: ['react', 'react-dom', 'react-router-dom'],
           },
         },
       },
     },
   })
   ```

### Database:

1. **Connection pooling:**
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
     relationMode = "prisma"
   }
   ```

2. **Add database indexes** (already in schema):
   - Workspace: `@@index([isActive])`
   - Booking: `@@index([workspaceId, startTime, status])`
   - Contact: `@@index([workspaceId, email])`

---

## Custom Domain Setup

### For Railway:
1. Go to service settings → Networking
2. Add custom domain
3. Update DNS records with provided values

### For Vercel:
1. Project Settings → Domains
2. Add your domain
3. Configure DNS (A/CNAME records)

### For Render:
1. Service Settings → Custom Domain
2. Add domain and configure DNS

---

## Continuous Deployment (CI/CD)

### GitHub Actions Example:

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: backend

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## Monitoring & Logging

### Recommended Tools:

1. **Sentry** (Error tracking):
   ```bash
   npm install @sentry/node @sentry/react
   ```

2. **LogRocket** (Session replay):
   ```bash
   npm install logrocket
   ```

3. **Uptime monitoring**:
   - UptimeRobot (free)
   - Pingdom
   - Better Uptime

### Basic Health Check Endpoint:

Add to `backend/src/index.ts`:
```typescript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})
```

---

## Troubleshooting

### Common Issues:

1. **CORS errors:**
   - Verify `FRONTEND_URL` is set correctly
   - Check CORS origin in backend

2. **Database connection fails:**
   - Verify `DATABASE_URL` format
   - Check database is running
   - Ensure migrations are deployed

3. **Build fails:**
   - Check Node version (use v18 or v20)
   - Clear node_modules and reinstall
   - Check for TypeScript errors

4. **Environment variables not loading:**
   - Restart service after adding variables
   - Check variable names match exactly
   - Verify no typos in `.env` files

5. **Static files not serving:**
   - Check build output directory
   - Verify `dist` folder exists after build
   - Check web server configuration

---

## Rollback Strategy

### Railway:
- Go to Deployments → Click previous deployment → Redeploy

### Render:
- Deployments tab → Click "Manual Deploy" on previous commit

### Vercel:
- Deployments → Select previous → Promote to Production

---

## Security Checklist

- ✅ Use HTTPS only (force redirect)
- ✅ Set secure JWT secrets (32+ characters)
- ✅ Enable rate limiting on API
- ✅ Use helmet for security headers
- ✅ Validate all user inputs
- ✅ Use parameterized queries (Prisma handles this)
- ✅ Set proper CORS origins
- ✅ Keep dependencies updated
- ✅ Use environment variables (never commit secrets)
- ✅ Enable database backups
- ✅ Set up SSL/TLS certificates
- ✅ Implement proper error handling (don't expose stack traces)

---

## Cost Estimates (Monthly)

### Free Tier Options:
- **Railway**: $5 free credit/month
- **Render**: Free tier available (with limitations)
- **Vercel**: Free for personal projects
- **Netlify**: Free for 100GB bandwidth

### Paid Recommendations:
- **Railway Pro**: $20/month (includes database + services)
- **Render**: $7/month PostgreSQL + $7/month Web Service
- **Vercel Pro**: $20/month (if needed)

---

## Support & Resources

- Railway Docs: https://docs.railway.app
- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- Prisma Deployment: https://www.prisma.io/docs/guides/deployment
- PostgreSQL Connection URLs: https://www.postgresql.org/docs/current/libpq-connect.html

---

## Quick Deploy Commands

### Local Build Test:
```bash
# Backend
cd backend
npm install
npm run build
DATABASE_URL="<your-db>" node dist/index.js

# Frontend  
cd frontend
npm install
npm run build
npm run preview
```

### Generate Secure Secrets:
```bash
# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Database URL Format:
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
```

---

**Ready to deploy!** Choose your preferred option and follow the steps above. For the easiest experience, start with Railway (Option 1).
