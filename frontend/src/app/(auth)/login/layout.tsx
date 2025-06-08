import ThemeInitializer from "@/components/Misc/ThemeInitializer";
import { GoogleOAuthProvider } from "@react-oauth/google";
import type { Metadata } from 'next';
import { Toaster } from "react-hot-toast";

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
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>

          {children}  
        </GoogleOAuthProvider>
        </main>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
