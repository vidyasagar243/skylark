# Deployment Fixes for Skylark Drone Coordinator

## Common Deployment Issues and Solutions

### 1. Port Configuration
- The application uses `process.env.PORT` for deployment environments
- Make sure your deployment platform sets the PORT environment variable
- Default port is 3000 for local development

### 2. Static File Serving
- All frontend files are served from the `public/` directory
- Make sure your deployment platform serves static files correctly
- The server.js file handles static file serving for production

### 3. Environment Variables
Required environment variables for deployment:
```
PORT=3000
NODE_ENV=production
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_SHEET_ID=your_sheet_id
OPENAI_API_KEY=your_openai_key
```

### 4. Package Installation
Make sure all dependencies are installed:
```bash
npm install
```

### 5. Deployment Commands
For different platforms:

#### Heroku
1. Create a Procfile with: `web: node server.js`
2. Set environment variables in Heroku dashboard
3. Deploy with Git or Heroku CLI

#### Railway
1. Connect your GitHub repository
2. Set environment variables in Railway dashboard
3. Deploy automatically

#### Vercel
1. Select Node.js runtime
2. Set environment variables in Vercel dashboard
3. Deploy from connected GitHub repository

#### Render
1. Create a Web Service
2. Set environment variables in Render dashboard
3. Connect GitHub repository for automatic deployments

### 6. Common Errors and Fixes

#### Error: ENOENT: no such file or directory
- Make sure all files are uploaded to the deployment platform
- Check that the `public/` and `src/` directories exist

#### Error: Cannot find module
- Ensure all dependencies are listed in package.json
- Run `npm install` before deployment

#### Error: EACCES: permission denied
- Make sure the server.js file has execution permissions
- Check that the PORT is available and not blocked

#### Error: Connection refused
- Verify that the environment variables are correctly set
- Check that the Google Sheets API and OpenAI API are accessible from the deployment environment

### 7. Testing the Deployment
After deployment, test these endpoints:
- `GET /` - Main application page
- `GET /api/health` - Health check
- `GET /api/pilots` - Pilots API
- `GET /api/drones` - Drones API

### 8. Troubleshooting Tips
- Check deployment logs for specific error messages
- Verify that all required environment variables are set
- Ensure the server is listening on the correct port
- Test API endpoints individually to isolate issues
- Make sure the Google Sheets integration is properly configured
- Verify OpenAI API key is valid (if using AI features)

### 9. Production Optimizations
- Set NODE_ENV=production for optimized performance
- Enable gzip compression if supported by platform
- Use environment-specific configurations
- Monitor application logs for errors
- Implement proper error handling for production

### 10. Rollback Plan
If deployment fails:
1. Check the previous working version
2. Verify all environment variables are correctly set
3. Test locally with production-like settings
4. Gradually reintroduce changes to identify the issue