import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Aloftly Analytics',
  description: 'Shopify CRO analytics dashboard — heatmaps, A/B tests, surveys, support, and reviews in one place.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
