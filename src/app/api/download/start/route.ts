import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { createWriteStream } from 'fs'
import { join } from 'path'

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

        // Build yt-dlp command
        const args = [
            '--newline',
            '--no-warnings',
            '--progress',
            '--output', './downloads/%(title)s.%(ext)s'
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

        // Start download process
        const downloadProcess = spawn('yt-dlp', args)

        // Store the process
        activeDownloads.set(id, {
            process: downloadProcess,
            status: 'downloading',
            progress: 0,
            speed: '',
            eta: '',
            filePath: '',
            fileName: '',
            fileSize: ''
        })

        // Handle progress updates
        downloadProcess.stdout.on('data', (data: Buffer) => {
            const output = data.toString()
            console.log(`Download output for ${id}:`, output)
            const lines = output.split('\n').filter(line => line.trim())

            for (const line of lines) {
                const download = activeDownloads.get(id)
                if (!download) continue

                // Extract progress information
                if (line.includes('%')) {
                    const progressMatch = line.match(/(\d+\.?\d*)%/)
                    const speedMatch = line.match(/(\d+\.?\d*\w+\/s)/)
                    const etaMatch = line.match(/ETA (\d+:\d+)/)
                    const sizeMatch = line.match(/of\s+(\d+\.?\d*\w+)/)

                    if (progressMatch) {
                        download.progress = parseFloat(progressMatch[1])
                        download.speed = speedMatch ? speedMatch[1] : ''
                        download.eta = etaMatch ? etaMatch[1] : ''
                        download.fileSize = sizeMatch ? sizeMatch[1] : ''
                    }
                }

                // Extract destination file path
                if (line.includes('[download] Destination:')) {
                    const pathMatch = line.match(/\[download\] Destination: (.+)/)
                    if (pathMatch) {
                        download.filePath = pathMatch[1].trim()
                        download.fileName = pathMatch[1].split(/[\\/]/).pop() || ''
                    }
                }

                // Check for completion
                if (line.includes('100% of') && line.includes('in ')) {
                    download.progress = 100
                    download.status = 'completed'
                }
            }
        })

        downloadProcess.stderr.on('data', (data: Buffer) => {
            console.error(`Download error for ${id}:`, data.toString())
            const download = activeDownloads.get(id)
            if (download) {
                download.status = 'error'
                download.error = data.toString()
            }
        })

        downloadProcess.on('close', (code: number) => {
            const download = activeDownloads.get(id)
            if (download) {
                if (code === 0) {
                    download.status = 'completed'
                    download.progress = 100
                } else {
                    download.status = 'error'
                    download.error = `Process exited with code ${code}`
                }
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

    if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const download = activeDownloads.get(id)
    if (!download) {
        return NextResponse.json({ error: 'Download not found' }, { status: 404 })
    }

    return NextResponse.json({
        id,
        status: download.status,
        progress: download.progress,
        speed: download.speed,
        eta: download.eta,
        error: download.error,
        filePath: download.filePath,
        fileName: download.fileName,
        fileSize: download.fileSize
    })
}