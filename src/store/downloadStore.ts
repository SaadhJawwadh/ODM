import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { DownloadItem, AppSettings, VideoInfo } from '@/types'

interface DownloadStore {
    downloads: DownloadItem[]
    settings: AppSettings
    currentVideo: VideoInfo | null
    isLoading: boolean

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

            addDownload: (download) =>
                set((state) => ({
                    downloads: [download, ...state.downloads],
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
                } catch (error) {
                    console.error('Failed to pause download:', error)
                }

                set((state) => ({
                    downloads: state.downloads.map((download) =>
                        download.id === id ? { ...download, status: 'paused' as const } : download
                    ),
                }))
            },

            resumeDownload: async (id) => {
                try {
                    await fetch('/api/download/control', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id, action: 'resume' })
                    })

                    // Restart the browser download
                    get().startBrowserDownload(id)
                } catch (error) {
                    console.error('Failed to resume download:', error)
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
                } catch (error) {
                    console.error('Failed to cancel download:', error)
                }

                set((state) => ({
                    downloads: state.downloads.filter((download) => download.id !== id),
                }))
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
                } catch (error) {
                    console.error('Failed to delete download:', error)
                }

                set((state) => ({
                    downloads: state.downloads.filter((download) => download.id !== id),
                }))
            },

            startBrowserDownload: async (id) => {
                const download = get().downloads.find(d => d.id === id)
                if (!download) return

                if (download.status !== 'ready') return

                try {
                    // Update status to downloading
                    get().updateDownload(id, { status: 'downloading', progress: 0 })

                    // Stream the file from the server
                    const response = await fetch(`/api/download/start?id=${id}&action=stream`)

                    if (!response.ok) {
                        throw new Error(`Failed to download: ${response.statusText}`)
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

                } catch (error) {
                    console.error('Download error:', error)
                    get().updateDownload(id, {
                        status: 'error',
                        error: error instanceof Error ? error.message : 'Download failed'
                    })
                }
            }
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