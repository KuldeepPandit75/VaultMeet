import ThemeInitializer from "@/components/Misc/ThemeInitializer";
import type { Metadata } from 'next';
import { Toaster } from "react-hot-toast";

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
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
