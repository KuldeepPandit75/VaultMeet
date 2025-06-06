'use client';

import { useThemeStore } from "@/Zustand_Store/ThemeStore";
import Image from "next/image";
import { useState, useMemo } from "react";

// Types
interface NewsItem {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  source: string;
  date: string;
  category: string;
}

// Constants
const CATEGORIES = ['All', 'AI', 'Hardware', 'Software', 'Automotive', 'Quantum Computing', 'AR/VR'];

const SAMPLE_NEWS: NewsItem[] = [
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
    
  
];

const NewsCard = ({ news }: { news: NewsItem }) => {
  const { primaryAccentColor, secondaryAccentColor } = useThemeStore();

  return (
    <div 
      className="bg-white rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
      style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
    >
      <Image 
        src={news.imageUrl} 
        alt={news.title}
        width={500}
        height={500}
        className="w-full h-48 object-cover"
      />
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <span 
            className="text-sm font-semibold px-3 py-1 rounded-full"
            style={{ color: primaryAccentColor, backgroundColor: `${primaryAccentColor}20` }}
          >
            {news.category}
          </span>
          <span 
            className="text-sm"
            style={{ color: secondaryAccentColor }}
          >
            {news.date}
          </span>
        </div>
        <h3 
          className="text-xl font-bold mb-2"
          style={{ color: secondaryAccentColor }}
        >
          {news.title}
        </h3>
        <p 
          className="text-gray-600 mb-4"
          style={{ color: primaryAccentColor }}
        >
          {news.description}
        </p>
        <div className="flex justify-between items-center">
          <span 
            className="text-sm font-medium"
            style={{ color: secondaryAccentColor }}
          >
            {news.source}
          </span>
          <button
            className="px-4 py-2 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
            style={{
              background: `linear-gradient(90deg, ${secondaryAccentColor} 0%, ${primaryAccentColor} 100%)`,
              color: '#222'
            }}
          >
            Read More
          </button>
        </div>
      </div>
    </div>
  );
};

const CategoryButton = ({ 
  category, 
  isActive, 
  onClick 
}: { 
  category: string; 
  isActive: boolean; 
  onClick: () => void;
}) => {
  const { primaryAccentColor, secondaryAccentColor } = useThemeStore();

  return (
    <button
      onClick={onClick}
      className={`
        px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300
        ${isActive ? 'font-bold shadow-lg scale-105' : 'font-normal opacity-70'}
        hover:opacity-100 hover:font-medium hover:scale-105 hover:shadow-md
      `}
      style={{ 
        color: '#fff',
        backgroundColor: isActive ? `${primaryAccentColor}30` : `${primaryAccentColor}10`,
        border: `1px solid ${isActive ? primaryAccentColor : 'transparent'}`
      }}
    >
      {category}
    </button>
  );
};

const NewsPage = () => {
  const { primaryAccentColor, secondaryAccentColor } = useThemeStore();
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredNews = useMemo(() => {
    if (selectedCategory === 'All') return SAMPLE_NEWS;
    return SAMPLE_NEWS.filter(news => news.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="min-h-screen px-4 sm:px-6 md:px-8 lg:px-[80px] py-8 md:py-12">
      <div className="text-center mb-8 md:mb-16">
        <h1 
          className="text-3xl md:text-5xl font-bold mb-4 md:mb-6"
          style={{ color: secondaryAccentColor }}
        >
          Latest News
        </h1>
        <p 
          className="text-base md:text-xl max-w-2xl mx-auto mb-12"
          style={{ color: primaryAccentColor }}
        >
          Stay updated with the latest trends and developments in the tech world
        </p>

        {/* Category Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-16">
          {CATEGORIES.map((category) => (
            <CategoryButton
              key={category}
              category={category}
              isActive={selectedCategory === category}
              onClick={() => setSelectedCategory(category)}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
        {filteredNews.map((news) => (
          <NewsCard key={news.id} news={news} />
        ))}
      </div>
    </div>
  );
};

export default NewsPage; 