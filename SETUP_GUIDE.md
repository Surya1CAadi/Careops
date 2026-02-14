# 🚀 CareOps Platform - Setup & Deployment Guide

## 📋 Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- Git installed
- Code editor (VS Code recommended)

## 🛠️ Initial Setup

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Setup PostgreSQL Database

Create a new PostgreSQL database:

```sql
CREATE DATABASE careops;
```

### 3. Configure Environment Variables

#### Backend (.env)

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/careops?schema=public"

# Server
PORT=3001
NODE_ENV=development

# JWT Secrets (generate strong secrets for production)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production

# Email (Choose one provider)
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com

# SMS (Twilio)
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

#### Frontend (.env)

```bash
cd ../frontend
cp .env.example .env
```

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:3001/api
```

### 4. Initialize Database

```bash
cd backend

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view database
npx prisma studio
```

### 5. Start Development Servers

From the root directory:

```bash
# Start both frontend and backend concurrently
npm run dev
```

Or start them separately:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Access the application:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/health

## 📦 Building for Production

### Backend

```bash
cd backend
npm run build
```

### Frontend

```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/`.

## 🚀 Deployment Options

### Option 1: Deploy to Vercel (Recommended)

#### Deploy Frontend

```bash
cd frontend
npm install -g vercel
vercel
```

Follow the prompts to deploy. Set environment variable:
- `VITE_API_URL`: Your backend API URL

#### Deploy Backend

Use Vercel, Railway, or any Node.js hosting:

```bash
cd backend
vercel
```

Set all environment variables in your hosting platform.

### Option 2: Deploy to Railway

1. Connect your GitHub repository to Railway
2. Create two services:
   - **Backend**: Set root directory to `backend/`
   - **Frontend**: Set root directory to `frontend/`
3. Add PostgreSQL database addon
4. Configure environment variables

### Option 3: Deploy to AWS/DigitalOcean

1. **Setup VPS**:
   ```bash
   ssh user@your-server-ip
   ```

2. **Install Node.js and PostgreSQL**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs postgresql
   ```

3. **Clone and Setup**:
   ```bash
   git clone your-repo
   cd careops-platform
   npm run install:all
   ```

4. **Configure PM2** (Process Manager):
   ```bash
   npm install -g pm2
   
   # Start backend
   cd backend
   pm2 start npm --name "careops-backend" -- start
   
   # Serve frontend with nginx or serve
   cd ../frontend
   npm run build
   sudo npm install -g serve
   pm2 start serve --name "careops-frontend" -- -s dist -p 3000
   ```

5. **Setup Nginx** as reverse proxy:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
       }
       
       location /api {
           proxy_pass http://localhost:3001;
       }
   }
   ```

### Option 4: Docker Deployment

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: careops
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/careops
      PORT: 3001
    ports:
      - "3001:3001"
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

Deploy:
```bash
docker-compose up -d
```

## 🔐 Security Checklist for Production

- [ ] Change all default secrets and passwords
- [ ] Enable HTTPS/SSL certificates (use Let's Encrypt)
- [ ] Set `NODE_ENV=production`
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable database backups
- [ ] Configure monitoring (Sentry, LogRocket)
- [ ] Set up firewall rules
- [ ] Use environment variables (never commit secrets)
- [ ] Enable database SSL connection

## 🧪 Testing the Application

### 1. Register a New Account

1. Go to http://localhost:5173/register
2. Fill in business details
3. Create your workspace

### 2. Complete Onboarding

Follow the 8-step onboarding process to set up:
- Communication channels
- Contact forms
- Booking types
- Forms
- Inventory
- Staff members

### 3. Test Core Features

- Create a test contact
- Book an appointment
- Send messages
- Create alerts
- Track inventory

## 📊 Monitoring & Maintenance

### Database Backups

```bash
# Backup
pg_dump careops > backup_$(date +%Y%m%d).sql

# Restore
psql careops < backup_YYYYMMDD.sql
```

### View Logs

```bash
# PM2 logs
pm2 logs

# Docker logs
docker-compose logs -f
```

### Update Application

```bash
git pull origin main
npm run install:all
cd backend && npx prisma migrate deploy
pm2 restart all
```

## 🐛 Troubleshooting

### Database Connection Issues

- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify DATABASE_URL in .env
- Check firewall settings

### Port Already in Use

```bash
# Find process using port
lsof -i :3001  # Backend port
lsof -i :5173  # Frontend port

# Kill process
kill -9 <PID>
```

### Prisma Issues

```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Regenerate client
npx prisma generate
```

## 📞 Support

For issues or questions:
- Check the README.md
- Review error logs
- Refer to hackathon documentation

## 🎉 Next Steps

Once deployed:
1. Configure your email/SMS providers
2. Create automation rules
3. Set up booking types
4. Invite staff members
5. Share booking links with customers

---

**Built for the CareOps Hackathon** 🏆
