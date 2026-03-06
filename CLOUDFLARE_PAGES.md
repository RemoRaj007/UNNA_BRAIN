# Deploy UNNA Brain Frontend on Cloudflare Pages

This repository uses **Cloudflare Pages** to host the React frontend, with API requests proxied to the FastAPI backend.

## What Cloudflare Pages hosts
- Built React app from `frontend/dist/` (compiled by Vite).
- API calls are routed through `frontend/public/_redirects`.

## 1) Deploy backend first
Cloudflare Pages cannot run this Python FastAPI backend directly.
Deploy API separately (Cloud Run / Fly / Render / VM) and get a URL like:
- `https://api.your-domain.com`

The API in this repo serves routes under `/api/v1/*` from `app/main.py`.

## 2) Configure API proxy for Pages
Edit `frontend/public/_redirects` and uncomment/update the API proxy line:

```txt
/api/* https://api.your-domain.com/api/:splat 200
/* /index.html 200
```

## 3) Create Cloudflare Pages project
In Cloudflare Dashboard:
1. Workers & Pages → Create Application → Pages → Connect to Git.
2. Select this repository.
3. Use:
   - **Framework preset:** None
   - **Build command:** `cd frontend && npm install && npm run build`
   - **Build output directory:** `frontend/dist`

## 4) Alternative: Deploy via CLI
From the repo root:
```bash
npm run deploy
```
This runs `cd frontend && npm run build` then `wrangler pages deploy frontend/dist`.

## 5) Validate deployment
After deploy:
- Open site root (`/`) — you should see the React app (Login or Dashboard page).
- Without a backend, the app runs in **demo mode** with mock data.
- With a backend configured, verify `/api/v1/health` returns `{"status": "ok"}`.

## 6) Optional custom domain
Attach your domain in Pages and keep Cloudflare proxy enabled.

## Important
- Update `frontend/public/_redirects` with your actual backend URL before production deployment.
- Add your Cloudflare Pages domain to the backend CORS config (`CORS_ALLOWED_ORIGINS`).
- The frontend works in demo mode without a backend — all pages show mock data.
