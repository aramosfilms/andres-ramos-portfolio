import type { Metadata, Viewport } from "next"
import { Inter_Tight } from "next/font/google"
import "./globals.css"

const sans = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  // Change NEXT_PUBLIC_SITE_URL if the site moves to its own domain.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://andresramosportfolio.site"),
  title: {
    default: "Andrés Ramos · Fotografía deportiva y vídeo",
    template: "%s · Andrés Ramos",
  },
  description:
    "Fotógrafo y videógrafo panameño con base en Valencia. Fotografía deportiva en Europa y Panamá, vídeos de viaje y videoclips.",
  openGraph: {
    title: "Andrés Ramos",
    description: "Fotografía deportiva · Vídeos de viaje · Videoclips",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Índice de trabajos de Andrés Ramos" }],
    locale: "es_ES",
    type: "website",
    siteName: "Andrés Ramos",
  },
  twitter: {
    card: "summary_large_image",
    title: "Andrés Ramos",
    description: "Fotografía deportiva · Vídeos de viaje · Videoclips",
    images: ["/og.jpg"],
  },
}

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" data-scroll-behavior="smooth" className={`${sans.variable} dark h-full antialiased`}>
      <body className="min-h-full bg-black text-white">{children}</body>
    </html>
  )
}
