import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { SocketProvider } from "@/context/SocketContext";
import MobileWrapper from "@/components/Game/Warnings/MobileWrapper";
import { GoogleOAuthProvider } from "@react-oauth/google";
import VerifyUser from "@/components/Auth/VerifyUser";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VaultMeet",
  icons: {
    icon: '/favicon.ico'
  },
  description: "Host & Join Events in a 2D Virtual World",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
          <SocketProvider>
            <MobileWrapper>
              <main>
                {children}
                <Toaster position="bottom-right" />
              </main>
            </MobileWrapper>
          </SocketProvider>
          <VerifyUser/>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
