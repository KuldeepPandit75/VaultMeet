import "../globals.css";
import ThemeInitializer from "@/components/Misc/ThemeInitializer";

export const metadata = {
  metadataBase: new URL('https://hackmeet.com'),
  title: {
    default: 'HackMeet',
    template: '%s | HackMeet'
  },
  description: 'Host & Join Hackathons in a 2D Virtual World',
  keywords: ['hackathon', 'virtual hackathon', 'HackMeet', 'coding competition', 'developer community'],
  authors: [{ name: 'HackMeet Team' }],
  creator: 'HackMeet',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://hackmeet.com',
    siteName: 'HackMeet',
    title: 'HackMeet - Host & Join Hackathons in a 2D Virtual World',
    description: 'Host & Join Hackathons in a 2D Virtual World',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HackMeet - Host & Join Hackathons in a 2D Virtual World',
    description: 'Host & Join Hackathons in a 2D Virtual World',
    creator: '@hackmeet',
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
