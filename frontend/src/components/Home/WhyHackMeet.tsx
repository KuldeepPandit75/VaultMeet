"use client"

import { useThemeStore } from '@/Zustand_Store/ThemeStore';

export default function WhyHackMeet() {
  const { primaryAccentColor, secondaryAccentColor } = useThemeStore();

  return (
    <section className="py-20 px-4 md:px-8 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16" style={{ color: primaryAccentColor }}>
          Why HackMeet?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300" style={{ backgroundColor: secondaryAccentColor }}>
            <h3 className="text-xl font-semibold mb-4">Explore Upcoming Hackathons</h3>
            <p className="text-gray-700">Walk through a virtual map and discover hackathons like never before. Each event has its own booth, vibe, and community.</p>
          </div>

          <div className="p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300" style={{ backgroundColor: secondaryAccentColor }}>
            <h3 className="text-xl font-semibold mb-4">2D Interactive Experience</h3>
            <p className="text-gray-700">No boring forms. Meet other participants, chat in real time, and showcase your project in an immersive virtual world.</p>
          </div>

          <div className="p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300" style={{ backgroundColor: secondaryAccentColor }}>
            <h3 className="text-xl font-semibold mb-4">Host Your Own Hackathon</h3>
            <p className="text-gray-700">Set up a custom hackathon with ease — pick a theme, invite mentors, and manage everything from the organizer dashboard.</p>
          </div>

          <div className="p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300" style={{ backgroundColor: secondaryAccentColor }}>
            <h3 className="text-xl font-semibold mb-4">Real-time Collaboration</h3>
            <p className="text-gray-700">From live chat to team creation and submissions — HackMeet powers every aspect of a modern hackathon.</p>
          </div>
        </div>
      </div>
    </section>
  );
} 