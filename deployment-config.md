# System yt-dlp Deployment Configuration Guide

This guide provides comprehensive instructions for configuring and deploying the ODM application to use system-installed yt-dlp.

## Quick Start

### 1. Environment Variables (Recommended)

Set these environment variables to use system yt-dlp:

```bash
# Primary engine preference
export YTDLP_PRIMARY_ENGINE=system

# System path (optional, will auto-detect if not set)
export YTDLP_SYSTEM_PATH=/usr/local/bin/yt-dlp

# Legacy environment variable (also supported)
export YTDLP_PATH=/usr/local/bin/yt-dlp

# Enable fallback to bundled version if system fails
export YTDLP_ENABLE_FALLBACK=true

# Performance settings
export YTDLP_MAX_CONCURRENT=3
export YTDLP_TIMEOUT=30000
export YTDLP_MAX_BUFFER=10485760

# Logging
export YTDLP_LOG_LEVEL=info
```

### 2. System Installation

#### Linux (Ubuntu/Debian)
```bash
# Install yt-dlp system-wide
sudo apt update
sudo apt install yt-dlp

# Verify installation
yt-dlp --version

# Set environment variable
echo 'export YTDLP_PRIMARY_ENGINE=system' >> ~/.bashrc
source ~/.bashrc
```

#### macOS
```bash
# Install via Homebrew
brew install yt-dlp

# Verify installation
yt-dlp --version

# Set environment variable
echo 'export YTDLP_PRIMARY_ENGINE=system' >> ~/.zshrc
source ~/.zshrc
```

#### Windows
```bash
# Install via winget
winget install yt-dlp

# Or via pip
pip install yt-dlp

# Verify installation
yt-dlp --version

# Set environment variable (PowerShell)
$env:YTDLP_PRIMARY_ENGINE="system"
```

## Deployment Methods

### Method 1: Docker with System yt-dlp

#### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install system dependencies including yt-dlp
RUN apk add --no-cache python3 py3-pip ffmpeg curl

# Install yt-dlp system-wide
RUN pip3 install yt-dlp

# Verify installation
RUN yt-dlp --version

# Set environment variables
ENV YTDLP_PRIMARY_ENGINE=system
ENV YTDLP_ENABLE_FALLBACK=true
ENV YTDLP_MAX_CONCURRENT=3
ENV YTDLP_TIMEOUT=30000

# Copy application
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S odm -u 1001
USER odm

EXPOSE 3000 3001

CMD ["npm", "start"]
```

#### Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
      - "3001:3001"
    environment:
      # System yt-dlp configuration
      - YTDLP_PRIMARY_ENGINE=system
      - YTDLP_ENABLE_FALLBACK=true
      - YTDLP_MAX_CONCURRENT=3
      - YTDLP_TIMEOUT=30000
      - YTDLP_LOG_LEVEL=info

      # WebSocket configuration
      - WEBSOCKET_PORT=3001
      - ENABLE_WEBSOCKET=true

      # Application settings
      - NODE_ENV=production
      - PORT=3000
    volumes:
      - ./downloads:/app/downloads
      - ./logs:/app/logs
    restart: unless-stopped
```

### Method 2: Production Server Deployment

#### Systemd Service
```bash
# Create service file
sudo tee /etc/systemd/system/odm.service > /dev/null << EOF
[Unit]
Description=ODM Download Manager
After=network.target

[Service]
Type=simple
User=odm
WorkingDirectory=/opt/odm
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10

# System yt-dlp configuration
Environment=YTDLP_PRIMARY_ENGINE=system
Environment=YTDLP_ENABLE_FALLBACK=true
Environment=YTDLP_MAX_CONCURRENT=3
Environment=YTDLP_TIMEOUT=30000
Environment=YTDLP_LOG_LEVEL=info

# WebSocket configuration
Environment=WEBSOCKET_PORT=3001
Environment=ENABLE_WEBSOCKET=true

# Application settings
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl enable odm
sudo systemctl start odm

# Check status
sudo systemctl status odm
```

#### PM2 Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'odm-app',
      script: './server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        // System yt-dlp configuration
        YTDLP_PRIMARY_ENGINE: 'system',
        YTDLP_ENABLE_FALLBACK: 'true',
        YTDLP_MAX_CONCURRENT: 3,
        YTDLP_TIMEOUT: 30000,
        YTDLP_LOG_LEVEL: 'info',

        // WebSocket configuration
        WEBSOCKET_PORT: 3001,
        ENABLE_WEBSOCKET: 'true',

        // Application settings
        NODE_ENV: 'production',
        PORT: 3000
      },
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      merge_logs: true,
      time: true
    }
  ]
};
```

### Method 3: Cloud Deployment

#### Heroku
```bash
# Create Procfile
echo "web: npm start" > Procfile

# Set environment variables
heroku config:set YTDLP_PRIMARY_ENGINE=system
heroku config:set YTDLP_ENABLE_FALLBACK=true
heroku config:set YTDLP_MAX_CONCURRENT=3
heroku config:set YTDLP_TIMEOUT=30000
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

#### Railway
```bash
# Set environment variables in Railway dashboard
YTDLP_PRIMARY_ENGINE=system
YTDLP_ENABLE_FALLBACK=true
YTDLP_MAX_CONCURRENT=3
YTDLP_TIMEOUT=30000
NODE_ENV=production
```

## Configuration Options

### Engine Priority
```bash
# Use system installation first
export YTDLP_PRIMARY_ENGINE=system

# Use environment variable first
export YTDLP_PRIMARY_ENGINE=environment

# Use bundled version first
export YTDLP_PRIMARY_ENGINE=bundled
```

### Fallback Configuration
```bash
# Enable automatic fallback
export YTDLP_ENABLE_FALLBACK=true

# Custom fallback order
export YTDLP_FALLBACK_ORDER=system,environment,bundled
```

### Performance Tuning
```bash
# Concurrent downloads
export YTDLP_MAX_CONCURRENT=5

# Command timeout (milliseconds)
export YTDLP_TIMEOUT=60000

# Buffer size (bytes)
export YTDLP_MAX_BUFFER=20971520  # 20MB
```

### Security Settings
```bash
# Validate executables
export YTDLP_VALIDATE_EXECUTABLE=true

# Allowed paths (comma-separated)
export YTDLP_ALLOWED_PATHS=/usr/local/bin,/usr/bin,/opt/homebrew/bin
```

### Logging Configuration
```bash
# Log level
export YTDLP_LOG_LEVEL=debug  # debug, info, warn, error

# Enable/disable logging
export YTDLP_ENABLE_LOGGING=true
```

## Testing Configuration

### 1. Check System yt-dlp
```bash
# Test system installation
yt-dlp --version

# Test with specific path
/path/to/yt-dlp --version
```

### 2. Test via API
```bash
# Check engine status
curl http://localhost:3000/api/ytdlp/system-config

# Test engine
curl -X PUT http://localhost:3000/api/ytdlp/system-config \
  -H "Content-Type: application/json" \
  -d '{"action": "test"}'

# Validate specific path
curl -X PUT http://localhost:3000/api/ytdlp/system-config \
  -H "Content-Type: application/json" \
  -d '{"action": "validate", "path": "/usr/local/bin/yt-dlp"}'
```

### 3. Test Download
```bash
# Test download via API
curl -X POST http://localhost:3000/api/download/start \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "quality": "720p",
    "format": "mp4"
  }'
```

## Troubleshooting

### Issue: System yt-dlp Not Detected
```bash
# Check if yt-dlp is installed
which yt-dlp

# Check if it's executable
ls -la $(which yt-dlp)

# Test execution
yt-dlp --version

# Check PATH
echo $PATH
```

### Issue: Permission Denied
```bash
# Check permissions
ls -la /usr/local/bin/yt-dlp

# Fix permissions
sudo chmod +x /usr/local/bin/yt-dlp

# Check user permissions
sudo -u odm /usr/local/bin/yt-dlp --version
```

### Issue: Different Python Environment
```bash
# Find yt-dlp installation
find /usr -name "yt-dlp" 2>/dev/null

# Use specific Python environment
export YTDLP_SYSTEM_PATH=/path/to/venv/bin/yt-dlp

# Or use pip to find installation
pip show yt-dlp
```

### Issue: Container Cannot Access System yt-dlp
```bash
# Mount system yt-dlp into container
docker run -v /usr/local/bin/yt-dlp:/usr/local/bin/yt-dlp:ro your-app

# Or install in container
RUN pip3 install yt-dlp
```

## Monitoring and Logs

### Check Application Logs
```bash
# Systemd logs
sudo journalctl -u odm -f

# PM2 logs
pm2 logs odm-app

# Docker logs
docker logs -f your-container
```

### Monitor yt-dlp Usage
```bash
# Check which engine is being used
curl http://localhost:3000/api/ytdlp/system-config | jq '.data.engine'

# Monitor download processes
ps aux | grep yt-dlp
```

## Best Practices

1. **Always enable fallback** to ensure reliability
2. **Use environment variables** for configuration
3. **Monitor logs** for engine selection
4. **Test configuration** before production deployment
5. **Keep yt-dlp updated** for latest features and fixes
6. **Use appropriate timeouts** for your network conditions
7. **Limit concurrent downloads** to prevent resource exhaustion

## Security Considerations

1. **Validate executable paths** to prevent path traversal
2. **Use non-root users** in containers and services
3. **Limit file system access** to necessary directories
4. **Monitor for suspicious activity** in logs
5. **Keep yt-dlp updated** to patch security vulnerabilities

This configuration ensures your deployed application uses system-installed yt-dlp while maintaining reliability through fallback mechanisms.