'use client'

import { useState } from 'react'
import { X, Settings as SettingsIcon, Folder, Download, Volume2, Video, Globe } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDownloadStore } from '@/store/downloadStore'

interface SettingsProps {
    isOpen: boolean
    onClose: () => void
}

export default function Settings({ isOpen, onClose }: SettingsProps) {
    const { settings, updateSettings } = useDownloadStore()
    const [localSettings, setLocalSettings] = useState(settings)

    const handleSave = () => {
        updateSettings(localSettings)
        onClose()
    }

    const handleReset = () => {
        const defaultSettings = {
            outputPath: './downloads',
            audioFormat: 'mp3' as const,
            videoFormat: 'mp4' as const,
            audioQuality: 'best' as const,
            videoQuality: 'best' as const,
            subtitles: false,
            thumbnails: true,
            maxConcurrentDownloads: 3,
            theme: 'dark' as const
        }
        setLocalSettings(defaultSettings)
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    {/* Settings Panel */}
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        className="fixed right-0 top-0 h-full w-full sm:w-96 max-w-md bg-white dark:bg-dark-800 border-l border-gray-200 dark:border-dark-700 shadow-xl z-50 overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 px-4 sm:px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3 min-w-0">
                                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-2 rounded-lg flex-shrink-0">
                                        <SettingsIcon className="w-5 h-5 text-white" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
                                        Settings
                                    </h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-3 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors touch-manipulation min-w-[44px] min-h-[44px] sm:min-w-auto sm:min-h-auto flex items-center justify-center flex-shrink-0"
                                    aria-label="Close settings"
                                >
                                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 sm:p-6 space-y-6">
                            {/* Output Path */}
                            <div>
                                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    <Folder className="w-4 h-4" />
                                    <span>Output Directory</span>
                                </label>
                                <input
                                    type="text"
                                    value={localSettings.outputPath}
                                    onChange={(e) => setLocalSettings(prev => ({ ...prev, outputPath: e.target.value }))}
                                    className="w-full px-4 py-3 text-base sm:text-sm border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white min-h-[44px] touch-manipulation"
                                    placeholder="./downloads"
                                />
                            </div>

                            {/* Audio Settings */}
                            <div>
                                <h3 className="flex items-center space-x-2 text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    <Volume2 className="w-5 h-5" />
                                    <span>Audio Settings</span>
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Audio Format
                                        </label>
                                        <select
                                            value={localSettings.audioFormat}
                                            onChange={(e) => setLocalSettings(prev => ({ ...prev, audioFormat: e.target.value as any }))}
                                            className="w-full px-4 py-3 text-base sm:text-sm border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white min-h-[44px] touch-manipulation"
                                        >
                                            <option value="mp3">MP3</option>
                                            <option value="aac">AAC</option>
                                            <option value="flac">FLAC</option>
                                            <option value="wav">WAV</option>
                                            <option value="ogg">OGG</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Audio Quality
                                        </label>
                                        <select
                                            value={localSettings.audioQuality}
                                            onChange={(e) => setLocalSettings(prev => ({ ...prev, audioQuality: e.target.value as any }))}
                                            className="w-full px-4 py-3 text-base sm:text-sm border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white min-h-[44px] touch-manipulation"
                                        >
                                            <option value="best">Best Quality</option>
                                            <option value="320">320 kbps</option>
                                            <option value="256">256 kbps</option>
                                            <option value="192">192 kbps</option>
                                            <option value="128">128 kbps</option>
                                            <option value="worst">Worst Quality</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Video Settings */}
                            <div>
                                <h3 className="flex items-center space-x-2 text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    <Video className="w-5 h-5" />
                                    <span>Video Settings</span>
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Video Format
                                        </label>
                                        <select
                                            value={localSettings.videoFormat}
                                            onChange={(e) => setLocalSettings(prev => ({ ...prev, videoFormat: e.target.value as any }))}
                                            className="w-full px-4 py-3 text-base sm:text-sm border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white min-h-[44px] touch-manipulation"
                                        >
                                            <option value="mp4">MP4</option>
                                            <option value="webm">WebM</option>
                                            <option value="mkv">MKV</option>
                                            <option value="avi">AVI</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Video Quality
                                        </label>
                                        <select
                                            value={localSettings.videoQuality}
                                            onChange={(e) => setLocalSettings(prev => ({ ...prev, videoQuality: e.target.value as any }))}
                                            className="w-full px-4 py-3 text-base sm:text-sm border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white min-h-[44px] touch-manipulation"
                                        >
                                            <option value="best">Best Quality</option>
                                            <option value="1080">1080p</option>
                                            <option value="720">720p</option>
                                            <option value="480">480p</option>
                                            <option value="360">360p</option>
                                            <option value="worst">Worst Quality</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Download Settings */}
                            <div>
                                <h3 className="flex items-center space-x-2 text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    <Download className="w-5 h-5" />
                                    <span>Download Settings</span>
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Max Concurrent Downloads
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={localSettings.maxConcurrentDownloads}
                                            onChange={(e) => setLocalSettings(prev => ({ ...prev, maxConcurrentDownloads: parseInt(e.target.value) }))}
                                            className="w-full px-4 py-3 text-base sm:text-sm border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white min-h-[44px] touch-manipulation"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors cursor-pointer touch-manipulation">
                                            <input
                                                type="checkbox"
                                                checked={localSettings.subtitles}
                                                onChange={(e) => setLocalSettings(prev => ({ ...prev, subtitles: e.target.checked }))}
                                                className="w-5 h-5 text-primary-500 rounded focus:ring-primary-500 focus:ring-2"
                                            />
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1">
                                                Download subtitles by default
                                            </span>
                                        </label>

                                        <label className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors cursor-pointer touch-manipulation">
                                            <input
                                                type="checkbox"
                                                checked={localSettings.thumbnails}
                                                onChange={(e) => setLocalSettings(prev => ({ ...prev, thumbnails: e.target.checked }))}
                                                className="w-5 h-5 text-primary-500 rounded focus:ring-primary-500 focus:ring-2"
                                            />
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1">
                                                Download thumbnails by default
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Theme Settings */}
                            <div>
                                <h3 className="flex items-center space-x-2 text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    <Globe className="w-5 h-5" />
                                    <span>Appearance</span>
                                </h3>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Theme
                                    </label>
                                    <select
                                        value={localSettings.theme}
                                        onChange={(e) => setLocalSettings(prev => ({ ...prev, theme: e.target.value as any }))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="light">Light</option>
                                        <option value="dark">Dark</option>
                                        <option value="system">System</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="sticky bottom-0 bg-white dark:bg-dark-800 border-t border-gray-200 dark:border-dark-700 px-6 py-4">
                            <div className="flex space-x-3">
                                <button
                                    onClick={handleSave}
                                    className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2 rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                    Save Changes
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="px-4 py-2 border border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}