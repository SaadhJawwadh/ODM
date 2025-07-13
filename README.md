# ODM: One Download Manager

A modern, web-based download manager powered by multiple download engines and built with Next.js. Download videos and audio from thousands of platforms with a beautiful, intuitive interface.

## Features

### 🎯 Core Features
- **Universal Download Support**: Download from YouTube, Vimeo, Twitter, Instagram, TikTok, and [1000+ other platforms](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md)
- **Multiple Download Engines**: Supports yt-dlp, youtube-dl-exec, ytdl-core, Instagram API, and more
- **Video & Audio Downloads**: Choose between video downloads or audio-only extraction
- **Quality Selection**: Select from various quality options (4K, 1080p, 720p, etc.)
- **Format Options**: Multiple output formats (MP4, WebM, MKV, MP3, AAC, FLAC, etc.)
- **Real-time Progress**: Live download progress with WebSocket updates, speed and ETA information
- **Batch Downloads**: Download multiple videos simultaneously
- **Download Management**: Pause, resume, and cancel downloads
- **Smart Engine Selection**: Automatically chooses the best download engine for each platform

### 🎨 Modern UI/UX
- **Dark/Light Theme**: Toggle between dark and light themes
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Smooth Animations**: Framer Motion powered animations and transitions
- **Intuitive Interface**: Clean, modern design with excellent usability
- **Real-time Updates**: Live progress tracking and status updates via WebSocket
- **Toast Notifications**: Instant feedback for all user actions

### ⚙️ Advanced Features
- **Custom Settings**: Configure default quality, formats, and download locations
- **Subtitle Support**: Download subtitles and closed captions
- **Thumbnail Downloads**: Save video thumbnails alongside downloads
- **Download History**: Track and manage your download history
- **Error Handling**: Comprehensive error reporting and recovery
- **System Status**: Real-time system health monitoring

### 📁 Post-Download Features
- **Preview Files**: Open downloaded files with default system applications
- **Open File Location**: Quickly navigate to downloaded files in file explorer
- **File Information**: Display file names, sizes, and save locations
- **Cross-Platform Support**: File operations work on Windows, macOS, and Linux

## Prerequisites

Before installing, make sure you have:

1. **Node.js** (v18 or higher)
2. **npm** or **yarn** package manager
3. **yt-dlp** installed globally on your system (primary engine)

### Installing Download Engines

#### yt-dlp (Primary Engine)

**Windows:**
```bash
# Using winget
winget install yt-dlp

# Using pip
pip install yt-dlp

# Using chocolatey
choco install yt-dlp
```

**macOS:**
```bash
# Using Homebrew
brew install yt-dlp

# Using pip
pip install yt-dlp
```

**Linux:**
```bash
# Using pip
pip install yt-dlp

# Using apt (Ubuntu/Debian)
sudo apt install yt-dlp

# Using pacman (Arch Linux)
sudo pacman -S yt-dlp
```

#### Additional Engines (Optional)
The application includes built-in support for:
- **youtube-dl-exec**: Alternative YouTube downloader
- **ytdl-core**: Fast YouTube streaming
- **Instagram API**: Direct Instagram integration
- **Automatic fallback**: If primary engine fails, automatically tries alternatives

## Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/odm-one-download-manager.git
cd odm-one-download-manager
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Create downloads directory**
```bash
mkdir downloads
```

4. **Run the development server**
```bash
npm run dev
# or
yarn dev
```

5. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Basic Download
1. Paste a video URL in the input field
2. Click "Get Info" to preview the video details
3. Choose your preferred quality and format
4. Click "Start Download"

### Advanced Options
- **Audio Only**: Toggle to download only audio
- **Quality**: Select from various quality options
- **Format**: Choose output format (MP4, WebM, MKV for video; MP3, AAC, FLAC for audio)
- **Subtitles**: Download subtitles and closed captions
- **Thumbnails**: Save video thumbnails

### Post-Download Actions
Once a download is completed, you'll see additional options:
- **👁️ Preview File**: Opens the downloaded file with your default application
- **📁 Open File Location**: Opens the folder containing the downloaded file
- **File Information**: View file name, size, and save location

### Download Management
- **▶️ Resume**: Continue paused downloads
- **⏸️ Pause**: Temporarily stop active downloads
- **❌ Cancel**: Stop and remove downloads from queue
- **🗑️ Clear Completed**: Remove all completed downloads from history

### Settings
Access the settings panel to configure:
- Default output directory
- Default quality and format preferences
- Maximum concurrent downloads
- Theme preferences
- Auto-download options for subtitles and thumbnails

## Supported Platforms

This application supports downloading from 1000+ platforms including:

- **Video Platforms**: YouTube, Vimeo, Dailymotion, Twitch
- **Social Media**: Twitter, Instagram, TikTok, Facebook
- **Educational**: Khan Academy, Coursera, edX
- **News**: BBC, CNN, Reuters
- **And many more**: [Full list of supported sites](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md)

## Technology Stack

### Core Technologies
- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **State Management**: Zustand
- **Backend**: Next.js API Routes
- **Real-time Communication**: WebSocket (Socket.IO)

### Download Engines
- **Primary**: yt-dlp (universal support)
- **YouTube**: @distube/ytdl-core, youtubei.js, youtube-dl-exec
- **Instagram**: instagram-private-api, @brahmbeyond/instareel
- **Fallback**: Automatic engine selection based on platform

### Supporting Libraries
- **Icons**: Lucide React
- **WebSocket**: Socket.IO Client & Server
- **File Operations**: Node.js fs/promises
- **Process Management**: Node.js child_process

## Configuration

### Environment Variables
Create a `.env.local` file in the root directory:

```env
# Optional: Custom download directory
DOWNLOAD_PATH=./downloads

# Optional: Maximum concurrent downloads
MAX_CONCURRENT_DOWNLOADS=3

# Primary engine preference
PRIMARY_ENGINE=yt-dlp

# Enable engine fallback
ENABLE_FALLBACK=true

# Instagram API credentials (optional)
INSTAGRAM_USERNAME=your_username
INSTAGRAM_PASSWORD=your_password

# WebSocket settings
WEBSOCKET_PORT=3001
ENABLE_WEBSOCKET=true
```

### Performance Tuning
```env
# Concurrent downloads per engine
MAX_CONCURRENT_YTDLP=2
MAX_CONCURRENT_YOUTUBE=3
MAX_CONCURRENT_INSTAGRAM=1

# Buffer sizes
DOWNLOAD_BUFFER_SIZE=1048576
WEBSOCKET_BUFFER_SIZE=65536
```

## API Documentation

### WebSocket Events
```typescript
// Client → Server
socket.emit('start_download', { url, options });
socket.emit('pause_download', { id });
socket.emit('resume_download', { id });
socket.emit('cancel_download', { id });

// Server → Client
socket.on('download_progress', (data) => {
  // { id, progress, speed, eta, status }
});
socket.on('download_complete', (data) => {
  // { id, filename, filepath, size }
});
socket.on('download_error', (data) => {
  // { id, error, retry_count }
});
socket.on('system_status', (data) => {
  // { engine, status, version, health }
});
```

### REST API Endpoints
```
GET  /api/video/info     - Get video information
POST /api/download/start - Start download
POST /api/download/control - Control download (pause/resume/cancel)
GET  /api/sites          - Get supported sites
POST /api/files/open     - Open file/folder
GET  /api/ytdlp          - Get engine status
```

## Development

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── download/      # Download management
│   │   ├── video/         # Video information
│   │   ├── files/         # File operations
│   │   └── ytdlp/         # Engine management
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── DownloadForm.tsx   # Download form
│   ├── DownloadItem.tsx   # Download item
│   ├── SystemStatus.tsx   # System monitoring
│   └── YtDlpStatusSection.tsx # Engine status
├── lib/                   # Core libraries
│   ├── yt-dlp-downloader.ts # Download engine
│   ├── ytdlp-manager.ts   # Engine management
│   └── websocket.ts       # WebSocket client
├── store/                 # State management
│   └── downloadStore.ts   # Zustand store
└── types/                 # TypeScript types
    ├── global.d.ts        # Global types
    └── index.ts           # Exported types
```

### Available Scripts
```bash
# Development with WebSocket
npm run dev

# Build for production
npm run build

# Start production server (includes WebSocket)
npm start

# Lint code
npm run lint

# Test download engines
node test-ytdlp.js
```

## File Operations

The application provides seamless file management after downloads:

### Preview Files
- **Windows**: Uses `start` command
- **macOS**: Uses `open` command
- **Linux**: Uses `xdg-open` command

### Open File Location
- **Windows**: Opens Explorer with file selected
- **macOS**: Opens Finder with file revealed
- **Linux**: Opens default file manager

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - The powerful download engine
- [Next.js](https://nextjs.org) - The React framework
- [Tailwind CSS](https://tailwindcss.com) - For styling
- [Framer Motion](https://framer.com/motion) - For animations
- [Lucide](https://lucide.dev) - For icons

## Support

If you encounter any issues or have questions:

1. Check the [yt-dlp documentation](https://github.com/yt-dlp/yt-dlp#readme)
2. Search existing [issues](https://github.com/yourusername/odm-one-download-manager/issues)
3. Create a new issue with detailed information

## Real-time Features

### WebSocket Integration
The application uses WebSocket connections for:
- **Live Progress Updates**: Real-time download progress without polling
- **System Status**: Instant notifications about system health
- **Error Reporting**: Immediate feedback on download failures
- **Queue Management**: Real-time queue status updates

### System Monitoring
- **Engine Health**: Monitor download engine availability
- **Performance Metrics**: Track download speeds and system resources
- **Auto-Recovery**: Automatic restart of failed downloads
- **Intelligent Routing**: Route requests to optimal download engines

## Multi-Engine Architecture

### Engine Selection Strategy
1. **Platform Detection**: Automatically detect the source platform
2. **Engine Preference**: Choose the most suitable engine for each platform
3. **Fallback Chain**: If primary engine fails, try alternatives
4. **Performance Monitoring**: Track engine performance and adapt

### Supported Platforms by Engine
- **yt-dlp**: Universal support for 1000+ platforms
- **YouTube Engines**: Optimized for YouTube content
- **Instagram Engines**: Direct Instagram API integration
- **Twitter/X**: Enhanced Twitter video support
- **TikTok**: Specialized TikTok handling

## Advanced Configuration

### Multi-Engine Settings
```env
# Primary engine preference
PRIMARY_ENGINE=yt-dlp

# Enable engine fallback
ENABLE_FALLBACK=true

# Instagram API credentials (optional)
INSTAGRAM_USERNAME=your_username
INSTAGRAM_PASSWORD=your_password

# WebSocket settings
WEBSOCKET_PORT=3001
ENABLE_WEBSOCKET=true
```

### Performance Tuning
```env
# Concurrent downloads per engine
MAX_CONCURRENT_YTDLP=2
MAX_CONCURRENT_YOUTUBE=3
MAX_CONCURRENT_INSTAGRAM=1

# Buffer sizes
DOWNLOAD_BUFFER_SIZE=1048576
WEBSOCKET_BUFFER_SIZE=65536
```

## API Documentation

### WebSocket Events
```typescript
// Client → Server
socket.emit('start_download', { url, options });
socket.emit('pause_download', { id });
socket.emit('resume_download', { id });
socket.emit('cancel_download', { id });

// Server → Client
socket.on('download_progress', (data) => {
  // { id, progress, speed, eta, status }
});
socket.on('download_complete', (data) => {
  // { id, filename, filepath, size }
});
socket.on('download_error', (data) => {
  // { id, error, retry_count }
});
socket.on('system_status', (data) => {
  // { engine, status, version, health }
});
```

### REST API Endpoints
```
GET  /api/video/info     - Get video information
POST /api/download/start - Start download
POST /api/download/control - Control download (pause/resume/cancel)
GET  /api/sites          - Get supported sites
POST /api/files/open     - Open file/folder
GET  /api/ytdlp          - Get engine status
```

## Version History

### v0.1.0 (Current)
- ✅ Multi-engine download support
- ✅ Real-time WebSocket updates
- ✅ Instagram API integration
- ✅ Advanced system monitoring
- ✅ Intelligent engine fallback
- ✅ Cross-platform file operations
- ✅ Enhanced error handling
- ✅ Performance optimizations

### Planned Features
- 🔄 Playlist download support
- 🔄 Scheduled downloads
- 🔄 Download queue management
- 🔄 Cloud storage integration
- 🔄 Mobile app companion
- 🔄 Plugin system for custom engines

## Troubleshooting

### Common Issues

**WebSocket Connection Failed**
```bash
# Check if WebSocket server is running
netstat -an | grep 3001

# Restart with WebSocket debugging
DEBUG=socket.io* npm run dev
```

**Multiple Engine Conflicts**
```bash
# Reset engine cache
rm -rf node_modules/.cache/ytdlp

# Reinstall engines
npm install --force
```

**Instagram Downloads Not Working**
```bash
# Check Instagram API status
curl -X GET http://localhost:3000/api/ytdlp

# Configure Instagram credentials
echo "INSTAGRAM_USERNAME=your_username" >> .env.local
echo "INSTAGRAM_PASSWORD=your_password" >> .env.local
```

### Performance Optimization
- **Concurrent Downloads**: Adjust `MAX_CONCURRENT_DOWNLOADS` based on your system
- **Engine Selection**: Use `PRIMARY_ENGINE` to prefer specific engines
- **Buffer Sizes**: Increase buffer sizes for better performance on fast connections
- **WebSocket**: Disable WebSocket if not needed: `ENABLE_WEBSOCKET=false`

## Disclaimer

This tool is for educational and personal use only. Please respect copyright laws and terms of service of the platforms you're downloading from. The developers are not responsible for any misuse of this software.

### Legal Considerations
- **Copyright**: Only download content you have permission to download
- **Terms of Service**: Respect platform terms of service
- **Rate Limiting**: Application includes built-in rate limiting to prevent abuse
- **Privacy**: No user data is collected or transmitted to third parties