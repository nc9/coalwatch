import type { Metadata } from "next"
import { Inter, Bebas_Neue } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })
const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
})

const SITE_URL = "https://coalwatch.com.au"
const SITE_NAME = "Coal Watch Australia"
const DESCRIPTION =
  "Live output of every coal-fired power unit on Australia's NEM and WEM grids, by station and region, with data from OpenElectricity."

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Coal Watch Australia: Live Coal Power Station Output",
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    title: "Coal Watch Australia: Live Coal Power Station Output",
    description: DESCRIPTION,
    locale: "en_AU",
    images: [
      { url: "/og", width: 1200, height: 630, alt: "Coal Watch Australia" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [
      { url: "/og", width: 1200, height: 630, alt: "Coal Watch Australia" },
    ],
    title: "Coal Watch Australia: Live Coal Power Station Output",
    description: DESCRIPTION,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link rel="icon" type="image/png" />
        <link rel="manifest" href="/site.webmanifest"></link>
      </head>
      <body className={`${inter.className} ${bebas.variable}`}>
        <a
          href="#main"
          className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-3 focus-visible:top-3 focus-visible:z-50 focus-visible:rounded focus-visible:bg-neutral-100 focus-visible:px-3 focus-visible:py-2 focus-visible:text-sm focus-visible:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  )
}
