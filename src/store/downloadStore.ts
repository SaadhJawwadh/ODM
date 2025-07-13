import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { DownloadItem, AppSettings, VideoInfo } from '@/types'

interface Notification {
    id: string
    message: string
    type: 'success' | 'error' | 'info'
    timestamp: number
}

interface SystemStatus {
    message: string;
    status: 'installing' | 'ready' | 'idle';
}

interface DownloadStore {
    downloads: DownloadItem[]
    settings: AppSettings
    currentVideo: VideoInfo | null
    isLoading: boolean
    notifications: Notification[]
    systemStatus: SystemStatus | null;

    // Actions
    addDownload: (download: DownloadItem) => void
    updateDownload: (id: string, updates: Partial<DownloadItem>) => void
    removeDownload: (id: string) => void
    clearCompleted: () => void
    setCurrentVideo: (video: VideoInfo | null) => void
    setLoading: (loading: boolean) => void
    updateSettings: (settings: Partial<AppSettings>) => void
    pauseDownload: (id: string) => void
    resumeDownload: (id: string) => void
    cancelDownload: (id: string) => void
    deleteDownload: (id: string) => void
    startBrowserDownload: (id: string) => void
    showNotification: (message: string, type: 'success' | 'error' | 'info') => void
    removeNotification: (id: string) => void
    setSystemStatus: (status: SystemStatus | null) => void;
}

const defaultSettings: AppSettings = {
    outputPath: './downloads',
    audioFormat: 'mp3',
    videoFormat: 'mp4',
    audioQuality: 'best',
    videoQuality: 'best',
    subtitles: false,
    thumbnails: true,
    maxConcurrentDownloads: 3,
    theme: 'dark'
}

// Store for active download abort controllers
const activeDownloads = new Map<string, AbortController>()

export const useDownloadStore = create<DownloadStore>()(
    persist(
        (set, get) => ({
            downloads: [],
            settings: defaultSettings,
            currentVideo: null,
            isLoading: false,
            notifications: [],
            systemStatus: null,

            addDownload: (download) =>
                set((state) => ({
                    downloads: [{ ...download, autoDownloadStarted: false }, ...state.downloads],
                })),

            updateDownload: (id, updates) =>
                set((state) => ({
                    downloads: state.downloads.map((download) =>
                        download.id === id ? { ...download, ...updates } : download
                    ),
                })),

            removeDownload: (id) =>
                set((state) => ({
                    downloads: state.downloads.filter((download) => download.id !== id),
                })),

            setSystemStatus: (status) => set({ systemStatus: status }),

            clearCompleted: () =>
                set((state) => ({
                    downloads: state.downloads.filter((download) => download.status !== 'completed'),
                })),

            setCurrentVideo: (video) =>
                set(() => ({
                    currentVideo: video,
                })),

            setLoading: (loading) =>
                set(() => ({
                    isLoading: loading,
                })),

            updateSettings: (newSettings) =>
                set((state) => ({
                    settings: { ...state.settings, ...newSettings },
                })),

            pauseDownload: async (id) => {
                const controller = activeDownloads.get(id)
                if (controller) {
                    controller.abort()
                    activeDownloads.delete(id)
                }

                try {
                    await fetch('/api/download/control', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id, action: 'pause' })
                    })

                    set((state) => ({
                        downloads: state.downloads.map((download) =>
                            download.id === id ? { ...download, status: 'paused' as const } : download
                        ),
                    }))

                    get().showNotification('Download paused', 'info')
                } catch (error) {
                    console.error('Failed to pause download:', error)
                    get().showNotification('Failed to pause download', 'error')
                }
            },

            resumeDownload: async (id) => {
                try {
                    const download = get().downloads.find(d => d.id === id)
                    if (!download) {
                        get().showNotification('Download not found', 'error')
                        return
                    }

                    // Update status to pending and reset progress
                    get().updateDownload(id, {
                        status: 'pending',
                        progress: 0,
                        error: ''
                    })

                    // Restart the download process by calling the start API
                    const response = await fetch('/api/download/start', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id: id,
                            url: download.url,
                            format: download.format,
                            quality: download.quality,
                            audioOnly: download.audioOnly || false,
                            subtitles: download.subtitles || false,
                            thumbnails: download.thumbnails || false
                        })
                    })

                    if (!response.ok) {
                        throw new Error('Failed to restart download')
                    }

                    get().showNotification('Download resumed', 'info')
                } catch (error) {
                    console.error('Failed to resume download:', error)
                    get().showNotification('Failed to resume download', 'error')

                    // Reset status to paused on error
                    get().updateDownload(id, { status: 'paused' })
                }
            },

            cancelDownload: async (id) => {
                const controller = activeDownloads.get(id)
                if (controller) {
                    controller.abort()
                    activeDownloads.delete(id)
                }

                try {
                    await fetch('/api/download/control', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id, action: 'cancel' })
                    })

                    set((state) => ({
                        downloads: state.downloads.filter((download) => download.id !== id),
                    }))

                    get().showNotification('Download cancelled', 'info')
                } catch (error) {
                    console.error('Failed to cancel download:', error)
                    get().showNotification('Failed to cancel download', 'error')
                }
            },

            deleteDownload: async (id) => {
                const controller = activeDownloads.get(id)
                if (controller) {
                    controller.abort()
                    activeDownloads.delete(id)
                }

                try {
                    await fetch('/api/download/control', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id, action: 'delete' })
                    })

                    set((state) => ({
                        downloads: state.downloads.filter((download) => download.id !== id),
                    }))

                    get().showNotification('Download deleted', 'info')
                } catch (error) {
                    console.error('Failed to delete download:', error)
                    get().showNotification('Failed to delete download', 'error')
                }
            },

            startBrowserDownload: async (id) => {
                const download = get().downloads.find(d => d.id === id)
                if (!download) {
                    get().showNotification('Download not found', 'error')
                    return
                }

                if (download.status !== 'ready') {
                    get().showNotification('Download not ready', 'error')
                    return
                }

                try {
                    // Update status to downloading
                    get().updateDownload(id, { status: 'downloading', progress: 0 })

                    // Stream the file from the server
                    const response = await fetch(`/api/download/start?id=${id}&action=stream`)

                    if (!response.ok) {
                        // Check if response is JSON (error response)
                        const contentType = response.headers.get('content-type')
                        if (contentType && contentType.includes('application/json')) {
                            const errorData = await response.json()
                            throw new Error(errorData.error || `Failed to download: ${response.statusText}`)
                        } else {
                            throw new Error(`Failed to download: ${response.statusText}`)
                        }
                    }

                    // Get filename from response headers
                    const contentDisposition = response.headers.get('content-disposition')
                    let filename = download.fileName || 'download'

                    if (contentDisposition) {
                        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/)
                        if (filenameMatch) {
                            filename = filenameMatch[1]
                        }
                    }

                    // Create blob and trigger download
                    const blob = await response.blob()
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = filename
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    URL.revokeObjectURL(url)

                    // Mark as completed
                    get().updateDownload(id, { status: 'completed', progress: 100 })
                    get().showNotification('Download completed successfully', 'success')

                } catch (error) {
                    console.error('Download error:', error)
                    const errorMessage = error instanceof Error ? error.message : 'Download failed'
                    get().updateDownload(id, {
                        status: 'error',
                        error: errorMessage
                    })
                    get().showNotification(`Download failed: ${errorMessage}`, 'error')
                }
            },

            showNotification: (message, type) => {
                const id = Date.now().toString()
                const notification: Notification = {
                    id,
                    message,
                    type,
                    timestamp: Date.now()
                }
                set((state) => ({
                    notifications: [...state.notifications, notification]
                }))

                // Auto-remove notification after 3 seconds
                setTimeout(() => {
                    get().removeNotification(id)
                }, 3000)
            },

            removeNotification: (id) =>
                set((state) => ({
                    notifications: state.notifications.filter(n => n.id !== id)
                }))
        }),
        {
            name: 'download-store',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                downloads: state.downloads,
                settings: state.settings,
            }),
            skipHydration: true,
        }
    )
)

// Initialize the store on the client side
if (typeof window !== 'undefined') {
    useDownloadStore.persist.rehydrate()
}