# Deploy UNNA Brain Frontend on Cloudflare Pages

This project can run on **Cloudflare Pages** for frontend hosting.
The Python FastAPI backend must be hosted separately.

## 1) Deploy backend first
Pages cannot run this FastAPI app directly.
Deploy backend to a service like Cloud Run / Fly / Render / VM and keep a public URL, e.g.:

- `https://api.your-domain.com`

## 2) Configure API proxy in Pages
Update `frontend/_redirects` so API requests are proxied to your backend:

```txt
/api/* https://api.your-domain.com/api/:splat 302
```

> Replace `api.example.com` with your real backend domain before deploying.

## 3) Deploy with Wrangler (CLI)
From repository root:

```bash
npm install
npm run deploy
# optional local validation without upload
CLOUDFLARE_DRY_RUN=1 npm run deploy
```

By default this deploys to project `unna-brain` and branch `production`.
You can override both:

```bash
CLOUDFLARE_PAGES_PROJECT=my-project CLOUDFLARE_PAGES_BRANCH=preview npm run deploy
# optional local validation without upload
CLOUDFLARE_DRY_RUN=1 npm run deploy
```

## 4) Deploy via Cloudflare Pages (Git integration)
Cloudflare Dashboard → Workers & Pages → Create Application → Pages → Connect to Git.

Use these settings:

- **Framework preset:** Vite
- **Root directory:** `frontend`
- **Build command:** `npm run build`
- **Build output directory:** `dist`

## 5) Required Cloudflare secrets (for GitHub Action deploy)
Set repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

The workflow `.github/workflows/deploy-frontend.yml` builds on PR/push and deploys only on `main` pushes.

## 6) Validate deployment
After deploy:

- Open your Pages URL and confirm app loads.
- Open `/api/v1/health` on the Pages domain and confirm proxy routing works.
- Open `/api/v1/docs` from your backend domain to confirm API is reachable.


## Troubleshooting

### Error: MIME type "text/jsx" for module script
This means Pages is serving the **source** app (`frontend/index.html` + `src/main.jsx`) instead of the Vite build output.

Fix in Cloudflare Pages project settings:
- Framework preset: `Vite`
- Root directory: `frontend`
- Build command: `npm run build`
- Build output directory: `dist`

Or deploy via CLI using `npm run deploy`, which always uploads `frontend/dist`.
