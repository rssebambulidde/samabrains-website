# Deployment Guide (Dual-Environment)

This guide covers how to deploy the **Frontend** to Cloudflare Pages and the **Backend** to Railway, using a standard dual-environment strategy (Production and Development).

---

## Part 1: Deploying the Backend (Railway)

We will use Railway's "Environments" feature to run two identical but separate servers.

### 1. Initial Setup
1. Create an account at [railway.app](https://railway.app).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select your repository (`samabrains-website`).
4. Railway will analyze the repo and start a build. We need to pause and configure it first.

### 2. Configure the Root Directory
By default, Railway looks in the root of the repo. We need to tell it to look in `/backend`.
1. Click on your newly created service in the Railway dashboard.
2. Go to the **Settings** tab.
3. Under **Service -> Root Directory**, type in `/backend` and hit save.

### 3. Setup the Production Environment
1. In your service, go to the **Variables** tab.
2. Add your live environment variables:
   - `BREVO_API_KEY`: [Your Brevo Key]
   - `CONTACT_EMAIL`: `info@samabrains.com`
3. Go to the **Settings** tab -> **Networking**. Click **Generate Domain**. 
   > **Important:** Your frontend expects the production API to be `https://api-samabrains-prod.up.railway.app`. You should attempt to customize the domain name in Railway to match this, or update the `script.js` file if Railway assigns a different domain.

### 4. Setup the Development Environment
1. In the top left corner of the Railway project dashboard, you will see a dropdown that says "production". Click it and select **New Environment**.
2. Name it `development`.
3. In this new `development` environment, go to **Settings** -> **Service** and change the deployment trigger branch from `main` to `development`.
4. Go to **Variables** and add your testing API keys (or the same ones if you don't have separate test keys).
5. Go to **Settings** -> **Networking** and click **Generate Domain**.
   > **Important:** Your frontend expects the development API to be `https://api-samabrains-dev.up.railway.app`. Customize it to match this, or update `script.js`.

---

## Part 2: Deploying the Frontend (Cloudflare Pages)

Cloudflare explicitly handles static HTML sites for free, and creates "preview" links for non-main branches automatically.

### 1. Initial Setup
1. Create an account at [cloudflare.com](https://dash.cloudflare.com/) and go to **Pages and Workers** -> **Pages**.
2. Click **Connect to Git** and authorize your GitHub account.
3. Select the `samabrains-website` repository and click "Begin setup".

### 2. Configure the Build Settings
1. **Project name:** `samabrains-website`
2. **Production branch:** `main`
3. **Framework preset:** `None`
4. **Build command:** *(Leave empty)*
5. **Build output directory:** `/frontend`
6. Click **Save and Deploy**.

### 3. Setup the Custom Domain (Optional but Recommended)
1. Once deployed, Cloudflare will give you a URL like `https://samabrains-website.pages.dev`. 
2. Go to the **Custom Domains** tab in your Pages project.
3. Add `samabrains.com` and follow the instructions to update your DNS records.

### How Environments Work Automatically Now
- When you push code to the `main` branch, Cloudflare updates your live production site (`samabrains.com`). That site securely talks to your **Railway Production** backend.
- When you push code to the `development` branch, Cloudflare builds a "Preview Deployment" (e.g., `https://1a2b.samabrains-website.pages.dev`). Since that URL ends in `.pages.dev`, the frontend script automatically knows to talk to your **Railway Development** backend for testing!

---

## Troubleshooting

**The contact form fails with a CORS error?**
Check your `server.js` file in the backend. Ensure that the URL of your frontend (e.g., `samabrains.com` or your Cloudflare `.pages.dev` link) is included in the `allowedOrigins` array.

**Railway fails to build?**
Ensure your `Root Directory` in Railway settings is explicitly set to `/backend`.
