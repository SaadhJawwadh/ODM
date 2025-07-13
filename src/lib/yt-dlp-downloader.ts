
import {
    getYtdlpPath,
    validateYtdlpInstallation,
    getYtdlpSystemInfo,
    YtDlpNotFoundError
} from './ytdlp-manager';

/**
 * Ensures yt-dlp is available using yt-dlp-wrap
 */
export async function ensureYtDlp(broadcast?: (data: any) => void): Promise<string> {
    try {
        // Check if yt-dlp is already available
        const systemInfo = await getYtdlpSystemInfo();
        if (systemInfo.available) {
            console.log(`Using ${systemInfo.source} yt-dlp at ${systemInfo.path}`);
            return systemInfo.path!;
        }
    } catch (error) {
        // If validation fails, yt-dlp-wrap will handle downloading
        console.log('yt-dlp not found, yt-dlp-wrap will download it automatically...');
    }

    if (broadcast) {
        broadcast({ type: 'system_status', message: 'Downloader not found. Installing now...', status: 'installing' });
    }

    try {
        // yt-dlp-wrap will automatically download the binary when needed
        const validation = await validateYtdlpInstallation();
        console.log('yt-dlp is ready.');

        if (broadcast) {
            const newStatus = await getYtDlpStatus();
            broadcast({ type: 'system_status', message: `Downloader ready (v${newStatus.version})`, status: 'ready' });
        }

        return validation.path;
    } catch (error) {
        console.error('Failed to setup yt-dlp:', error);
        throw new Error('Could not setup yt-dlp. Please check your network connection and try again.');
    }
}

/**
 * Get yt-dlp status
 */
export async function getYtDlpStatus(): Promise<{ status: 'system' | 'local' | 'not_found', version?: string, path?: string }> {
    try {
        const systemInfo = await getYtdlpSystemInfo();
        if (systemInfo.available) {
            return {
                status: systemInfo.source === 'bundled' ? 'local' : 'system',
                version: systemInfo.version,
                path: systemInfo.path
            };
        }
    } catch (error) {
        console.error('Error getting yt-dlp status:', error);
    }

    return { status: 'not_found' };
}

/**
 * Update yt-dlp binary
 */
export async function updateYtDlp(): Promise<{ status: 'system' | 'local' | 'not_found', version?: string, path?: string }> {
    try {
        // With yt-dlp-wrap, we need to clear the instance and re-download
        // This is handled by the initializeYtDlp function in ytdlp-manager
        const validation = await validateYtdlpInstallation();

        return {
            status: 'local',
            version: validation.version,
            path: validation.path
        };
    } catch (error) {
        console.error('Error updating yt-dlp:', error);
        throw new Error('Failed to update yt-dlp. Please check your network connection and try again.');
    }
}