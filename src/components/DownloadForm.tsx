'use client'

import { useState } from 'react'
import { Download, Link, Music, Video, FileText, Image, Monitor, Headphones, Eye, AlertTriangle, Info, Check } from 'lucide-react'
import { useDownloadStore } from '@/store/downloadStore'
import { VideoInfo } from '@/types'

export default function DownloadForm() {
    const [url, setUrl] = useState('')
    const [audioOnly, setAudioOnly] = useState(false)
    const [quality, setQuality] = useState('best')
    const [format, setFormat] = useState('mp4')
    const [selectedFormatId, setSelectedFormatId] = useState('')
    const [subtitles, setSubtitles] = useState(false)
    const [thumbnails, setThumbnails] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [downloadStep, setDownloadStep] = useState<'input' | 'info' | 'download'>('input')

    const { addDownload, settings } = useDownloadStore()

    const handleGetInfo = async () => {
        if (!url.trim()) return

        setIsLoading(true)
        try {
            const response = await fetch('/api/video/info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url.trim() })
            })

            if (response.ok) {
                const info = await response.json()
                setVideoInfo(info)
                // Auto-select best format for current mode
                if (info.formats) {
                    if (audioOnly && info.formats.audio.length > 0) {
                        setSelectedFormatId(info.formats.audio[0].format_id)
                    } else if (!audioOnly && info.formats.video.length > 0) {
                        setSelectedFormatId(info.formats.video[0].format_id)
                    }
                }
                setDownloadStep('info')
            } else {
                console.error('Failed to get video info')
            }
        } catch (error) {
            console.error('Error getting video info:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleStartDownload = async () => {
        if (!url.trim() || !videoInfo) return

        const downloadId = Date.now().toString()

        // Add to store immediately
        addDownload({
            id: downloadId,
            url: url.trim(),
            title: videoInfo.title || 'Unknown',
            thumbnail: videoInfo.thumbnail,
            duration: videoInfo.duration,
            format: audioOnly ? settings.audioFormat : format,
            quality,
            status: 'pending',
            progress: 0,
            createdAt: new Date(),
            audioOnly,
            subtitles,
            thumbnails
        })

        // Start download
        try {
            const response = await fetch('/api/download/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: downloadId,
                    url: url.trim(),
                    format: audioOnly ? settings.audioFormat : format,
                    quality,
                    audioOnly,
                    subtitles,
                    thumbnails
                })
            })

            if (!response.ok) {
                console.error('Failed to start download')
            }
        } catch (error) {
            console.error('Error starting download:', error)
        }

        // Reset form
        setUrl('')
        setVideoInfo(null)
        setSelectedFormatId('')
        setDownloadStep('input')
    }

    const handleBackToInput = () => {
        setDownloadStep('input')
        setVideoInfo(null)
        setSelectedFormatId('')
    }

    const getSelectedFormat = () => {
        if (!videoInfo || !selectedFormatId) return null
        const allFormats = [...videoInfo.formats.video, ...videoInfo.formats.audio]
        return allFormats.find(f => f.format_id === selectedFormatId)
    }

    const getAvailableQualities = () => {
        if (!videoInfo) return []
        const formats = audioOnly ? videoInfo.formats.audio : videoInfo.formats.video
        return formats.map(f => ({ value: f.format_id, label: f.quality, fileSize: f.filesizeFormatted }))
    }

    const formatFileSize = (bytes: number) => {
        if (!bytes) return 'Unknown'
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(1024))
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
    }

    const getFileSizeWarning = (format: any) => {
        if (!format?.filesize) return null
        const sizeInMB = format.filesize / (1024 * 1024)
        if (sizeInMB > 500) return 'Large file (>500MB)'
        if (sizeInMB > 100) return 'Medium file (>100MB)'
        return null
    }

    // Step 1: URL Input
    if (downloadStep === 'input') {
        return (
            <div className="bg-white dark:bg-dark-800 rounded-xl card-shadow p-6 mb-6">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-2 rounded-lg">
                        <Link className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Add Download
                    </h2>
                </div>

                {/* URL Input */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Video URL
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="Paste video URL here..."
                            className="flex-1 px-4 py-3 text-base sm:text-sm border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 min-h-[44px] touch-manipulation"
                        />
                        <button
                            onClick={handleGetInfo}
                            disabled={!url.trim() || isLoading}
                            className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl min-h-[44px] touch-manipulation whitespace-nowrap font-medium"
                        >
                            {isLoading ? 'Loading...' : 'Get Info & Continue'}
                        </button>
                    </div>
                </div>

                {/* Basic Download Type Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Download Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setAudioOnly(false)}
                            className={`flex items-center justify-center space-x-2 px-4 py-4 rounded-lg border transition-colors min-h-[52px] touch-manipulation ${!audioOnly
                                ? 'bg-primary-500 border-primary-500 text-white'
                                : 'border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700'
                                }`}
                        >
                            <Video className="w-5 h-5" />
                            <span className="font-medium">Video</span>
                        </button>
                        <button
                            onClick={() => setAudioOnly(true)}
                            className={`flex items-center justify-center space-x-2 px-4 py-4 rounded-lg border transition-colors min-h-[52px] touch-manipulation ${audioOnly
                                ? 'bg-primary-500 border-primary-500 text-white'
                                : 'border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700'
                                }`}
                        >
                            <Music className="w-5 h-5" />
                            <span className="font-medium">Audio</span>
                        </button>
                    </div>
                </div>

                {/* Additional Options */}
                <div className="space-y-4 mb-6">
                    <label className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors cursor-pointer touch-manipulation">
                        <input
                            type="checkbox"
                            checked={subtitles}
                            onChange={(e) => setSubtitles(e.target.checked)}
                            className="w-5 h-5 text-primary-500 rounded focus:ring-primary-500 focus:ring-2"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2 flex-1">
                            <FileText className="w-5 h-5" />
                            <span>Download Subtitles</span>
                        </span>
                    </label>

                    <label className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors cursor-pointer touch-manipulation">
                        <input
                            type="checkbox"
                            checked={thumbnails}
                            onChange={(e) => setThumbnails(e.target.checked)}
                            className="w-5 h-5 text-primary-500 rounded focus:ring-primary-500 focus:ring-2"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2 flex-1">
                            <Image className="w-5 h-5" />
                            <span>Download Thumbnail</span>
                        </span>
                    </label>
                </div>
            </div>
        )
    }

    // Step 2: Video Info and Quality Selection
    if (downloadStep === 'info' && videoInfo) {
        return (
            <div className="bg-white dark:bg-dark-800 rounded-xl card-shadow p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-2 rounded-lg">
                            <Check className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Select Download Options
                        </h2>
                    </div>
                    <button
                        onClick={handleBackToInput}
                        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        ← Back
                    </button>
                </div>

                {/* Enhanced Video Info */}
                <div className="mb-6 p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
                    <div className="flex items-start space-x-4 mb-4">
                        {videoInfo.thumbnail && (
                            <div className="relative flex-shrink-0">
                                <img
                                    src={videoInfo.thumbnail}
                                    alt={videoInfo.title}
                                    className="w-32 h-24 object-cover rounded-lg"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center rounded-lg">
                                    <div className="bg-black bg-opacity-50 p-1 rounded">
                                        {videoInfo.contentType === 'video' ? (
                                            <Video className="w-4 h-4 text-white" />
                                        ) : (
                                            <Music className="w-4 h-4 text-white" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                                {videoInfo.title}
                            </h3>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                                <span className="flex items-center gap-1">
                                    <Monitor className="w-4 h-4" />
                                    {videoInfo.uploader}
                                </span>
                                {videoInfo.duration && (
                                    <span className="flex items-center gap-1">
                                        <Eye className="w-4 h-4" />
                                        {videoInfo.duration}
                                    </span>
                                )}
                                {videoInfo.metadata.viewCount && (
                                    <span className="flex items-center gap-1">
                                        <Eye className="w-4 h-4" />
                                        {videoInfo.metadata.viewCount.toLocaleString()} views
                                    </span>
                                )}
                            </div>

                            {/* File Type and Size Info */}
                            <div className="grid grid-cols-2 gap-4 mb-3">
                                <div className="bg-white dark:bg-dark-800 p-3 rounded-lg">
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Content Type</div>
                                    <div className="flex items-center gap-2">
                                        {videoInfo.contentType === 'video' ? (
                                            <Video className="w-4 h-4 text-primary-500" />
                                        ) : (
                                            <Music className="w-4 h-4 text-primary-500" />
                                        )}
                                        <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                                            {videoInfo.contentType}
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-dark-800 p-3 rounded-lg">
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Available Formats</div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                        {videoInfo.formats.video.length} Video • {videoInfo.formats.audio.length} Audio
                                    </div>
                                </div>
                            </div>

                            {/* Estimated File Sizes */}
                            <div className="bg-white dark:bg-dark-800 p-3 rounded-lg">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Estimated File Sizes</div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>1080p:</span>
                                        <span className="font-medium">{videoInfo.estimatedSizes['1080p']}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>720p:</span>
                                        <span className="font-medium">{videoInfo.estimatedSizes['720p']}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>480p:</span>
                                        <span className="font-medium">{videoInfo.estimatedSizes['480p']}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Audio:</span>
                                        <span className="font-medium">{videoInfo.estimatedSizes['audio']}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Tags */}
                            {videoInfo.metadata.tags && videoInfo.metadata.tags.length > 0 && (
                                <div className="mt-3">
                                    <div className="flex flex-wrap gap-1">
                                        {videoInfo.metadata.tags.map((tag, index) => (
                                            <span
                                                key={index}
                                                className="px-2 py-1 bg-gray-200 dark:bg-dark-600 text-xs rounded-full text-gray-700 dark:text-gray-300"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Advanced Format Selection */}
                    {showAdvanced && (
                        <div className="mt-4 p-4 bg-white dark:bg-dark-800 rounded-lg">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Available Formats</h4>
                            <div className="grid gap-2 max-h-48 overflow-y-auto">
                                {(audioOnly ? videoInfo.formats.audio : videoInfo.formats.video).map((format) => (
                                    <label
                                        key={format.format_id}
                                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${selectedFormatId === format.format_id
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                                : 'border-gray-200 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-700'
                                            }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="radio"
                                                name="format"
                                                value={format.format_id}
                                                checked={selectedFormatId === format.format_id}
                                                onChange={() => setSelectedFormatId(format.format_id)}
                                                className="w-4 h-4 text-primary-500"
                                            />
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white">
                                                    {format.quality} • {format.ext.toUpperCase()}
                                                </div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                    {format.resolution && `${format.resolution} • `}
                                                    {format.fps && `${format.fps}fps • `}
                                                    {format.vcodec && `${format.vcodec} • `}
                                                    {format.acodec && format.acodec}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-medium text-gray-900 dark:text-white">
                                                {format.filesizeFormatted}
                                            </div>
                                            {getFileSizeWarning(format) && (
                                                <div className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    {getFileSizeWarning(format)}
                                                </div>
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Toggle Advanced Options */}
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="mt-3 text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1"
                    >
                        <Info className="w-4 h-4" />
                        {showAdvanced ? 'Hide' : 'Show'} Advanced Format Options
                    </button>
                </div>

                {/* Quality Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                    {/* Smart Quality Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Quality
                        </label>
                        <select
                            value={showAdvanced ? selectedFormatId : quality}
                            onChange={(e) => {
                                if (showAdvanced) {
                                    setSelectedFormatId(e.target.value)
                                } else {
                                    setQuality(e.target.value)
                                }
                            }}
                            className="w-full px-4 py-3 text-base sm:text-sm border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white min-h-[44px] touch-manipulation"
                        >
                            {showAdvanced ? (
                                // Show actual available formats
                                getAvailableQualities().map((q) => (
                                    <option key={q.value} value={q.value}>
                                        {q.label} ({q.fileSize})
                                    </option>
                                ))
                            ) : (
                                // Show generic quality options
                                <>
                                    <option value="best">Best Quality</option>
                                    {audioOnly ? (
                                        <>
                                            <option value="320">320 kbps</option>
                                            <option value="256">256 kbps</option>
                                            <option value="192">192 kbps</option>
                                            <option value="128">128 kbps</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="1080">1080p</option>
                                            <option value="720">720p</option>
                                            <option value="480">480p</option>
                                            <option value="360">360p</option>
                                        </>
                                    )}
                                    <option value="worst">Worst Quality</option>
                                </>
                            )}
                        </select>
                        {showAdvanced && getSelectedFormat() && (
                            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                Selected: {getSelectedFormat()!.filesizeFormatted}
                                {getFileSizeWarning(getSelectedFormat()) && (
                                    <div className="text-orange-600 dark:text-orange-400 flex items-center gap-1 mt-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        {getFileSizeWarning(getSelectedFormat())}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Format Selection */}
                    {!audioOnly && !showAdvanced && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Video Format
                            </label>
                            <select
                                value={format}
                                onChange={(e) => setFormat(e.target.value)}
                                className="w-full px-4 py-3 text-base sm:text-sm border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white min-h-[44px] touch-manipulation"
                            >
                                <option value="mp4">MP4</option>
                                <option value="webm">WebM</option>
                                <option value="mkv">MKV</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* Download Button */}
                <button
                    onClick={handleStartDownload}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl min-h-[52px] touch-manipulation font-medium text-base"
                >
                    <Download className="w-6 h-6" />
                    <span>{isLoading ? 'Starting Download...' : 'Start Download'}</span>
                </button>
            </div>
        )
    }

    return null
}