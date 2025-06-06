'use client';

import { useThemeStore } from "@/Zustand_Store/ThemeStore";
import { useState, useEffect } from "react";
import Image from "next/image";

interface NewsItem {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  source: string;
  date: string;
  category: string;
}

export default function NewsPage() {
  const { primaryAccentColor, secondaryAccentColor } = useThemeStore();
  const [news, setNews] = useState<NewsItem[]>([
    {
      id: 1,
      title: "OpenAI Unveils GPT-5 with Enhanced Multimodal Capabilities",
      description: "OpenAI has announced GPT-5, featuring improved multimodal understanding and more accurate responses. The new model shows significant advancements in handling complex tasks and maintaining context.",
      imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995",
      source: "TechCrunch",
      date: "2024-03-15",
      category: "AI"
    },
    {
      id: 2,
      title: "Apple's Vision Pro: First Week Sales Exceed Expectations",
      description: "Apple's mixed reality headset has surpassed initial sales projections, with over 200,000 units sold in its first week. The device is being praised for its innovative interface and display technology.",
      imageUrl: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9",
      source: "The Verge",
      date: "2024-03-14",
      category: "Hardware"
    },
    {
      id: 3,
      title: "Microsoft Announces Major Windows 12 Update",
      description: "Microsoft has revealed Windows 12, featuring a redesigned interface and enhanced AI integration. The new OS focuses on productivity and seamless cross-device experiences.",
      imageUrl: "https://images.unsplash.com/photo-1573164713988-8665fc963095",
      source: "Windows Central",
      date: "2024-03-13",
      category: "Software"
    },
    {
      id: 4,
      title: "Tesla's New Battery Technology Promises 500-Mile Range",
      description: "Tesla has unveiled its next-generation battery technology, promising 500 miles of range and faster charging times. The new batteries are expected to enter production next year.",
      imageUrl: "https://images.unsplash.com/photo-1617704548623-340376564e68",
      source: "Electrek",
      date: "2024-03-12",
      category: "Automotive"
    },
    {
      id: 5,
      title: "Google's Quantum Computing Breakthrough",
      description: "Google has achieved quantum supremacy with its latest quantum computer, solving a complex problem in minutes that would take traditional supercomputers years to complete.",
      imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb",
      source: "Nature",
      date: "2024-03-11",
      category: "Quantum Computing"
    },
    {
      id: 6,
      title: "Meta's New AR Glasses Set to Launch This Year",
      description: "Meta has announced its next-generation AR glasses, featuring advanced hand tracking and spatial computing capabilities. The device is expected to revolutionize social interactions in virtual spaces.",
      imageUrl: "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac",
      source: "CNET",
      date: "2024-03-10",
      category: "AR/VR"
    }
  ]);

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const categories = ["All", "AI", "Hardware", "Software", "Automotive", "Quantum Computing", "AR/VR"];

  const filteredNews = selectedCategory === "All" 
    ? news 
    : news.filter(item => item.category === selectedCategory);

  return (
    <div className="min-h-screen px-[80px] py-[40px] text-white">
      <div className="max-w-7xl mx-auto">
        <h1 
          className="text-4xl font-bold mb-8 text-center"
          style={{ color: primaryAccentColor }}
        >
          Latest Tech News
        </h1>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-4 mb-8 justify-center">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full transition-all ${
                selectedCategory === category 
                  ? 'scale-105' 
                  : 'hover:scale-105'
              }`}
              style={{
                backgroundColor: selectedCategory === category 
                  ? primaryAccentColor 
                  : `${secondaryAccentColor}20`,
                color: selectedCategory === category ? '#222' : 'white'
              }}
            >
              {category}
            </button>
          ))}
        </div>

        {/* News Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNews.map((item) => (
            <div 
              key={item.id}
              className="rounded-xl overflow-hidden transition-transform hover:scale-105"
              style={{ backgroundColor: `${secondaryAccentColor}20` }}
            >
              <div className="relative h-48 w-full">
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-2">
                  <span 
                    className="text-sm px-3 py-1 rounded-full"
                    style={{ backgroundColor: `${primaryAccentColor}20`, color: primaryAccentColor }}
                  >
                    {item.category}
                  </span>
                  <span className="text-sm text-gray-400">{item.date}</span>
                </div>
                <h2 
                  className="text-xl font-semibold mb-2"
                  style={{ color: primaryAccentColor }}
                >
                  {item.title}
                </h2>
                <p className="text-gray-300 mb-4">{item.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Source: {item.source}</span>
                  <button 
                    className="text-sm px-4 py-2 rounded-lg transition-transform hover:scale-105"
                    style={{ 
                      background: `linear-gradient(90deg, ${primaryAccentColor} 0%, ${secondaryAccentColor} 100%)`,
                      color: '#222'
                    }}
                  >
                    Read More
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 