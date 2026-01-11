# Quick Start - Development Workflow

## 🚀 Fast Setup (3 Steps)

### Step 1: Create Development Branch
```bash
git checkout -b development
git push origin development
```

### Step 2: Setup Railway Preview (One-time)
1. Railway Dashboard → Your Project
2. Click "New" → "Environment" → Name it "development"
3. Connect to `development` branch
4. Add environment variables (same as production)

### Step 3: Start Developing
```bash
# Make changes, then:
git add .
git commit -m "Your changes"
git push origin development
```

**Railway automatically creates preview URL!** Check Railway dashboard for the URL.

## 📝 Daily Workflow

```bash
# 1. Work on development branch
git checkout development

# 2. Make your changes
# (edit files)

# 3. Test locally (optional)
npm start
# Visit http://localhost:3000

# 4. Commit and push
git add .
git commit -m "Description"
git push origin development

# 5. Test on Railway preview URL
# (Check Railway dashboard)

# 6. When ready, merge to production
git checkout main
git merge development
git push origin main
```

## 🔗 URLs

- **Local**: `http://localhost:3000` (run `npm start`)
- **Preview**: Railway preview URL (auto-generated per branch)
- **Production**: Your main Railway URL

## ⚙️ Local Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file:**
   ```
   BREVO_API_KEY=your_key_here
   CONTACT_EMAIL=info@samabrains.com
   PORT=3000
   ```

3. **Start server:**
   ```bash
   npm start
   ```

4. **Open browser:**
   ```
   http://localhost:3000
   ```

That's it! See `DEVELOPMENT.md` for detailed instructions.
