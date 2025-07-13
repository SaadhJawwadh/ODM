import { NextRequest, NextResponse } from 'next/server';
import { systemYtDlpManager, getEngineStatus, updateConfig, SystemYtDlpConfig } from '@/lib/system-ytdlp-config';

export async function GET() {
    try {
        const status = await getEngineStatus();

        return NextResponse.json({
            success: true,
            data: status
        });
    } catch (error) {
        console.error('Error getting system yt-dlp status:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to get system yt-dlp status',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { config }: { config: Partial<SystemYtDlpConfig> } = body;

        if (!config) {
            return NextResponse.json({
                success: false,
                error: 'Configuration object is required'
            }, { status: 400 });
        }

        // Update configuration
        updateConfig(config);

        // Get updated status
        const status = await getEngineStatus();

        return NextResponse.json({
            success: true,
            message: 'Configuration updated successfully',
            data: status
        });
    } catch (error) {
        console.error('Error updating system yt-dlp configuration:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to update configuration',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, path }: { action: 'test' | 'validate'; path?: string } = body;

        switch (action) {
            case 'test':
                // Test the current engine
                const engine = await systemYtDlpManager.getBestEngine();
                const testResult = await systemYtDlpManager.executeYtDlpCommand(['--version'], { timeout: 10000 });

                return NextResponse.json({
                    success: true,
                    data: {
                        engine,
                        testResult
                    }
                });

            case 'validate':
                // Validate a specific path
                if (!path) {
                    return NextResponse.json({
                        success: false,
                        error: 'Path is required for validation'
                    }, { status: 400 });
                }

                try {
                    const result = await systemYtDlpManager.executeYtDlpCommand(['--version'], {
                        timeout: 10000
                    });

                    return NextResponse.json({
                        success: true,
                        data: {
                            path,
                            valid: result.success,
                            version: result.stdout.trim(),
                            error: result.stderr
                        }
                    });
                } catch (error) {
                    return NextResponse.json({
                        success: false,
                        data: {
                            path,
                            valid: false,
                            error: error instanceof Error ? error.message : 'Validation failed'
                        }
                    });
                }

            default:
                return NextResponse.json({
                    success: false,
                    error: 'Invalid action. Use "test" or "validate"'
                }, { status: 400 });
        }
    } catch (error) {
        console.error('Error performing system yt-dlp action:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to perform action',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}