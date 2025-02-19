import type { Metadata } from "next"
import { Inter, Roboto_Mono } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })
const mono = Roboto_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
    title: "Coal Watch",
    description:
        "Coal Watch: Observe the current status of Coal Fired Power Stations in Australia",
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <head>
                <title>Coal Watch Australia</title>
            </head>
            <body className={inter.className}>{children}</body>
        </html>
    )
}
