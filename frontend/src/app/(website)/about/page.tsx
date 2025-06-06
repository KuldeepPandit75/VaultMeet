"use client"

import { useThemeStore } from '@/Zustand_Store/ThemeStore';
import { features } from '@/data/features';
import FeatureCard from '@/app/(website)/about/FeatureCard';

export default function AboutPage() {
    const { primaryAccentColor, secondaryAccentColor } = useThemeStore();

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="py-20 px-4 md:px-8 lg:px-16" style={{ backgroundColor: `${secondaryAccentColor}20` }}>
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: primaryAccentColor }}>
                        About Us
                    </h1>
                    <p className="text-lg text-gray-700 mb-8">
                        Welcome to HackMeet – Where Innovation Meets Immersion
                    </p>
                    <p className="text-gray-600">
                        HackMeet is more than just a platform — it&apos;s a dynamic, interactive space built for developers, designers, and tech enthusiasts to explore, host, and participate in hackathons like never before. We bring the thrill of real-time collaboration into a 2D virtual world where creativity and code collide.
                    </p>
                </div>
            </section>

            {/* Vision Section */}
            <section className="py-16 px-4 md:px-8 lg:px-16">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold mb-6" style={{ color: primaryAccentColor }}>Our Vision</h2>
                    <p className="text-lg text-gray-600">
                        To redefine how hackathons are experienced online — making them more interactive, accessible, and engaging for everyone, from first-time participants to seasoned hackers.
                    </p>
                </div>
            </section>

            {/* What We Offer Section */}
            <section className="py-16 px-4 md:px-8 lg:px-16 mx-[100px] my-[50px] rounded-2xl" style={{ backgroundColor: `${secondaryAccentColor}20` }}>
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold mb-12 text-center" style={{ color: primaryAccentColor }}>What We Offer</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <FeatureCard key={index} feature={feature} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Why We Built Section */}
            <section className="py-16 px-4 md:px-8 lg:px-16">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold mb-6" style={{ color: primaryAccentColor }}>Why We Built HackMeet</h2>
                    <p className="text-lg text-gray-600">
                        We believe the future of hackathons is borderless and immersive. The traditional online format lacks the energy and spontaneity of physical events. So we created HackMeet — to bridge that gap, making virtual hackathons feel alive, social, and exciting again.
                    </p>
                </div>
            </section>

            {/* Join Section */}
            <section className="py-16 px-4 md:px-8 lg:px-16 mx-[100px] my-[50px] rounded-2xl" style={{ backgroundColor: `${secondaryAccentColor}20` }}>
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold mb-6" style={{ color: primaryAccentColor }}>Join the Movement</h2>
                    <p className="text-lg text-gray-600 mb-8">
                        Whether you&apos;re a developer, student, educator, startup, or tech community — HackMeet is your launchpad to build, connect, and innovate with a global network of passionate creators.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a 
                            href="/register" 
                            className="px-8 py-3 rounded-lg text-white font-medium transition-colors"
                            style={{ backgroundColor: primaryAccentColor }}
                        >
                            Get Started
                        </a>
                        <a 
                            href="/host" 
                            className="px-8 py-3 rounded-lg text-white font-medium transition-colors"
                            style={{ backgroundColor: secondaryAccentColor }}
                        >
                            Host a Hackathon
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
} 