# ODM: One Download Manager

A modern, web-based download manager powered by [yt-dlp](https://github.com/yt-dlp/yt-dlp) and built with Next.js. Download videos and audio from thousands of platforms with a beautiful, intuitive interface.

## Features

### 🎯 Core Features
- **Universal Download Support**: Download from YouTube, Vimeo, Twitter, Instagram, TikTok, and [1000+ other platforms](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md)
- **Video & Audio Downloads**: Choose between video downloads or audio-only extraction
- **Quality Selection**: Select from various quality options (4K, 1080p, 720p, etc.)
- **Format Options**: Multiple output formats (MP4, WebM, MKV, MP3, AAC, FLAC, etc.)
- **Real-time Progress**: Live download progress with speed and ETA information
- **Batch Downloads**: Download multiple videos simultaneously
- **Download Management**: Pause, resume, and cancel downloads

### 🎨 Modern UI/UX
- **Dark/Light Theme**: Toggle between dark and light themes
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Smooth Animations**: Framer Motion powered animations and transitions
- **Intuitive Interface**: Clean, modern design with excellent usability
- **Real-time Updates**: Live progress tracking and status updates
- **Toast Notifications**: Instant feedback for all user actions

### ⚙️ Advanced Features
- **Custom Settings**: Configure default quality, formats, and download locations
- **Subtitle Support**: Download subtitles and closed captions
- **Thumbnail Downloads**: Save video thumbnails alongside downloads
- **Download History**: Track and manage your download history
- **Error Handling**: Comprehensive error reporting and recovery

### 📁 Post-Download Features
- **Preview Files**: Open downloaded files with default system applications
- **Open File Location**: Quickly navigate to downloaded files in file explorer
- **File Information**: Display file names, sizes, and save locations
- **Cross-Platform Support**: File operations work on Windows, macOS, and Linux

## Prerequisites

Before installing, make sure you have:

1. **Node.js** (v18 or higher)
2. **npm** or **yarn** package manager
3. **yt-dlp** installed globally on your system

### Installing yt-dlp

#### Windows
```bash
# Using winget
winget install yt-dlp

# Using pip
pip install yt-dlp

# Using chocolatey
choco install yt-dlp
```

#### macOS
```bash
# Using Homebrew
brew install yt-dlp

# Using pip
pip install yt-dlp
```

#### Linux
```bash
# Using pip
pip install yt-dlp

# Using apt (Ubuntu/Debian)
sudo apt install yt-dlp

# Using pacman (Arch Linux)
sudo pacman -S yt-dlp
```

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

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **State Management**: Zustand
- **Backend**: Next.js API Routes
- **Download Engine**: yt-dlp
- **Icons**: Lucide React

## Configuration

### Environment Variables
Create a `.env.local` file in the root directory:

```env
# Optional: Custom download directory
DOWNLOAD_PATH=./downloads

# Optional: Maximum concurrent downloads
MAX_CONCURRENT_DOWNLOADS=3
```

### Custom yt-dlp Options
You can customize yt-dlp behavior by modifying the API routes in `src/app/api/`.

## Development

### Project Structure
```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Main page
├── components/         # React components
├── store/             # Zustand store
└── types/             # TypeScript types
```

### Available Scripts
```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
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

## Disclaimer

This tool is for educational and personal use only. Please respect copyright laws and terms of service of the platforms you're downloading from. The developers are not responsible for any misuse of this software.