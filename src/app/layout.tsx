import './globals.css'
import { Inter } from 'next/font/google'
import NotificationContainer from '@/components/NotificationContainer'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
    title: 'ODM: One Download Manager',
    description: 'A modern download manager powered by yt-dlp',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className="dark">
            <body className={inter.className}>
                <div className="min-h-screen gradient-bg">
                    {children}
                </div>
                <NotificationContainer />
            </body>
        </html>
    )
}