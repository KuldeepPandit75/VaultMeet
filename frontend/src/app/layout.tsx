import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { SocketProvider } from '@/context/SocketContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'My Next.js App',
  description: 'Created with Next.js',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SocketProvider>
          <main>
            {children}
            <Toaster position="bottom-right" />
          </main>
        </SocketProvider>
      </body>
    </html>
  )
}
