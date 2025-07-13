
import { execSync, spawn } from 'child_process';
import { existsSync, mkdirSync, chmodSync, createWriteStream, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Readable } from 'stream';
import { finished } from 'stream/promises';
import { promisify } from 'util';

const execAsync = promisify(require('child_process').exec);
const binDir = join(process.cwd(), 'bin');

interface PlatformInfo {
    name: string;
    url: string;
    pythonName?: string;
}

function getPlatformInfo(): PlatformInfo {
    const platform = process.platform;
    const arch = process.arch;

    if (platform === 'win32') {
        return {
            name: 'yt-dlp.exe',
            url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe',
            pythonName: 'yt-dlp'
        };
    }

    if (platform === 'linux') {
        return {
            name: 'yt-dlp',
            url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp',
            pythonName: 'yt-dlp'
        };
    }

    if (platform === 'darwin') {
        return {
            name: 'yt-dlp_macos',
            url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos',
            pythonName: 'yt-dlp'
        };
    }

    throw new Error(`Unsupported platform: ${platform}`);
}

async function downloadFile(url: string, path: string) {
    console.log(`Downloading ${url} to ${path}`);
    if (!existsSync(binDir)) {
        mkdirSync(binDir, { recursive: true });
    }

    try {
        const response = await fetch(url);
        if (!response.ok || !response.body) {
            throw new Error(`Failed to download file: ${response.statusText}`);
        }
        const body = response.body as unknown as NodeJS.ReadableStream;
        const fileStream = createWriteStream(path, { mode: 0o755 });
        await finished(body.pipe(fileStream));
        console.log('Download finished.');
    } catch (error) {
        console.error('Download failed:', error);
        throw error;
    }
}

// Enhanced detection with multiple fallback strategies
function getYtDlpExecutable(): { path: string; type: 'system' | 'local' | 'python' | 'embedded' } | null {
    // Strategy 1: Try system-installed yt-dlp
    try {
        execSync('yt-dlp --version', { stdio: 'ignore' });
        console.log('Found system yt-dlp');
        return { path: 'yt-dlp', type: 'system' };
    } catch (e) {
        console.log('System yt-dlp not found, trying alternatives...');
    }

    // Strategy 2: Try python-based yt-dlp (common in server environments)
    try {
        execSync('python3 -m yt_dlp --version', { stdio: 'ignore' });
        console.log('Found python3 yt-dlp');
        return { path: 'python3 -m yt_dlp', type: 'python' };
    } catch (e) {
        console.log('Python3 yt-dlp not found, trying python...');
    }

    // Strategy 3: Try python (without 3)
    try {
        execSync('python -m yt_dlp --version', { stdio: 'ignore' });
        console.log('Found python yt-dlp');
        return { path: 'python -m yt_dlp', type: 'python' };
    } catch (e) {
        console.log('Python yt-dlp not found, checking local binary...');
    }

    // Strategy 4: Check local binary
    const platformInfo = getPlatformInfo();
    const localPath = join(binDir, platformInfo.name);

    if (existsSync(localPath)) {
        if (process.platform !== 'win32') {
            try {
                chmodSync(localPath, 0o755);
            } catch (e) {
                console.warn('Could not set executable permissions:', e);
            }
        }
        console.log('Found local yt-dlp binary');
        return { path: localPath, type: 'local' };
    }

    // Strategy 5: Check for embedded binary in different locations
    const embeddedPaths = [
        join(process.cwd(), 'assets', 'bin', platformInfo.name),
        join(__dirname, '..', '..', 'bin', platformInfo.name),
        join(process.cwd(), 'public', 'bin', platformInfo.name)
    ];

    for (const embeddedPath of embeddedPaths) {
        if (existsSync(embeddedPath)) {
            if (process.platform !== 'win32') {
                try {
                    chmodSync(embeddedPath, 0o755);
                } catch (e) {
                    console.warn('Could not set executable permissions:', e);
                }
            }
            console.log('Found embedded yt-dlp binary at:', embeddedPath);
            return { path: embeddedPath, type: 'embedded' };
        }
    }

    console.log('No yt-dlp executable found');
    return null;
}

// Enhanced installation with better error handling
export async function ensureYtDlp(broadcast?: (data: any) => void): Promise<string> {
    const executable = getYtDlpExecutable();
    if (executable) {
        console.log(`Using ${executable.type} yt-dlp at ${executable.path}`);
        return executable.path;
    }

    if (broadcast) {
        broadcast({ type: 'system_status', message: 'Downloader not found. Installing...', status: 'installing' });
    }

    console.log('yt-dlp not found, attempting installation...');

    // Try multiple installation strategies
    const strategies = [
        () => installViaPython(broadcast),
        () => downloadBinary(broadcast),
        () => createPythonWrapper(broadcast)
    ];

    for (const strategy of strategies) {
        try {
            const result = await strategy();
            if (result) {
                console.log('yt-dlp installation successful');
                if (broadcast) {
                    const newStatus = await getYtDlpStatus();
                    broadcast({ type: 'system_status', message: `Downloader installed (v${newStatus.version})`, status: 'ready' });
                }
                return result;
            }
        } catch (error) {
            console.warn('Installation strategy failed:', error);
        }
    }

    throw new Error('Could not install yt-dlp. Please ensure Python with pip is available or manually install yt-dlp.');
}

// Strategy 1: Install via Python pip
async function installViaPython(broadcast?: (data: any) => void): Promise<string | null> {
    try {
        console.log('Attempting to install yt-dlp via pip...');
        if (broadcast) {
            broadcast({ type: 'system_status', message: 'Installing via Python pip...', status: 'installing' });
        }

        // Try pip3 first, then pip
        const pipCommands = ['pip3 install yt-dlp', 'pip install yt-dlp'];

        for (const cmd of pipCommands) {
            try {
                execSync(cmd, { stdio: 'pipe' });
                console.log(`Successfully installed yt-dlp via ${cmd}`);

                // Verify installation
                const executable = getYtDlpExecutable();
                if (executable) {
                    return executable.path;
                }
            } catch (e) {
                console.log(`Failed to install via ${cmd}`);
            }
        }

        return null;
    } catch (error) {
        console.error('Python installation failed:', error);
        return null;
    }
}

// Strategy 2: Download binary (original approach)
async function downloadBinary(broadcast?: (data: any) => void): Promise<string | null> {
    try {
        console.log('Attempting to download yt-dlp binary...');
        if (broadcast) {
            broadcast({ type: 'system_status', message: 'Downloading binary...', status: 'installing' });
        }

        const platformInfo = getPlatformInfo();
        const localPath = join(binDir, platformInfo.name);

        await downloadFile(platformInfo.url, localPath);

        if (process.platform !== 'win32') {
            chmodSync(localPath, 0o755);
        }

        console.log('Binary downloaded successfully');
        return localPath;
    } catch (error) {
        console.error('Binary download failed:', error);
        return null;
    }
}

// Strategy 3: Create Python wrapper script
async function createPythonWrapper(broadcast?: (data: any) => void): Promise<string | null> {
    try {
        console.log('Creating Python wrapper for yt-dlp...');
        if (broadcast) {
            broadcast({ type: 'system_status', message: 'Creating Python wrapper...', status: 'installing' });
        }

        // First install yt-dlp via pip
        const pipResult = await installViaPython();
        if (!pipResult) {
            return null;
        }

        // Create wrapper script
        const wrapperPath = join(binDir, 'yt-dlp-wrapper.py');
        const wrapperContent = `#!/usr/bin/env python3
import sys
import subprocess
import yt_dlp

def main():
    # Convert command line arguments to yt-dlp format
    args = sys.argv[1:]

    # Create yt-dlp options
    ydl_opts = {}

    # Parse basic arguments (extend as needed)
    url = args[-1] if args else ''

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            if '--version' in args:
                print(yt_dlp.version.__version__)
                return
            elif '--dump-json' in args:
                info = ydl.extract_info(url, download=False)
                import json
                print(json.dumps(info))
                return
            elif url:
                ydl.download([url])
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            sys.exit(1)

if __name__ == '__main__':
    main()
`;

        if (!existsSync(binDir)) {
            mkdirSync(binDir, { recursive: true });
        }

        writeFileSync(wrapperPath, wrapperContent);
        if (process.platform !== 'win32') {
            chmodSync(wrapperPath, 0o755);
        }

        console.log('Python wrapper created successfully');
        return `python3 ${wrapperPath}`;
    } catch (error) {
        console.error('Python wrapper creation failed:', error);
        return null;
    }
}

export async function getYtDlpStatus(): Promise<{ status: 'system' | 'local' | 'python' | 'embedded' | 'not_found', version?: string, path?: string }> {
    const executable = getYtDlpExecutable();
    if (!executable) {
        return { status: 'not_found' };
    }

    try {
        let versionCmd = `"${executable.path}" --version`;

        // Handle python module calls differently
        if (executable.type === 'python') {
            versionCmd = `${executable.path} --version`;
        }

        const version = execSync(versionCmd, { encoding: 'utf8' }).toString().trim();
        return { status: executable.type, version, path: executable.path };
    } catch (e) {
        console.error(`Failed to get version for ${executable.path}`, e);
        return { status: 'not_found' };
    }
}

export async function updateYtDlp(): Promise<{ status: 'system' | 'local' | 'python' | 'embedded' | 'not_found', version?: string, path?: string }> {
    console.log('Updating yt-dlp...');

    const currentStatus = await getYtDlpStatus();

    if (currentStatus.status === 'python') {
        // Update via pip
        try {
            const pipCommands = ['pip3 install --upgrade yt-dlp', 'pip install --upgrade yt-dlp'];

            for (const cmd of pipCommands) {
                try {
                    execSync(cmd, { stdio: 'pipe' });
                    console.log(`Successfully updated yt-dlp via ${cmd}`);
                    break;
                } catch (e) {
                    console.log(`Failed to update via ${cmd}`);
                }
            }
        } catch (error) {
            console.error('Failed to update via pip:', error);
        }
    } else {
        // Update binary
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
            console.log('yt-dlp binary updated successfully');
        } catch (error) {
            console.error('Failed to update yt-dlp binary:', error);
            throw new Error('Could not update yt-dlp.');
        }
    }

    return await getYtDlpStatus();
}