import type { Metadata } from "next";
import AboutPageContent from './AboutPageContent';

export const metadata: Metadata = {
  title: "About VaultMeet - Where Innovation Meets Immersion",
  description: "Learn about VaultMeet, the revolutionary platform that redefines how hackathons are experienced online. Discover our vision, features, and mission to make virtual hackathons more interactive and engaging.",
  keywords: [
    "about vaultmeet",
    "hackathon platform",
    "virtual events platform",
    "tech community",
    "developer platform",
    "innovation platform",
    "virtual hackathon",
    "2D virtual world",
    "tech events"
  ],
  openGraph: {
    title: "About VaultMeet - Where Innovation Meets Immersion",
    description: "Learn about VaultMeet, the revolutionary platform that redefines how hackathons are experienced online.",
    url: "https://www.vaultmeet.xyz/about",
    siteName: "VaultMeet",
    images: [
      {
        url: "/banner.png",
        width: 1200,
        height: 630,
        alt: "About VaultMeet - Innovation Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About VaultMeet - Where Innovation Meets Immersion",
    description: "Learn about VaultMeet, the revolutionary platform that redefines how hackathons are experienced online.",
    images: ["/banner.png"],
  },
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
    return (
        <>
          {/* Structured Data for About Page */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "AboutPage",
                "name": "About VaultMeet",
                "description": "Learn about VaultMeet, the revolutionary platform that redefines how hackathons are experienced online.",
                "url": "https://www.vaultmeet.xyz/about",
                "mainEntity": {
                  "@type": "Organization",
                  "name": "VaultMeet",
                  "description": "A dynamic, interactive space built for developers, designers, and tech enthusiasts to explore, host, and participate in hackathons like never before.",
                  "foundingDate": "2024",
                  "mission": "To redefine how hackathons are experienced online — making them more interactive, accessible, and engaging for everyone"
                }
              })
            }}
          />
          
          <AboutPageContent />
        </>
    );
} 