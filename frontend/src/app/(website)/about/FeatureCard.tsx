"use client"

import { useThemeStore } from '@/Zustand_Store/ThemeStore';
import { Feature } from '@/data/features';

interface FeatureCardProps {
    feature: Feature;
}

export default function FeatureCard({ feature }: FeatureCardProps) {
    const { secondaryAccentColor } = useThemeStore();

    return (
        <div 
            className="p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
            style={{ backgroundColor: `${secondaryAccentColor}20` }}
        >
            <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
            <p className="text-gray-600">{feature.description}</p>
        </div>
    );
} 