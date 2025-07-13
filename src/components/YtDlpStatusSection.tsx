
'use client'

import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, XCircle, Download } from 'lucide-react';

interface YtDlpStatus {
    status: 'system' | 'local' | 'not_found' | 'checking' | 'updating';
    version?: string;
    path?: string;
}

export default function YtDlpStatusSection() {
    const [ytDlpStatus, setYtDlpStatus] = useState<YtDlpStatus>({ status: 'checking' });

    const fetchYtDlpStatus = async () => {
        setYtDlpStatus({ status: 'checking' });
        try {
            const response = await fetch('/api/ytdlp');
            if (!response.ok) throw new Error('Failed to fetch status');
            const data = await response.json();
            setYtDlpStatus(data);
        } catch (error) {
            console.error(error);
            setYtDlpStatus({ status: 'not_found' });
        }
    };

    const handleUpdateYtDlp = async () => {
        setYtDlpStatus(prev => ({ ...prev, status: 'updating' }));
        try {
            const response = await fetch('/api/ytdlp', { method: 'POST' });
            if (!response.ok) throw new Error('Failed to update');
            const data = await response.json();
            setYtDlpStatus(data);
        } catch (error) {
            console.error(error);
            // Refetch status on error to get back to a stable state
            await fetchYtDlpStatus();
        }
    };

    useEffect(() => {
        fetchYtDlpStatus();
    }, []);

    return (
        <div>
            <h3 className="flex items-center space-x-2 text-lg font-semibold text-gray-900 dark:text-white mb-4">
                <Download className="w-5 h-5" />
                <span>Downloader Status</span>
            </h3>
            <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4 flex items-center justify-between">
                <div>
                    <div className="font-semibold text-gray-800 dark:text-gray-200">yt-dlp</div>
                    {ytDlpStatus.status === 'checking' && <div className="text-sm text-gray-500 dark:text-gray-400">Checking...</div>}
                    {ytDlpStatus.status === 'updating' && <div className="text-sm text-primary-500 dark:text-primary-400">Updating...</div>}
                    {ytDlpStatus.status === 'not_found' && (
                        <div className="flex items-center space-x-2 text-sm text-red-500 dark:text-red-400">
                            <XCircle className="w-4 h-4" />
                            <span>Not Found</span>
                        </div>
                    )}
                    {(ytDlpStatus.status === 'local' || ytDlpStatus.status === 'system') && (
                        <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                            <CheckCircle className="w-4 h-4" />
                            <span>
                                {ytDlpStatus.status === 'local' ? 'Installed (Local)' : 'Installed (System)'}
                            </span>
                        </div>
                    )}
                    {ytDlpStatus.version && <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono">{ytDlpStatus.version}</div>}
                </div>
                <button
                    onClick={handleUpdateYtDlp}
                    disabled={ytDlpStatus.status === 'checking' || ytDlpStatus.status === 'updating' || ytDlpStatus.status === 'system'}
                    className="flex items-center space-x-2 px-3 py-2 text-sm rounded-lg bg-gray-200 dark:bg-dark-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-dark-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${ytDlpStatus.status === 'updating' ? 'animate-spin' : ''}`} />
                    <span>Update</span>
                </button>
            </div>
            {ytDlpStatus.status === 'system' && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    A system-wide yt-dlp was found. To update it, please use your system's package manager.
                </p>
            )}
        </div>
    );
}