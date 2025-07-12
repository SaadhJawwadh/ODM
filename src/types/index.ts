export interface DownloadItem {
    id: string
    url: string
    title: string
    thumbnail?: string
    duration?: string
    format: string
    quality: string
    status: 'pending' | 'downloading' | 'completed' | 'error' | 'paused' | 'ready'
    progress: number
    speed?: string
    eta?: string
    fileSize?: string
    filePath?: string
    fileName?: string
    error?: string
    createdAt: Date
    completedAt?: Date
    audioOnly?: boolean
    subtitles?: boolean
    thumbnails?: boolean
}

export interface VideoFormat {
    format_id: string
    ext: string
    quality: string
    resolution?: string
    filesize?: number
    filesizeFormatted: string
    tbr?: number
    vbr?: number
    abr?: number
    fps?: number
    vcodec?: string
    acodec?: string
    format_note?: string
    hasAudio: boolean
    hasVideo: boolean
}

export interface LegacyVideoFormat {
    format_id: string
    ext: string
    quality: string
    filesize?: number
    tbr?: number
    vbr?: number
    abr?: number
    fps?: number
    width?: number
    height?: number
    format_note?: string
}

export interface CategorizedFormats {
    video: VideoFormat[]
    audio: VideoFormat[]
}

export interface EstimatedSizes {
    '1080p': string
    '720p': string
    '480p': string
    'audio': string
}

export interface VideoMetadata {
    viewCount?: number
    likeCount?: number
    uploadDate?: string
    categories?: string[]
    tags?: string[]
}

export interface VideoInfo {
    id: string
    title: string
    description: string
    thumbnail: string
    duration: string
    uploader: string
    upload_date: string
    url: string
    contentType: 'video' | 'audio'
    estimatedSizes: EstimatedSizes
    formats: CategorizedFormats
    legacyFormats: LegacyVideoFormat[]
    metadata: VideoMetadata
}

export interface DownloadProgress {
    id: string
    status: string
    downloaded_bytes: number
    total_bytes: number
    speed: number
    eta: number
    percent: number
    filename: string
}

export interface AppSettings {
    outputPath: string
    audioFormat: 'mp3' | 'aac' | 'flac' | 'wav' | 'ogg'
    videoFormat: 'mp4' | 'webm' | 'mkv' | 'avi'
    audioQuality: 'best' | 'worst' | '320' | '256' | '192' | '128'
    videoQuality: 'best' | 'worst' | '1080' | '720' | '480' | '360'
    subtitles: boolean
    thumbnails: boolean
    maxConcurrentDownloads: number
    theme: 'light' | 'dark' | 'system'
}

export interface DownloadRequest {
    url: string
    format: string
    quality: string
    audioOnly: boolean
    subtitles: boolean
    thumbnails: boolean
}