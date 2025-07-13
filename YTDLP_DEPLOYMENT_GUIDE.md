# Multi-Engine Download Manager Deployment Guide

This guide provides complete instructions for deploying your web application with secure multi-engine download manager integration, including yt-dlp, WebSocket server, Instagram API, and multiple download engines.

## Overview

The multi-engine download manager provides several deployment strategies:

1. **Strategy 1: Bundled Executables** - Package all download engines with your application
2. **Strategy 2: Environment Configuration** - Allow administrators to specify engine locations
3. **Strategy 3: Hybrid Approach** - Combine bundled and external engines
4. **Strategy 4: Container Deployment** - Docker-based deployment with all engines

The system automatically falls back through these strategies in order:
1. Check engine-specific environment variables (`YTDLP_PATH`, `YOUTUBE_DL_PATH`, etc.)
2. Look for bundled executables in `./bin/` directory
3. Check system PATH for engines
4. Use built-in JavaScript engines as fallback

## Security Features

### Multi-Engine Command Injection Prevention

The integration prevents command injection across all engines by:
- Using `spawn()` instead of `exec()` or `shell()` commands for external engines
- Passing user input as separate arguments, not concatenated strings
- Validating executable paths before execution
- Setting timeouts and buffer limits per engine
- Engine-specific argument sanitization
- WebSocket message validation and sanitization

### Example of Secure Usage

```typescript
// ❌ DANGEROUS - Command injection vulnerability
const command = `yt-dlp --dump-json "${userUrl}"`;
exec(command); // User can inject commands through URL

// ✅ SECURE - Arguments passed separately
const args = ['--dump-json', userUrl];
spawn(ytdlpPath, args); // User input isolated as argument
```

## Deployment Strategies

### Strategy 1: Bundled Executables (Recommended)

This is the most reliable approach for production deployments, supporting all external engines.

#### For GitHub Actions / CI/CD

Add to your workflow (`.github/workflows/deploy.yml`):

```yaml
name: Deploy Multi-Engine Application

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install dependencies
      run: npm ci

    - name: Download All Engines
      run: |
        mkdir -p bin

        # Download yt-dlp (primary engine)
        wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O bin/yt-dlp
        chmod +x bin/yt-dlp

        # Download youtube-dl (fallback)
        wget https://github.com/ytdl-org/youtube-dl/releases/latest/download/youtube-dl -O bin/youtube-dl
        chmod +x bin/youtube-dl

        # Verify installations
        ./bin/yt-dlp --version
        ./bin/youtube-dl --version

    - name: Setup Instagram API
      env:
        INSTAGRAM_USERNAME: ${{ secrets.INSTAGRAM_USERNAME }}
        INSTAGRAM_PASSWORD: ${{ secrets.INSTAGRAM_PASSWORD }}
      run: |
        echo "Instagram credentials configured"

    - name: Build application
      run: npm run build

    - name: Deploy to production
      run: |
        # Your deployment commands here
        # Make sure to include the bin/ directory and environment variables
        rsync -av --include='bin/' --exclude='node_modules/' . user@server:/path/to/app/
```

#### For Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache wget python3 py3-pip ffmpeg

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Download all engines
RUN mkdir -p bin && \
    # Download yt-dlp (primary)
    wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O bin/yt-dlp && \
    chmod +x bin/yt-dlp && \
    # Download youtube-dl (fallback)
    wget https://github.com/ytdl-org/youtube-dl/releases/latest/download/youtube-dl -O bin/youtube-dl && \
    chmod +x bin/youtube-dl && \
    # Install python packages for Instagram API
    pip3 install --no-cache-dir instaloader && \
    # Verify installations
    ./bin/yt-dlp --version && \
    ./bin/youtube-dl --version

# Copy application code
COPY . .

# Build application
RUN npm run build

# Create downloads directory
RUN mkdir -p downloads && chown -R node:node downloads

# Switch to non-root user
USER node

# Expose ports for HTTP and WebSocket
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/ytdlp || exit 1

CMD ["npm", "start"]
```

#### For Manual Deployment

```bash
# On your server
mkdir -p bin

# Download all engines
wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O bin/yt-dlp
chmod +x bin/yt-dlp

wget https://github.com/ytdl-org/youtube-dl/releases/latest/download/youtube-dl -O bin/youtube-dl
chmod +x bin/youtube-dl

# Install system dependencies
sudo apt-get update
sudo apt-get install -y python3 python3-pip ffmpeg

# Install Instagram API dependencies
pip3 install instaloader

# Verify installations
./bin/yt-dlp --version
./bin/youtube-dl --version

# Setup environment variables
export YTDLP_PATH=./bin/yt-dlp
export YOUTUBE_DL_PATH=./bin/youtube-dl
export INSTAGRAM_USERNAME=your_username
export INSTAGRAM_PASSWORD=your_password
export WEBSOCKET_PORT=3001
export ENABLE_WEBSOCKET=true

# Start your application
npm start
```

### Strategy 2: Environment Variable Configuration

This approach allows administrators to specify all engine locations and configure advanced features.

#### Setting Engine Environment Variables

```bash
# Primary engines
export YTDLP_PATH=/usr/local/bin/yt-dlp
export YOUTUBE_DL_PATH=/usr/local/bin/youtube-dl

# Engine preferences
export PRIMARY_ENGINE=yt-dlp
export ENABLE_FALLBACK=true

# Instagram API configuration
export INSTAGRAM_USERNAME=your_username
export INSTAGRAM_PASSWORD=your_password
export INSTAGRAM_API_ENABLED=true

# WebSocket configuration
export WEBSOCKET_PORT=3001
export ENABLE_WEBSOCKET=true
export WEBSOCKET_CORS_ORIGIN=https://yourdomain.com

# Performance settings
export MAX_CONCURRENT_DOWNLOADS=5
export MAX_CONCURRENT_YTDLP=3
export MAX_CONCURRENT_YOUTUBE=2
export MAX_CONCURRENT_INSTAGRAM=1

# Security settings
export DOWNLOAD_TIMEOUT=300000
export MAX_DOWNLOAD_SIZE=5368709120  # 5GB
export ENABLE_RATE_LIMITING=true

# For systemd service
cat > /etc/systemd/system/odm.service << EOF
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

# Environment variables
Environment=NODE_ENV=production
Environment=YTDLP_PATH=/usr/local/bin/yt-dlp
Environment=YOUTUBE_DL_PATH=/usr/local/bin/youtube-dl
Environment=PRIMARY_ENGINE=yt-dlp
Environment=ENABLE_FALLBACK=true
Environment=WEBSOCKET_PORT=3001
Environment=ENABLE_WEBSOCKET=true

[Install]
WantedBy=multi-user.target
EOF

systemctl enable odm
systemctl start odm
```

#### Docker with Environment Variables

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache python3 py3-pip ffmpeg curl

# Install all engines system-wide
RUN pip3 install yt-dlp youtube-dl instaloader

# Set environment variables for all engines
ENV YTDLP_PATH=/usr/local/bin/yt-dlp
ENV YOUTUBE_DL_PATH=/usr/local/bin/youtube-dl
ENV PRIMARY_ENGINE=yt-dlp
ENV ENABLE_FALLBACK=true
ENV WEBSOCKET_PORT=3001
ENV ENABLE_WEBSOCKET=true
ENV MAX_CONCURRENT_DOWNLOADS=5

# Copy and build application
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S odm -u 1001

# Create downloads directory
RUN mkdir -p downloads && chown -R odm:nodejs downloads

USER odm

# Expose ports for HTTP and WebSocket
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/ytdlp || exit 1

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
      - "3001:3001"  # WebSocket port
    environment:
      # Engine configuration
      - YTDLP_PATH=/usr/local/bin/yt-dlp
      - YOUTUBE_DL_PATH=/usr/local/bin/youtube-dl
      - PRIMARY_ENGINE=yt-dlp
      - ENABLE_FALLBACK=true

      # WebSocket configuration
      - WEBSOCKET_PORT=3001
      - ENABLE_WEBSOCKET=true
      - WEBSOCKET_CORS_ORIGIN=https://yourdomain.com

      # Instagram API (use Docker secrets for production)
      - INSTAGRAM_USERNAME=${INSTAGRAM_USERNAME}
      - INSTAGRAM_PASSWORD=${INSTAGRAM_PASSWORD}
      - INSTAGRAM_API_ENABLED=true

      # Performance settings
      - MAX_CONCURRENT_DOWNLOADS=5
      - MAX_CONCURRENT_YTDLP=3
      - MAX_CONCURRENT_YOUTUBE=2
      - MAX_CONCURRENT_INSTAGRAM=1

      # Security settings
      - NODE_ENV=production
      - DOWNLOAD_TIMEOUT=300000
      - MAX_DOWNLOAD_SIZE=5368709120  # 5GB
      - ENABLE_RATE_LIMITING=true

    volumes:
      - ./downloads:/app/downloads
      - ./logs:/app/logs

    # Health check
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/ytdlp"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

    # Resource limits
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G

    # Restart policy
    restart: unless-stopped

    # Security
    security_opt:
      - no-new-privileges:true

    # Logging
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "3"

  # Optional: Redis for session management and caching
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    restart: unless-stopped

  # Optional: Nginx reverse proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  redis_data:
```

### Strategy 3: WebSocket-Enabled Deployment

This strategy focuses on deploying with full WebSocket support for real-time updates.

#### WebSocket Configuration

```typescript
// server.js - WebSocket server configuration
import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const server = createServer();
const io = new Server(server, {
    cors: {
        origin: process.env.WEBSOCKET_CORS_ORIGIN || "http://localhost:3000",
        methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling']
});

// WebSocket security middleware
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (validateToken(token)) {
        next();
    } else {
        next(new Error('Authentication error'));
    }
});

// WebSocket event handlers
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('start_download', async (data) => {
        try {
            const download = await startDownload(data.url, data.options);
            socket.emit('download_started', { id: download.id, status: 'started' });
        } catch (error) {
            socket.emit('download_error', { error: error.message });
        }
    });

    socket.on('pause_download', async (data) => {
        await pauseDownload(data.id);
        socket.emit('download_paused', { id: data.id });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

server.listen(3001, () => {
    console.log('WebSocket server running on port 3001');
});
```

#### Nginx Configuration for WebSocket

```nginx
# nginx.conf
upstream app {
    server app:3000;
}

upstream websocket {
    server app:3001;
}

server {
    listen 80;
    server_name yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # HTTP traffic
    location / {
        proxy_pass http://app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket traffic
    location /socket.io/ {
        proxy_pass http://websocket;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket specific timeouts
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }
}
```

### Strategy 4: Instagram API Secure Deployment

This strategy focuses on secure deployment with Instagram API integration.

#### Instagram API Security Setup

```bash
# Create secure credential store
sudo mkdir -p /etc/odm/secrets
sudo chmod 700 /etc/odm/secrets

# Store Instagram credentials securely
echo "your_instagram_username" | sudo tee /etc/odm/secrets/instagram_username
echo "your_instagram_password" | sudo tee /etc/odm/secrets/instagram_password
sudo chmod 600 /etc/odm/secrets/*

# Create Instagram API service
cat > /etc/systemd/system/odm-instagram.service << EOF
[Unit]
Description=ODM Instagram API Service
After=network.target

[Service]
Type=simple
User=odm
WorkingDirectory=/opt/odm
ExecStart=/usr/bin/node scripts/instagram-service.js
Restart=always
RestartSec=10

# Load credentials from secure location
ExecStartPre=/bin/bash -c 'export INSTAGRAM_USERNAME=\$(cat /etc/odm/secrets/instagram_username)'
ExecStartPre=/bin/bash -c 'export INSTAGRAM_PASSWORD=\$(cat /etc/odm/secrets/instagram_password)'

Environment=NODE_ENV=production
Environment=INSTAGRAM_API_ENABLED=true
Environment=INSTAGRAM_RATE_LIMIT=50
Environment=INSTAGRAM_SESSION_TIMEOUT=3600000

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable odm-instagram
sudo systemctl start odm-instagram
```

#### Instagram API Rate Limiting

```typescript
// lib/instagram-rate-limiter.ts
export class InstagramRateLimiter {
    private requests: Map<string, number[]> = new Map();
    private readonly maxRequests = 50; // per hour
    private readonly windowMs = 60 * 60 * 1000; // 1 hour

    async checkRateLimit(clientId: string): Promise<boolean> {
        const now = Date.now();
        const windowStart = now - this.windowMs;

        if (!this.requests.has(clientId)) {
            this.requests.set(clientId, []);
        }

        const clientRequests = this.requests.get(clientId)!;

        // Remove old requests
        const validRequests = clientRequests.filter(time => time > windowStart);
        this.requests.set(clientId, validRequests);

        // Check if limit exceeded
        if (validRequests.length >= this.maxRequests) {
            return false;
        }

        // Add current request
        validRequests.push(now);
        return true;
    }
}
```

### Strategy 5: Production Deployment Best Practices

This comprehensive strategy covers all aspects of production deployment.

#### Production Environment Setup

```bash
# Create production user
sudo useradd -r -s /bin/bash -d /opt/odm -m odm

# Setup directory structure
sudo mkdir -p /opt/odm/{bin,downloads,logs,backups,config}
sudo chown -R odm:odm /opt/odm

# Install production dependencies
sudo apt-get update
sudo apt-get install -y nodejs npm python3 python3-pip ffmpeg nginx redis-server

# Install Node.js process manager
sudo npm install -g pm2

# Setup PM2 ecosystem
cat > /opt/odm/ecosystem.config.js << EOF
module.exports = {
    apps: [
        {
            name: 'odm-app',
            script: './server.js',
            instances: 'max',
            exec_mode: 'cluster',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
                YTDLP_PATH: '/opt/odm/bin/yt-dlp',
                YOUTUBE_DL_PATH: '/opt/odm/bin/youtube-dl',
                PRIMARY_ENGINE: 'yt-dlp',
                ENABLE_FALLBACK: 'true',
                MAX_CONCURRENT_DOWNLOADS: 5,
                WEBSOCKET_PORT: 3001,
                ENABLE_WEBSOCKET: 'true'
            },
            log_file: '/opt/odm/logs/combined.log',
            out_file: '/opt/odm/logs/out.log',
            error_file: '/opt/odm/logs/error.log',
            merge_logs: true,
            time: true
        },
        {
            name: 'odm-websocket',
            script: './websocket-server.js',
            instances: 1,
            env: {
                NODE_ENV: 'production',
                WEBSOCKET_PORT: 3001,
                REDIS_URL: 'redis://localhost:6379'
            },
            log_file: '/opt/odm/logs/websocket.log',
            time: true
        }
    ]
};
EOF

sudo chown odm:odm /opt/odm/ecosystem.config.js
```

#### Production Security Configuration

```bash
# Setup firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Setup fail2ban for protection
sudo apt-get install -y fail2ban

cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 10

[nginx-botsearch]
enabled = true
filter = nginx-botsearch
logpath = /var/log/nginx/access.log
maxretry = 2
EOF

sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Setup log rotation
cat > /etc/logrotate.d/odm << EOF
/opt/odm/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
```

#### Production Monitoring Setup

```bash
# Install monitoring tools
sudo apt-get install -y htop iotop nethogs

# Setup system monitoring
cat > /opt/odm/scripts/health-check.sh << EOF
#!/bin/bash
# System health check script

LOG_FILE="/opt/odm/logs/health-check.log"
DATE=\$(date '+%Y-%m-%d %H:%M:%S')

echo "[\$DATE] Starting health check" >> \$LOG_FILE

# Check disk space
DISK_USAGE=\$(df /opt/odm | tail -1 | awk '{print \$5}' | sed 's/%//')
if [ \$DISK_USAGE -gt 80 ]; then
    echo "[\$DATE] WARNING: Disk usage is \$DISK_USAGE%" >> \$LOG_FILE
fi

# Check memory usage
MEM_USAGE=\$(free | grep Mem | awk '{printf "%.2f", \$3/\$2 * 100.0}')
if [ \${MEM_USAGE%.*} -gt 80 ]; then
    echo "[\$DATE] WARNING: Memory usage is \$MEM_USAGE%" >> \$LOG_FILE
fi

# Check application status
if ! pm2 describe odm-app > /dev/null 2>&1; then
    echo "[\$DATE] ERROR: Application is not running" >> \$LOG_FILE
    pm2 start ecosystem.config.js
fi

# Check WebSocket status
if ! pm2 describe odm-websocket > /dev/null 2>&1; then
    echo "[\$DATE] ERROR: WebSocket server is not running" >> \$LOG_FILE
    pm2 start ecosystem.config.js --only odm-websocket
fi

# Check download engines
if ! /opt/odm/bin/yt-dlp --version > /dev/null 2>&1; then
    echo "[\$DATE] ERROR: yt-dlp is not working" >> \$LOG_FILE
fi

echo "[\$DATE] Health check completed" >> \$LOG_FILE
EOF

chmod +x /opt/odm/scripts/health-check.sh

# Setup cron job for health checks
echo "*/5 * * * * /opt/odm/scripts/health-check.sh" | sudo -u odm crontab -
```

#### Production Backup Strategy

```bash
# Create backup script
cat > /opt/odm/scripts/backup.sh << EOF
#!/bin/bash
# Backup script for ODM

BACKUP_DIR="/opt/odm/backups"
DATE=\$(date '+%Y%m%d_%H%M%S')
BACKUP_FILE="odm_backup_\$DATE.tar.gz"

# Create backup
cd /opt/odm
tar -czf "\$BACKUP_DIR/\$BACKUP_FILE" \
    --exclude='downloads' \
    --exclude='logs' \
    --exclude='backups' \
    --exclude='node_modules' \
    .

# Keep only last 7 days of backups
find \$BACKUP_DIR -name "odm_backup_*.tar.gz" -mtime +7 -delete

echo "Backup created: \$BACKUP_FILE"
EOF

chmod +x /opt/odm/scripts/backup.sh

# Setup daily backup
echo "0 2 * * * /opt/odm/scripts/backup.sh" | sudo -u odm crontab -
```

## Implementation Examples

### API Route with Error Handling

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getVideoInfo, YtDlpNotFoundError, YtDlpExecutionError } from '@/lib/ytdlp-manager';

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        // Validate input
        if (!url || typeof url !== 'string') {
            return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
        }

        // Secure execution with timeout and buffer limits
        const videoInfo = await getVideoInfo(url, {
            timeout: 30000,
            maxBuffer: 5 * 1024 * 1024 // 5MB
        });

        return NextResponse.json(videoInfo);

    } catch (error) {
        if (error instanceof YtDlpNotFoundError) {
            return NextResponse.json({
                error: 'yt-dlp not configured',
                details: error.message
            }, { status: 503 });
        }

        if (error instanceof YtDlpExecutionError) {
            return NextResponse.json({
                error: 'Video processing failed',
                details: error.message
            }, { status: 400 });
        }

        return NextResponse.json({
            error: 'Internal server error'
        }, { status: 500 });
    }
}
```

### Download with Progress Tracking

```typescript
import { downloadVideo } from '@/lib/ytdlp-manager';

export async function downloadWithProgress(url: string, format: string) {
    return downloadVideo(url, {
        format,
        output: 'downloads/%(title)s.%(ext)s',
        timeout: 300000, // 5 minutes
        onProgress: (data) => {
            console.log('Download progress:', data);
            // Send progress to client via WebSocket
        }
    });
}
```

### System Status Check

```typescript
import { getYtdlpSystemInfo } from '@/lib/ytdlp-manager';

export async function GET() {
    const systemInfo = await getYtdlpSystemInfo();

    return NextResponse.json({
        ytdlp: {
            available: systemInfo.available,
            version: systemInfo.version,
            path: systemInfo.path,
            source: systemInfo.source
        }
    });
}
```

## File Permissions and Security

### Required Permissions

```bash
# For bundled executable
chmod +x bin/yt-dlp

# For system installation
sudo chmod +x /usr/local/bin/yt-dlp

# Verify permissions
ls -la bin/yt-dlp
# Should show: -rwxr-xr-x
```

### Security Considerations

1. **Always verify executable integrity**:
   ```bash
   # Check file signature (if available)
   gpg --verify yt-dlp.sig yt-dlp

   # Check file hash
   sha256sum bin/yt-dlp
   ```

2. **Use specific versions in production**:
   ```bash
   # Instead of "latest"
   wget https://github.com/yt-dlp/yt-dlp/releases/download/2023.12.30/yt-dlp
   ```

3. **Limit process resources**:
   ```typescript
   const result = await executeYtdlpCommand(path, args, {
       timeout: 30000,      // 30 second timeout
       maxBuffer: 10485760  // 10MB buffer limit
   });
   ```

4. **Validate user input**:
   ```typescript
   function validateUrl(url: string): boolean {
       try {
           new URL(url);
           return true;
       } catch {
           return false;
       }
   }
   ```

## Error Handling

### Common Errors and Solutions

1. **yt-dlp not found**:
   ```
   Error: yt-dlp executable not found
   Solution: Set YTDLP_PATH or ensure bundled executable exists
   ```

2. **Permission denied**:
   ```
   Error: spawn EACCES
   Solution: chmod +x bin/yt-dlp
   ```

3. **Command timeout**:
   ```
   Error: Command timed out after 30000ms
   Solution: Increase timeout or check network connection
   ```

4. **Buffer overflow**:
   ```
   Error: Output exceeded maximum buffer size
   Solution: Increase maxBuffer or reduce output verbosity
   ```

### Error Logging

```typescript
import { YtDlpNotFoundError, YtDlpExecutionError } from '@/lib/ytdlp-manager';

try {
    await getVideoInfo(url);
} catch (error) {
    if (error instanceof YtDlpNotFoundError) {
        console.error('yt-dlp configuration error:', error.message);
        // Alert administrators
    } else if (error instanceof YtDlpExecutionError) {
        console.error('yt-dlp execution error:', {
            exitCode: error.exitCode,
            stderr: error.stderr,
            stdout: error.stdout
        });
    }
}
```

## Testing Your Deployment

### Basic Functionality Test

```bash
# Test bundled executable
./bin/yt-dlp --version

# Test with environment variable
YTDLP_PATH=/usr/local/bin/yt-dlp node -e "
const { getYtdlpSystemInfo } = require('./dist/lib/ytdlp-manager');
getYtdlpSystemInfo().then(console.log);
"

# Test API endpoint
curl -X POST http://localhost:3000/api/video/info \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

### Performance Test

```bash
# Test with timeout
time ./bin/yt-dlp --dump-json --no-warnings "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

# Test with large video
curl -X POST http://localhost:3000/api/video/info \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=LONG_VIDEO_ID"}'
```

## Monitoring and Maintenance

### Health Check Endpoint

```typescript
export async function GET() {
    try {
        const info = await getYtdlpSystemInfo();
        return NextResponse.json({
            status: 'healthy',
            ytdlp: info
        });
    } catch (error) {
        return NextResponse.json({
            status: 'unhealthy',
            error: error.message
        }, { status: 503 });
    }
}
```

### Automated Updates

```bash
#!/bin/bash
# update-ytdlp.sh

OLD_VERSION=$(./bin/yt-dlp --version)
wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O bin/yt-dlp.new
chmod +x bin/yt-dlp.new
NEW_VERSION=$(./bin/yt-dlp.new --version)

if [ "$OLD_VERSION" != "$NEW_VERSION" ]; then
    mv bin/yt-dlp.new bin/yt-dlp
    echo "Updated yt-dlp from $OLD_VERSION to $NEW_VERSION"
    # Restart your application
    pm2 restart your-app
else
    rm bin/yt-dlp.new
    echo "yt-dlp is already up to date ($OLD_VERSION)"
fi
```

## Troubleshooting

### Debug Mode

```typescript
// Enable debug logging
process.env.DEBUG = 'ytdlp:*';

// Or use verbose logging
const result = await executeYtdlpCommand(path, ['--verbose', ...args]);
```

### Common Issues

1. **Architecture mismatch**: Ensure you download the correct binary for your platform
2. **Network issues**: Check if the server can access GitHub and video sites
3. **Memory issues**: Adjust `maxBuffer` settings for large operations
4. **Permission issues**: Verify file permissions and user context

For additional support, check the application logs and refer to the yt-dlp documentation at https://github.com/yt-dlp/yt-dlp.