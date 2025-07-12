'use client'

import { useState } from 'react'
import { Download, Link, Music, Video, FileText, Image } from 'lucide-react'
import { useDownloadStore } from '@/store/downloadStore'
import { VideoInfo } from '@/types'

export default function DownloadForm() {
    const [url, setUrl] = useState('')
    const [audioOnly, setAudioOnly] = useState(false)
    const [quality, setQuality] = useState('best')
    const [format, setFormat] = useState('mp4')
    const [subtitles, setSubtitles] = useState(false)
    const [thumbnails, setThumbnails] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)

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
            } else {
                console.error('Failed to get video info')
            }
        } catch (error) {
            console.error('Error getting video info:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDownload = async () => {
        if (!url.trim()) return

        const downloadId = Date.now().toString()
        let currentVideoInfo = videoInfo

        // Automatically get video info if not already available
        if (!currentVideoInfo) {
            setIsLoading(true)
            try {
                const response = await fetch('/api/video/info', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: url.trim() })
                })

                if (response.ok) {
                    const data = await response.json()
                    currentVideoInfo = data
                    setVideoInfo(currentVideoInfo)
                } else {
                    console.error('Failed to get video info')
                }
            } catch (error) {
                console.error('Error fetching video info:', error)
            } finally {
                setIsLoading(false)
            }
        }

        // Add to store immediately
        addDownload({
            id: downloadId,
            url: url.trim(),
            title: currentVideoInfo?.title || 'Unknown',
            thumbnail: currentVideoInfo?.thumbnail,
            duration: currentVideoInfo?.duration,
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
    }

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
                        className="px-6 py-3 bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] touch-manipulation whitespace-nowrap"
                    >
                        {isLoading ? 'Loading...' : 'Get Info'}
                    </button>
                </div>
            </div>

            {/* Video Info */}
            {videoInfo && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
                    <div className="flex items-start space-x-4">
                        {videoInfo.thumbnail && (
                            <img
                                src={videoInfo.thumbnail}
                                alt={videoInfo.title}
                                className="w-24 h-18 object-cover rounded-lg"
                            />
                        )}
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                {videoInfo.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {videoInfo.uploader} • {videoInfo.duration}
                            </p>
                            {videoInfo.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                    {videoInfo.description}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Download Options */}
            <div className="space-y-6 mb-6">
                {/* Format Selection */}
                <div>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Quality Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Quality
                        </label>
                        <select
                            value={quality}
                            onChange={(e) => setQuality(e.target.value)}
                            className="w-full px-4 py-3 text-base sm:text-sm border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white min-h-[44px] touch-manipulation"
                        >
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
                        </select>
                    </div>

                    {/* Format Selection */}
                    {!audioOnly && (
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

            {/* Download Button */}
            <button
                onClick={handleDownload}
                disabled={!url.trim() || isLoading}
                className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl min-h-[52px] touch-manipulation font-medium text-base"
            >
                <Download className="w-6 h-6" />
                <span>{isLoading ? 'Preparing Download...' : 'Start Download'}</span>
            </button>
        </div>
    )
}