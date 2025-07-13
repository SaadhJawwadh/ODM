FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    curl \
    bash

# Install yt-dlp via pip with specific version
RUN pip3 install --no-cache-dir yt-dlp>=2023.1.6

# Alternative: Download yt-dlp binary as backup
RUN mkdir -p /usr/local/bin && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod +x /usr/local/bin/yt-dlp

# Verify installations
RUN python3 -m yt_dlp --version && \
    yt-dlp --version

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source files
COPY . .

# Create necessary directories
RUN mkdir -p temp bin && \
    chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/ytdlp || exit 1

# Start the application
CMD ["npm", "start"]