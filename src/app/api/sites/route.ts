import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function GET() {
    try {
        const command = 'yt-dlp --list-extractors'
        const { stdout, stderr } = await execAsync(command)

        if (stderr) {
            console.error('yt-dlp error:', stderr)
            return NextResponse.json({ error: 'Failed to get supported sites' }, { status: 500 })
        }

        const sites = stdout
            .split('\n')
            .filter(line => line.trim() && !line.startsWith('='))
            .map(site => site.trim())
            .filter(site => site && !site.includes('extractor') && !site.includes('youtube-dl'))

        return NextResponse.json({ sites })
    } catch (error) {
        console.error('Error getting supported sites:', error)
        return NextResponse.json({ error: 'Failed to get supported sites' }, { status: 500 })
    }
}