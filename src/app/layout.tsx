import type { Metadata } from "next"
import { Inter, Roboto_Mono, Bebas_Neue } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })
const mono = Roboto_Mono({ subsets: ["latin"] })
const bebas = Bebas_Neue({
    weight: "400",
    subsets: ["latin"],
    variable: "--font-bebas",
})

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
            <body className={`${inter.className} ${bebas.variable}`}>
                {children}
            </body>
        </html>
    )
}
