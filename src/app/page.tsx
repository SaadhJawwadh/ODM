'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Trash2, Filter, Download as DownloadIcon } from 'lucide-react'
import { useDownloadStore } from '@/store/downloadStore'
import Header from '@/components/Header'
import DownloadForm from '@/components/DownloadForm'
import DownloadItem from '@/components/DownloadItem'
import Settings from '@/components/Settings'

export default function Home() {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [filter, setFilter] = useState<'all' | 'downloading' | 'completed' | 'error'>('all')
    const { downloads, updateDownload, clearCompleted, startBrowserDownload } = useDownloadStore()

    // Poll for download progress updates
    useEffect(() => {
        const activeDownloads = downloads.filter(d =>
            d.status === 'downloading' || d.status === 'pending' || d.status === 'ready'
        )

        if (activeDownloads.length === 0) return

        const interval = setInterval(async () => {
            for (const download of activeDownloads) {
                try {
                    const response = await fetch(`/api/download/start?id=${download.id}`)
                    if (response.ok) {
                        const data = await response.json()

                        // Update download status
                        updateDownload(download.id, {
                            status: data.status,
                            progress: data.progress || 0,
                            speed: data.speed || '',
                            eta: data.eta || '',
                            error: data.error || '',
                            fileName: data.fileName || '',
                            fileSize: data.fileSize || ''
                        })

                        // Auto-start ready downloads
                        if (data.status === 'ready' && download.status !== 'ready') {
                            // Small delay to ensure UI updates, then start download
                            setTimeout(() => {
                                startBrowserDownload(download.id)
                            }, 1000)
                        }
                    }
                } catch (error) {
                    console.error('Error fetching download progress:', error)
                }
            }
        }, 2000) // Poll every 2 seconds

        return () => clearInterval(interval)
    }, [downloads, updateDownload, startBrowserDownload])

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

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Download Form */}
                <DownloadForm />

                {/* Stats and Controls */}
                <div className="bg-white dark:bg-dark-800 rounded-xl card-shadow p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Downloads
                        </h2>
                        <div className="flex items-center space-x-3">
                            {stats.completed > 0 && (
                                <button
                                    onClick={clearCompleted}
                                    className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Clear Completed</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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

                    {/* Filters */}
                    <div className="flex items-center space-x-2">
                        <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Filter:</span>
                        <div className="flex space-x-2">
                            {[
                                { key: 'all', label: 'All' },
                                { key: 'downloading', label: 'Active' },
                                { key: 'completed', label: 'Completed' },
                                { key: 'error', label: 'Failed' }
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setFilter(key as any)}
                                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${filter === key
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
        </div>
    )
}