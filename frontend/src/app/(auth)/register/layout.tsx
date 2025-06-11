import ThemeInitializer from "@/components/Misc/ThemeInitializer";
import { GoogleOAuthProvider } from "@react-oauth/google";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register",
  description: "Register to HackMeet",
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
          <GoogleOAuthProvider
            clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}
          >
            {children}
          </GoogleOAuthProvider>
        </main>
      </body>
    </html>
  );
}
