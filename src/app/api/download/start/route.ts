import { NextRequest, NextResponse } from 'next/server'
import { readFile, unlink, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { promisify } from 'util'
import { broadcast } from '@/lib/websocket'
import YTDlpWrap from 'yt-dlp-wrap'

const ytDlpWrap = new YTDlpWrap()

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
        const { url, format, quality, audioOnly, subtitles, thumbnails, id } = await request.json()

        if (!url || !id) {
            return NextResponse.json({ error: 'URL and ID are required' }, { status: 400 })
        }

        const videoInfo = await ytDlpWrap.getVideoInfo(url);
        const title = videoInfo.title || 'video';
        const outputTemplate = `./temp/${title}.%(ext)s`;

        // Build yt-dlp command to download to temp directory
        const args = [
            '--newline',
            '--no-warnings',
            '--progress',
            '--progress-template', '"%(progress)j"',
            '--output', outputTemplate
        ]

        if (audioOnly) {
            args.push('--extract-audio')
            args.push('--audio-format', format || 'mp3')
            if (quality !== 'best' && quality !== 'worst') {
                args.push('--audio-quality', quality)
            }
        } else {
            // Handle video format selection
            if (quality === 'best') {
                args.push('--format', 'best')
            } else if (quality === 'worst') {
                args.push('--format', 'worst')
            } else {
                // For specific quality numbers like 1080, 720, etc.
                const qualityNum = parseInt(quality)
                if (!isNaN(qualityNum)) {
                    args.push('--format', `best[height<=${qualityNum}]`)
                } else {
                    args.push('--format', 'best')
                }
            }
        }

        if (subtitles) {
            args.push('--write-subs')
            args.push('--write-auto-subs')
        }

        if (thumbnails) {
            args.push('--write-thumbnail')
        }

        args.push(url)

        console.log('yt-dlp command:', 'yt-dlp', args.join(' '))

        // Get the singleton instance of YTDlpWrap
        const downloadProcess = ytDlpWrap.exec(args)

        // Store the process
        activeDownloads.set(id, {
            process: downloadProcess,
            status: 'downloading',
            progress: 0,
            speed: '',
            eta: '',
            fileName: `${title}.${videoInfo.ext || 'mp4'}`,
            fileSize: '',
            filePath: '',
            abortController: downloadProcess.controller
        })

        // Handle progress updates using the 'progress' event from yt-dlp-wrap
        downloadProcess.on('progress', (progress) => {
            const download = activeDownloads.get(id)
            if (!download) return

            download.progress = progress.percent;
            download.speed = progress.currentSpeed;
            download.eta = progress.eta;
            download.fileSize = progress.totalSize;

            broadcast({ type: 'progress', id, ...download })
        });

        // Handle metadata event to get filename
        downloadProcess.on('ytDlpEvent', (eventType, eventData) => {
            if (eventType === 'info') {
                 const download = activeDownloads.get(id)
                 if (!download) return

                 const data = JSON.parse(eventData);
                 download.filePath = data._filename || ''; // yt-dlp often uses _filename for the final path
            }
        });


        downloadProcess.on('error', (error) => {
            console.error(`Download error for ${id}:`, error.message)
            const download = activeDownloads.get(id)
            if (download) {
                download.status = 'error'
                download.error = error.message
                broadcast({ type: 'progress', id, ...download })
            }
        });

        downloadProcess.on('close', () => {
            const download = activeDownloads.get(id)
            if (download) {
                // If status is not already error, mark as ready
                if (download.status !== 'error') {
                    download.status = 'ready'
                    download.progress = 100
                }
                broadcast({ type: 'progress', id, ...download })
            }
        })

        return NextResponse.json({ success: true, id })
    } catch (error) {
        console.error('Download start error:', error)
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