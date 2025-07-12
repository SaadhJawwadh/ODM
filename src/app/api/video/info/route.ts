import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Helper function to format file sizes
function formatFileSize(bytes: number): string {
    if (!bytes) return 'Unknown'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

// Helper function to get quality label
function getQualityLabel(format: any): string {
    if (format.height) {
        return `${format.height}p`
    }
    if (format.abr) {
        return `${format.abr}k`
    }
    if (format.quality) {
        return format.quality
    }
    return format.format_note || 'Unknown'
}

// Helper function to categorize formats
function categorizeFormats(formats: any[]) {
    const videoFormats = formats.filter(f => f.vcodec && f.vcodec !== 'none')
    const audioFormats = formats.filter(f => f.acodec && f.acodec !== 'none' && (!f.vcodec || f.vcodec === 'none'))

    return {
        video: videoFormats.map(format => ({
            format_id: format.format_id,
            ext: format.ext,
            quality: getQualityLabel(format),
            resolution: format.width && format.height ? `${format.width}x${format.height}` : null,
            filesize: format.filesize || format.filesize_approx,
            filesizeFormatted: formatFileSize(format.filesize || format.filesize_approx || 0),
            tbr: format.tbr,
            vbr: format.vbr,
            abr: format.abr,
            fps: format.fps,
            vcodec: format.vcodec,
            acodec: format.acodec,
            format_note: format.format_note,
            hasAudio: format.acodec && format.acodec !== 'none',
            hasVideo: format.vcodec && format.vcodec !== 'none'
        })).sort((a, b) => {
            // Sort by resolution (height) descending
            const aHeight = parseInt(a.resolution?.split('x')[1] || '0')
            const bHeight = parseInt(b.resolution?.split('x')[1] || '0')
            return bHeight - aHeight
        }),
        audio: audioFormats.map(format => ({
            format_id: format.format_id,
            ext: format.ext,
            quality: getQualityLabel(format),
            filesize: format.filesize || format.filesize_approx,
            filesizeFormatted: formatFileSize(format.filesize || format.filesize_approx || 0),
            tbr: format.tbr,
            abr: format.abr,
            acodec: format.acodec,
            format_note: format.format_note,
            hasAudio: true,
            hasVideo: false
        })).sort((a, b) => {
            // Sort by bitrate descending
            return (b.abr || 0) - (a.abr || 0)
        })
    }
}

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json()

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 })
        }

        // Get video info using yt-dlp with additional format details
        const command = `yt-dlp --dump-json --no-warnings "${url}"`

        const { stdout, stderr } = await execAsync(command)

        if (stderr) {
            console.error('yt-dlp error:', stderr)
            return NextResponse.json({ error: 'Failed to get video info' }, { status: 500 })
        }

        const videoInfo = JSON.parse(stdout)

        // Categorize formats
        const categorizedFormats = categorizeFormats(videoInfo.formats || [])

        // Get best video and audio formats for recommendations
        const bestVideo = categorizedFormats.video[0]
        const bestAudio = categorizedFormats.audio[0]

        // Detect content type
        const contentType = videoInfo.duration ? 'video' :
                           videoInfo.formats?.some((f: any) => f.vcodec && f.vcodec !== 'none') ? 'video' :
                           'audio'

        // Calculate estimated file sizes for common qualities
        const estimatedSizes = {
            '1080p': bestVideo?.filesize ? formatFileSize(bestVideo.filesize) : 'Unknown',
            '720p': categorizedFormats.video.find(f => f.resolution?.includes('720'))?.filesizeFormatted || 'Unknown',
            '480p': categorizedFormats.video.find(f => f.resolution?.includes('480'))?.filesizeFormatted || 'Unknown',
            'audio': bestAudio?.filesizeFormatted || 'Unknown'
        }

        // Extract relevant information
        const response = {
            id: videoInfo.id,
            title: videoInfo.title,
            description: videoInfo.description,
            thumbnail: videoInfo.thumbnail,
            duration: videoInfo.duration_string || videoInfo.duration,
            uploader: videoInfo.uploader,
            upload_date: videoInfo.upload_date,
            url: videoInfo.webpage_url,
            contentType,
            estimatedSizes,
            formats: categorizedFormats,
            // Legacy format for backward compatibility
            legacyFormats: videoInfo.formats?.map((format: any) => ({
                format_id: format.format_id,
                ext: format.ext,
                quality: format.quality || format.format_note,
                filesize: format.filesize,
                tbr: format.tbr,
                vbr: format.vbr,
                abr: format.abr,
                fps: format.fps,
                width: format.width,
                height: format.height,
                format_note: format.format_note
            })) || [],
            // Additional metadata
            metadata: {
                viewCount: videoInfo.view_count,
                likeCount: videoInfo.like_count,
                uploadDate: videoInfo.upload_date,
                categories: videoInfo.categories,
                tags: videoInfo.tags?.slice(0, 5) // First 5 tags only
            }
        }

        return NextResponse.json(response)
    } catch (error) {
        console.error('Error getting video info:', error)
        return NextResponse.json({ error: 'Failed to get video info' }, { status: 500 })
    }
}