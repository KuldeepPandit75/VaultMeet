import type { Metadata } from "next";
import HeroSection from '@/components/Home/HeroSection';
import WhyVaultMeet from '@/components/Home/WhyVaultMeet';
import ForParticipants from '@/components/Home/ForParticipants';
import ForOrganizers from '@/components/Home/ForOrganizers';
import CallToAction from '@/components/Home/CallToAction';

export const metadata: Metadata = {
  title: "VaultMeet - Host & Join Events in a 2D Virtual World",
  description: "VaultMeet is a revolutionary platform for hosting and participating in hackathons, workshops, and tech events in an immersive 2D virtual world. Connect, collaborate, and innovate with developers worldwide.",
  keywords: [
    "hackathon platform",
    "virtual events",
    "2D virtual world",
    "tech events",
    "developer community",
    "online hackathon",
    "coding competition",
    "virtual collaboration",
    "tech workshops",
    "developer networking",
    "virtual hackathon"
  ],
  openGraph: {
    title: "VaultMeet - Host & Join Events in a 2D Virtual World",
    description: "VaultMeet is a revolutionary platform for hosting and participating in hackathons, workshops, and tech events in an immersive 2D virtual world.",
    url: "https://www.vaultmeet.xyz",
    siteName: "VaultMeet",
    images: [
      {
        url: "/banner.png",
        width: 1200,
        height: 630,
        alt: "VaultMeet - 2D Virtual Event Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VaultMeet - Host & Join Events in a 2D Virtual World",
    description: "VaultMeet is a revolutionary platform for hosting and participating in hackathons, workshops, and tech events in an immersive 2D virtual world.",
    images: ["/banner.png"],
  },
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return (
    <>
      {/* Structured Data for WebSite */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "VaultMeet",
            "url": "https://www.vaultmeet.xyz",
            "description": "VaultMeet is a revolutionary platform for hosting and participating in hackathons, workshops, and tech events in an immersive 2D virtual world.",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://www.vaultmeet.xyz/events?search={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          })
        }}
      />
      
      {/* Structured Data for SoftwareApplication */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "VaultMeet",
            "applicationCategory": "WebApplication",
            "operatingSystem": "Web Browser",
            "description": "A 2D virtual world platform for hosting and participating in hackathons and tech events",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "featureList": [
              "2D Virtual World",
              "Real-time Collaboration",
              "Hackathon Hosting",
              "Developer Networking",
              "Virtual Events",
              "Coding Challenges"
            ]
          })
        }}
      />
      
      <HeroSection />
      <WhyVaultMeet />
      <ForParticipants />
      <ForOrganizers />
      <CallToAction />
    </>
  );
}
