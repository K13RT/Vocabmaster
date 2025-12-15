# Vercel Deployment Guide (Fix 404 Errors)

If you are seeing **404: NOT_FOUND**, it means Vercel is not serving your `index.html` correctly. Follow these exact settings.

## Option 1: Deploying the `client` folder (Recommended)

1.  Go to your Vercel Project Settings.
2.  **General** -> **Root Directory**:
    *   Click "Edit" and select `client`.
3.  **Build & Development Settings**:
    *   **Framework Preset**: Select `Vite`.
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `dist` (NOT `public` or `build`)
    *   **Install Command**: `npm install`
4.  **Environment Variables**:
    *   Add `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
5.  **Redeploy**: Go to Deployments and click "Redeploy".

## Option 2: Deploying the Root (Monorepo style)

If you didn't set the Root Directory to `client`, Vercel assumes the root.

1.  **Build Command**: `cd client && npm install && npm run build`
2.  **Output Directory**: `client/dist`
3.  **Framework Preset**: `Other` or `Vite` (might need manual override).

**Why the 404?**
Vercel looks for `index.html`. If your build puts it in `dist` but Vercel looks in `public`, it fails. Also, for Single Page Apps (SPA), you need a rewrite rule (which I added in `vercel.json`) to redirect all traffic to `index.html`.

**I have added `vercel.json` in both `client/` and root to be safe.**
