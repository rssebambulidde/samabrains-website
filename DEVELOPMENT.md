# Development Environment Setup

This guide explains how to set up a development environment to test changes before pushing to production.

## Development Workflow Options

### Option 1: Railway Preview Deployments (Recommended) 🚀

Railway automatically creates preview deployments for pull requests and branches.

#### Setup Steps:

1. **Create a Development Branch**
   ```bash
   git checkout -b development
   git push origin development
   ```

2. **Configure Railway for Multiple Environments**
   - Go to Railway Dashboard → Your Project
   - Click "New" → "Environment"
   - Create a new environment called "development"
   - Connect it to your `development` branch

3. **Workflow:**
   ```bash
   # Make changes on development branch
   git checkout development
   # ... make your changes ...
   git add .
   git commit -m "Your changes"
   git push origin development
   ```
   - Railway will automatically deploy to a preview URL
   - You'll get a unique URL like: `your-app-development.up.railway.app`
   - Test everything on the preview URL
   - When ready, merge to main for production

4. **Merge to Production:**
   ```bash
   git checkout main
   git merge development
   git push origin main
   ```

### Option 2: Local Development Server

Test changes locally before pushing.

#### Setup:

1. **Install Dependencies** (if not already installed)
   ```bash
   npm install
   ```

2. **Run Local Server**
   ```bash
   # Option A: Using the included server.js
   npm start
   # Server runs on http://localhost:3000

   # Option B: Using Python (simpler, no backend)
   python -m http.server 8000
   # Server runs on http://localhost:8000

   # Option C: Using Node.js http-server
   npx http-server -p 8000
   # Server runs on http://localhost:8000
   ```

3. **Access Your Site**
   - Open browser: `http://localhost:3000` or `http://localhost:8000`
   - Make changes to files
   - Refresh browser to see changes
   - No need to restart server for HTML/CSS changes

4. **For Backend Testing (Brevo API)**
   - Create `.env` file in project root:
     ```
     BREVO_API_KEY=your_api_key_here
     CONTACT_EMAIL=info@samabrains.com
     PORT=3000
     ```
   - Run: `npm start`
   - Test contact form at `http://localhost:3000`

### Option 3: Railway Branch Deployments

Deploy feature branches to separate Railway services.

#### Setup:

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Create New Railway Service**
   - Railway Dashboard → Your Project
   - Click "New" → "GitHub Repo"
   - Select your repository
   - Select the feature branch
   - Railway creates a separate deployment

3. **Get Preview URL**
   - Each branch gets its own URL
   - Example: `feature-new-feature-production.up.railway.app`
   - Test your changes there

4. **Merge When Ready**
   ```bash
   git checkout main
   git merge feature/new-feature
   git push origin main
   ```

## Recommended Workflow

### Daily Development:

```bash
# 1. Create/switch to development branch
git checkout development
# or create new: git checkout -b development

# 2. Make your changes
# Edit files in your editor

# 3. Test locally (optional)
npm start
# Visit http://localhost:3000

# 4. Commit changes
git add .
git commit -m "Description of changes"

# 5. Push to development branch
git push origin development

# 6. Railway auto-deploys to preview URL
# Check Railway dashboard for preview URL

# 7. Test on preview URL

# 8. When satisfied, merge to main
git checkout main
git merge development
git push origin main
```

## Environment Variables Setup

### Local Development (.env file):

Create `.env` in project root:
```
BREVO_API_KEY=your_development_api_key
CONTACT_EMAIL=info@samabrains.com
PORT=3000
```

**Important:** `.env` is in `.gitignore` - never commit it!

### Railway Development Environment:

1. Railway Dashboard → Your Project
2. Click on "development" environment
3. Go to "Variables" tab
4. Add:
   - `BREVO_API_KEY` = Your API key
   - `CONTACT_EMAIL` = Your email

### Railway Production Environment:

1. Railway Dashboard → Your Project
2. Click on "production" environment (or main)
3. Go to "Variables" tab
4. Add same variables

## Quick Commands Reference

```bash
# Start local development server
npm start

# Check current branch
git branch

# Create new branch
git checkout -b feature-name

# Switch branches
git checkout main
git checkout development

# See what changed
git status
git diff

# Commit changes
git add .
git commit -m "Your message"

# Push to branch
git push origin branch-name

# Merge development to main
git checkout main
git merge development
git push origin main
```

## Testing Checklist

Before merging to production:

- [ ] Test on local development server
- [ ] Test on Railway preview URL
- [ ] Check responsive design (mobile, tablet, desktop)
- [ ] Test contact form submission
- [ ] Verify dark mode toggle
- [ ] Check all navigation links
- [ ] Test back to top button
- [ ] Verify images load correctly
- [ ] Check browser console for errors
- [ ] Test on different browsers (Chrome, Firefox, Safari)

## Troubleshooting

### Local Server Won't Start

```bash
# Check if port is in use
# Windows:
netstat -ano | findstr :3000

# Kill process if needed, then:
npm start
```

### Changes Not Showing

1. Hard refresh browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear browser cache
3. Check if you're on the right branch
4. Verify files were saved

### Railway Preview Not Updating

1. Check Railway logs for errors
2. Verify branch is connected correctly
3. Check if deployment completed
4. Wait a few minutes for DNS propagation

## Best Practices

1. **Always test locally first** - Catch errors early
2. **Use development branch** - Keep main stable
3. **Test on preview URL** - See how it looks live
4. **Small, frequent commits** - Easier to track changes
5. **Clear commit messages** - Describe what changed
6. **Test before merging** - Don't break production

## URLs Reference

- **Local Development**: `http://localhost:3000`
- **Production**: Your main Railway URL
- **Preview/Development**: Railway preview URL (changes per branch)

---

**Ready to develop!** Use the development branch workflow for safe, tested deployments.
