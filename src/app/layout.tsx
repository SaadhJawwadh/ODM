import './globals.css'
import { Inter } from 'next/font/google'
import NotificationContainer from '@/components/NotificationContainer'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
    title: 'ODM: One Download Manager',
    description: 'A modern download manager powered by yt-dlp',
    icons: {
        icon: [
            { url: '/favicon.ico', sizes: 'any' },
            { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
            { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        ],
        apple: [
            { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        ],
    },
    manifest: '/site.webmanifest',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className="dark">
            <head>
                <link rel="icon" href="/favicon.ico" sizes="any" />
                <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16" />
                <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
                <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
                <link rel="manifest" href="/site.webmanifest" />
            </head>
            <body className={inter.className}>
                <div className="min-h-screen gradient-bg">
                    {children}
                </div>
                <NotificationContainer />
            </body>
        </html>
    )
}