import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { Inter } from "next/font/google";

// Self-hosted by Next.js: no render-blocking request to Google Fonts, no layout shift
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://rollmap.co"),
  title: {
    default: "RollMap — Find BJJ gyms to train, anywhere.",
    template: "%s | RollMap",
  },
  description:
    "Discover 10,000+ Brazilian Jiu-Jitsu gyms worldwide. Search by city, filter by Gi, No-Gi, Open Mat, Drop-in friendly.",
  keywords: [
    "BJJ", "Brazilian Jiu-Jitsu", "gym finder", "martial arts", "grappling",
    "jiu jitsu near me", "BJJ gym", "open mat", "no-gi", "drop-in BJJ",
  ],
  authors: [{ name: "RollMap" }],
  creator: "RollMap",
  openGraph: {
    title: "RollMap — Find BJJ gyms to train, anywhere.",
    description: "Discover 10,000+ BJJ gyms worldwide. Search by city, find training info, schedule & contact.",
    type: "website",
    siteName: "RollMap",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "RollMap — Find BJJ gyms to train, anywhere.",
    description: "Discover 10,000+ BJJ gyms worldwide.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  verification: {
    google: "4A_tcdh7OLfF70AHYK3OaYZQ6e5Kfnq24YFvsQKv40Y",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-bg text-text font-sans min-h-screen antialiased flex flex-col">
        <div className="flex-1">{children}</div>
        <footer className="text-center py-5 text-text3 text-xs border-t border-bg3 space-y-2">
          <p>RollMap — Find BJJ gyms to train, anywhere.</p>
          <div className="flex items-center justify-center gap-4">
            <a href="/countries" className="hover:text-accent transition-colors">
              Countries
            </a>
            <span className="text-bg4">·</span>
            <a href="/blog" className="hover:text-accent transition-colors">
              Blog
            </a>
            <span className="text-bg4">·</span>
            <a
              href="https://twitter.com/O_Amande"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
            >
              Twitter
            </a>
            <span className="text-bg4">·</span>
            <a
              href="https://www.instagram.com/rollmap.contact/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
            >
              Instagram
            </a>
            <span className="text-bg4">·</span>
            <a
              href="https://forms.gle/H78qhnMWuXmrHxnA6"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
            >
              Share feedback
            </a>
            <span className="text-bg4">·</span>
            <a href="/about" className="hover:text-accent transition-colors">
              About
            </a>
            <span className="text-bg4">·</span>
            <a href="/contact" className="hover:text-accent transition-colors">
              Contact
            </a>
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
