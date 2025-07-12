'use client'

import { Download, Settings, Moon, Sun } from 'lucide-react'
import { useDownloadStore } from '@/store/downloadStore'
import { useState } from 'react'

interface HeaderProps {
    onSettingsClick: () => void
}

export default function Header({ onSettingsClick }: HeaderProps) {
    const { settings, updateSettings } = useDownloadStore()
    const [isDark, setIsDark] = useState(settings.theme === 'dark')

    const toggleTheme = () => {
        const newTheme = isDark ? 'light' : 'dark'
        setIsDark(!isDark)
        updateSettings({ theme: newTheme })
        document.documentElement.classList.toggle('dark', newTheme === 'dark')
    }

    return (
        <header className="bg-white/80 dark:bg-dark-800/80 backdrop-blur-md border-b border-gray-200 dark:border-dark-700 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-14 sm:h-16">
                    {/* Logo */}
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                        <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                            <Download className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                                ODM: One Download Manager
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                                Download from any platform
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
                        <button
                            onClick={toggleTheme}
                            className="p-2.5 sm:p-2 rounded-lg bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors touch-manipulation min-w-[44px] min-h-[44px] sm:min-w-auto sm:min-h-auto flex items-center justify-center"
                            aria-label="Toggle theme"
                        >
                            {isDark ? (
                                <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                            ) : (
                                <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                            )}
                        </button>

                        <button
                            onClick={onSettingsClick}
                            className="p-2.5 sm:p-2 rounded-lg bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors touch-manipulation min-w-[44px] min-h-[44px] sm:min-w-auto sm:min-h-auto flex items-center justify-center"
                            aria-label="Settings"
                        >
                            <Settings className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    )
}