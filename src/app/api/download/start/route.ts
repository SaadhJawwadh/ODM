import { NextRequest, NextResponse } from 'next/server'
import { mkdirSync, existsSync, readFileSync, statSync, readFile, unlink, readdirSync } from 'fs'
import { join } from 'path'
import { promisify } from 'util'
import { broadcast, initWebSocketServer } from '@/lib/websocket'
import { ensureYtDlp } from '@/lib/yt-dlp-downloader'
import { downloadVideo } from '@/lib/ytdlp-manager'

// Initialize WebSocket server
initWebSocketServer()

const readFileAsync = promisify(readFile)
const unlinkAsync = promisify(unlink)

// Ensure temp directory exists
const tempDir = './temp'
if (!existsSync(tempDir)) {
    mkdirSync(tempDir, { recursive: true })
}

// MIME type mapping for common file extensions
const getMimeType = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase()
    const mimeTypes: { [key: string]: string } = {
        // Video formats
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'avi': 'video/x-msvideo',
        'mov': 'video/quicktime',
        'wmv': 'video/x-ms-wmv',
        'flv': 'video/x-flv',
        'mkv': 'video/x-matroska',
        '3gp': 'video/3gpp',
        'm4v': 'video/x-m4v',
        'ogv': 'video/ogg',

        // Audio formats
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'flac': 'audio/flac',
        'aac': 'audio/aac',
        'ogg': 'audio/ogg',
        'wma': 'audio/x-ms-wma',
        'opus': 'audio/opus',
        'm4a': 'audio/mp4',
        'aiff': 'audio/aiff',
        'au': 'audio/basic',

        // Image formats
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'bmp': 'image/bmp',
        'svg': 'image/svg+xml',
        'ico': 'image/x-icon',
        'tiff': 'image/tiff',
        'webp': 'image/webp',

        // Document formats
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'txt': 'text/plain',
        'rtf': 'application/rtf',

        // Subtitle formats
        'srt': 'text/srt',
        'vtt': 'text/vtt',
        'ass': 'text/x-ass',
        'ssa': 'text/x-ssa',
        'sub': 'text/x-microdvd',

        // Archive formats
        'zip': 'application/zip',
        'rar': 'application/x-rar-compressed',
        '7z': 'application/x-7z-compressed',
        'tar': 'application/x-tar',
        'gz': 'application/gzip'
    }

    return mimeTypes[ext || ''] || 'application/octet-stream'
}

// Store active downloads in global scope for sharing between API routes
let activeDownloads: Map<string, any>

// Get the shared downloads map
try {
    if (typeof global !== 'undefined') {
        if (!global.activeDownloads) {
            global.activeDownloads = new Map()
        }
        activeDownloads = global.activeDownloads
    } else {
        activeDownloads = new Map()
    }
} catch (error) {
    activeDownloads = new Map()
}

export async function POST(request: NextRequest) {
    try {
        await ensureYtDlp(broadcast);
        const { url, format, quality, audioOnly, subtitles, thumbnails, id } = await request.json()

        if (!url || !id) {
            return NextResponse.json({ error: 'URL and ID are required' }, { status: 400 })
        }

        // Build options for yt-dlp-wrap
        const options = {
            format: audioOnly ? (format || 'mp3') : undefined,
            output: `./temp/%(title)s.%(ext)s`,
            audioOnly,
            timeout: 300000, // 5 minutes
            onProgress: (progressData: any) => {
                const download = activeDownloads.get(id)
                if (!download) return

                // Handle different progress data formats from yt-dlp-wrap
                let progressValue = 0
                let speed = ''
                let eta = ''
                let fileName = ''
                let fileSize = ''

                if (progressData.percent) {
                    progressValue = parseFloat(progressData.percent)
                }

                if (progressData.currentSpeed) {
                    speed = progressData.currentSpeed
                }

                if (progressData.eta) {
                    eta = progressData.eta
                }

                if (progressData.totalSize) {
                    fileSize = progressData.totalSize
                }

                // Only update if progress has actually changed
                if (download.progress !== progressValue) {
                    download.progress = progressValue
                    download.speed = speed
                    download.eta = eta
                    download.fileName = fileName
                    download.fileSize = fileSize

                    // If we reach 100%, mark as ready but don't finalize yet
                    if (progressValue >= 100) {
                        download.status = 'ready'
                    } else {
                        download.status = 'downloading'
                    }

                    console.log(`Progress update for ${id}: ${progressValue}%`)
                    broadcast({
                        type: 'progress',
                        id,
                        status: download.status,
                        progress: progressValue,
                        speed,
                        eta,
                        fileName,
                        fileSize
                    })
                }
            }
        }

        // Handle video format selection
        if (!audioOnly) {
            if (quality === 'best') {
                options.format = 'best'
            } else if (quality === 'worst') {
                options.format = 'worst'
            } else {
                // For specific quality numbers like 1080, 720, etc.
                const qualityNum = parseInt(quality)
                if (!isNaN(qualityNum)) {
                    options.format = `best[height<=${qualityNum}]`
                } else {
                    options.format = 'best'
                }
            }
        }

        // Store the download info
        activeDownloads.set(id, {
            process: null, // yt-dlp-wrap handles the process internally
            status: 'downloading',
            progress: 0,
            speed: '',
            eta: '',
            fileName: '',
            fileSize: '',
            filePath: '',
            abortController: null
        })

        // Immediately broadcast the initial status
        console.log(`Download started for ${id}`)
        broadcast({ type: 'progress', id, status: 'downloading', progress: 0, speed: '', eta: '', fileName: '', fileSize: '' })

        // Start download using yt-dlp-wrap
        try {
            const result = await downloadVideo(url, options)

            const download = activeDownloads.get(id)
            if (download) {
                // Find the actual downloaded file
                const tempDir = join(process.cwd(), 'temp')
                let actualFilePath = ''
                let actualFileName = ''

                if (existsSync(tempDir)) {
                    const files = readdirSync(tempDir)
                    // Find the most recently modified file (the downloaded one)
                    const sortedFiles = files
                        .map(file => ({
                            name: file,
                            path: join(tempDir, file),
                            stats: statSync(join(tempDir, file))
                        }))
                        .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime())

                    if (sortedFiles.length > 0) {
                        actualFilePath = sortedFiles[0].path
                        actualFileName = sortedFiles[0].name
                    }
                }

                download.status = 'ready' // Use 'ready' instead of 'completed' for frontend compatibility
                download.progress = 100
                download.filePath = actualFilePath
                download.fileName = actualFileName

                console.log(`Download completed for ${id}: ${actualFileName}`)
                broadcast({
                    type: 'completed',
                    id,
                    status: 'ready',
                    progress: 100,
                    speed: '',
                    eta: '',
                    fileName: actualFileName,
                    fileSize: download.fileSize,
                    filePath: actualFilePath
                })
            }
        } catch (error) {
            console.error(`Download failed for ${id}:`, error)

            const download = activeDownloads.get(id)
            if (download) {
                download.status = 'failed'
                broadcast({
                    type: 'error',
                    id,
                    status: 'failed',
                    progress: download.progress,
                    speed: '',
                    eta: '',
                    fileName: download.fileName,
                    fileSize: download.fileSize,
                    error: error instanceof Error ? error.message : 'Unknown error'
                })
            }
        }

        return NextResponse.json({ status: 'started', id })
    } catch (error) {
        console.error('Error starting download:', error)
        return NextResponse.json({ error: 'Failed to start download' }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const action = searchParams.get('action')

    if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const download = activeDownloads.get(id)
    if (!download) {
        return NextResponse.json({ error: 'Download not found' }, { status: 404 })
    }

    // If action is 'stream', stream the file to browser
    if (action === 'stream' && download.filePath && download.status === 'ready') {
        try {
            // Check if file exists
            if (!existsSync(download.filePath)) {
                return NextResponse.json({ error: 'File not found' }, { status: 404 })
            }

            // Update status to completed
            download.status = 'completed'
            download.progress = 100

            // Read the file
            const fileBuffer = await readFileAsync(download.filePath)
            const fileName = download.fileName || 'download'

            // Get proper MIME type
            const mimeType = getMimeType(fileName)
            console.log(`Streaming file: ${fileName} with MIME type: ${mimeType}`)

            // Create response with file
            const response = new NextResponse(fileBuffer, {
                headers: {
                    'Content-Type': mimeType,
                    'Content-Disposition': `attachment; filename="${fileName}"`,
                    'Content-Length': fileBuffer.length.toString(),
                    'Cache-Control': 'no-cache'
                }
            })

            // Clean up the temp file after a delay to ensure download completes
            setTimeout(async () => {
                try {
                    if (existsSync(download.filePath)) {
                        await unlinkAsync(download.filePath)
                        console.log(`Cleaned up temp file: ${download.filePath}`)
                    }
                } catch (error) {
                    console.error('Error cleaning up temp file:', error)
                }
            }, 5000) // 5 second delay

            return response
        } catch (error) {
            console.error('Stream error:', error)
            download.status = 'error'
            download.error = error instanceof Error ? error.message : 'Failed to stream file'
            return NextResponse.json({ error: 'Failed to stream file' }, { status: 500 })
        }
    }

    return NextResponse.json({
        id,
        status: download.status,
        progress: download.progress,
        speed: download.speed,
        eta: download.eta,
        error: download.error,
        fileName: download.fileName,
        fileSize: download.fileSize
    })
}