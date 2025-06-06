'use client'

import Link from "next/link";
import { useThemeStore } from "../../Zustand_Store/ThemeStore";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const { primaryAccentColor, secondaryAccentColor } = useThemeStore();
  return (
    <nav className="px-[20px] md:px-[40px] lg:px-[80px] py-[20px] flex justify-between items-center">
      <div
        id="logo"
        className="text-[36px] font-[900] cursor-pointer"
        style={{ color: secondaryAccentColor }}
        onClick={() => router.push('/')}
      >
        Hack<span style={{ color: primaryAccentColor }}>Meet</span>
      </div>
      <div className="rounded-[25px] w-[450px] py-1 text-[18px] flex justify-around items-center"
        style={{backgroundColor:primaryAccentColor}}
      >
        <Link href="/news">News</Link>
        <Link href="#">Events</Link>
        <Link href="/host">Host</Link>
      </div>
      <div className="flex gap-[30px] text-[18px] items-center">
        <Link href="#" style={{color:secondaryAccentColor}}>Login</Link>
        <Link href="#" style={{backgroundColor:primaryAccentColor}} className="text-black rounded-[20px] px-[18px] py-1">Sign Up</Link>
      </div>
    </nav>
  );
}
