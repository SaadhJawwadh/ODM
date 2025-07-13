import { NextRequest, NextResponse } from 'next/server'
import { unlink, existsSync } from 'fs'
import { promisify } from 'util'

const unlinkAsync = promisify(unlink)

// Import the shared activeDownloads map
let activeDownloads: Map<string, any>

// Get the shared downloads map from the start route
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
                if (download.status === 'downloading') {
                    download.status = 'paused'
                    download.abortController?.abort()
                }
                break

            case 'resume':
                if (download.status === 'paused') {
                    download.status = 'ready'
                    // Frontend will handle resuming the download
                }
                break

            case 'cancel':
                // Kill the preparation process if still running
                if (download.process && !download.process.killed) {
                    download.process.kill('SIGTERM')
                }

                // Abort any active download
                if (download.abortController) {
                    download.abortController.abort()
                }

                // Remove from active downloads
                activeDownloads.delete(id)
                break

            case 'delete':
                // Kill the process if still running
                if (download.process && !download.process.killed) {
                    download.process.kill('SIGTERM')
                }

                // Abort any active download
                if (download.abortController) {
                    download.abortController.abort()
                }

                // Delete the physical file if it exists
                if (download.filePath && existsSync(download.filePath)) {
                    try {
                        await unlinkAsync(download.filePath)
                        console.log(`Deleted file: ${download.filePath}`)
                    } catch (error) {
                        console.error(`Failed to delete file ${download.filePath}:`, error)
                    }
                }

                // Also try to delete common file patterns in temp directory
                if (download.fileName) {
                    const tempDir = './temp'
                    const possibleFiles = [
                        `${tempDir}/${download.fileName}`,
                        `${tempDir}/${download.fileName.replace(/\.[^/.]+$/, '')}.mp4`,
                        `${tempDir}/${download.fileName.replace(/\.[^/.]+$/, '')}.webp`,
                        `${tempDir}/${download.fileName.replace(/\.[^/.]+$/, '')}.mp3`
                    ]

                    for (const filePath of possibleFiles) {
                        if (existsSync(filePath)) {
                            try {
                                await unlinkAsync(filePath)
                                console.log(`Deleted file: ${filePath}`)
                            } catch (error) {
                                console.error(`Failed to delete file ${filePath}:`, error)
                            }
                        }
                    }
                }

                // Remove from active downloads
                activeDownloads.delete(id)
                break

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

        const responseData = action === 'cancel' || action === 'delete'
            ? { success: true, id, action, deleted: true }
            : { success: true, id, action, status: download.status }

        return NextResponse.json(responseData)
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
            error: download.error,
            fileName: download.fileName,
            fileSize: download.fileSize,
            downloadUrl: download.downloadUrl
        }))

        return NextResponse.json({ downloads })
    } catch (error) {
        console.error('Get downloads error:', error)
        return NextResponse.json({ error: 'Failed to get downloads' }, { status: 500 })
    }
}