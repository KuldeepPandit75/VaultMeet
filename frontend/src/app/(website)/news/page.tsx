"use client";

import { useThemeStore } from "@/Zustand_Store/ThemeStore";
import Image from "next/image";
import { useState, useMemo, useEffect } from "react";
import useEventStore from "@/Zustand_Store/EventStore";

// Types
interface NewsItem {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  source: string;
  date: string;
  category: string;
  link: string;
}

// Constants
const CATEGORIES = [
  "All",
  "AI",
  "Hardware",
  "Software",
  "Automotive",
  "Quantum Computing",
  "AR/VR",
];

const SAMPLE_NEWS: NewsItem[] = [
  {
    _id: "1",
    title: "OpenAI Unveils GPT-5 with Enhanced Multimodal Capabilities",
    description:
      "OpenAI has announced GPT-5, featuring improved multimodal understanding and more accurate responses. The new model shows significant advancements in handling complex tasks and maintaining context.",
    imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995",
    source: "TechCrunch",
    date: "2024-03-15",
    category: "AI",
    link: "https://www.vaultmeet.xyz/news",
  },
];

const NewsCard = ({ news }: { news: NewsItem }) => {
  const { primaryAccentColor, secondaryAccentColor } = useThemeStore();

  return (
    <div
      className="bg-white flex flex-col rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
      style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
    >
      <Image
        src={news.imageUrl}
        alt={news.title}
        width={500}
        height={500}
        className="w-full h-48 object-cover"
      />
      <div className="p-6 flex justify-between flex-col flex-1">
        <div>
          <div className="flex justify-between items-center mb-4">
            <span
              className="text-sm font-semibold px-3 py-1 rounded-full"
              style={{
                color: primaryAccentColor,
                backgroundColor: `${primaryAccentColor}20`,
              }}
            >
              {news.category}
            </span>
            <span className="text-sm" style={{ color: secondaryAccentColor }}>
              {new Date(news.date).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
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
            {news.description.length > 220
              ? news.description.slice(0, 220) + "..."
              : news.description}
          </p>
        </div>

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
              color: "#222",
            }}
            onClick={() => window.open(news.link, "_blank")}
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
  onClick,
}: {
  category: string;
  isActive: boolean;
  onClick: () => void;
}) => {
  const { primaryAccentColor } = useThemeStore();

  return (
    <button
      onClick={onClick}
      className={`
        px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300
        ${isActive ? "font-bold shadow-lg scale-105" : "font-normal opacity-70"}
        hover:opacity-100 hover:font-medium hover:scale-105 hover:shadow-md
      `}
      style={{
        color: "#fff",
        backgroundColor: isActive
          ? `${primaryAccentColor}30`
          : `${primaryAccentColor}10`,
        border: `1px solid ${isActive ? primaryAccentColor : "transparent"}`,
      }}
    >
      {category}
    </button>
  );
};

const NewsPage = () => {
  const { primaryAccentColor, secondaryAccentColor } = useThemeStore();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { getNews } = useEventStore();
  const [news, setNews] = useState<NewsItem[]>([]);
  useEffect(() => {
    const fetchNews = async () => {
      const response = await getNews();
      if (response.success) {
        setNews(response.data as unknown as NewsItem[]);
      } else {
        setNews(SAMPLE_NEWS);
      }
    };
    fetchNews();
  }, []);

  const filteredNews = useMemo(() => {
    if (selectedCategory === "All") return news;
    return news.filter((news) => news.category === selectedCategory);
  }, [selectedCategory, news]);

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
          <NewsCard key={news._id} news={news} />
        ))}
      </div>
    </div>
  );
};

export default NewsPage;
