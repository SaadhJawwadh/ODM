# Secure yt-dlp Integration Deployment Guide

This guide provides complete instructions for deploying your web application with secure yt-dlp integration, including both bundled executable and environment variable strategies.

## Overview

The yt-dlp integration provides two main deployment strategies:

1. **Strategy 1: Bundled Executable** - Package yt-dlp directly with your application
2. **Strategy 2: Environment Variable** - Allow administrators to specify yt-dlp location

The system automatically falls back through these strategies in order:
1. Check `YTDLP_PATH` environment variable
2. Look for bundled executable in `./bin/` directory
3. Fall back to system PATH

## Security Features

### Command Injection Prevention

The integration prevents command injection by:
- Using `spawn()` instead of `exec()` or `shell()` commands
- Passing user input as separate arguments, not concatenated strings
- Validating executable paths before execution
- Setting timeouts and buffer limits

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

### Strategy 1: Bundled Executable (Recommended)

This is the most reliable approach for production deployments.

#### For GitHub Actions / CI/CD

Add to your workflow (`.github/workflows/deploy.yml`):

```yaml
name: Deploy

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

    - name: Download yt-dlp
      run: |
        mkdir -p bin
        wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O bin/yt-dlp
        chmod +x bin/yt-dlp
        ./bin/yt-dlp --version  # Verify installation

    - name: Build application
      run: npm run build

    - name: Deploy to production
      run: |
        # Your deployment commands here
        # Make sure to include the bin/ directory in your deployment
```

#### For Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Download yt-dlp
RUN apk add --no-cache wget && \
    mkdir -p bin && \
    wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O bin/yt-dlp && \
    chmod +x bin/yt-dlp && \
    ./bin/yt-dlp --version

# Copy application code
COPY . .

# Build application
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### For Manual Deployment

```bash
# On your server
mkdir -p bin
wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O bin/yt-dlp
chmod +x bin/yt-dlp

# Verify installation
./bin/yt-dlp --version

# Start your application
npm start
```

### Strategy 2: Environment Variable Configuration

This approach allows administrators to specify yt-dlp location.

#### Setting the Environment Variable

```bash
# Point to system installation
export YTDLP_PATH=/usr/local/bin/yt-dlp

# Point to custom location
export YTDLP_PATH=/opt/yt-dlp/yt-dlp

# For systemd service
echo 'YTDLP_PATH=/usr/local/bin/yt-dlp' >> /etc/environment
```

#### Docker with Environment Variable

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install yt-dlp system-wide
RUN apk add --no-cache python3 py3-pip
RUN pip3 install yt-dlp

# Set environment variable
ENV YTDLP_PATH=/usr/local/bin/yt-dlp

# Copy and build application
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

EXPOSE 3000
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
    environment:
      - YTDLP_PATH=/usr/local/bin/yt-dlp
      - NODE_ENV=production
    volumes:
      - ./downloads:/app/downloads
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