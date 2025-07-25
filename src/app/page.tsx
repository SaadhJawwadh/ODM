'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Trash2, Filter, Download as DownloadIcon } from 'lucide-react'
import { useDownloadStore } from '@/store/downloadStore'
import Header from '@/components/Header'
import DownloadForm from '@/components/DownloadForm'
import DownloadItem from '@/components/DownloadItem'
import Settings from '@/components/Settings'
import SystemStatus from '@/components/SystemStatus'
import YtDlpStatusSection from '@/components/YtDlpStatusSection'

export default function Home() {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [filter, setFilter] = useState<'all' | 'downloading' | 'completed' | 'error'>('all')
    const { downloads, updateDownload, clearCompleted, startBrowserDownload, setSystemStatus } = useDownloadStore()

    useEffect(() => {
        let ws: WebSocket
        let reconnectTimeout: NodeJS.Timeout

        const connectWebSocket = () => {
            // Determine the correct WebSocket URL based on environment
            const wsUrl = process.env.NODE_ENV === 'development'
                ? 'ws://localhost:3002'
                : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`

            console.log('Connecting to WebSocket:', wsUrl)
            ws = new WebSocket(wsUrl)

            ws.onopen = () => {
                console.log('✅ WebSocket connection established')
            }

            ws.onmessage = event => {
                try {
                    const data = JSON.parse(event.data)
                    console.log('📨 WebSocket message received:', data)

                    if (data.type === 'progress') {
                        console.log(`🔄 Updating download ${data.id}: ${data.progress}% - ${data.status}`)
                        updateDownload(data.id, {
                            status: data.status,
                            progress: data.progress || 0,
                            speed: data.speed || '',
                            eta: data.eta || '',
                            error: data.error || '',
                            fileName: data.fileName || '',
                            fileSize: data.fileSize || ''
                        })
                    } else if (data.type === 'system_status') {
                        console.log('🔧 System status update:', data)
                        setSystemStatus({
                            message: data.message,
                            status: data.status,
                        });
                    }
                } catch (error) {
                    console.error('❌ Error parsing WebSocket message:', error)
                }
            }

            ws.onclose = (event) => {
                console.log('🔌 WebSocket connection closed:', event.code, event.reason)
                // Attempt to reconnect after 3 seconds
                reconnectTimeout = setTimeout(connectWebSocket, 3000)
            }

            ws.onerror = error => {
                console.error('❌ WebSocket error:', error)
            }
        }

        // Initial connection
        connectWebSocket()

        const unsubscribe = useDownloadStore.subscribe(
            (state, prevState) => {
                state.downloads.forEach(download => {
                    const prevDownload = prevState.downloads.find(d => d.id === download.id)
                    if (prevDownload &&
                        prevDownload.status !== 'ready' &&
                        download.status === 'ready' &&
                        !download.autoDownloadStarted) {
                        console.log('🚀 Auto-starting browser download for:', download.id)
                        // Mark as started to prevent multiple downloads
                        updateDownload(download.id, { autoDownloadStarted: true })
                        startBrowserDownload(download.id)
                    }
                })
            }
        )

        return () => {
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout)
            }
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.close()
            }
            unsubscribe()
        }
    }, [updateDownload, startBrowserDownload, setSystemStatus])

    // Filter downloads based on selected filter
    const filteredDownloads = downloads.filter(download => {
        switch (filter) {
            case 'downloading':
                return download.status === 'downloading' || download.status === 'pending' || download.status === 'ready'
            case 'completed':
                return download.status === 'completed'
            case 'error':
                return download.status === 'error'
            default:
                return true
        }
    })

    // Get download statistics
    const stats = {
        total: downloads.length,
        downloading: downloads.filter(d =>
            d.status === 'downloading' || d.status === 'pending' || d.status === 'ready'
        ).length,
        completed: downloads.filter(d => d.status === 'completed').length,
        error: downloads.filter(d => d.status === 'error').length
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
            <Header onSettingsClick={() => setIsSettingsOpen(true)} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
                {/* Download Form */}
                <DownloadForm />

                {/* Stats and Controls */}
                <div className="bg-white dark:bg-dark-800 rounded-xl card-shadow p-4 sm:p-6 mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Downloads
                        </h2>
                        <div className="flex items-center space-x-3">
                            {stats.completed > 0 && (
                                <button
                                    onClick={clearCompleted}
                                    className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors touch-manipulation min-h-[40px]"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Clear Completed</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                        <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {stats.total}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {stats.downloading}
                            </div>
                            <div className="text-sm text-blue-600 dark:text-blue-400">Active</div>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {stats.completed}
                            </div>
                            <div className="text-sm text-green-600 dark:text-green-400">Completed</div>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                {stats.error}
                            </div>
                            <div className="text-sm text-red-600 dark:text-red-400">Failed</div>
                        </div>
                    </div>

                    {/* Downloader Status */}
                    <div className="mb-6">
                        <YtDlpStatusSection />
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-2">
                        <div className="flex items-center space-x-2">
                            <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Filter:</span>
                        </div>
                        <div className="grid grid-cols-4 sm:flex gap-2">
                            {[
                                { key: 'all', label: 'All' },
                                { key: 'downloading', label: 'Active' },
                                { key: 'completed', label: 'Completed' },
                                { key: 'error', label: 'Failed' }
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setFilter(key as any)}
                                    className={`px-3 py-2 rounded-lg text-sm transition-colors touch-manipulation min-h-[40px] flex items-center justify-center ${filter === key
                                        ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Downloads List */}
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {filteredDownloads.length > 0 ? (
                            filteredDownloads.map((download) => (
                                <DownloadItem key={download.id} download={download} />
                            ))
                        ) : (
                            <div className="bg-white dark:bg-dark-800 rounded-xl card-shadow p-12 text-center">
                                <div className="bg-gray-100 dark:bg-dark-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                    <DownloadIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                    {downloads.length === 0 ? 'No downloads yet' : `No ${filter} downloads`}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                                    {downloads.length === 0
                                        ? 'Add a video URL above to start downloading content from your favorite platforms.'
                                        : `You don't have any ${filter} downloads at the moment.`
                                    }
                                </p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {/* Settings Modal */}
            <Settings
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
            <SystemStatus />
        </div>
    )
}