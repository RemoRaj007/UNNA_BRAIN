# Deploy UNNA Brain Frontend on Cloudflare Pages

This repository now supports **Cloudflare Pages for frontend hosting** and proxies API requests to the FastAPI backend.

## What Cloudflare Pages hosts
- Static frontend from `frontend/`.
- API calls are routed through `frontend/_redirects` using an external redirect.

## 1) Deploy backend first
Cloudflare Pages cannot run this Python FastAPI backend directly.
Deploy API separately (Cloud Run / Fly / Render / VM) and get a URL like:
- `https://api.your-domain.com`

The API in this repo serves routes under `/api/v1/*` from `app/main.py`.

## 2) Configure API proxy for Pages
Edit `frontend/_redirects`:

```txt
/api/* https://api.your-domain.com/api/:splat 302
```

## 3) Create Cloudflare Pages project
In Cloudflare Dashboard:
1. Workers & Pages → Create Application → Pages → Connect to Git.
2. Select this repository.
3. Use:
   - **Framework preset:** None
   - **Build command:** *(leave empty)*
   - **Build output directory:** `frontend`

## 4) Validate deployment
After deploy:
- Open site root (`/`) and ensure health widget checks `/api/v1/health`.
- Open `/api/v1/openapi.json` via Pages domain to verify redirect to backend works.

## 5) Optional custom domain
Attach your domain in Pages and keep Cloudflare proxy enabled.

## Important
- `frontend/_redirects` currently uses `https://api.example.com` placeholder and must be replaced.
- Keep CORS strict on backend for your Pages domain.


## Cloudflare constraint
Cloudflare rejects `_redirects` entries that use `200` proxy rewrites to absolute URLs.
Use `301`/`302` for absolute external API targets, or implement a Worker route for true proxy behavior.
