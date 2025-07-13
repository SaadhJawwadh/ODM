import { spawn, SpawnOptions } from 'child_process';
import { existsSync, accessSync, constants, statSync } from 'fs';
import { join, resolve } from 'path';

/**
 * Configuration for yt-dlp execution
 */
interface YtDlpConfig {
    executablePath?: string;
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

/**
 * Determines the platform-specific yt-dlp executable name
 */
function getExecutableName(): string {
    return process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
}

/**
 * Checks if a file exists and is executable
 */
function isExecutable(filePath: string): boolean {
    try {
        accessSync(filePath, constants.F_OK);
        const stats = statSync(filePath);
        if (!stats.isFile()) {
            return false;
        }

        // On Windows, we just check if file exists since execute permissions work differently
        if (process.platform === 'win32') {
            return true;
        }

        // On Unix-like systems, check execute permissions
        try {
            accessSync(filePath, constants.X_OK);
            return true;
        } catch {
            return false;
        }
    } catch {
        return false;
    }
}

/**
 * Strategy 1 & 2: Robust path resolution with fallback mechanism
 *
 * This function implements a comprehensive strategy to find yt-dlp:
 * 1. First checks YTDLP_PATH environment variable
 * 2. Falls back to bundled executable in ./bin directory
 * 3. Falls back to system PATH
 * 4. Throws descriptive error if none found
 */
export function getYtdlpPath(): string {
    // Strategy 2: Check environment variable first
    const envPath = process.env.YTDLP_PATH;
    if (envPath) {
        const resolvedEnvPath = resolve(envPath);
        if (isExecutable(resolvedEnvPath)) {
            console.log(`Using yt-dlp from environment variable: ${resolvedEnvPath}`);
            return resolvedEnvPath;
        } else {
            console.warn(`YTDLP_PATH environment variable set but executable not found or not executable: ${resolvedEnvPath}`);
        }
    }

    // Strategy 1: Check for bundled executable
    const bundledPath = join(process.cwd(), 'bin', getExecutableName());
    if (isExecutable(bundledPath)) {
        console.log(`Using bundled yt-dlp: ${bundledPath}`);
        return bundledPath;
    }

    // Fallback: Check system PATH
    const systemExecutable = getExecutableName();
    // We can't easily check system PATH directly, so we'll let the spawn process handle it
    // This will be validated when we actually try to execute the command

    // As a last resort, assume system installation
    console.log('Attempting to use system yt-dlp from PATH');
    return systemExecutable;
}

/**
 * Validates that the yt-dlp executable exists and is working
 */
export async function validateYtdlpInstallation(executablePath?: string): Promise<{ path: string; version: string }> {
    const ytdlpPath = executablePath || getYtdlpPath();

    try {
        const result = await executeYtdlpCommand(ytdlpPath, ['--version'], { timeout: 10000 });

        if (!result.success) {
            throw new YtDlpNotFoundError(
                `yt-dlp validation failed. Exit code: ${result.exitCode}, stderr: ${result.stderr}`
            );
        }

        const version = result.stdout.trim();
        return { path: ytdlpPath, version };
    } catch (error) {
        if (error instanceof YtDlpExecutionError) {
            throw error;
        }

        throw new YtDlpNotFoundError(
            `yt-dlp executable not found or not working at path: ${ytdlpPath}. ` +
            `Please ensure yt-dlp is installed and accessible. ` +
            `You can set the YTDLP_PATH environment variable to specify a custom location, ` +
            `or place the executable in the ./bin directory of your project.`
        );
    }
}

/**
 * Secure command execution that prevents command injection
 *
 * This function ensures security by:
 * 1. Using spawn() instead of exec() to avoid shell injection
 * 2. Passing arguments as separate array elements
 * 3. Validating the executable path
 * 4. Setting appropriate timeouts and limits
 */
export async function executeYtdlpCommand(
    executablePath: string,
    args: string[],
    options: { timeout?: number; maxBuffer?: number } = {}
): Promise<YtDlpResult> {
    const { timeout = 30000, maxBuffer = 1024 * 1024 * 10 } = options; // 10MB max buffer

    return new Promise((resolve, reject) => {
        // Security: Use spawn with argument array to prevent command injection
        const spawnOptions: SpawnOptions = {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env },
            timeout,
        };

        const childProcess = spawn(executablePath, args, spawnOptions);

        let stdout = '';
        let stderr = '';
        let killed = false;

        // Set up timeout
        const timeoutId = setTimeout(() => {
            if (!killed) {
                killed = true;
                childProcess.kill('SIGTERM');
                reject(new YtDlpExecutionError(
                    `Command timed out after ${timeout}ms`,
                    -1,
                    stderr,
                    stdout
                ));
            }
        }, timeout);

        // Handle stdout
        childProcess.stdout?.on('data', (data) => {
            stdout += data.toString();
            if (stdout.length > maxBuffer) {
                killed = true;
                childProcess.kill('SIGTERM');
                reject(new YtDlpExecutionError(
                    `Output exceeded maximum buffer size of ${maxBuffer} bytes`,
                    -1,
                    stderr,
                    stdout
                ));
            }
        });

        // Handle stderr
        childProcess.stderr?.on('data', (data) => {
            stderr += data.toString();
            if (stderr.length > maxBuffer) {
                killed = true;
                childProcess.kill('SIGTERM');
                reject(new YtDlpExecutionError(
                    `Error output exceeded maximum buffer size of ${maxBuffer} bytes`,
                    -1,
                    stderr,
                    stdout
                ));
            }
        });

        // Handle process completion
        childProcess.on('close', (code) => {
            if (killed) return;

            clearTimeout(timeoutId);

            const result: YtDlpResult = {
                stdout,
                stderr,
                exitCode: code || 0,
                success: code === 0,
            };

            resolve(result);
        });

        // Handle process errors
        childProcess.on('error', (error) => {
            if (killed) return;

            clearTimeout(timeoutId);

            // Common error when executable is not found
            if (error.message.includes('ENOENT')) {
                reject(new YtDlpNotFoundError(
                    `yt-dlp executable not found at path: ${executablePath}. ` +
                    `Please ensure yt-dlp is installed and the path is correct.`
                ));
            } else {
                reject(new YtDlpExecutionError(
                    `Failed to execute yt-dlp: ${error.message}`,
                    -1,
                    stderr,
                    stdout
                ));
            }
        });
    });
}

/**
 * High-level function to get video information
 * This demonstrates secure usage of the yt-dlp manager
 */
export async function getVideoInfo(url: string, config: YtDlpConfig = {}): Promise<any> {
    const ytdlpPath = config.executablePath || getYtdlpPath();

    // Validate the URL is provided (basic validation)
    if (!url || typeof url !== 'string') {
        throw new Error('Invalid URL provided');
    }

    // Security: Arguments are passed as separate array elements
    const args = [
        '--dump-json',
        '--no-warnings',
        '--no-playlist',
        url // User input is isolated as a separate argument
    ];

    try {
        const result = await executeYtdlpCommand(ytdlpPath, args, {
            timeout: config.timeout || 30000,
            maxBuffer: config.maxBuffer || 1024 * 1024 * 5 // 5MB for JSON
        });

        if (!result.success) {
            throw new YtDlpExecutionError(
                `yt-dlp failed to get video info: ${result.stderr || 'Unknown error'}`,
                result.exitCode,
                result.stderr,
                result.stdout
            );
        }

        // Parse JSON response
        try {
            return JSON.parse(result.stdout);
        } catch (parseError) {
            throw new YtDlpExecutionError(
                `Failed to parse yt-dlp JSON output: ${parseError}`,
                result.exitCode,
                result.stderr,
                result.stdout
            );
        }
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
 * High-level function to download a video
 * This demonstrates secure usage for download operations
 */
export async function downloadVideo(
    url: string,
    options: {
        format?: string;
        output?: string;
        audioOnly?: boolean;
        executablePath?: string;
        timeout?: number;
        onProgress?: (data: string) => void;
    } = {}
): Promise<YtDlpResult> {
    const ytdlpPath = options.executablePath || getYtdlpPath();

    // Validate the URL is provided
    if (!url || typeof url !== 'string') {
        throw new Error('Invalid URL provided');
    }

    // Build arguments array securely
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

    // Add the URL as the last argument
    args.push(url);

    // For download operations, we might want to stream progress
    if (options.onProgress) {
        return new Promise((resolve, reject) => {
            const childProcess = spawn(ytdlpPath, args, {
                stdio: ['pipe', 'pipe', 'pipe'],
                env: { ...process.env },
            });

            let stdout = '';
            let stderr = '';

            childProcess.stdout?.on('data', (data) => {
                const output = data.toString();
                stdout += output;
                options.onProgress?.(output);
            });

            childProcess.stderr?.on('data', (data) => {
                const output = data.toString();
                stderr += output;
                options.onProgress?.(output);
            });

            childProcess.on('close', (code) => {
                const result: YtDlpResult = {
                    stdout,
                    stderr,
                    exitCode: code || 0,
                    success: code === 0,
                };

                if (result.success) {
                    resolve(result);
                } else {
                    reject(new YtDlpExecutionError(
                        `Download failed: ${stderr || 'Unknown error'}`,
                        result.exitCode,
                        stderr,
                        stdout
                    ));
                }
            });

            childProcess.on('error', (error) => {
                reject(new YtDlpNotFoundError(
                    `Failed to execute yt-dlp: ${error.message}`
                ));
            });
        });
    }

    // For simple downloads without progress tracking
    return executeYtdlpCommand(ytdlpPath, args, {
        timeout: options.timeout || 300000, // 5 minutes for downloads
        maxBuffer: 1024 * 1024 * 2 // 2MB buffer for download logs
    });
}

/**
 * Utility function to check if yt-dlp is available
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
 * Get system information about yt-dlp installation
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

        let source: 'environment' | 'bundled' | 'system' | 'unknown' = 'unknown';

        if (process.env.YTDLP_PATH) {
            source = 'environment';
        } else if (path.includes(join(process.cwd(), 'bin'))) {
            source = 'bundled';
        } else {
            source = 'system';
        }

        return {
            available: true,
            path: validation.path,
            version: validation.version,
            source,
        };
    } catch {
        return {
            available: false,
            source: 'unknown',
        };
    }
}