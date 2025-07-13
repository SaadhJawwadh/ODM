# Testing the ODM: One Download Manager

## Quick Test Guide

### 1. Prerequisites
Make sure you have:
- **Primary Engine**: yt-dlp installed: `pip install yt-dlp` or `brew install yt-dlp`
- **Node.js** dependencies installed: `npm install`
- **Development server** running: `npm run dev`
- **WebSocket server** running (automatically started with dev server)

### 2. Engine Status Check
Before testing, verify all engines are working:

```bash
# Check primary engine
yt-dlp --version

# Test system status
curl http://localhost:3000/api/ytdlp

# Check WebSocket connection
# Look for "WebSocket connected" message in browser console
```

### 3. Test URLs by Platform

**YouTube (Multiple Engines Available):**
- https://www.youtube.com/watch?v=dQw4w9WgXcQ (Rick Astley - Never Gonna Give You Up)
- https://www.youtube.com/watch?v=9bZkp7q19f0 (PSY - Gangnam Style)
- https://www.youtube.com/watch?v=JGwWNGJdvx8 (Short test video)

**Instagram (Direct API Integration):**
- https://www.instagram.com/p/[post_id]/ (Public Instagram post)
- https://www.instagram.com/reel/[reel_id]/ (Instagram Reel)
- https://www.instagram.com/tv/[tv_id]/ (Instagram TV)

**Twitter/X:**
- https://twitter.com/[user]/status/[tweet_id] (Video tweet)
- https://x.com/[user]/status/[tweet_id] (X.com video tweet)

**TikTok:**
- https://www.tiktok.com/@[user]/video/[video_id] (TikTok video)
- https://vm.tiktok.com/[short_id]/ (TikTok short link)

**Vimeo:**
- https://vimeo.com/148751763 (Short test video)
- https://vimeo.com/[video_id] (Any public Vimeo video)

**Other Platforms:**
- https://www.twitch.tv/videos/[video_id] (Twitch VOD)
- https://www.dailymotion.com/video/[video_id] (Dailymotion)
- https://www.reddit.com/r/[subreddit]/comments/[post_id]/ (Reddit video)

### 4. Testing Procedures

#### 4.1 Basic Video Download Test

1. **Open Application**: Navigate to http://localhost:3000
2. **System Status**: Check the system status indicator (should be green)
3. **Engine Detection**: Verify multiple engines are detected in settings
4. **URL Input**: Paste a YouTube URL in the input field
5. **Get Info**: Click "Get Info" to preview the video
6. **Engine Selection**: Application automatically selects best engine
7. **Quality Selection**: Choose quality (e.g., 720p)
8. **Start Download**: Click "Start Download"
9. **Real-time Updates**: Observe WebSocket progress updates
10. **Completion**: Verify download completes successfully

#### 4.2 Multi-Engine Testing

**Engine Priority Testing:**
1. **Primary Engine**: Test with yt-dlp (default)
2. **YouTube Engine**: Test YouTube-specific URL with ytdl-core
3. **Instagram Engine**: Test Instagram URL with direct API
4. **Fallback Testing**: Temporarily disable primary engine and test fallback

**Engine Switching:**
```bash
# Test engine preference
echo "PRIMARY_ENGINE=youtube-dl-exec" >> .env.local
npm run dev

# Test fallback
echo "ENABLE_FALLBACK=true" >> .env.local
npm run dev
```

#### 4.3 WebSocket Functionality Testing

**Real-time Progress:**
1. Start multiple downloads simultaneously
2. Monitor WebSocket messages in browser dev tools
3. Verify progress updates every 1-2 seconds
4. Check for proper connection handling

**WebSocket Events to Monitor:**
```javascript
// In browser console
socket.on('download_progress', console.log);
socket.on('download_complete', console.log);
socket.on('download_error', console.log);
socket.on('system_status', console.log);
```

#### 4.4 Instagram API Testing

**Setup Instagram Credentials:**
```env
# Add to .env.local
INSTAGRAM_USERNAME=your_test_username
INSTAGRAM_PASSWORD=your_test_password
```

**Test Instagram Features:**
1. **Public Posts**: Test public Instagram posts
2. **Reels**: Test Instagram Reels
3. **Stories**: Test Instagram Stories (if available)
4. **Private Content**: Test with authenticated account

#### 4.5 Advanced Features Testing

**Audio-Only Downloads:**
1. Select any video URL
2. Toggle "Audio Only" mode
3. Choose audio quality (e.g., 320 kbps)
4. Select format (MP3, AAC, FLAC)
5. Start download and verify audio extraction

**Subtitle and Thumbnail Testing:**
1. Find video with subtitles (YouTube recommended)
2. Enable "Download Subtitles" option
3. Enable "Download Thumbnail" option
4. Start download
5. Verify subtitle files (.vtt) are downloaded
6. Verify thumbnail files (.webp) are downloaded

**Batch Downloads:**
1. Queue multiple downloads from different platforms
2. Monitor concurrent download limits
3. Test pause/resume functionality
4. Test cancel functionality
5. Verify proper resource management

#### 4.6 Error Handling Testing

**Network Errors:**
1. Disconnect internet during download
2. Verify proper error handling
3. Test automatic retry mechanisms
4. Check WebSocket reconnection

**Invalid URL Testing:**
1. Test with invalid URLs
2. Test with unsupported platforms
3. Test with private/restricted content
4. Verify proper error messages

**Engine Failure Testing:**
1. Temporarily rename yt-dlp executable
2. Test fallback engine activation
3. Verify error recovery
4. Test engine health monitoring

### 5. Expected Behavior

#### 5.1 Normal Operation
- **System Status**: Green indicator when engines are healthy
- **Engine Selection**: Automatic selection based on platform
- **Progress Updates**: Real-time progress via WebSocket
- **Speed Display**: Download speed in MB/s or KB/s
- **ETA**: Accurate estimated time remaining
- **Status Flow**: Pending → Downloading → Completed
- **File Info**: Name, size, and save location displayed
- **File Operations**: Preview and location buttons functional

#### 5.2 Multi-Engine Behavior
- **Primary Engine**: yt-dlp used by default
- **Platform-Specific**: YouTube engines for YouTube URLs
- **Instagram API**: Direct API for Instagram content
- **Fallback Chain**: Automatic fallback if primary fails
- **Performance**: Optimal engine selection for speed

#### 5.3 WebSocket Behavior
- **Connection**: Automatic connection on page load
- **Reconnection**: Automatic reconnection if disconnected
- **Progress**: Updates every 1-2 seconds during download
- **Errors**: Immediate error reporting
- **Queue Updates**: Real-time queue status changes

### 6. Performance Testing

#### 6.1 Concurrent Downloads
```bash
# Test concurrent limits
MAX_CONCURRENT_DOWNLOADS=5 npm run dev

# Test per-engine limits
MAX_CONCURRENT_YTDLP=2 npm run dev
MAX_CONCURRENT_YOUTUBE=3 npm run dev
MAX_CONCURRENT_INSTAGRAM=1 npm run dev
```

#### 6.2 Large File Testing
1. **4K Video Downloads**: Test high-resolution content
2. **Long Videos**: Test videos over 1 hour
3. **Live Streams**: Test live stream recording
4. **Large Playlists**: Test playlist download capabilities

#### 6.3 Resource Monitoring
```bash
# Monitor system resources during testing
top -p $(pgrep -f "node.*next")
htop
```

### 7. Platform-Specific Testing

#### 7.1 YouTube Testing
- **Video Formats**: MP4, WebM, MKV
- **Audio Formats**: MP3, AAC, FLAC, OGG
- **Qualities**: 144p to 4K
- **Live Streams**: Test live stream recording
- **Premieres**: Test scheduled premieres
- **Shorts**: Test YouTube Shorts

#### 7.2 Instagram Testing
- **Posts**: Regular Instagram posts
- **Reels**: Instagram Reels
- **IGTV**: Instagram TV content
- **Stories**: Instagram Stories (24h limit)
- **Profile Videos**: Profile highlight videos

#### 7.3 Twitter/X Testing
- **Native Videos**: Twitter-hosted videos
- **External Links**: Videos linked from other platforms
- **Threads**: Video threads
- **Spaces**: Twitter Spaces audio

#### 7.4 TikTok Testing
- **Regular Videos**: Standard TikTok content
- **Live Streams**: TikTok live streams
- **Duets**: TikTok duet videos
- **Challenges**: Trending challenge videos

### 8. Troubleshooting Tests

#### 8.1 Common Issues

**"Multiple engines conflict"**
```bash
# Reset engine cache
rm -rf node_modules/.cache/ytdlp
npm install --force
```

**"WebSocket connection failed"**
```bash
# Check WebSocket port
netstat -an | grep 3001
DEBUG=socket.io* npm run dev
```

**"Instagram authentication failed"**
```bash
# Check credentials
curl -X POST http://localhost:3000/api/instagram/auth \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

**"Engine not found"**
```bash
# Check engine paths
which yt-dlp
which youtube-dl
npm run engine-check
```

#### 8.2 Debug Mode Testing
```bash
# Enable debug mode
DEBUG=* npm run dev

# Engine-specific debugging
DEBUG=ytdlp:* npm run dev
DEBUG=websocket:* npm run dev
DEBUG=instagram:* npm run dev
```

### 9. Security Testing

#### 9.1 Input Validation
- **URL Injection**: Test with malicious URLs
- **Path Traversal**: Test with directory traversal attempts
- **Command Injection**: Test with shell injection attempts
- **XSS Protection**: Test with XSS payloads in URLs

#### 9.2 Rate Limiting
- **Request Limits**: Test API rate limiting
- **Concurrent Limits**: Test concurrent download limits
- **Engine Limits**: Test per-engine rate limits
- **IP Blocking**: Test IP-based restrictions

### 10. Cross-Platform Testing

#### 10.1 Windows Testing
- **File Operations**: Test file preview and location opening
- **Path Handling**: Test Windows path handling
- **PowerShell**: Test PowerShell compatibility
- **Antivirus**: Test with antivirus software

#### 10.2 macOS Testing
- **File Operations**: Test Finder integration
- **Permissions**: Test file permissions
- **Quarantine**: Test Gatekeeper compatibility
- **Path Handling**: Test macOS path handling

#### 10.3 Linux Testing
- **File Managers**: Test various file managers
- **Permissions**: Test file permissions
- **Desktop Integration**: Test desktop notifications
- **Distribution Testing**: Test on different distributions

### 11. Automated Testing

#### 11.1 Unit Tests
```bash
# Run unit tests
npm run test

# Run engine tests
npm run test:engines

# Run WebSocket tests
npm run test:websocket
```

#### 11.2 Integration Tests
```bash
# Test full download flow
npm run test:integration

# Test multi-engine fallback
npm run test:fallback

# Test WebSocket functionality
npm run test:websocket-integration
```

### 12. Test Reporting

#### 12.1 Test Results Template
```
## Test Results - ODM v0.1.0

### Environment
- OS: [Windows/macOS/Linux]
- Node.js: [version]
- Browser: [browser and version]
- Primary Engine: [yt-dlp version]

### Engine Status
- ✅ yt-dlp: [version] - Working
- ✅ youtube-dl-exec: [version] - Working
- ✅ ytdl-core: [version] - Working
- ✅ Instagram API: Connected
- ✅ WebSocket: Connected

### Platform Tests
- ✅ YouTube: [X/Y tests passed]
- ✅ Instagram: [X/Y tests passed]
- ✅ Twitter: [X/Y tests passed]
- ✅ TikTok: [X/Y tests passed]
- ✅ Vimeo: [X/Y tests passed]

### Feature Tests
- ✅ Multi-engine: [X/Y tests passed]
- ✅ WebSocket: [X/Y tests passed]
- ✅ File Operations: [X/Y tests passed]
- ✅ Error Handling: [X/Y tests passed]

### Performance
- Average Download Speed: [X MB/s]
- Concurrent Downloads: [X successful]
- Memory Usage: [X MB peak]
- CPU Usage: [X% peak]

### Issues Found
- [ ] Issue 1: Description
- [ ] Issue 2: Description
```

### 13. Test Checklist

#### 13.1 Pre-Release Testing
- [ ] All engines detected and working
- [ ] WebSocket connection established
- [ ] Multi-platform download testing
- [ ] Engine fallback testing
- [ ] File operations testing
- [ ] Error handling verification
- [ ] Performance benchmarking
- [ ] Security testing
- [ ] Cross-platform compatibility
- [ ] Documentation accuracy

#### 13.2 Regression Testing
- [ ] Previous functionality still works
- [ ] New features don't break existing features
- [ ] Performance hasn't degraded
- [ ] All test URLs still work
- [ ] Engine compatibility maintained

Enjoy testing your enhanced multi-engine download manager! 🎉

## Advanced Testing Scenarios

### 14. Load Testing

#### 14.1 Stress Testing
```bash
# Test with 50 concurrent downloads
for i in {1..50}; do
  curl -X POST http://localhost:3000/api/download/start \
    -H "Content-Type: application/json" \
    -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ","quality":"720p"}' &
done
```

#### 14.2 Memory Testing
```bash
# Monitor memory usage during extended testing
while true; do
  ps aux | grep node | grep -v grep
  sleep 5
done
```

### 15. Edge Case Testing

#### 15.1 Network Conditions
- **Slow Connection**: Test with limited bandwidth
- **Intermittent Connection**: Test with unstable network
- **Proxy/VPN**: Test with proxy or VPN connections
- **Firewall**: Test with restrictive firewall settings

#### 15.2 Content Edge Cases
- **Age-Restricted**: Test age-restricted content
- **Geographic Restrictions**: Test geo-blocked content
- **Private Content**: Test private/unlisted content
- **Deleted Content**: Test deleted video URLs
- **Very Long URLs**: Test extremely long URLs
- **Special Characters**: Test URLs with special characters

This comprehensive test guide ensures all aspects of the ODM: One Download Manager are thoroughly tested! 🚀