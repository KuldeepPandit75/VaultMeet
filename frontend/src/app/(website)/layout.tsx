import type { Metadata } from 'next';
import { Inter } from "next/font/google";
import ThemeInitializer from "@/components/Misc/ThemeInitializer";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import ChatWrapper from "@/components/Layout/ChatWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://www.vaultmeet.xyz'),
  title: {
    default: 'VaultMeet',
    template: '%s | VaultMeet'
  },
  icons:{
    icon: '/favicon.ico'
  },
  description: 'Host & Join Hackathons in a 2D Virtual World',
  keywords: ['hackathon', 'virtual hackathon', 'VaultMeet', 'coding competition', 'developer community'],
  authors: [{ name: 'VaultMeet Team' }],
  creator: 'VaultMeet',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.vaultmeet.xyz',
    siteName: 'VaultMeet',
    title: 'VaultMeet - Host & Join Hackathons in a 2D Virtual World',
    description: 'Host & Join Hackathons in a 2D Virtual World',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VaultMeet - Host & Join Hackathons in a 2D Virtual World',
    description: 'Host & Join Hackathons in a 2D Virtual World',
    creator: '@Kuldeepk75',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body 
        className={inter.className}
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <ThemeInitializer />
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
        <ChatWrapper />
      </body>
    </html>
  );
}
