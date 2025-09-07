'use client';

import { useThemeStore } from "@/Zustand_Store/ThemeStore";
import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { useEffect } from "react";
// import toast from "react-hot-toast";

export default function HostPageContent() {
  const { primaryAccentColor, secondaryAccentColor } = useThemeStore();
  // const router=useRouter();

  // useEffect(()=>{
  //   if(process.env.NODE_ENV!=="development"){
  //     toast("Under Development")
  //     router.push("/")
  //   }
  // })

  return (
    <div className="min-h-screen px-[40px] md:px-[80px] py-[40px] text-white">
      {/* Header Section */}
      <div className="text-center mb-16">
        <h1 
          className="text-5xl font-bold mb-6"
          style={{ color: secondaryAccentColor }}
        >
          Host Your Event
        </h1>
        <p 
          className="text-xl max-w-2xl mx-auto"
          style={{ color: primaryAccentColor }}
        >
          Create an engaging Event experience for developers worldwide. Choose your path below to get started.
        </p>
      </div>

      {/* Main Content */}
      <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {/* Company Section */}
        <div 
          className="p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
          style={{ backgroundColor: `${primaryAccentColor}20` }}
        >
          <h2 
            className="text-3xl font-bold mb-4"
            style={{ color: secondaryAccentColor }}
          >
            For Companies
          </h2>
          <ul className="space-y-4 mb-8">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Host industry-focused Events</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Access to global developer talent</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Promote your brand and technology</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Innovation and recruitment opportunities</span>
            </li>
          </ul>
          <Link 
            href="/host/company"
            className="inline-block px-6 py-3 rounded-lg font-semibold transition-transform hover:scale-105"
            style={{ 
              background: `linear-gradient(90deg, ${secondaryAccentColor} 0%, ${primaryAccentColor} 100%)`,
              color: '#222'
            }}
          >
            Host as Company
          </Link>
        </div>

        {/* Student Section */}
        <div 
          className="p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
          style={{ backgroundColor: `${primaryAccentColor}20` }}
        >
          <h2 
            className="text-3xl font-bold mb-4"
            style={{ color: secondaryAccentColor }}
          >
            For Students
          </h2>
          <ul className="space-y-4 mb-8">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Organize college Events</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Build your developer community</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Gain event management experience</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Connect with industry partners</span>
            </li>
          </ul>
          <Link 
            href="/host/student"
            className="inline-block px-6 py-3 rounded-lg font-semibold transition-transform hover:scale-105"
            style={{ 
              background: `linear-gradient(90deg, ${secondaryAccentColor} 0%, ${primaryAccentColor} 100%)`,
              color: '#222'
            }}
          >
            Host as Student
          </Link>
        </div>
      </div>

      {/* Additional Info Section */}
      <div className="mt-16 max-w-4xl mx-auto">
        <h2 
          className="text-3xl font-bold mb-6 text-center"
          style={{ color: secondaryAccentColor }}
        >
          Why Host on VaultMeet?
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center p-6">
            <h3 className="font-bold mb-2" style={{ color: primaryAccentColor }}>Virtual Environment</h3>
            <p>2D virtual world for immersive Event experience</p>
          </div>
          <div className="text-center p-6">
            <h3 className="font-bold mb-2" style={{ color: primaryAccentColor }}>Global Reach</h3>
            <p>Connect with developers worldwide</p>
          </div>
          <div className="text-center p-6">
            <h3 className="font-bold mb-2" style={{ color: primaryAccentColor }}>Easy Management</h3>
            <p>Streamlined tools for Event organization</p>
          </div>
        </div>
      </div>
    </div>
  );
}
