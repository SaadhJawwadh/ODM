
import { execSync } from 'child_process';
import { existsSync, mkdirSync, chmodSync, createWriteStream, unlinkSync } from 'fs';
import { join } from 'path';
import { Readable } from 'stream';
import { finished } from 'stream/promises';

const binDir = join(process.cwd(), 'bin');

function getPlatformInfo() {
    const platform = process.platform;
    const arch = process.arch;

    if (platform === 'win32') {
        return {
            name: 'yt-dlp.exe',
            url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe',
        };
    }

    if (platform === 'linux') {
        return {
            name: 'yt-dlp',
            url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp',
        };
    }

    if (platform === 'darwin') {
        return {
            name: 'yt-dlp_macos',
            url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos',
        };
    }

    throw new Error(`Unsupported platform: ${platform}`);
}

async function downloadFile(url: string, path: string) {
    console.log(`Downloading ${url} to ${path}`);
    if (!existsSync(binDir)) {
        mkdirSync(binDir, { recursive: true });
    }
    const response = await fetch(url);
    if (!response.ok || !response.body) {
        throw new Error(`Failed to download file: ${response.statusText}`);
    }
    const body = response.body as unknown as NodeJS.ReadableStream;
    const fileStream = createWriteStream(path, { mode: 0o755 });
    await finished(body.pipe(fileStream));
    console.log('Download finished.');
}

function getYtDlpExecutable(): { path: string; type: 'system' | 'local' } | null {
    try {
        execSync('yt-dlp --version', { stdio: 'ignore' });
        return { path: 'yt-dlp', type: 'system' };
    } catch (e) {
        // Not in path, check local
    }

    const platformInfo = getPlatformInfo();
    const localPath = join(binDir, platformInfo.name);

    if (existsSync(localPath)) {
        if (process.platform !== 'win32') {
            chmodSync(localPath, 0o755); // Ensure it's executable
        }
        return { path: localPath, type: 'local' };
    }

    return null;
}

export async function ensureYtDlp(broadcast?: (data: any) => void): Promise<string> {
    const executable = getYtDlpExecutable();
    if (executable) {
        console.log(`Using ${executable.type} yt-dlp at ${executable.path}`);
        return executable.path;
    }

    if (broadcast) {
        broadcast({ type: 'system_status', message: 'Downloader not found. Installing now...', status: 'installing' });
    }

    console.log('yt-dlp not found, attempting to download...');
    try {
        const platformInfo = getPlatformInfo();
        const localPath = join(binDir, platformInfo.name);
        await downloadFile(platformInfo.url, localPath);
        if (process.platform !== 'win32') {
            chmodSync(localPath, 0o755);
        }
        console.log('yt-dlp downloaded and is ready.');

        if (broadcast) {
            const newStatus = await getYtDlpStatus();
            broadcast({ type: 'system_status', message: `Downloader installed (v${newStatus.version})`, status: 'ready' });
        }

        return localPath;
    } catch (error) {
        console.error('Failed to download yt-dlp:', error);
        throw new Error('Could not automatically install yt-dlp. Please install it manually and ensure it is available in your system\'s PATH.');
    }
}

export async function getYtDlpStatus(): Promise<{ status: 'system' | 'local' | 'not_found', version?: string, path?: string }> {
    const executable = getYtDlpExecutable();
    if (!executable) {
        return { status: 'not_found' };
    }

    try {
        const version = execSync(`"${executable.path}" --version`).toString().trim();
        return { status: executable.type, version, path: executable.path };
    } catch (e) {
        console.error(`Failed to get version for ${executable.path}`, e);
        return { status: 'not_found' };
    }
}

export async function updateYtDlp(): Promise<{ status: 'system' | 'local' | 'not_found', version?: string, path?: string }> {
    console.log('Forcing update of local yt-dlp...');
    const platformInfo = getPlatformInfo();
    const localPath = join(binDir, platformInfo.name);

    if (existsSync(localPath)) {
        unlinkSync(localPath);
        console.log(`Removed existing local binary at ${localPath}`);
    }

    try {
        await downloadFile(platformInfo.url, localPath);
        if (process.platform !== 'win32') {
            chmodSync(localPath, 0o755);
        }
        console.log('yt-dlp downloaded.');
        return await getYtDlpStatus();
    } catch (error) {
        console.error('Failed to download yt-dlp for update:', error);
        throw new Error('Could not update yt-dlp.');
    }
}