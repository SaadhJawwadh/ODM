import { NextRequest, NextResponse } from 'next/server'

// Import the shared activeDownloads map
// Note: In a production app, this should be stored in a database or Redis
// For now, we'll create a simple module to share the state
let activeDownloads: Map<string, any>

// Get the shared downloads map from the start route
try {
    // This is a workaround to share state between API routes
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
        const { id, action } = await request.json()

        if (!id || !action) {
            return NextResponse.json({ error: 'ID and action are required' }, { status: 400 })
        }

        const download = activeDownloads.get(id)
        if (!download) {
            return NextResponse.json({ error: 'Download not found' }, { status: 404 })
        }

        switch (action) {
            case 'pause':
                if (download.process && !download.process.killed) {
                    // Use SIGTERM for Windows compatibility
                    download.process.kill('SIGTERM')
                    download.status = 'paused'
                }
                break

            case 'resume':
                // Resume is not directly supported with yt-dlp
                // We would need to restart the download
                download.status = 'pending'
                break

            case 'cancel':
                if (download.process && !download.process.killed) {
                    download.process.kill('SIGTERM')
                }
                activeDownloads.delete(id)
                break

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

        return NextResponse.json({ success: true, id, action, status: download.status })
    } catch (error) {
        console.error('Download control error:', error)
        return NextResponse.json({ error: 'Failed to control download' }, { status: 500 })
    }
}

export async function GET() {
    try {
        const downloads = Array.from(activeDownloads.entries()).map(([id, download]) => ({
            id,
            status: download.status,
            progress: download.progress,
            speed: download.speed,
            eta: download.eta,
            error: download.error
        }))

        return NextResponse.json({ downloads })
    } catch (error) {
        console.error('Get downloads error:', error)
        return NextResponse.json({ error: 'Failed to get downloads' }, { status: 500 })
    }
}