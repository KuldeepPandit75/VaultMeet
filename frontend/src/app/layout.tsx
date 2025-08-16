import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { SocketProvider } from "@/context/SocketContext";
import MobileWrapper from "@/components/Game/Warnings/MobileWrapper";
import { GoogleOAuthProvider } from "@react-oauth/google";
import VerifyUser from "@/components/Auth/VerifyUser";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "VaultMeet - Host & Join Events in a 2D Virtual World",
    template: "%s | VaultMeet"
  },
  description: "VaultMeet is a revolutionary platform for hosting and participating in hackathons, workshops, and tech events in an immersive 2D virtual world. Connect, collaborate, and innovate with developers worldwide.",
  keywords: [
    "hackathon",
    "virtual events",
    "2D virtual world",
    "tech events",
    "developer community",
    "online hackathon",
    "coding competition",
    "virtual collaboration",
    "tech workshops",
    "developer networking"
  ],
  authors: [{ name: "VaultMeet Team" }],
  creator: "VaultMeet",
  publisher: "VaultMeet",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://www.vaultmeet.xyz'), // Replace with your actual domain
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.vaultmeet.xyz',
    siteName: 'VaultMeet',
    title: 'VaultMeet - Host & Join Events in a 2D Virtual World',
    description: 'VaultMeet is a revolutionary platform for hosting and participating in hackathons, workshops, and tech events in an immersive 2D virtual world.',
    images: [
      {
        url: '/banner.png',
        width: 1200,
        height: 630,
        alt: 'VaultMeet - 2D Virtual Event Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VaultMeet - Host & Join Events in a 2D Virtual World',
    description: 'VaultMeet is a revolutionary platform for hosting and participating in hackathons, workshops, and tech events in an immersive 2D virtual world.',
    images: ['/banner.png'],
    creator: '@Kuldeepk75', // VaultMeet's X/Twitter handle
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
  verification: {
    google: 'your-google-verification-code', // Replace with your actual verification code
    // yandex: 'your-yandex-verification-code',
    // yahoo: 'your-yahoo-verification-code',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#000000' },
    ],
  },
  manifest: '/site.webmanifest',
  category: 'technology',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
                 {/* Structured Data for Organization */}
         <script
           type="application/ld+json"
           dangerouslySetInnerHTML={{
             __html: JSON.stringify({
               "@context": "https://schema.org",
               "@type": "Organization",
               "name": "VaultMeet",
               "url": "https://www.vaultmeet.xyz",
               "logo": "https://www.vaultmeet.xyz/logo_final.png",
               "description": "VaultMeet is a revolutionary platform for hosting and participating in hackathons, workshops, and tech events in an immersive 2D virtual world.",
               "sameAs": [
                 "https://x.com/Kuldeepk75",
                 "https://linkedin.com/company/vaultmeet",
                 "https://www.instagram.com/vaultmeet/",
                 "https://github.com/KuldeepPandit75",
                 "https://chat.whatsapp.com/HoMRaLQgIx85LneXJzPJbQ?mode=ac_t"
               ],
               "founder": {
                 "@type": "Person",
                 "name": "Kuldeep Kumar Pandit",
                 "jobTitle": "Founder & CEO",
                 "url": "https://www.linkedin.com/in/kuldeepk-pandit/",
                 "sameAs": [
                   "https://x.com/Kuldeepk75",
                   "https://github.com/KuldeepPandit75"
                 ]
               },
               "contactPoint": {
                 "@type": "ContactPoint",
                 "contactType": "customer service",
                 "email": "support@vaultmeet.xyz"
               }
             })
           }}
         />
      </head>
      <body className={inter.className}>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
          <SocketProvider>
            <MobileWrapper>
              <main>
                {children}
                <Toaster position="bottom-right" />
              </main>
            </MobileWrapper>
          </SocketProvider>
          <VerifyUser/>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
