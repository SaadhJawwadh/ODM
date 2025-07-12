'use client'

import { useState } from 'react'
import { Play, Pause, X, Download, Clock, CheckCircle, XCircle, AlertCircle, Eye, FolderOpen, HardDrive, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { DownloadItem as DownloadItemType } from '@/types'
import { useDownloadStore } from '@/store/downloadStore'
import ProgressBar from './ProgressBar'

interface DownloadItemProps {
    download: DownloadItemType
}

export default function DownloadItem({ download }: DownloadItemProps) {
    const [isLoading, setIsLoading] = useState(false)
    const { pauseDownload, resumeDownload, cancelDownload, deleteDownload, startBrowserDownload } = useDownloadStore()

    const handlePause = async () => {
        if (isLoading) return
        setIsLoading(true)
        try {
            await pauseDownload(download.id)
        } catch (error) {
            console.error('Error pausing download:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleResume = async () => {
        if (isLoading) return
        setIsLoading(true)
        try {
            await resumeDownload(download.id)
        } catch (error) {
            console.error('Error resuming download:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = async () => {
        if (isLoading) return
        setIsLoading(true)
        try {
            await cancelDownload(download.id)
        } catch (error) {
            console.error('Error canceling download:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async () => {
        if (isLoading) return
        setIsLoading(true)
        try {
            await deleteDownload(download.id)
        } catch (error) {
            console.error('Error deleting download:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleStartDownload = async () => {
        if (isLoading) return
        setIsLoading(true)
        try {
            await startBrowserDownload(download.id)
        } catch (error) {
            console.error('Error starting download:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const getStatusIcon = () => {
        switch (download.status) {
            case 'pending':
                return <Clock className="w-4 h-4 text-gray-500" />
            case 'ready':
                return <CheckCircle className="w-4 h-4 text-blue-500" />
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
                return 'Preparing...'
            case 'ready':
                return 'Ready to download'
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
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-dark-800 rounded-xl card-shadow p-4 sm:p-6 mb-4"
        >
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Thumbnail */}
                <div className="flex-shrink-0 self-center sm:self-start">
                    {download.thumbnail ? (
                        <img
                            src={download.thumbnail}
                            alt={download.title}
                            className="w-24 h-18 sm:w-20 sm:h-15 object-cover rounded-lg"
                        />
                    ) : (
                        <div className="w-24 h-18 sm:w-20 sm:h-15 bg-gray-200 dark:bg-dark-700 rounded-lg flex items-center justify-center">
                            <Download className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-white text-base sm:text-sm line-clamp-2 sm:truncate">
                                {download.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                                {download.fileName || download.url}
                            </p>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-2 sm:gap-2 sm:ml-4 flex-wrap sm:flex-nowrap">
                            {/* Start Download Button for Ready Status */}
                            {download.status === 'ready' && (
                                <button
                                    onClick={handleStartDownload}
                                    disabled={isLoading}
                                    className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 disabled:opacity-50 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                                    aria-label="Start download"
                                    title="Start download"
                                >
                                    <Download className="w-5 h-5" />
                                </button>
                            )}

                            {/* Download Controls */}
                            {download.status === 'downloading' && (
                                <button
                                    onClick={handlePause}
                                    disabled={isLoading}
                                    className="p-3 rounded-lg bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 disabled:opacity-50 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                                    aria-label="Pause download"
                                >
                                    <Pause className="w-5 h-5" />
                                </button>
                            )}

                            {download.status === 'paused' && (
                                <button
                                    onClick={handleResume}
                                    disabled={isLoading}
                                    className="p-3 rounded-lg bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 disabled:opacity-50 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                                    aria-label="Resume download"
                                >
                                    <Play className="w-5 h-5" />
                                </button>
                            )}

                            {/* File Operations for Completed Downloads */}
                            {download.status === 'completed' && (
                                <>
                                    <button
                                        onClick={() => {/* File downloaded to your browser downloads folder */ }}
                                        disabled={isLoading}
                                        className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 text-green-600 dark:text-green-400 disabled:opacity-50 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                                        aria-label="Download location"
                                        title="File saved to browser downloads"
                                    >
                                        <FolderOpen className="w-5 h-5" />
                                    </button>
                                </>
                            )}

                            {/* Cancel Button for Active Downloads */}
                            {(download.status === 'pending' || download.status === 'downloading' || download.status === 'paused') && (
                                <button
                                    onClick={handleCancel}
                                    disabled={isLoading}
                                    className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 disabled:opacity-50 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                                    aria-label="Cancel download"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}

                            {/* Delete Button for All Downloads */}
                            <button
                                onClick={handleDelete}
                                disabled={isLoading}
                                className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 disabled:opacity-50 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                                aria-label="Delete download"
                                title="Delete from list"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Progress */}
                    <ProgressBar
                        progress={download.progress}
                        status={download.status}
                        className="mb-3"
                    />

                    {/* Status and Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                        <div className="flex items-center space-x-2">
                            {getStatusIcon()}
                            <span className="text-gray-700 dark:text-gray-300 font-medium">
                                {getStatusText()}
                            </span>
                            {download.fileSize && (
                                <span className="text-gray-500 dark:text-gray-400">
                                    • {download.fileSize}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center justify-between sm:justify-end space-x-4 text-gray-500 dark:text-gray-400">
                            {download.speed && download.status === 'downloading' && (
                                <span className="text-xs sm:text-sm">{download.speed}</span>
                            )}
                            {download.eta && download.status === 'downloading' && (
                                <span className="text-xs sm:text-sm">ETA: {download.eta}</span>
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
                                <span className="font-medium">File downloaded:</span>
                                <span className="truncate">{download.fileName}</span>
                            </div>
                            <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                                Check your browser's download folder
                            </p>
                        </div>
                    )}

                    {/* Ready Status Info */}
                    {download.status === 'ready' && (
                        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <div className="flex items-center space-x-2 text-sm text-blue-700 dark:text-blue-400">
                                <Download className="w-4 h-4" />
                                <span className="font-medium">Ready to download</span>
                            </div>
                            <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                                Click the download button to start
                            </p>
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
    )
}