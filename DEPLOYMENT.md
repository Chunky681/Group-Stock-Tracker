# GitHub Pages Deployment Guide

This guide will help you deploy the Group Stock Tracker application to GitHub Pages.

## Prerequisites

1. A GitHub account
2. The repository name should be `Group-Stock-Tracker` (or update `vite.config.js` base path accordingly)

## Step 1: Push Your Code to GitHub

If you haven't already, initialize git and push your code:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/Group-Stock-Tracker.git
git push -u origin main
```

**Note:** Replace `YOUR_USERNAME` with your GitHub username.

## Step 2: Configure GitHub Secrets

Since your app uses environment variables, you need to add them as GitHub Secrets:

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add each of these:
   - `VITE_GOOGLE_SHEET_ID` - Your Google Sheet ID (required)
   - `VITE_GOOGLE_SHEETS_API_KEY` - Your Google Sheets API Key (required)

## Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select:
   - **Source**: `GitHub Actions`
4. Click **Save**

## Step 4: Trigger Deployment

The GitHub Actions workflow will automatically deploy when you:
- Push to the `main` branch
- Or manually trigger it via **Actions** → **Deploy to GitHub Pages** → **Run workflow**

## Step 5: Access Your Deployed App

Once deployed, your app will be available at:
```
https://YOUR_USERNAME.github.io/Group-Stock-Tracker/
```

## Important Notes

1. **Repository Name**: The `vite.config.js` is configured for a repository named `Group-Stock-Tracker`. If your repository has a different name, update the `base` path in `vite.config.js`.

2. **Environment Variables**: Make sure all required environment variables are set as GitHub Secrets. The build will fail if any are missing.

3. **First Deployment**: The first deployment may take a few minutes. You can monitor progress in the **Actions** tab.

4. **CORS**: Once deployed to GitHub Pages, the CORS issue with your Google Apps Script web app should be resolved since it's now on a real domain (github.io) instead of localhost.

## Troubleshooting

- **Build fails**: Check the Actions tab for error messages. Common issues:
  - Missing environment variables (add them as secrets)
  - Build errors in your code
  
- **404 errors**: Make sure the `base` path in `vite.config.js` matches your repository name

- **CORS still failing**: Ensure your Google Apps Script web app is deployed with "Anyone" access

## Manual Deployment (Alternative)

If you prefer to deploy manually:

```bash
npm run build
# Then push the dist folder to the gh-pages branch
```

However, using GitHub Actions (as configured) is recommended as it's automated and handles everything for you.

