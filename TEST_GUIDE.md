# Testing the YT-DLP Download Manager

## Quick Test Guide

### 1. Prerequisites
Make sure you have:
- **yt-dlp** installed: `pip install yt-dlp` or `brew install yt-dlp`
- **Node.js** dependencies installed: `npm install`
- **Development server** running: `npm run dev`

### 2. Test URLs
Here are some safe test URLs you can use:

**YouTube:**
- https://www.youtube.com/watch?v=dQw4w9WgXcQ (Rick Astley - Never Gonna Give You Up)
- https://www.youtube.com/watch?v=9bZkp7q19f0 (PSY - Gangnam Style)

**Vimeo:**
- https://vimeo.com/148751763 (Short test video)

### 3. Testing Steps

#### Basic Video Download
1. Open http://localhost:3000
2. Paste a YouTube URL in the input field
3. Click "Get Info" to preview the video
4. Select "Video" download type
5. Choose quality (e.g., 720p)
6. Click "Start Download"

#### Audio-Only Download
1. Paste a YouTube URL
2. Click "Get Info"
3. Select "Audio" download type
4. Choose quality (e.g., 320 kbps)
5. Select format (MP3)
6. Click "Start Download"

#### Advanced Options
1. Enable "Download Subtitles"
2. Enable "Download Thumbnail"
3. Try different quality settings
4. Test different formats

#### Post-Download Features 🆕
After a download completes, you'll see new buttons:
1. **👁️ Preview File**: Click to open the downloaded file
   - Should open with your default media player
   - Test with both video and audio files
2. **📁 Open File Location**: Click to open the downloads folder
   - **Windows**: Opens Explorer with file selected
   - **macOS**: Opens Finder with file revealed
   - **Linux**: Opens file manager
3. **File Information**: Green info box showing file details

#### Download Management
1. **Pause/Resume**: Test pausing and resuming active downloads
2. **Cancel**: Test canceling downloads in progress
3. **Clear Completed**: Remove completed downloads from history
4. **Toast Notifications**: Verify you see feedback messages for all actions

### 4. Expected Behavior
- **Progress**: You should see real-time progress updates
- **Speed**: Download speed should be displayed
- **ETA**: Estimated time remaining
- **Status**: Status should change from "Pending" → "Downloading" → "Completed"
- **File Info**: Completed downloads show file name, size, and save location
- **File Operations**: Preview and location buttons appear for completed downloads
- **Notifications**: Toast messages appear for all user actions

### 5. Common Issues & Solutions

**Error: "yt-dlp not found"**
- Install yt-dlp: `pip install yt-dlp`
- Make sure it's in your PATH

**Error: "Invalid filter specification"**
- This has been fixed in the latest version
- Try using "best" quality if custom qualities fail

**Download not starting**
- Check browser console for errors
- Verify the URL is valid and accessible

**File operations not working**
- Ensure the download completed successfully
- Check that the file exists in the downloads folder
- Verify file permissions

**Toast notifications not showing**
- Check if browser notifications are blocked
- Ensure JavaScript is enabled

### 6. File Locations
Downloaded files will be saved to:
- `./downloads/` directory in your project folder
- Files are named: `[Video Title].[extension]`
- Thumbnails: `[Video Title].webp` (if enabled)
- Subtitles: `[Video Title].[language].vtt` (if enabled)

### 7. Features to Test
- [x] Video downloads
- [x] Audio-only downloads
- [x] Quality selection
- [x] Format selection
- [x] Progress tracking
- [x] Subtitle downloads
- [x] Thumbnail downloads
- [x] Download management (pause/resume/cancel)
- [x] Dark/Light theme toggle
- [x] Settings panel
- [x] **🆕 Preview downloaded files**
- [x] **🆕 Open file location**
- [x] **🆕 Toast notifications**
- [x] **🆕 File information display**

### 8. Performance
- Downloads run in the background
- Multiple downloads are supported
- Real-time progress updates every 2 seconds
- File operations are cross-platform compatible

### 9. Testing Different Platforms
Try downloading from various supported platforms:
- **YouTube**: Standard video/audio downloads
- **Twitter**: Video tweets
- **Instagram**: Stories, reels, posts
- **TikTok**: Short videos
- **Vimeo**: High-quality videos

### 10. User Experience Testing
- **Responsive Design**: Test on different screen sizes
- **Dark/Light Mode**: Toggle themes and verify appearance
- **Error Handling**: Try invalid URLs to test error messages
- **Performance**: Download multiple files simultaneously
- **File Management**: Test all post-download actions

Enjoy testing your enhanced download manager with improved file management features! 🎉

## Troubleshooting File Operations

### Windows
- Ensure Windows has proper file associations for media files
- Check that Explorer is set as default file manager

### macOS
- Verify default applications are set for media file types
- Ensure Finder permissions are correct

### Linux
- Install a file manager if not already available: `sudo apt install nautilus`
- Verify `xdg-open` is working: `xdg-open .`