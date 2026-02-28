# Build Environment Setup Guide

This guide provides comprehensive instructions for setting up the UNNA Brain build environment.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Deployment Workflow](#deployment-workflow)
4. [Verification](#verification)
5. [Troubleshooting](#troubleshooting)
6. [Local Development](#local-development)

---

## Prerequisites

### Required Software

#### Frontend Development (Cloudflare Pages)
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Wrangler CLI**: Installed via npm (v4.69.0+)

#### Backend Development (FastAPI)
- **Python**: v3.11 or higher
- **Docker**: For database and container deployment
- **Docker Compose**: For local development environment

#### Optional
- **Git**: For version control
- **PostgreSQL 16**: If running database locally (or use Docker)

### Hardware Requirements
- **Minimum RAM**: 4GB (8GB recommended)
- **Disk Space**: 2GB for dependencies and build artifacts
- **Internet Connection**: Required for npm/pip downloads and Cloudflare deployments

### System Requirements
- **macOS**: 10.15+
- **Linux**: Any modern distribution (Ubuntu 20.04+, Fedora 35+, etc.)
- **Windows**: WSL2 with Ubuntu 20.04+ recommended

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/RemoRaj007/UNNA_BRAIN.git
cd UNNA_BRAIN
```

### 2. Install Frontend Dependencies

```bash
npm install
```

This installs wrangler and other Node.js dependencies defined in `package.json`.

**Verify Installation:**
```bash
npx wrangler --version
# Expected: wrangler 4.69.0 (or higher)
```

### 3. Install Backend Dependencies

#### Option A: Using Docker Compose (Recommended)

```bash
docker-compose up -d
```

This sets up:
- PostgreSQL 16 database
- FastAPI backend service
- All Python dependencies

**Verify:**
```bash
docker-compose ps
# Should show both 'db' and 'api' services running
```

#### Option B: Local Python Setup

```bash
# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env.local file
cp .env.local.example .env.local
# Edit .env.local with your local database configuration
```

### 4. Verify Installation

Run the verification script:

```bash
npm run verify
```

This will check:
- ✓ Node.js version
- ✓ npm version
- ✓ wrangler installation
- ✓ Python version (if local setup)
- ✓ Docker status (if using containers)
- ✓ Configuration files
- ✓ Frontend assets directory

**Expected Output:**
```
✓ Node.js v18.x.x detected
✓ npm v9.x.x detected
✓ wrangler v4.69.0 installed
✓ Docker running
✓ Frontend assets directory exists
✓ Configuration files found
```

---

## Deployment Workflow

### Frontend Deployment (Cloudflare Pages)

#### Prerequisites
- Cloudflare account with Pages service enabled
- Account ID and API token configured
- Project created in Cloudflare Pages

#### Environment Setup

```bash
# Copy example environment file
cp .env.local.example .env.local

# Edit .env.local and add Cloudflare credentials:
# CLOUDFLARE_ACCOUNT_ID=your-account-id
# CLOUDFLARE_API_TOKEN=your-api-token

# Make them available to npm scripts
export $(cat .env.local | grep CLOUDFLARE | xargs)
```

#### Deploy to Production

```bash
npm run deploy
```

This command:
1. Verifies the build environment
2. Checks `.assetsignore` rules
3. Uploads frontend assets to Cloudflare Pages
4. Triggers deployment pipeline

**Expected Output:**
```
⛅️ wrangler 4.69.0
───────────────
🌀 Building list of assets...
✨ Read X files from the assets directory frontend/
✓ Uploaded successfully
```

#### Deploy to Staging (if configured)

```bash
npx wrangler pages deploy frontend --branch staging
```

### Backend Deployment

#### Using Docker

```bash
# Build image
docker build -t unna-brain-api .

# Run container
docker run -p 8000:8000 \
  --env-file .env.local \
  unna-brain-api
```

#### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

#### Health Check

```bash
curl http://localhost:8000/api/v1/health
```

---

## Verification

### Quick Health Check

```bash
# Verify build environment
npm run verify

# Check frontend assets
ls -la frontend/
# Expected files:
# - index.html (main entry point)
# - _redirects (routing rules)
# - .assetsignore (upload rules)

# Verify backend
npm run backend-logs
# Should show FastAPI startup messages
```

### Detailed Verification Checklist

- [ ] Node.js version is 18.0.0 or higher
- [ ] npm version is 9.0.0 or higher
- [ ] wrangler CLI is installed and accessible
- [ ] Python 3.11+ is installed (if local setup)
- [ ] Docker and Docker Compose are running
- [ ] `.env.local` file exists and is configured
- [ ] Frontend assets directory exists
- [ ] `.assetsignore` file is in place
- [ ] Backend database is accessible
- [ ] API health endpoint responds

### Running Tests

```bash
# Backend unit tests with coverage
npm run backend-test

# Backend linting
npm run backend-lint

# Backend type checking
npm run backend-type
```

---

## Troubleshooting

### Common Issues

#### 1. wrangler not found

**Error:**
```
command not found: wrangler
```

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Or use npx
npx wrangler pages deploy frontend
```

#### 2. Cloudflare API token authentication fails

**Error:**
```
Error: Unable to authenticate
```

**Solution:**
```bash
# Verify credentials in .env.local
cat .env.local | grep CLOUDFLARE

# Re-authenticate
export CLOUDFLARE_ACCOUNT_ID=your-correct-account-id
export CLOUDFLARE_API_TOKEN=your-correct-api-token

# Try deployment again
npm run deploy
```

#### 3. Frontend assets upload error

**Error:**
```
✘ [ERROR] Uploading a Pages _worker.js file as an asset.
```

**Solution:**
This error is prevented by `.assetsignore`. If it still occurs:
```bash
# Verify .assetsignore exists
ls -la frontend/.assetsignore

# Check for forbidden files
find frontend -name "_worker.js" -o -name "*.env*"

# Remove if found
rm frontend/_worker.js

# Retry deployment
npm run deploy
```

#### 4. Docker containers won't start

**Error:**
```
ERROR: Couldn't connect to Docker daemon
```

**Solution:**
```bash
# Start Docker service (macOS/Linux)
sudo systemctl start docker

# Or on macOS with Docker Desktop:
open -a Docker

# Verify Docker is running
docker ps
```

#### 5. Database connection failed

**Error:**
```
FATAL: remaining connection slots are reserved for non-replication superuser connections
```

**Solution:**
```bash
# Restart database container
docker-compose restart db

# Or reset the database
docker-compose down
docker volume rm unna_brain_pg_data
docker-compose up -d
```

#### 6. Port already in use

**Error:**
```
ERROR: driver failed programming external connectivity on endpoint unna-brain-api bind: address already in use
```

**Solution:**
```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>

# Or use different port in docker-compose
```

---

## Local Development

### Development Server

```bash
# Start all services
npm run dev

# This runs:
# 1. Environment verification
# 2. Docker Compose setup (database + API)
# 3. API runs on http://localhost:8000
# 4. Frontend is at http://localhost:3000 (if using dev server)
```

### Backend Development

```bash
# SSH into backend container
docker-compose exec api bash

# Run FastAPI with auto-reload
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development

For static files, just open `frontend/index.html` in a browser or use:

```bash
# Simple HTTP server
python3 -m http.server --directory frontend 3000
```

Then visit: `http://localhost:3000`

### Database Management

```bash
# Connect to PostgreSQL
docker-compose exec db psql -U postgres -d unna_brain

# Run migrations
docker-compose exec api alembic upgrade head

# Create new migration
docker-compose exec api alembic revision --autogenerate -m "migration name"
```

---

## Environment Configuration

### Configuration File Hierarchy

1. `.env.local` - Local overrides (not in git)
2. `.env.production` - Production values (reviewed before deploy)
3. System environment variables (highest priority)

### Required Variables for Deployment

```bash
# Cloudflare Pages
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN

# Database (for backend)
DATABASE_URL

# Authentication
OIDC_ISSUER
OIDC_AUDIENCE
JWT_ALGORITHM
JWT_JWKS_URL

# API
API_PREFIX
CORS_ALLOWED_ORIGINS

# File uploads
UPLOAD_MAX_SIZE_MB
UPLOAD_ALLOWED_EXTENSIONS
```

### Optional Variables

```bash
# Cloudflare R2 Storage
R2_ENDPOINT_URL
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME

# Debug settings
APP_DEBUG
APP_LOG_LEVEL
```

---

## Next Steps

1. ✓ Complete the [Installation](#installation) section
2. ✓ Run [Verification](#verification) to ensure setup
3. ✓ Review [Deployment Workflow](#deployment-workflow)
4. ✓ Check [Local Development](#local-development) for development tips
5. ✓ Reference [Troubleshooting](#troubleshooting) if issues arise

## Support

For additional help:
- Check GitHub Issues: https://github.com/RemoRaj007/UNNA_BRAIN/issues
- Review [CI/CD Pipeline](.github/workflows/ci.yml)
- Check Docker Compose logs: `docker-compose logs -f`

---

**Last Updated:** 2026-02-28
**Maintainers:** UNNA Team
