import "../globals.css";
import ThemeInitializer from "@/components/Misc/ThemeInitializer";

export const metadata = {
  metadataBase: new URL('https://www.vaultmeet.xyz'),
  title: {
    default: 'VaulMeet',
    template: '%s | VaulMeet'
  },
  description: 'Host & Join Hackathons in a 2D Virtual World',
  keywords: ['hackathon', 'virtual hackathon', 'VaulMeet', 'coding competition', 'developer community'],
  authors: [{ name: 'VaulMeet Team' }],
  creator: 'VaulMeet',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.vaultmeet.xyz',
    siteName: 'VaulMeet',
    title: 'VaulMeet - Host & Join Hackathons in a 2D Virtual World',
    description: 'Host & Join Hackathons in a 2D Virtual World',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VaulMeet - Host & Join Hackathons in a 2D Virtual World',
    description: 'Host & Join Hackathons in a 2D Virtual World',
    creator: '@vaultmeet',
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

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <ThemeInitializer />
      {children}
    </>
  );
}
