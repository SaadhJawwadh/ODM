'use client'

import { useDownloadStore } from '@/store/downloadStore'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

export default function NotificationContainer() {
    const { notifications, removeNotification } = useDownloadStore()

    const getIcon = (type: 'success' | 'error' | 'info') => {
        switch (type) {
            case 'success':
                return <CheckCircle className="w-5 h-5 text-green-500" />
            case 'error':
                return <XCircle className="w-5 h-5 text-red-500" />
            case 'info':
                return <Info className="w-5 h-5 text-blue-500" />
        }
    }

    const getStyles = (type: 'success' | 'error' | 'info') => {
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
        <div className="fixed top-4 left-4 right-4 sm:top-4 sm:right-4 sm:left-auto sm:max-w-sm z-50 space-y-2">
            <AnimatePresence>
                {notifications.map((notification) => (
                    <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: -50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -50, scale: 0.95 }}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg border shadow-lg ${getStyles(notification.type)}`}
                    >
                        {getIcon(notification.type)}
                        <span className="text-sm font-medium flex-1">{notification.message}</span>
                        <button
                            onClick={() => removeNotification(notification.id)}
                            className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors touch-manipulation min-w-[40px] min-h-[40px] flex items-center justify-center"
                            aria-label="Dismiss notification"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}