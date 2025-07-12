'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

interface ToastProps {
    message: string
    type: 'success' | 'error' | 'info'
    isVisible: boolean
    onClose: () => void
    duration?: number
}

export default function Toast({ message, type, isVisible, onClose, duration = 3000 }: ToastProps) {
    useEffect(() => {
        if (isVisible && duration > 0) {
            const timer = setTimeout(() => {
                onClose()
            }, duration)
            return () => clearTimeout(timer)
        }
    }, [isVisible, duration, onClose])

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle className="w-5 h-5 text-green-500" />
            case 'error':
                return <XCircle className="w-5 h-5 text-red-500" />
            case 'info':
                return <Info className="w-5 h-5 text-blue-500" />
        }
    }

    const getStyles = () => {
        switch (type) {
            case 'success':
                return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
            case 'error':
                return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
            case 'info':
                return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
        }
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -50, scale: 0.95 }}
                    className="fixed top-4 right-4 z-50"
                >
                    <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg border shadow-lg max-w-sm ${getStyles()}`}>
                        {getIcon()}
                        <span className="text-sm font-medium flex-1">{message}</span>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}