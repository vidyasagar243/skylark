# Deployment Guide - Skylark Drone Coordinator

## 🚀 Deployment Options

### Option 1: Railway (Recommended)
1. Create a free account at [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Connect your repository
4. Add environment variables:
   ```
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_SHEET_ID=your_sheet_id
   OPENAI_API_KEY=your_openai_key
   PORT=3000
   NODE_ENV=production
   ```
5. Deploy and get your URL

### Option 2: Vercel + Backend
**Frontend (Vercel):**
1. Push `public/` folder to GitHub
2. Import to Vercel
3. Set environment variables

**Backend (Railway/Render):**
1. Push `src/` and `package.json` to GitHub
2. Deploy to Railway/Render
3. Configure API endpoint in frontend

### Option 3: Heroku
1. Install Heroku CLI
2. Create app: `heroku create your-app-name`
3. Set environment variables: `heroku config:set KEY=value`
4. Deploy: `git push heroku main`

## 📦 What's Included

```
deployment/
├── package.json          # Dependencies and scripts
├── README.md            # Main documentation
├── DECISION_LOG.md      # Technical decisions
├── src/                 # Backend source code
│   ├── index.js         # Main server file
│   ├── models/          # Data models
│   ├── services/        # Business logic
│   ├── routes/          # API endpoints
│   └── controllers/     # Request handlers
└── public/              # Frontend files
    ├── index.html       # Main page
    ├── styles.css       # Styling
    └── script.js        # Client-side logic
```

## 🔧 Environment Configuration

### Required Variables
```env
# Google Sheets (required for data persistence)
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_SHEET_ID=xxx

# OpenAI (required for AI features)
OPENAI_API_KEY=xxx

# Server Configuration
PORT=3000
NODE_ENV=production
```

### Optional Variables
```env
# For enhanced security
SESSION_SECRET=xxx
# For logging
LOG_LEVEL=info
```

## 🛠️ Local Testing Before Deployment

1. Test all endpoints:
   ```bash
   node test.js
   ```

2. Verify Google Sheets integration:
   - Ensure sheet is shared with service account
   - Test read/write operations

3. Check AI functionality:
   - Verify OpenAI API key works
   - Test chat responses

## 📊 Monitoring After Deployment

### Health Checks
- `/api/health` endpoint for uptime monitoring
- Dashboard statistics for operational metrics

### Logging
- Console logs for errors and important events
- Consider adding structured logging for production

### Performance
- Monitor response times
- Track API usage limits
- Watch memory consumption

## 🔒 Security Considerations

### Production Checklist
- [ ] Use HTTPS only
- [ ] Set up proper authentication
- [ ] Implement rate limiting
- [ ] Add input validation
- [ ] Secure environment variables
- [ ] Set up monitoring/alerts

### API Security
- [ ] Add authentication middleware
- [ ] Implement request validation
- [ ] Set up CORS properly
- [ ] Add request logging

## 🆘 Troubleshooting

### Common Issues

**Google Sheets Not Loading**
- Verify sheet ID is correct
- Check service account permissions
- Ensure proper column structure

**AI Responses Not Working**
- Verify OpenAI API key
- Check API usage limits
- Review prompt engineering

**Deployment Failures**
- Check build logs
- Verify environment variables
- Ensure all dependencies are listed

### Support
For deployment issues, check:
1. Platform-specific documentation
2. Error logs in deployment dashboard
3. Application logs for runtime errors

## 📈 Scaling Considerations

### When to Scale
- High concurrent users
- Frequent API calls
- Large dataset sizes

### Scaling Options
- Database migration (MongoDB/PostgreSQL)
- Load balancing
- Caching layer (Redis)
- Microservices architecture
- CDN for static assets

## 🎯 Success Metrics

Monitor these after deployment:
- API response times (< 500ms)
- Error rates (< 1%)
- User engagement
- Assignment completion rate
- Conflict detection accuracy

The application is designed to be production-ready with minimal configuration changes needed for deployment.