import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: "Hansol Noh Portfolio Website",
  description: "This is Artist Hansol Noh's Portfolio Website",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased ">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
