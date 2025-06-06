import ThemeInitializer from "@/components/Misc/ThemeInitializer";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register',
  description: 'Register to HackMeet',
};

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
