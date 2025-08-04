# GitHub Deployment Guide

This guide covers deploying TaskScheduler using GitHub's free services:
- **Frontend**: GitHub Pages (free static hosting)
- **Backend**: Various free options (Railway, Render, or Heroku)
- **Database**: Free PostgreSQL options

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  GitHub Pages   │────▶│   Backend API   │────▶│   PostgreSQL    │
│   (Frontend)    │     │ (Railway/Render)│     │   (Supabase)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Step 1: Fork or Create Repository

1. Fork this repository or push your code to GitHub
2. Make sure your repository is public (required for free GitHub Pages)

## Step 2: Deploy Backend

### Option A: Deploy to Railway (Recommended)

1. Go to [Railway](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect the backend
5. Add PostgreSQL service:
   ```
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will automatically connect it
   ```
6. Set environment variables:
   ```
   NODE_ENV=production
   JWT_SECRET=<generate-secure-secret>
   CORS_ORIGIN=https://<your-github-username>.github.io
   ```
7. Copy your backend URL (e.g., `https://taskscheduler-api.up.railway.app`)

### Option B: Deploy to Render

1. Go to [Render](https://render.com)
2. Create new "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: taskscheduler-api
   - **Root Directory**: server
   - **Build Command**: `npm install`
   - **Start Command**: `node src/index.js`
5. Add environment variables (same as Railway)
6. Create PostgreSQL database in Render
7. Copy your backend URL

### Option C: Deploy to Heroku

1. Install Heroku CLI
2. Create and deploy:
   ```bash
   heroku create taskscheduler-api
   heroku addons:create heroku-postgresql:mini
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=<your-secret>
   heroku config:set CORS_ORIGIN=https://<username>.github.io
   git push heroku main
   ```

## Step 3: Configure Frontend

1. Update `client/package.json`:
   ```json
   "homepage": "https://<your-github-username>.github.io/taskscheduler"
   ```

2. Create/update `client/.env.production`:
   ```
   REACT_APP_API_URL=<your-backend-url>/api
   ```

3. Update backend URL in GitHub Secrets:
   - Go to Settings → Secrets and variables → Actions
   - Add secret: `REACT_APP_API_URL` = your backend URL

## Step 4: Enable GitHub Pages

1. Go to your repository Settings
2. Navigate to "Pages" section
3. Under "Build and deployment":
   - Source: GitHub Actions
4. The workflow will automatically deploy on push to main

## Step 5: Deploy

### Automatic Deployment (Recommended)

Simply push to main branch:
```bash
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main
```

The GitHub Action will automatically:
- Build the frontend
- Deploy to GitHub Pages
- Your site will be available at: `https://<username>.github.io/taskscheduler`

### Manual Deployment

```bash
cd client
npm run deploy
```

## Step 6: Custom Domain (Optional)

1. Add `CNAME` file to `client/public/`:
   ```
   yourdomain.com
   ```

2. Configure DNS:
   - Add CNAME record pointing to `<username>.github.io`
   - Or use A records:
     ```
     185.199.108.153
     185.199.109.153
     185.199.110.153
     185.199.111.153
     ```

3. Update GitHub Pages settings with custom domain

## Environment Variables

### Backend (.env)
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=<from-your-provider>
JWT_SECRET=<generate-secure-secret>
CORS_ORIGIN=https://<username>.github.io
```

### Frontend (.env.production)
```bash
REACT_APP_API_URL=https://your-backend-url.com/api
```

## Free Tier Limits

### GitHub Pages
- **Bandwidth**: 100GB/month
- **Storage**: 1GB
- **Builds**: 10 builds/hour

### Railway
- **Free**: $5 credit/month
- **Database**: 1GB PostgreSQL
- **Compute**: ~500 hours

### Render
- **Free**: 750 hours/month
- **Database**: 1GB PostgreSQL
- **Auto-sleep**: After 15 min inactivity

### Heroku
- **Free**: No longer available
- **Basic**: $7/month

## Troubleshooting

### CORS Errors
- Ensure `CORS_ORIGIN` in backend matches your GitHub Pages URL
- Include protocol (https://)
- No trailing slash

### 404 Errors on Refresh
- The workflow creates `404.html` automatically
- For manual deployment, copy `index.html` to `404.html`

### API Connection Issues
- Check if backend is running
- Verify `REACT_APP_API_URL` is correct
- Check browser console for errors

### Build Failures
- Check GitHub Actions logs
- Ensure all dependencies are in package.json
- Verify Node version compatibility

## Monitoring

### Frontend (GitHub Pages)
- Check deployment status in Actions tab
- View site analytics in repository Insights

### Backend Monitoring
- **Railway**: Built-in metrics dashboard
- **Render**: Basic metrics in dashboard
- **Uptime monitoring**: Use [UptimeRobot](https://uptimerobot.com) (free)

## Backup Strategy

### Database Backups
1. **Automated** (add to backend):
   ```javascript
   // Add to your backend
   const backupDatabase = require('./utils/backup');
   
   // Daily backup cron job
   schedule.scheduleJob('0 2 * * *', backupDatabase);
   ```

2. **Manual backups**:
   ```bash
   pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
   ```

## Cost Summary

| Service | Free Tier | Paid |
|---------|-----------|------|
| GitHub Pages | ✓ Unlimited | - |
| Railway | $5 credit/mo | $5/mo |
| Render | 750 hrs/mo | $7/mo |
| Supabase | 500MB DB | $25/mo |
| **Total** | **$0-5/mo** | **$12-37/mo** |

## Next Steps

1. Set up monitoring with UptimeRobot
2. Configure custom domain (optional)
3. Set up automated backups
4. Add analytics (Google Analytics, etc.)
5. Implement CDN for better performance

## Support

- Check Actions tab for deployment logs
- Use Issues tab for bug reports
- Backend logs available in your hosting provider's dashboard