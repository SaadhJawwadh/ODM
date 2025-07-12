'use client'

import { useState } from 'react'
import { Play, Pause, X, Download, Clock, CheckCircle, XCircle, AlertCircle, Eye, FolderOpen, HardDrive } from 'lucide-react'
import { motion } from 'framer-motion'
import { DownloadItem as DownloadItemType } from '@/types'
import { useDownloadStore } from '@/store/downloadStore'
import ProgressBar from './ProgressBar'
import Toast from './Toast'

interface DownloadItemProps {
    download: DownloadItemType
}

export default function DownloadItem({ download }: DownloadItemProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; visible: boolean }>({
        message: '',
        type: 'info',
        visible: false
    })
    const { updateDownload, removeDownload } = useDownloadStore()

    const showToast = (message: string, type: 'success' | 'error' | 'info') => {
        setToast({ message, type, visible: true })
    }

    const handlePause = async () => {
        if (isLoading) return
        setIsLoading(true)

        try {
            const response = await fetch('/api/download/control', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: download.id, action: 'pause' })
            })

            if (response.ok) {
                updateDownload(download.id, { status: 'paused' })
                showToast('Download paused', 'info')
            }
        } catch (error) {
            console.error('Error pausing download:', error)
            showToast('Failed to pause download', 'error')
        } finally {
            setIsLoading(false)
        }
    }

    const handleResume = async () => {
        if (isLoading) return
        setIsLoading(true)

        try {
            const response = await fetch('/api/download/control', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: download.id, action: 'resume' })
            })

            if (response.ok) {
                updateDownload(download.id, { status: 'downloading' })
                showToast('Download resumed', 'info')
            }
        } catch (error) {
            console.error('Error resuming download:', error)
            showToast('Failed to resume download', 'error')
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = async () => {
        if (isLoading) return
        setIsLoading(true)

        try {
            const response = await fetch('/api/download/control', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: download.id, action: 'cancel' })
            })

            if (response.ok) {
                removeDownload(download.id)
                showToast('Download cancelled', 'info')
            }
        } catch (error) {
            console.error('Error canceling download:', error)
            showToast('Failed to cancel download', 'error')
        } finally {
            setIsLoading(false)
        }
    }

    const handleFileOperation = async (action: 'open-file' | 'open-location') => {
        if (!download.filePath) {
            showToast('File path not available', 'error')
            return
        }

        setIsLoading(true)
        try {
            const response = await fetch('/api/files/open', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, filePath: download.filePath })
            })

            if (response.ok) {
                const actionText = action === 'open-file' ? 'File opened' : 'File location opened'
                showToast(actionText, 'success')
            } else {
                const error = await response.json()
                showToast(error.error || 'File operation failed', 'error')
            }
        } catch (error) {
            console.error('Error with file operation:', error)
            showToast('Failed to perform file operation', 'error')
        } finally {
            setIsLoading(false)
        }
    }

    const getStatusIcon = () => {
        switch (download.status) {
            case 'pending':
                return <Clock className="w-4 h-4 text-gray-500" />
            case 'downloading':
                return <Download className="w-4 h-4 text-blue-500 animate-bounce" />
            case 'completed':
                return <CheckCircle className="w-4 h-4 text-green-500" />
            case 'error':
                return <XCircle className="w-4 h-4 text-red-500" />
            case 'paused':
                return <AlertCircle className="w-4 h-4 text-yellow-500" />
            default:
                return <Clock className="w-4 h-4 text-gray-500" />
        }
    }

    const getStatusText = () => {
        switch (download.status) {
            case 'pending':
                return 'Pending'
            case 'downloading':
                return `Downloading ${download.progress}%`
            case 'completed':
                return 'Completed'
            case 'error':
                return 'Error'
            case 'paused':
                return 'Paused'
            default:
                return 'Unknown'
        }
    }

    const formatTime = (date: Date | string) => {
        try {
            // Handle both Date objects and string dates
            const dateObj = typeof date === 'string' ? new Date(date) : date

            // Check if the date is valid
            if (!dateObj || isNaN(dateObj.getTime())) {
                return 'Unknown'
            }

            return new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(dateObj)
        } catch (error) {
            console.error('Error formatting date:', error)
            return 'Unknown'
        }
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white dark:bg-dark-800 rounded-xl card-shadow p-4 mb-4"
            >
                <div className="flex items-start space-x-4">
                    {/* Thumbnail */}
                    <div className="flex-shrink-0">
                        {download.thumbnail ? (
                            <img
                                src={download.thumbnail}
                                alt={download.title}
                                className="w-20 h-15 object-cover rounded-lg"
                            />
                        ) : (
                            <div className="w-20 h-15 bg-gray-200 dark:bg-dark-700 rounded-lg flex items-center justify-center">
                                <Download className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                    {download.title}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                    {download.fileName || download.url}
                                </p>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center space-x-2 ml-4">
                                {/* File Operations for Completed Downloads */}
                                {download.status === 'completed' && download.filePath && (
                                    <>
                                        <button
                                            onClick={() => handleFileOperation('open-file')}
                                            disabled={isLoading}
                                            className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 text-green-600 dark:text-green-400 disabled:opacity-50 transition-colors"
                                            aria-label="Preview file"
                                            title="Preview file"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleFileOperation('open-location')}
                                            disabled={isLoading}
                                            className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 disabled:opacity-50 transition-colors"
                                            aria-label="Open file location"
                                            title="Open file location"
                                        >
                                            <FolderOpen className="w-4 h-4" />
                                        </button>
                                    </>
                                )}

                                {/* Download Controls */}
                                {download.status === 'downloading' && (
                                    <button
                                        onClick={handlePause}
                                        disabled={isLoading}
                                        className="p-2 rounded-lg bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 disabled:opacity-50 transition-colors"
                                        aria-label="Pause download"
                                    >
                                        <Pause className="w-4 h-4" />
                                    </button>
                                )}

                                {download.status === 'paused' && (
                                    <button
                                        onClick={handleResume}
                                        disabled={isLoading}
                                        className="p-2 rounded-lg bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 disabled:opacity-50 transition-colors"
                                        aria-label="Resume download"
                                    >
                                        <Play className="w-4 h-4" />
                                    </button>
                                )}

                                {download.status !== 'completed' && (
                                    <button
                                        onClick={handleCancel}
                                        disabled={isLoading}
                                        className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 disabled:opacity-50 transition-colors"
                                        aria-label="Cancel download"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Progress */}
                        <ProgressBar
                            progress={download.progress}
                            status={download.status}
                            className="mb-2"
                        />

                        {/* Status and Info */}
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                                {getStatusIcon()}
                                <span className="text-gray-700 dark:text-gray-300">
                                    {getStatusText()}
                                </span>
                                {download.fileSize && (
                                    <span className="text-gray-500 dark:text-gray-400">
                                        • {download.fileSize}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center space-x-4 text-gray-500 dark:text-gray-400">
                                {download.speed && download.status === 'downloading' && (
                                    <span>{download.speed}</span>
                                )}
                                {download.eta && download.status === 'downloading' && (
                                    <span>ETA: {download.eta}</span>
                                )}
                                <span className="text-xs">
                                    {formatTime(download.createdAt)}
                                </span>
                            </div>
                        </div>

                        {/* File Info for Completed Downloads */}
                        {download.status === 'completed' && download.fileName && (
                            <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <div className="flex items-center space-x-2 text-sm text-green-700 dark:text-green-400">
                                    <HardDrive className="w-4 h-4" />
                                    <span className="font-medium">File saved:</span>
                                    <span className="truncate">{download.fileName}</span>
                                </div>
                            </div>
                        )}

                        {/* Error Message */}
                        {download.error && (
                            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-sm text-red-700 dark:text-red-400">
                                    {download.error}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Toast Notification */}
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.visible}
                onClose={() => setToast(prev => ({ ...prev, visible: false }))}
            />
        </>
    )
}