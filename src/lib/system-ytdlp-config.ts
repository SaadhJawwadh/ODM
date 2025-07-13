/**
 * System yt-dlp Configuration Manager
 *
 * This module provides comprehensive configuration for using system-installed yt-dlp
 * in both development and production environments.
 */

import { spawn, SpawnOptions } from 'child_process';
import { existsSync, accessSync, constants, statSync } from 'fs';
import { join, resolve } from 'path';

export interface SystemYtDlpConfig {
    // Engine configuration
    primaryEngine: 'system' | 'bundled' | 'environment';
    systemPath?: string;
    environmentPath?: string;

    // Fallback configuration
    enableFallback: boolean;
    fallbackOrder: ('system' | 'bundled' | 'environment')[];

    // Performance settings
    maxConcurrentDownloads: number;
    timeout: number;
    maxBuffer: number;

    // Security settings
    validateExecutable: boolean;
    allowedPaths: string[];

    // Logging
    enableLogging: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface YtDlpEngineInfo {
    path: string;
    version: string;
    source: 'system' | 'bundled' | 'environment';
    available: boolean;
    lastChecked: Date;
}

export class SystemYtDlpManager {
    private config: SystemYtDlpConfig;
    private engineInfo: YtDlpEngineInfo | null = null;
    private lastValidation: Date | null = null;
    private validationInterval = 5 * 60 * 1000; // 5 minutes

    constructor(config?: Partial<SystemYtDlpConfig>) {
        this.config = {
            primaryEngine: 'system',
            enableFallback: true,
            fallbackOrder: ['system', 'environment', 'bundled'],
            maxConcurrentDownloads: 3,
            timeout: 30000,
            maxBuffer: 1024 * 1024 * 10, // 10MB
            validateExecutable: true,
            allowedPaths: [
                '/usr/local/bin',
                '/usr/bin',
                '/opt/homebrew/bin',
                'C:\\Program Files\\yt-dlp',
                'C:\\yt-dlp'
            ],
            enableLogging: true,
            logLevel: 'info',
            ...config
        };

        // Override with environment variables
        this.loadEnvironmentConfig();
    }

    private loadEnvironmentConfig(): void {
        // Engine preference
        if (process.env.YTDLP_PRIMARY_ENGINE) {
            this.config.primaryEngine = process.env.YTDLP_PRIMARY_ENGINE as any;
        }

        // System path
        if (process.env.YTDLP_SYSTEM_PATH) {
            this.config.systemPath = process.env.YTDLP_SYSTEM_PATH;
        }

        // Environment path (legacy YTDLP_PATH)
        if (process.env.YTDLP_PATH) {
            this.config.environmentPath = process.env.YTDLP_PATH;
        }

        // Fallback settings
        if (process.env.YTDLP_ENABLE_FALLBACK) {
            this.config.enableFallback = process.env.YTDLP_ENABLE_FALLBACK === 'true';
        }

        // Performance settings
        if (process.env.YTDLP_MAX_CONCURRENT) {
            this.config.maxConcurrentDownloads = parseInt(process.env.YTDLP_MAX_CONCURRENT);
        }

        if (process.env.YTDLP_TIMEOUT) {
            this.config.timeout = parseInt(process.env.YTDLP_TIMEOUT);
        }

        if (process.env.YTDLP_MAX_BUFFER) {
            this.config.maxBuffer = parseInt(process.env.YTDLP_MAX_BUFFER);
        }

        // Security settings
        if (process.env.YTDLP_VALIDATE_EXECUTABLE) {
            this.config.validateExecutable = process.env.YTDLP_VALIDATE_EXECUTABLE === 'true';
        }

        // Logging
        if (process.env.YTDLP_LOG_LEVEL) {
            this.config.logLevel = process.env.YTDLP_LOG_LEVEL as any;
        }
    }

    private log(message: string, level: 'debug' | 'info' | 'warn' | 'error' = 'info'): void {
        if (!this.config.enableLogging) return;

        const levels = { debug: 0, info: 1, warn: 2, error: 3 };
        const currentLevel = levels[this.config.logLevel];
        const messageLevel = levels[level];

        if (messageLevel >= currentLevel) {
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] [YTDLP-${level.toUpperCase()}] ${message}`);
        }
    }

    /**
     * Find system-installed yt-dlp
     */
    private async findSystemYtDlp(): Promise<string | null> {
        const possiblePaths = [
            // Common system paths
            '/usr/local/bin/yt-dlp',
            '/usr/bin/yt-dlp',
            '/opt/homebrew/bin/yt-dlp',
            '/opt/local/bin/yt-dlp',

            // Windows paths
            'C:\\Program Files\\yt-dlp\\yt-dlp.exe',
            'C:\\yt-dlp\\yt-dlp.exe',
            'yt-dlp.exe',

            // Generic command (will be resolved by shell)
            'yt-dlp'
        ];

        // Add custom system path if configured
        if (this.config.systemPath) {
            possiblePaths.unshift(this.config.systemPath);
        }

        for (const path of possiblePaths) {
            try {
                if (await this.validateExecutable(path)) {
                    this.log(`Found system yt-dlp at: ${path}`, 'info');
                    return path;
                }
            } catch (error) {
                this.log(`Path ${path} not valid: ${error}`, 'debug');
            }
        }

        return null;
    }

    /**
     * Find environment-configured yt-dlp
     */
    private async findEnvironmentYtDlp(): Promise<string | null> {
        if (!this.config.environmentPath) {
            return null;
        }

        try {
            const resolvedPath = resolve(this.config.environmentPath);
            if (await this.validateExecutable(resolvedPath)) {
                this.log(`Found environment yt-dlp at: ${resolvedPath}`, 'info');
                return resolvedPath;
            }
        } catch (error) {
            this.log(`Environment yt-dlp not valid: ${error}`, 'warn');
        }

        return null;
    }

    /**
     * Find bundled yt-dlp
     */
    private async findBundledYtDlp(): Promise<string | null> {
        const executableName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
        const bundledPath = join(process.cwd(), 'bin', executableName);

        try {
            if (await this.validateExecutable(bundledPath)) {
                this.log(`Found bundled yt-dlp at: ${bundledPath}`, 'info');
                return bundledPath;
            }
        } catch (error) {
            this.log(`Bundled yt-dlp not valid: ${error}`, 'debug');
        }

        return null;
    }

    /**
     * Validate executable file
     */
    private async validateExecutable(filePath: string): Promise<boolean> {
        if (!this.config.validateExecutable) {
            return true;
        }

        try {
            // Check if file exists
            if (!existsSync(filePath)) {
                return false;
            }

            // Check if it's a file
            const stats = statSync(filePath);
            if (!stats.isFile()) {
                return false;
            }

            // Check execute permissions on Unix systems
            if (process.platform !== 'win32') {
                try {
                    accessSync(filePath, constants.X_OK);
                } catch {
                    return false;
                }
            }

            // Test execution
            const result = await this.executeCommand(filePath, ['--version'], { timeout: 5000 });
            return result.success && result.stdout.trim().length > 0;

        } catch (error) {
            this.log(`Validation failed for ${filePath}: ${error}`, 'debug');
            return false;
        }
    }

    /**
     * Execute yt-dlp command securely
     */
    private async executeCommand(
        executablePath: string,
        args: string[],
        options: { timeout?: number; maxBuffer?: number } = {}
    ): Promise<{ success: boolean; stdout: string; stderr: string; exitCode: number }> {
        const { timeout = this.config.timeout, maxBuffer = this.config.maxBuffer } = options;

        return new Promise((resolve, reject) => {
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
                    reject(new Error(`Command timed out after ${timeout}ms`));
                }
            }, timeout);

            // Handle stdout
            childProcess.stdout?.on('data', (data) => {
                stdout += data.toString();
                if (stdout.length > maxBuffer) {
                    killed = true;
                    childProcess.kill('SIGTERM');
                    reject(new Error(`Output exceeded maximum buffer size of ${maxBuffer} bytes`));
                }
            });

            // Handle stderr
            childProcess.stderr?.on('data', (data) => {
                stderr += data.toString();
                if (stderr.length > maxBuffer) {
                    killed = true;
                    childProcess.kill('SIGTERM');
                    reject(new Error(`Error output exceeded maximum buffer size of ${maxBuffer} bytes`));
                }
            });

            // Handle process completion
            childProcess.on('close', (code) => {
                if (killed) return;

                clearTimeout(timeoutId);

                resolve({
                    success: code === 0,
                    stdout,
                    stderr,
                    exitCode: code || 0,
                });
            });

            // Handle process errors
            childProcess.on('error', (error) => {
                if (killed) return;

                clearTimeout(timeoutId);
                reject(error);
            });
        });
    }

    /**
     * Get the best available yt-dlp engine
     */
    public async getBestEngine(): Promise<YtDlpEngineInfo> {
        // Check if we have recent validation
        if (this.engineInfo && this.lastValidation) {
            const timeSinceValidation = Date.now() - this.lastValidation.getTime();
            if (timeSinceValidation < this.validationInterval) {
                return this.engineInfo;
            }
        }

        const engineOrder = this.config.enableFallback
            ? this.config.fallbackOrder
            : [this.config.primaryEngine];

        for (const engineType of engineOrder) {
            try {
                let path: string | null = null;

                switch (engineType) {
                    case 'system':
                        path = await this.findSystemYtDlp();
                        break;
                    case 'environment':
                        path = await this.findEnvironmentYtDlp();
                        break;
                    case 'bundled':
                        path = await this.findBundledYtDlp();
                        break;
                }

                if (path) {
                    // Get version
                    const result = await this.executeCommand(path, ['--version'], { timeout: 5000 });
                    if (result.success) {
                        this.engineInfo = {
                            path,
                            version: result.stdout.trim(),
                            source: engineType,
                            available: true,
                            lastChecked: new Date()
                        };
                        this.lastValidation = new Date();

                        this.log(`Using ${engineType} yt-dlp v${this.engineInfo.version} at ${path}`, 'info');
                        return this.engineInfo;
                    }
                }
            } catch (error) {
                this.log(`Failed to use ${engineType} engine: ${error}`, 'warn');
            }
        }

        // No engine found
        this.engineInfo = {
            path: '',
            version: '',
            source: 'system',
            available: false,
            lastChecked: new Date()
        };
        this.lastValidation = new Date();

        throw new Error('No yt-dlp engine available. Please install yt-dlp or configure a valid path.');
    }

    /**
     * Execute yt-dlp command with the best available engine
     */
    public async executeYtDlpCommand(args: string[], options?: { timeout?: number; maxBuffer?: number }): Promise<{ success: boolean; stdout: string; stderr: string; exitCode: number }> {
        const engine = await this.getBestEngine();

        if (!engine.available) {
            throw new Error('No yt-dlp engine available');
        }

        this.log(`Executing yt-dlp command: ${args.join(' ')}`, 'debug');

        return this.executeCommand(engine.path, args, options);
    }

    /**
     * Get current configuration
     */
    public getConfig(): SystemYtDlpConfig {
        return { ...this.config };
    }

    /**
     * Get engine status
     */
    public async getEngineStatus(): Promise<{
        available: boolean;
        engine?: YtDlpEngineInfo;
        config: SystemYtDlpConfig;
    }> {
        try {
            const engine = await this.getBestEngine();
            return {
                available: engine.available,
                engine,
                config: this.getConfig()
            };
        } catch (error) {
            return {
                available: false,
                config: this.getConfig()
            };
        }
    }

    /**
     * Update configuration
     */
    public updateConfig(newConfig: Partial<SystemYtDlpConfig>): void {
        this.config = { ...this.config, ...newConfig };
        this.log('Configuration updated', 'info');

        // Reset cached engine info to force re-validation
        this.engineInfo = null;
        this.lastValidation = null;
    }
}

// Export singleton instance
export const systemYtDlpManager = new SystemYtDlpManager();

// Export convenience functions
export const getBestEngine = () => systemYtDlpManager.getBestEngine();
export const executeYtDlpCommand = (args: string[], options?: any) => systemYtDlpManager.executeYtDlpCommand(args, options);
export const getEngineStatus = () => systemYtDlpManager.getEngineStatus();
export const updateConfig = (config: Partial<SystemYtDlpConfig>) => systemYtDlpManager.updateConfig(config);