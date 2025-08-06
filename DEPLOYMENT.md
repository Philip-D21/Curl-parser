# Deployment Guide - Render

This guide will help you deploy the reqline parser to Render.

## Prerequisites

1. **GitHub Repository**: Your code should be in a GitHub repository
2. **Render Account**: Sign up at [render.com](https://render.com)

## Deployment Steps

### 1. Push to GitHub

First, make sure your code is pushed to GitHub:

```bash
git add .
git commit -m "Add reqline parser implementation"
git push origin main
```

### 2. Deploy on Render

1. **Go to Render Dashboard**
   - Visit [dashboard.render.com](https://dashboard.render.com)
   - Click "New +" → "Web Service"

2. **Connect Repository**
   - Connect your GitHub account
   - Select your repository
   - Choose the branch (usually `main`)

3. **Configure Service**
   - **Name**: `reqline-parser` (or any name you prefer)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start` (or leave empty to use Procfile)
   - **Plan**: Free (or choose paid plan)

4. **Environment Variables**
   - **PORT**: Render will set this automatically
   - **MONGO_URI**: (Optional) If you need MongoDB, add your connection string

5. **Advanced Settings**
   - **Auto-Deploy**: Enable (recommended)
   - **Health Check Path**: `/` (optional)

### 3. Deploy

Click "Create Web Service" and wait for deployment to complete.

## Configuration Files

### package.json
```json
{
  "scripts": {
    "start": "node app.js"
  }
}
```

### Procfile
```
web: node app.js
```

## Testing Your Deployment

Once deployed, test your endpoint:

```bash
curl -X POST https://your-app-name.onrender.com/ \
  -H "Content-Type: application/json" \
  -d '{"reqline":"HTTP GET | URL https://dummyjson.com/quotes/3 | QUERY {\"refid\": 1920933}"}'
```

Or using PowerShell:
```powershell
Invoke-WebRequest -Uri "https://your-app-name.onrender.com/" -Method POST -ContentType "application/json" -Body '{"reqline":"HTTP GET | URL https://dummyjson.com/quotes/3 | QUERY {\"refid\": 1920933}"}'
```

## Troubleshooting

### Common Issues

1. **Build Fails**
   - Check that all dependencies are in `package.json`
   - Ensure `app.js` exists and is the main entry point

2. **App Won't Start**
   - Check logs in Render dashboard
   - Ensure PORT environment variable is being used correctly

3. **CORS Issues**
   - The app has CORS enabled, but you might need to configure allowed origins

### Logs

- View logs in Render dashboard under your service
- Check "Logs" tab for build and runtime errors

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Port number | Auto-set by Render |
| `MONGO_URI` | MongoDB connection string | No (if not using DB) |

## Health Check

Your app will be available at:
- **URL**: `https://your-app-name.onrender.com/`
- **Health Check**: `https://your-app-name.onrender.com/` (POST with valid reqline)

## Cost

- **Free Tier**: 750 hours/month
- **Paid Plans**: Starting from $7/month for unlimited usage

## Support

- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com) 