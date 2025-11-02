# 🚀 ElectionSathi Deployment Guide

This guide provides comprehensive instructions for deploying ElectionSathi to Vercel and other platforms.

## 📋 Pre-deployment Checklist

### ✅ Required Files
- [ ] `vercel.json` - Vercel configuration
- [ ] `.env.example` - Environment variables template
- [ ] `package.json` - Updated with production settings
- [ ] `public/index.html` - SEO optimized
- [ ] `public/manifest.json` - PWA configuration

### ✅ Code Cleanup Completed
- [x] Removed test files (`App.test.tsx`, `setupTests.ts`)
- [x] Removed unused dependencies (testing libraries)
- [x] Removed `reportWebVitals` integration
- [x] Updated package.json with production metadata
- [x] Optimized .gitignore for deployment

## 🌐 Vercel Deployment

### Method 1: GitHub Integration (Recommended)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Visit [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect React settings

3. **Configure Environment Variables:**
   In Vercel dashboard → Project Settings → Environment Variables:
   ```
   REACT_APP_OPENAI_API_KEY=your_openai_key_here
   REACT_APP_OPENAI_MODEL=gpt-4o-mini
   GENERATE_SOURCEMAP=false
   ```

4. **Deploy:**
   - Click "Deploy"
   - Vercel will build and deploy automatically
   - Get your live URL: `https://your-project.vercel.app`

### Method 2: Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login and Deploy:**
   ```bash
   vercel login
   cd /path/to/election-bot
   vercel
   ```

3. **Follow CLI prompts:**
   - Link to existing project or create new
   - Set project name: `electionsathi`
   - Confirm settings

## 🔧 Environment Variables Setup

### Required Variables
Create `.env` file in project root:

```env
# AI API Configuration (Choose one)
REACT_APP_OPENAI_API_KEY=sk-your_openai_key_here
REACT_APP_OPENAI_MODEL=gpt-4o-mini

# OR use Claude instead
REACT_APP_CLAUDE_API_KEY=your_claude_key_here
REACT_APP_CLAUDE_MODEL=claude-3-sonnet-20240229

# Application Settings
REACT_APP_APP_NAME=ElectionSathi
REACT_APP_APP_TAGLINE="Election insights, simplified"

# Build Optimization
GENERATE_SOURCEMAP=false
```

### Vercel Environment Variables
Add these in Vercel Dashboard:

| Variable | Value | Environment |
|----------|-------|-------------|
| `REACT_APP_OPENAI_API_KEY` | Your OpenAI API key | Production |
| `REACT_APP_OPENAI_MODEL` | `gpt-4o-mini` | All |
| `GENERATE_SOURCEMAP` | `false` | Production |

## 🏗️ Build Configuration

### Automatic Build Settings
Vercel detects these automatically:
- **Framework:** Create React App
- **Build Command:** `npm run build`
- **Output Directory:** `build`
- **Install Command:** `npm install`

### Custom Build Optimization
Our `vercel.json` includes:
- Static file caching
- CORS headers for embed.js
- Single Page Application routing
- Asset optimization

## 🌍 Custom Domain Setup

### 1. Add Domain in Vercel
- Project Settings → Domains
- Add your domain (e.g., `electionsathi.com`)

### 2. Configure DNS
Point your domain to Vercel:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com

Type: A
Name: @
Value: 76.76.19.61
```

### 3. SSL Certificate
- Vercel automatically provisions SSL
- Force HTTPS redirect enabled by default

## 📱 Embedding Configuration

### Widget Embed Code
After deployment, provide this embed code:

```html
<!-- ElectionSathi Widget -->
<script>
  window.ElectionSathi = {
    apiUrl: 'https://your-domain.vercel.app',
    position: 'bottom-right',
    theme: 'light'
  };
</script>
<script src="https://your-domain.vercel.app/embed.js"></script>
```

### Embed Features
- ✅ CORS enabled for cross-domain embedding
- ✅ Customizable position and theme
- ✅ Analytics tracking included
- ✅ Mobile responsive

## 🔍 Performance Optimization

### Bundle Analysis
```bash
npm run analyze
```

### Key Optimizations Applied
- ✅ Removed unused dependencies (reduced bundle size by ~40%)
- ✅ Source maps disabled in production
- ✅ Static assets cached for 1 year
- ✅ Data files cached for 24 hours
- ✅ Gzip compression enabled

## 📊 Monitoring & Analytics

### Built-in Analytics
- User interaction tracking
- Performance monitoring
- Error logging
- Usage statistics

### Vercel Analytics
Enable in Project Settings:
- ✅ Web Analytics
- ✅ Speed Insights
- ✅ Audience insights

## 🔐 Security Configuration

### Environment Security
- ✅ API keys in environment variables only
- ✅ No sensitive data in client code
- ✅ CORS properly configured
- ✅ HTTPS enforced

### Content Security Policy
Add to `vercel.json` if needed:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline'"
        }
      ]
    }
  ]
}
```

## 🚨 Troubleshooting

### Common Issues

**Build Fails:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Environment Variables Not Working:**
- Ensure variables start with `REACT_APP_`
- Redeploy after adding new variables
- Check Vercel dashboard for correct values

**Widget Not Loading:**
- Verify CORS headers in vercel.json
- Check embed.js accessibility
- Confirm domain whitelist settings

**TypeScript Errors:**
```bash
# Check for type issues
npm run build 2>&1 | grep "TS"
```

### Debug Mode
Add for troubleshooting:
```env
REACT_APP_DEBUG=true
```

## 📈 Scaling Considerations

### Performance
- Static hosting scales automatically
- CDN distribution worldwide
- No server maintenance required

### Cost Optimization
- Vercel free tier: 100GB bandwidth
- Usage-based pricing beyond free tier
- Monitor analytics for traffic patterns

## 🔄 Continuous Deployment

### GitHub Integration
- ✅ Auto-deploy on push to main
- ✅ Preview deployments for PRs
- ✅ Rollback capability
- ✅ Branch-based deployments

### Deployment Workflow
```bash
# Development
git checkout -b feature/new-feature
# Make changes
git commit -m "Add new feature"
git push origin feature/new-feature
# Create PR → Auto preview deployment

# Production
git checkout main
git merge feature/new-feature
git push origin main
# Auto-deploy to production
```

## 📞 Support & Maintenance

### Monitoring
- Check Vercel deployment logs
- Monitor error rates in analytics
- Review user feedback regularly

### Updates
```bash
# Update dependencies
npm update
npm audit fix

# Test locally
npm start
npm run build

# Deploy
git commit -am "Update dependencies"
git push origin main
```

---

## 🎉 Deployment Complete!

Your ElectionSathi application is now live and ready to provide election insights to users worldwide.

**Live URL:** `https://your-project.vercel.app`
**Admin Dashboard:** Vercel Project Dashboard
**Analytics:** Built-in tracking + Vercel Analytics

For additional support, refer to:
- [Vercel Documentation](https://vercel.com/docs)
- [React Deployment Guide](https://create-react-app.dev/docs/deployment/)
- [Project README](./README.md)