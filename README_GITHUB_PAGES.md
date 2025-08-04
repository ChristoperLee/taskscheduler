# Deploying TaskScheduler to GitHub Pages

This is a quick guide to deploy TaskScheduler using GitHub's free services.

## Prerequisites

- GitHub account
- Git installed locally
- Node.js installed

## Quick Start

### 1. Fork or Clone Repository

```bash
git clone https://github.com/yourusername/taskscheduler.git
cd taskscheduler
```

### 2. Deploy Backend (Choose One)

#### Option A: Railway (Recommended - Free $5 credit)
1. Go to [Railway.app](https://railway.app)
2. Click "Deploy from GitHub repo"
3. Add PostgreSQL database
4. Set environment variables:
   ```
   NODE_ENV=production
   JWT_SECRET=your-secret-here
   CORS_ORIGIN=https://yourusername.github.io
   ```

#### Option B: Render (Free tier with auto-sleep)
1. Go to [Render.com](https://render.com)
2. Create new Web Service from GitHub
3. Add PostgreSQL database
4. Configure same environment variables

### 3. Deploy Frontend

#### Automated Deployment (via GitHub Actions)

1. Update `client/package.json`:
   ```json
   "homepage": "https://yourusername.github.io/taskscheduler"
   ```

2. Add GitHub Secret:
   - Go to Settings → Secrets → Actions
   - Add: `REACT_APP_API_URL` = your backend URL

3. Push to main branch:
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

4. Enable GitHub Pages:
   - Settings → Pages → Source: GitHub Actions

#### Manual Deployment

```bash
# Run the deployment script
./scripts/deploy-github.sh

# Or manually:
cd client
npm install --legacy-peer-deps
npm run deploy
```

## URLs

After deployment:
- **Frontend**: `https://yourusername.github.io/taskscheduler`
- **Backend**: Your chosen service URL
- **API**: `https://your-backend.com/api`

## Environment Variables

### Backend (.env)
```env
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
CORS_ORIGIN=https://yourusername.github.io
```

### Frontend (.env.production)
```env
REACT_APP_API_URL=https://your-backend-url.com
```

## Updating Your Deployment

### Frontend Updates
```bash
cd client
npm run deploy
```

### Backend Updates
- Railway/Render: Auto-deploys on push
- Or manually trigger deployment in dashboard

## Troubleshooting

### Page not found (404)
- Wait 5-10 minutes for GitHub Pages to update
- Check Settings → Pages for deployment status

### CORS errors
- Ensure backend CORS_ORIGIN matches your GitHub Pages URL
- Include https:// protocol
- No trailing slash

### API not connecting
- Check browser console for errors
- Verify REACT_APP_API_URL is correct
- Ensure backend is running

## Free Tier Limits

| Service | Limits |
|---------|--------|
| GitHub Pages | 100GB bandwidth/month, 1GB storage |
| Railway | $5 credit/month |
| Render | 750 hours/month, auto-sleeps |

## Total Cost: $0-5/month

Perfect for personal projects and demos!