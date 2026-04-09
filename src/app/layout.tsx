import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css"
        />
      </head>
      <body className="bg-bg text-text font-sans min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
