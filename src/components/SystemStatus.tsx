
'use client'

import { useDownloadStore } from '@/store/downloadStore';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, Loader, X } from 'lucide-react';
import { useEffect } from 'react';

export default function SystemStatus() {
    const { systemStatus, setSystemStatus } = useDownloadStore();

    useEffect(() => {
        if (systemStatus?.status === 'ready') {
            const timer = setTimeout(() => {
                setSystemStatus(null);
            }, 5000); // Hide after 5 seconds
            return () => clearTimeout(timer);
        }
    }, [systemStatus, setSystemStatus]);

    const getIcon = () => {
        if (!systemStatus) return null;

        switch (systemStatus.status) {
            case 'installing':
                return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
            case 'ready':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            default:
                return null;
        }
    };

    return (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
            <AnimatePresence>
                {systemStatus && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.3 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                        className="flex items-center space-x-4 bg-white dark:bg-dark-800 shadow-lg rounded-full py-3 px-6 border border-gray-200 dark:border-dark-700"
                    >
                        {getIcon()}
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{systemStatus.message}</p>
                        <button
                            onClick={() => setSystemStatus(null)}
                            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700"
                            aria-label="Dismiss"
                        >
                            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}