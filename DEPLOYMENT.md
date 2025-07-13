# Deployment Guide for yt-dlp Download Manager

This guide covers multiple deployment strategies to ensure yt-dlp works correctly in production environments.

## 🚀 Quick Start

Before deploying, run the setup script to prepare yt-dlp:

```bash
npm run setup:ytdlp
```

## 🐳 Docker Deployment (Recommended)

The Docker deployment is the most reliable method as it includes all necessary dependencies.

### Build and Run

```bash
# Build the Docker image
docker build -t ytdlp-downloader .

# Run the container
docker run -p 3000:3000 ytdlp-downloader
```

### Using Docker Compose

```bash
# Start all services
docker-compose up --build

# Run in background
docker-compose up -d --build
```

### Docker Features

- ✅ Pre-installed yt-dlp via pip
- ✅ Backup binary download
- ✅ FFmpeg support
- ✅ Health checks
- ✅ Non-root user security
- ✅ Volume persistence

## 🌐 Platform-Specific Deployments

### Vercel

1. **Configure Python runtime** (add to `vercel.json`):
```json
{
  "functions": {
    "src/app/api/**": {
      "runtime": "@vercel/node"
    }
  }
}
```

2. **Deploy**:
```bash
npm install -g vercel
vercel --prod
```

**Limitations**: Vercel serverless functions have execution time limits (10s hobby, 300s pro).

### Railway

1. **Add Python buildpack** in Railway dashboard
2. **Deploy**:
```bash
railway login
railway link
railway up
```

### Heroku

1. **Add buildpacks**:
```bash
heroku buildpacks:add heroku/nodejs
heroku buildpacks:add heroku/python
```

2. **Deploy**:
```bash
git push heroku main
```

### Netlify

1. **Configure build command** in `netlify.toml`:
```toml
[build]
command = "npm run build"
publish = ".next"

[build.environment]
PYTHON_VERSION = "3.8"
```

## 🔧 Manual Server Setup

### Ubuntu/Debian

```bash
# Install dependencies
sudo apt update
sudo apt install python3 python3-pip ffmpeg nodejs npm

# Install yt-dlp
pip3 install yt-dlp

# Clone and setup
git clone <your-repo>
cd <your-repo>
npm install
npm run build
npm start
```

### CentOS/RHEL

```bash
# Install dependencies
sudo yum install python3 python3-pip ffmpeg nodejs npm

# Install yt-dlp
pip3 install yt-dlp

# Setup application
npm install
npm run build
npm start
```

## 🔍 Troubleshooting

### Common Issues

1. **yt-dlp not found**
   - Run `npm run setup:ytdlp` during build
   - Check if Python is available: `python3 --version`
   - Verify yt-dlp installation: `python3 -m yt_dlp --version`

2. **Permission errors**
   - Ensure write permissions for `temp/` and `bin/` directories
   - Check if container runs as non-root user

3. **Timeout issues**
   - Increase serverless function timeout limits
   - Use background processing for long downloads

### Debug Commands

```bash
# Check yt-dlp status
curl http://localhost:3000/api/ytdlp

# Test download
curl -X POST http://localhost:3000/api/download/start \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "id": "test"}'

# Check logs
docker-compose logs -f app
```

## 📊 Detection Strategy

The application uses a multi-layered detection strategy:

1. **System yt-dlp** - Checks if yt-dlp is in PATH
2. **Python module** - Tries `python3 -m yt_dlp` and `python -m yt_dlp`
3. **Local binary** - Checks for downloaded binary in `bin/` directory
4. **Embedded binary** - Looks for pre-bundled binaries

## 🛠️ Build-Time Setup

The setup script (`scripts/setup-ytdlp.js`) automatically:

- Attempts pip installation
- Downloads platform-specific binaries
- Creates Docker configurations
- Generates deployment files

## 🚨 Production Considerations

### Security

- Run containers as non-root user
- Limit file system access
- Use environment variables for sensitive config
- Implement rate limiting

### Performance

- Use Redis for caching
- Implement download queuing
- Add CDN for static assets
- Monitor memory usage

### Monitoring

- Set up health checks
- Monitor download success rates
- Track yt-dlp version updates
- Log errors and performance metrics

## 📦 Environment Variables

```bash
NODE_ENV=production
YTDLP_CACHE_DIR=/app/cache
TEMP_DIR=/app/temp
PYTHON_VERSION=3.9
```

## 🔄 Updates

To update yt-dlp:

```bash
# Manual update
npm run setup:ytdlp

# Docker rebuild
docker-compose build --no-cache

# Python update
pip3 install --upgrade yt-dlp
```

## 📝 Support

If you encounter issues:

1. Check the application logs
2. Verify yt-dlp installation
3. Test with a simple URL
4. Check platform-specific limitations

For platform-specific issues, consult the respective documentation:
- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app/)
- [Heroku Docs](https://devcenter.heroku.com/)
- [Netlify Docs](https://docs.netlify.com/)