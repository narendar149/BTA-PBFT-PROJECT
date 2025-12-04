import type React from "react"
import { Geist, Geist_Mono } from "next/font/google"
import { ConsensusProvider } from "@/contexts/consensus-context"
import "./globals.css" // Import globals.css at the top of the file

import type { Metadata } from "next" // Declare the Metadata variable

const _geistSans = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PBFT Consensus Simulator",
  description: "Interactive visualization of Byzantine Fault Tolerant consensus algorithm",,
  // ... existing metadata ...
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${_geistSans.className} antialiased`}>
        <ConsensusProvider>{children}</ConsensusProvider>
      </body>
    </html>
  )
}
