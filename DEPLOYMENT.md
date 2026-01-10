# Deploy to Railway

This guide will help you deploy your SamaBrains Solutions website to Railway.

## Prerequisites

1. **Railway Account**: Create an account at [railway.app](https://railway.app)
2. **GitHub Account**: Your project should be on GitHub
3. **Railway CLI** (optional): Install Railway CLI for advanced usage

## Deployment Steps

### Method 1: Using Railway Dashboard (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - SamaBrains website"
   git branch -M main
   git remote add origin https://github.com/yourusername/samabrains-website.git
   git push -u origin main
   ```

2. **Deploy on Railway**
   - Go to [railway.app](https://railway.app) and login
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will automatically detect the static site
   - Click "Deploy"

3. **Configure Settings**
   - Set environment variables if needed
   - Configure custom domain (optional)
   - Set up automatic deployments

### Method 2: Using Railway CLI

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Deploy**
   ```bash
   railway login
   railway init
   railway up
   ```

## Configuration Files

Your project includes:

- `railway.json`: Railway configuration
- `Procfile`: Process definition for Railway
- `.gitignore`: Git ignore file

## Environment Variables

No environment variables are required for this static site.

## Custom Domain

To use a custom domain:

1. Go to your Railway project settings
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Update your DNS records as instructed

## Deployment URLs

After deployment, your site will be available at:
- Railway URL: `https://your-app-name.up.railway.app`
- Custom domain: `https://yourdomain.com` (if configured)

## Troubleshooting

### Common Issues

1. **Build Fails**
   - Check that all files are committed to Git
   - Verify `railway.json` configuration

2. **404 Errors**
   - Ensure `index.html` is in the root directory
   - Check the `startCommand` in `railway.json`

3. **Styling Issues**
   - Verify TailwindCSS CDN is accessible
   - Check console for CSS loading errors

### Logs

View deployment logs:
```bash
railway logs
```

Or check the Railway dashboard under your project's "Logs" tab.

## Automatic Deployments

Railway automatically redeploys when you:
- Push to the main branch
- Merge a pull request to main
- Manually trigger a deployment

## Performance Optimization

Your site is optimized with:
- Lazy loading for images
- Throttled scroll events
- Minimal JavaScript footprint
- CSS animations using GPU acceleration

## Support

- Railway Documentation: [docs.railway.app](https://docs.railway.app)
- GitHub Issues: Report issues in your repository

---

**Ready to deploy!** 🚀 Your SamaBrains Solutions website is configured and ready for Railway deployment.
