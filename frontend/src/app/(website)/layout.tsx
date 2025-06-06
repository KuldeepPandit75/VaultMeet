'use client';

import { Inter } from "next/font/google";
import "../global.css";
import ThemeInitializer from "@/components/Misc/ThemeInitializer";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import SEO from "@/components/SEO/SEO";
import { generateSEO } from "@/config/seo.config";

const inter = Inter({ subsets: ["latin"] });

// Default SEO metadata for the entire application
const defaultSeo = generateSEO({
  title: 'HackMeet - Virtual Hackathon Platform',
  description: 'Join HackMeet, the innovative virtual hackathon platform. Connect with developers worldwide, participate in exciting challenges, and showcase your skills in our immersive 2D virtual environment.',
  keywords: [
    'hackathon',
    'virtual hackathon',
    'coding competition',
    'developer platform',
    'tech events'
  ]
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <SEO {...defaultSeo} />
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
      </body>
    </html>
  );
}
