import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json()

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 })
        }

        // Get video info using yt-dlp
        const command = `yt-dlp --dump-json --no-warnings "${url}"`

        const { stdout, stderr } = await execAsync(command)

        if (stderr) {
            console.error('yt-dlp error:', stderr)
            return NextResponse.json({ error: 'Failed to get video info' }, { status: 500 })
        }

        const videoInfo = JSON.parse(stdout)

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
            formats: videoInfo.formats?.map((format: any) => ({
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
            })) || []
        }

        return NextResponse.json(response)
    } catch (error) {
        console.error('Error getting video info:', error)
        return NextResponse.json({ error: 'Failed to get video info' }, { status: 500 })
    }
}