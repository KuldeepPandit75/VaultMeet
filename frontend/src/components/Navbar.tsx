import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <Image
                src="/logo.png"
                alt="HackMeet Logo"
                width={40}
                height={40}
                className="rounded-full"
              />
            </Link>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link
                  href="/"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === "/"
                      ? "text-white"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  Home
                </Link>
                <Link
                  href="/hackathons"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === "/hackathons"
                      ? "text-white"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  Hackathons
                </Link>
                <Link
                  href="/news"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === "/news"
                      ? "text-white"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  News
                </Link>
                <Link
                  href="/host"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === "/host"
                      ? "text-white"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  Host
                </Link>
              </div>
            </div>
          </div>
          {/* ... rest of the navbar code ... */}
        </div>
      </div>
    </nav>
  );
} 