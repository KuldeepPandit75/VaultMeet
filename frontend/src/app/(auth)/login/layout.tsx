import ThemeInitializer from "@/components/Misc/ThemeInitializer";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Login to your HackMeet account',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeInitializer />
        <main className="flex-grow">
          {children}
        </main>
      </body>
    </html>
  );
}
