'use client'

import { useState, useEffect } from 'react'
import { Settings, CheckCircle, XCircle, AlertCircle, Download, RefreshCw } from 'lucide-react'

interface SystemYtDlpConfig {
    primaryEngine: 'system' | 'bundled' | 'environment';
    systemPath?: string;
    environmentPath?: string;
    enableFallback: boolean;
    fallbackOrder: ('system' | 'bundled' | 'environment')[];
    maxConcurrentDownloads: number;
    timeout: number;
    maxBuffer: number;
    validateExecutable: boolean;
    enableLogging: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
}

interface YtDlpEngineInfo {
    path: string;
    version: string;
    source: 'system' | 'bundled' | 'environment';
    available: boolean;
    lastChecked: Date;
}

interface EngineStatus {
    available: boolean;
    engine?: YtDlpEngineInfo;
    config: SystemYtDlpConfig;
}

export default function SystemYtDlpConfig() {
    const [isOpen, setIsOpen] = useState(false)
    const [status, setStatus] = useState<EngineStatus | null>(null)
    const [loading, setLoading] = useState(false)
    const [config, setConfig] = useState<Partial<SystemYtDlpConfig>>({})
    const [testPath, setTestPath] = useState('')
    const [testResult, setTestResult] = useState<any>(null)

    useEffect(() => {
        if (isOpen) {
            loadStatus()
        }
    }, [isOpen])

    const loadStatus = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/ytdlp/system-config')
            const data = await response.json()
            if (data.success) {
                setStatus(data.data)
                setConfig(data.data.config)
            }
        } catch (error) {
            console.error('Failed to load status:', error)
        } finally {
            setLoading(false)
        }
    }

    const updateConfiguration = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/ytdlp/system-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ config })
            })
            const data = await response.json()
            if (data.success) {
                setStatus(data.data)
                setConfig(data.data.config)
            }
        } catch (error) {
            console.error('Failed to update configuration:', error)
        } finally {
            setLoading(false)
        }
    }

    const testEngine = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/ytdlp/system-config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'test' })
            })
            const data = await response.json()
            if (data.success) {
                setTestResult(data.data)
            }
        } catch (error) {
            console.error('Failed to test engine:', error)
        } finally {
            setLoading(false)
        }
    }

    const validatePath = async () => {
        if (!testPath.trim()) return

        setLoading(true)
        try {
            const response = await fetch('/api/ytdlp/system-config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'validate', path: testPath })
            })
            const data = await response.json()
            if (data.success) {
                setTestResult(data.data)
            }
        } catch (error) {
            console.error('Failed to validate path:', error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusIcon = () => {
        if (!status) return <AlertCircle className="w-5 h-5 text-gray-400" />
        if (status.available) return <CheckCircle className="w-5 h-5 text-green-500" />
        return <XCircle className="w-5 h-5 text-red-500" />
    }

    const getStatusText = () => {
        if (!status) return 'Unknown'
        if (status.available) {
            return `Available (${status.engine?.source} v${status.engine?.version})`
        }
        return 'Not Available'
    }

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
                <Settings className="w-4 h-4" />
                <span>System yt-dlp Config</span>
                {getStatusIcon()}
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                System yt-dlp Configuration
                            </h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Status Section */}
                        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium text-gray-900 dark:text-white">Current Status</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{getStatusText()}</p>
                                    {status?.engine && (
                                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                            Path: {status.engine.path}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={loadStatus}
                                    disabled={loading}
                                    className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                                >
                                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                                    <span>Refresh</span>
                                </button>
                            </div>
                        </div>

                        {/* Configuration Section */}
                        <div className="mb-6">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Configuration</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Primary Engine */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Primary Engine
                                    </label>
                                    <select
                                        value={config.primaryEngine || 'system'}
                                        onChange={(e) => setConfig({ ...config, primaryEngine: e.target.value as any })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="system">System Installation</option>
                                        <option value="environment">Environment Variable</option>
                                        <option value="bundled">Bundled</option>
                                    </select>
                                </div>

                                {/* System Path */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        System Path (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={config.systemPath || ''}
                                        onChange={(e) => setConfig({ ...config, systemPath: e.target.value })}
                                        placeholder="/usr/local/bin/yt-dlp"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>

                                {/* Environment Path */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Environment Path (YTDLP_PATH)
                                    </label>
                                    <input
                                        type="text"
                                        value={config.environmentPath || ''}
                                        onChange={(e) => setConfig({ ...config, environmentPath: e.target.value })}
                                        placeholder="/path/to/yt-dlp"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>

                                {/* Max Concurrent Downloads */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Max Concurrent Downloads
                                    </label>
                                    <input
                                        type="number"
                                        value={config.maxConcurrentDownloads || 3}
                                        onChange={(e) => setConfig({ ...config, maxConcurrentDownloads: parseInt(e.target.value) })}
                                        min="1"
                                        max="10"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>

                                {/* Timeout */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Timeout (ms)
                                    </label>
                                    <input
                                        type="number"
                                        value={config.timeout || 30000}
                                        onChange={(e) => setConfig({ ...config, timeout: parseInt(e.target.value) })}
                                        min="5000"
                                        max="300000"
                                        step="1000"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>

                                {/* Enable Fallback */}
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="enableFallback"
                                        checked={config.enableFallback !== false}
                                        onChange={(e) => setConfig({ ...config, enableFallback: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="enableFallback" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Enable Fallback
                                    </label>
                                </div>
                            </div>

                            <div className="mt-4 flex space-x-2">
                                <button
                                    onClick={updateConfiguration}
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                                >
                                    {loading ? 'Updating...' : 'Update Configuration'}
                                </button>
                                <button
                                    onClick={testEngine}
                                    disabled={loading}
                                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                                >
                                    {loading ? 'Testing...' : 'Test Engine'}
                                </button>
                            </div>
                        </div>

                        {/* Path Testing Section */}
                        <div className="mb-6">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Test Custom Path</h3>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={testPath}
                                    onChange={(e) => setTestPath(e.target.value)}
                                    placeholder="Enter yt-dlp path to test"
                                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                                <button
                                    onClick={validatePath}
                                    disabled={loading || !testPath.trim()}
                                    className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
                                >
                                    {loading ? 'Testing...' : 'Validate'}
                                </button>
                            </div>
                        </div>

                        {/* Test Results */}
                        {testResult && (
                            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Test Results</h3>
                                <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">
                                    {JSON.stringify(testResult, null, 2)}
                                </pre>
                            </div>
                        )}

                        {/* Environment Variables Info */}
                        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Environment Variables</h3>
                            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                                You can also configure yt-dlp using environment variables:
                            </p>
                            <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                                <div><code>YTDLP_PRIMARY_ENGINE=system</code> - Set primary engine</div>
                                <div><code>YTDLP_SYSTEM_PATH=/path/to/yt-dlp</code> - Set system path</div>
                                <div><code>YTDLP_PATH=/path/to/yt-dlp</code> - Legacy environment path</div>
                                <div><code>YTDLP_ENABLE_FALLBACK=true</code> - Enable fallback</div>
                                <div><code>YTDLP_MAX_CONCURRENT=3</code> - Max concurrent downloads</div>
                                <div><code>YTDLP_TIMEOUT=30000</code> - Command timeout</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}