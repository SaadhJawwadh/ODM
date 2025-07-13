import YTDlpWrap from 'yt-dlp-wrap';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

/**
 * Configuration for yt-dlp execution
 */
interface YtDlpConfig {
    timeout?: number;
    maxBuffer?: number;
}

/**
 * Result from yt-dlp command execution
 */
interface YtDlpResult {
    stdout: string;
    stderr: string;
    exitCode: number;
    success: boolean;
}

/**
 * Error thrown when yt-dlp executable cannot be found
 */
export class YtDlpNotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'YtDlpNotFoundError';
    }
}

/**
 * Error thrown when yt-dlp command execution fails
 */
export class YtDlpExecutionError extends Error {
    public readonly exitCode: number;
    public readonly stderr: string;
    public readonly stdout: string;

    constructor(message: string, exitCode: number, stderr: string, stdout: string) {
        super(message);
        this.name = 'YtDlpExecutionError';
        this.exitCode = exitCode;
        this.stderr = stderr;
        this.stdout = stdout;
    }
}

// Global instance of yt-dlp-wrap
let ytDlpInstance: YTDlpWrap | null = null;

/**
 * Initialize yt-dlp-wrap instance
 */
async function initializeYtDlp(): Promise<YTDlpWrap> {
    if (ytDlpInstance) {
        return ytDlpInstance;
    }

    // Create bin directory if it doesn't exist
    const binDir = join(process.cwd(), 'bin');
    if (!existsSync(binDir)) {
        mkdirSync(binDir, { recursive: true });
    }

    const ytDlpPath = join(binDir, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');

    // Download yt-dlp if it doesn't exist
    if (!existsSync(ytDlpPath)) {
        console.log('Downloading yt-dlp...');
        await YTDlpWrap.downloadFromGithub(ytDlpPath);
        console.log('yt-dlp downloaded successfully');
    }

    // Create instance
    ytDlpInstance = new YTDlpWrap(ytDlpPath);
    return ytDlpInstance;
}

/**
 * Get the yt-dlp path (for compatibility)
 */
export function getYtdlpPath(): string {
    const binDir = join(process.cwd(), 'bin');
    return join(binDir, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
}

/**
 * Validate yt-dlp installation
 */
export async function validateYtdlpInstallation(executablePath?: string): Promise<{ path: string; version: string }> {
    try {
        const ytDlp = await initializeYtDlp();
        const version = await ytDlp.getVersion();
        const path = executablePath || getYtdlpPath();

        return { path, version };
    } catch (error) {
        throw new YtDlpNotFoundError(
            `yt-dlp executable not found or not working. Error: ${error}`
        );
    }
}

/**
 * Execute yt-dlp command (compatibility wrapper)
 */
export async function executeYtdlpCommand(
    executablePath: string,
    args: string[],
    options: { timeout?: number; maxBuffer?: number } = {}
): Promise<YtDlpResult> {
    try {
        const ytDlp = await initializeYtDlp();

        // For compatibility, we'll use execPromise
        const stdout = await ytDlp.execPromise(args);

        return {
            stdout,
            stderr: '',
            exitCode: 0,
            success: true
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new YtDlpExecutionError(
            `yt-dlp command failed: ${errorMessage}`,
            1,
            errorMessage,
            ''
        );
    }
}

/**
 * Get video information using yt-dlp-wrap
 */
export async function getVideoInfo(url: string, config: YtDlpConfig = {}): Promise<any> {
    if (!url || typeof url !== 'string') {
        throw new Error('Invalid URL provided');
    }

    try {
        const ytDlp = await initializeYtDlp();
        const metadata = await ytDlp.getVideoInfo(url);
        return metadata;
    } catch (error) {
        if (error instanceof YtDlpNotFoundError || error instanceof YtDlpExecutionError) {
            throw error;
        }

        throw new YtDlpExecutionError(
            `Unexpected error during video info extraction: ${error}`,
            -1,
            '',
            ''
        );
    }
}

/**
 * Download a video using yt-dlp-wrap
 */
export async function downloadVideo(
    url: string,
    options: {
        format?: string;
        output?: string;
        audioOnly?: boolean;
        timeout?: number;
        onProgress?: (data: any) => void;
    } = {}
): Promise<YtDlpResult> {
    if (!url || typeof url !== 'string') {
        throw new Error('Invalid URL provided');
    }

    try {
        const ytDlp = await initializeYtDlp();

        // Build arguments array
        const args = ['--no-warnings'];

        if (options.format) {
            args.push('-f', options.format);
        }

        if (options.output) {
            args.push('-o', options.output);
        }

        if (options.audioOnly) {
            args.push('-x');
        }

        // Add the URL
        args.push(url);

        // Use EventEmitter interface for progress tracking
        if (options.onProgress) {
            return new Promise((resolve, reject) => {
                const emitter = ytDlp.exec(args);

                let stdout = '';
                let stderr = '';

                emitter.on('progress', (progress) => {
                    options.onProgress?.(progress);
                });

                emitter.on('ytDlpEvent', (eventType, eventData) => {
                    stdout += `${eventType}: ${eventData}\n`;
                });

                emitter.on('error', (error) => {
                    stderr = error.message || String(error);
                    reject(new YtDlpExecutionError(
                        `Download failed: ${stderr}`,
                        1,
                        stderr,
                        stdout
                    ));
                });

                emitter.on('close', () => {
                    resolve({
                        stdout,
                        stderr,
                        exitCode: 0,
                        success: true
                    });
                });
            });
        }

        // For simple downloads without progress tracking
        const stdout = await ytDlp.execPromise(args);
        return {
            stdout,
            stderr: '',
            exitCode: 0,
            success: true
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new YtDlpExecutionError(
            `Download failed: ${errorMessage}`,
            1,
            errorMessage,
            ''
        );
    }
}

/**
 * Check if yt-dlp is available
 */
export async function isYtdlpAvailable(): Promise<boolean> {
    try {
        await validateYtdlpInstallation();
        return true;
    } catch {
        return false;
    }
}

/**
 * Get yt-dlp system information
 */
export async function getYtdlpSystemInfo(): Promise<{
    available: boolean;
    path?: string;
    version?: string;
    source: 'environment' | 'bundled' | 'system' | 'unknown';
}> {
    try {
        const path = getYtdlpPath();
        const validation = await validateYtdlpInstallation(path);

        return {
            available: true,
            path: validation.path,
            version: validation.version,
            source: 'bundled'
        };
    } catch (error) {
        return {
            available: false,
            source: 'unknown'
        };
    }
}