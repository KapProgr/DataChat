import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'DataChat - AI Data Analysis Platform',
  description: 'Transform your spreadsheets into insights with AI. Upload CSV or Excel files and ask questions in plain English. Get instant charts, analysis, and answers.',
  keywords: ['data analysis', 'AI', 'spreadsheet', 'CSV', 'Excel', 'charts', 'analytics', 'business intelligence'],
  authors: [{ name: 'DataChat' }],
  creator: 'DataChat',
  publisher: 'DataChat',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://datachat.app',
    siteName: 'DataChat',
    title: 'DataChat - AI Data Analysis Platform',
    description: 'Transform your spreadsheets into insights with AI. Upload CSV or Excel files and ask questions in plain English.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DataChat - AI Data Analysis',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DataChat - AI Data Analysis Platform',
    description: 'Transform your spreadsheets into insights with AI.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          {children}
          <Toaster position="top-right" />
        </body>
      </html>
    </ClerkProvider>
  )
}