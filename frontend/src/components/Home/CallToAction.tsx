"use client"
import { useThemeStore } from '@/Zustand_Store/ThemeStore';
import Link from 'next/link';

export default function CallToAction() {
  const { primaryAccentColor, secondaryAccentColor } = useThemeStore();

  return (
    <section className="py-20 px-4 md:px-8 lg:px-16">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-8" style={{ color: primaryAccentColor }}>
          Ready to Hack the Future?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-12">
          <Link 
            href="/register" 
            className="p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            style={{ backgroundColor: primaryAccentColor }}
          >
            <h3 className="text-2xl font-semibold mb-4 text-white">Join as a Participant</h3>
            <p className="text-white/90">Discover events and start building.</p>
          </Link>

          <Link 
            href="/host" 
            className="p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            style={{ backgroundColor: secondaryAccentColor }}
          >
            <h3 className="text-2xl font-semibold mb-4 text-white">Become a Host</h3>
            <p className="text-white/90">Launch your event today – free to start.</p>
          </Link>
        </div>
      </div>
    </section>
  );
} 