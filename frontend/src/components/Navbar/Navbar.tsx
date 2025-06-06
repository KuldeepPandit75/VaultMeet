'use client'

import Link from "next/link";
import { useThemeStore } from "../../Zustand_Store/ThemeStore";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

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
  { href: "/signup", label: "Sign Up", isPrimary: true },
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
        ${isActive ? 'font-bold' : 'font-normal opacity-60'} 
        hover:opacity-100 hover:font-medium
        px-4 py-1 rounded-xl
      `}
      style={{ 
        color: '#000',
        backgroundColor: isActive ? `${primaryAccentColor}20` : 'transparent',
      }}
    >
      {label}
    </Link>
  );
};

const NavButton = ({ href, label, isPrimary }: NavButton) => {
  const { primaryAccentColor, secondaryAccentColor } = useThemeStore();
  const pathname = usePathname();
  const isActive = pathname === href;
  
  return (
    <Link 
      href={href} 
      style={isPrimary ? { backgroundColor: primaryAccentColor } : { color: secondaryAccentColor }}
      className={`text-[18px] ${isPrimary ? 'text-black rounded-[20px] px-[18px] py-1' : ''}`}
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

  return (
    <nav className="px-[20px] md:px-[40px] lg:px-[80px] py-[20px] flex justify-between items-center relative z-[100000]">
      <div
        id="logo"
        className="text-[36px] font-[900] cursor-pointer"
        style={{ color: secondaryAccentColor }}
        onClick={() => router.push('/')}
      >
        Hack<span style={{ color: primaryAccentColor }}>Meet</span>
      </div>

      {/* Mobile Menu Button */}
      <button 
        className="md:hidden text-white p-2"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        style={{ color: secondaryAccentColor }}
      >
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} 
          />
        </svg>
      </button>

      {/* Desktop Navigation */}
      <div 
        className="rounded-[25px] w-[450px] py-1 ml-[50px] text-[18px] hidden md:flex justify-around items-center"
        style={{ backgroundColor: primaryAccentColor }}
      >
        {NAV_LINKS.map((link) => (
          <NavLink key={link.href} {...link} />
        ))}
      </div>

      <div className="hidden md:flex gap-[30px] text-[18px] items-center ml-8">
        {NAV_BUTTONS.map((button) => (
          <NavButton key={button.label} {...button} />
        ))}
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div 
          className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg rounded-b-lg py-4"
          style={{ backgroundColor: primaryAccentColor }}
        >
          <div className="flex flex-col items-center space-y-4">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.href} {...link} />
            ))}
            <Link href="/login" className="text-[18px] text-black rounded-[20px] px-[18px] py-1">Login</Link>
            <Link href="/signup" className="text-[18px] text-black rounded-[20px] px-[18px] py-1">Sign Up</Link>
          </div>
        </div>
      )}
    </nav>
  );
};

// Exports
export default Navbar;
