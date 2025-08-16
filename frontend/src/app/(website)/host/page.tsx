import type { Metadata } from "next";
import HostPageContent from './HostPageContent';

export const metadata: Metadata = {
  title: "Host Events - Create Hackathons & Tech Events | VaultMeet",
  description: "Host your own hackathons, workshops, and tech events on VaultMeet. Create engaging virtual experiences for developers worldwide with our 2D virtual world platform.",
  keywords: [
    "host hackathon",
    "create tech events",
    "virtual event hosting",
    "hackathon platform",
    "event management",
    "virtual hackathon hosting",
    "tech event creation",
    "developer events",
    "virtual world events",
    "online hackathon hosting"
  ],
  openGraph: {
    title: "Host Events - Create Hackathons & Tech Events | VaultMeet",
    description: "Host your own hackathons, workshops, and tech events on VaultMeet. Create engaging virtual experiences for developers worldwide.",
    url: "https://www.vaultmeet.xyz/host",
    siteName: "VaultMeet",
    images: [
      {
        url: "/banner.png",
        width: 1200,
        height: 630,
        alt: "VaultMeet Host Events - Create Hackathons",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Host Events - Create Hackathons & Tech Events | VaultMeet",
    description: "Host your own hackathons, workshops, and tech events on VaultMeet. Create engaging virtual experiences for developers worldwide.",
    images: ["/banner.png"],
  },
  alternates: {
    canonical: "/host",
  },
};

export default function HostPage() {
  return (
    <>
      {/* Structured Data for Host Page */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Host Events on VaultMeet",
            "description": "Host your own hackathons, workshops, and tech events on VaultMeet",
            "url": "https://www.vaultmeet.xyz/host",
            "mainEntity": {
              "@type": "Service",
              "name": "Event Hosting Service",
              "description": "Platform for hosting virtual hackathons and tech events",
              "provider": {
                "@type": "Organization",
                "name": "VaultMeet"
              },
              "serviceType": "Virtual Event Hosting",
              "areaServed": "Worldwide"
            }
          })
        }}
      />
      
      <HostPageContent />
    </>
  );
} 