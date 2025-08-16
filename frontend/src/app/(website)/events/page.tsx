import type { Metadata } from "next";
import EventsPageContent from './EventsPageContent';

export const metadata: Metadata = {
  title: "Events - Discover Hackathons & Tech Events | VaultMeet",
  description: "Discover and join exciting hackathons, workshops, and tech events on VaultMeet. Find upcoming competitions, connect with developers, and participate in virtual coding challenges.",
  keywords: [
    "hackathon events",
    "tech events",
    "virtual hackathons",
    "coding competitions",
    "developer events",
    "workshop events",
    "tech workshops",
    "online hackathons",
    "virtual events",
    "coding challenges"
  ],
  openGraph: {
    title: "Events - Discover Hackathons & Tech Events | VaultMeet",
    description: "Discover and join exciting hackathons, workshops, and tech events on VaultMeet.",
    url: "https://www.vaultmeet.xyz/events",
    siteName: "VaultMeet",
    images: [
      {
        url: "/banner.png",
        width: 1200,
        height: 630,
        alt: "VaultMeet Events - Hackathons and Tech Events",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Events - Discover Hackathons & Tech Events | VaultMeet",
    description: "Discover and join exciting hackathons, workshops, and tech events on VaultMeet.",
    images: ["/banner.png"],
  },
  alternates: {
    canonical: "/events",
  },
};

export default function EventsPage() {
  return (
    <>
      {/* Structured Data for Events Page */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "VaultMeet Events",
            "description": "A collection of hackathons, workshops, and tech events",
            "url": "https://www.vaultmeet.xyz/events",
            "numberOfItems": 0, // This will be dynamic based on actual events
            "itemListElement": [] // This will be populated with actual events
          })
        }}
      />
      
      <EventsPageContent />
    </>
  );
} 