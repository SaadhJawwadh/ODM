
import { NextResponse } from 'next/server';
import { getYtDlpStatus, updateYtDlp } from '@/lib/yt-dlp-downloader';

export async function GET() {
    try {
        const status = await getYtDlpStatus();
        return NextResponse.json(status);
    } catch (error) {
        console.error('Failed to get yt-dlp status:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function POST() {
    try {
        const status = await updateYtDlp();
        return NextResponse.json(status);
    } catch (error) {
        console.error('Failed to update yt-dlp:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'Failed to update yt-dlp', details: errorMessage }, { status: 500 });
    }
}