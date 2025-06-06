import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import "./global.css";
import ThemeInitializer from "@/components/Misc/ThemeInitializer";
export const metadata = {
  title: 'HackMeet',
  description: 'The Coding Environment for Developers',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ThemeInitializer />
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  )
}
