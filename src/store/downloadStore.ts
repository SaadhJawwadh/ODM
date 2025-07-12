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

            pauseDownload: (id) =>
                set((state) => ({
                    downloads: state.downloads.map((download) =>
                        download.id === id ? { ...download, status: 'paused' as const } : download
                    ),
                })),

            resumeDownload: (id) =>
                set((state) => ({
                    downloads: state.downloads.map((download) =>
                        download.id === id ? { ...download, status: 'downloading' as const } : download
                    ),
                })),

            cancelDownload: (id) =>
                set((state) => ({
                    downloads: state.downloads.filter((download) => download.id !== id),
                })),
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