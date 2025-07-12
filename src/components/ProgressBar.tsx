'use client'

import { motion } from 'framer-motion'

interface ProgressBarProps {
    progress: number
    status: 'pending' | 'downloading' | 'completed' | 'error' | 'paused' | 'ready'
    className?: string
}

export default function ProgressBar({ progress, status, className = '' }: ProgressBarProps) {
    const getProgressColor = () => {
        switch (status) {
            case 'downloading':
                return 'bg-gradient-to-r from-blue-500 to-blue-600'
            case 'completed':
                return 'bg-gradient-to-r from-green-500 to-green-600'
            case 'error':
                return 'bg-gradient-to-r from-red-500 to-red-600'
            case 'paused':
                return 'bg-gradient-to-r from-yellow-500 to-yellow-600'
            case 'ready':
                return 'bg-gradient-to-r from-blue-400 to-blue-500'
            default:
                return 'bg-gradient-to-r from-gray-400 to-gray-500'
        }
    }

    const getProgressWidth = () => {
        if (status === 'pending') return 0
        if (status === 'error') return 100
        if (status === 'ready') return 100
        return Math.min(Math.max(progress, 0), 100)
    }

    return (
        <div className={`progress-bar h-2 ${className}`}>
            <motion.div
                className={`progress-fill h-full rounded-full ${getProgressColor()}`}
                initial={{ width: 0 }}
                animate={{ width: `${getProgressWidth()}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
            />
            {status === 'downloading' && (
                <motion.div
                    className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full"
                    animate={{ x: ['0%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                />
            )}
        </div>
    )
}