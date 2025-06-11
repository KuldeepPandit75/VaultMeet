"use client";

import Link from "next/link";
import { useThemeStore } from "../../Zustand_Store/ThemeStore";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import useAuthStore from "@/Zustand_Store/AuthStore";
import toast from "react-hot-toast";

// Types
interface NavLink {
  href: string;
  label: string;
}

interface NavButton {
  href: string;
  label: string;
  isPrimary?: boolean;
}

// Constants
const NAV_LINKS: NavLink[] = [
  { href: "/news", label: "News" },
  { href: "/events", label: "Events" },
  { href: "/host", label: "Host" },
  { href: "/about", label: "About" },
];

const NAV_BUTTONS: NavButton[] = [
  { href: "/login", label: "Login", isPrimary: false },
  { href: "/register", label: "Sign Up", isPrimary: true },
];

// Components
const NavLink = ({ href, label }: NavLink) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  const { primaryAccentColor } = useThemeStore();

  return (
    <Link
      href={href}
      className={`
        transition-all duration-200 
        ${isActive ? "font-bold" : "font-normal opacity-60"} 
        hover:opacity-100 hover:font-medium
        px-4 py-1 rounded-xl
      `}
      style={{
        color: "#000",
        backgroundColor: isActive ? `${primaryAccentColor}20` : "transparent",
      }}
    >
      {label}
    </Link>
  );
};

const NavButton = ({ href, label, isPrimary }: NavButton) => {
  const { primaryAccentColor, secondaryAccentColor } = useThemeStore();

  return (
    <Link
      href={href}
      style={
        isPrimary
          ? { backgroundColor: primaryAccentColor }
          : { color: secondaryAccentColor }
      }
      className={`text-[18px] ${
        isPrimary ? "text-black rounded-[20px] px-[18px] py-1" : ""
      }`}
    >
      {label}
    </Link>
  );
};

// Main Component
const Navbar = () => {
  const router = useRouter();
  const { primaryAccentColor, secondaryAccentColor } = useThemeStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <nav className="px-[20px] md:px-[40px] lg:px-[80px] py-[20px] flex justify-between items-center relative z-[100000]">
      <div
        id="logo"
        className="text-[36px] font-[900] cursor-pointer"
        style={{ color: secondaryAccentColor }}
        onClick={() => router.push("/")}
      >
        Vault<span style={{ color: primaryAccentColor }}>Meet</span>
      </div>

      {/* Mobile Menu Button */}
      <button
            className={`md:hidden text-black p-2 rounded-lg transition-colors mr-6`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            <div
              className={`flex flex-col gap-2 relative transition-all duration-300 ${isMenuOpen ? "h-0" : "h-4"}`}
            >
              <div
                className={`w-6 rounded-full border-t-[3px] border-[#999] absolute transition-all duration-300  ${isMenuOpen ? "rotate-45 top-[50%] -translate-y-[50%]" : "top-0"}`}
              ></div>
              <div
                className={`w-6 rounded-full border-t-[3px] border-[#999] absolute transition-all duration-300  ${isMenuOpen ? " -rotate-45 top-[50%] -translate-y-[50%]" : "bottom-0"}`}
              ></div>
            </div>
          </button>

      {/* Desktop Navigation */}
      <div
        className={`rounded-[25px] w-[450px] py-1 ${isAuthenticated ? "ml-0" : "ml-[50px]"} text-[18px] hidden md:flex justify-around items-center`}
        style={{ backgroundColor: primaryAccentColor }}
      >
        {NAV_LINKS.map((link) => (
          <NavLink key={link.href} {...link} />
        ))}
      </div>

      <div className="hidden md:flex gap-[30px] text-[18px] items-center ml-8">
        {isAuthenticated ? (
          <div className="relative">
            <div
              className="flex items-center gap-2 cursor-pointer"
              style={{ color: primaryAccentColor }}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              {!user?.avatar ? (
                <div
                  className="flex items-center justify-center h-[40px] w-[40px] rounded-full"
                  style={{ backgroundColor: secondaryAccentColor }}
                >
                  <p className="text-[18px] text-black font-bold">
                    {user?.fullname.firstname.charAt(0).toUpperCase()}
                  </p>
                </div>
              ) : (
                <div
                  className="flex items-center justify-center h-[40px] w-[40px] rounded-full"
                  style={{
                    backgroundImage: `url(${user?.avatar})`,
                    backgroundPosition: "center",
                    backgroundSize: "cover",
                  }}
                ></div>
              )}
              <svg
                className={`w-4 h-4 ml-1 inline-block transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>

            {/* Dropdown Menu */}
            <div
              className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white transform transition-all duration-200 ease-in-out ${
                isDropdownOpen
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-2 pointer-events-none"
              }`}
            >
              <div className="py-1">
                <button
                  onClick={() => router.push("/me")}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Profile
                </button>
                <button
                  onClick={() => {
                    logout();
                    toast.success("Logged out successfully");
                    router.push("/");
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        ) : (
          NAV_BUTTONS.map((button) => (
            <NavButton key={button.label} {...button} />
          ))
        )}
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden absolute top-full left-0 right-0 bg-white shadow-lg rounded-b-lg transition-all duration-300 ease-in-out transform origin-top py-[20px] ${
          isMenuOpen 
            ? "opacity-100 scale-y-100" 
            : "opacity-0 scale-y-0 pointer-events-none"
        }`}
        style={{ backgroundColor: primaryAccentColor }}
      >
        <div className={`flex flex-col space-y-6 transition-all duration-300 delay-100 ${
          isMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        }`}>
          <div className="flex flex-col space-y-4 px-6">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.href} {...link} />
            ))}
          </div>

          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-4 w-full px-6 py-4 border-t border-b border-gray-200/30">
                {!user?.avatar ? (
                  <div
                    className="flex items-center justify-center h-[50px] w-[50px] rounded-full shadow-md"
                    style={{ backgroundColor: secondaryAccentColor }}
                  >
                    <p className="text-[20px] text-black font-bold">
                      {user?.fullname.firstname.charAt(0).toUpperCase()}
                    </p>
                  </div>
                ) : (
                  <div
                    className="flex items-center justify-center h-[50px] w-[50px] rounded-full shadow-md"
                    style={{
                      backgroundImage: `url(${user?.avatar})`,
                      backgroundPosition: "center",
                      backgroundSize: "cover",
                    }}
                  ></div>
                )}
                <div className="flex flex-col">
                  <span className="text-black font-semibold text-lg">
                    {user?.fullname.firstname} {user?.fullname.lastname}
                  </span>
                  <span className="text-black/60 text-sm">View Profile</span>
                </div>
              </div>
              <div className="flex flex-col space-y-2 px-6">
                <button
                  onClick={() => router.push("/me")}
                  className="w-full text-left px-4 py-3 text-black hover:bg-black/5 rounded-xl transition-all duration-200 flex items-center gap-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile
                </button>
                <button
                  onClick={() => {
                    logout();
                    toast.success("Logged out successfully");
                    router.push("/");
                  }}
                  className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 flex items-center gap-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col space-y-3 px-6">
              <Link
                href="/login"
                className="text-[18px] text-black rounded-xl px-6 py-3 text-center hover:bg-black/5 transition-all duration-200"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="text-[18px] text-black rounded-xl px-6 py-3 text-center bg-black/10 hover:bg-black/20 transition-all duration-200"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

// Exports
export default Navbar;
