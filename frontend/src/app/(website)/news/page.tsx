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
  "Security",
  "Startups",
  "Hackathons",
  "Technology",
  "Apps",
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
  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<{
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const itemsPerPage = 6;

  // Load news when page changes
  useEffect(() => {
    loadNews(currentPage);
  }, [currentPage]);

  // Reset to page 1 when category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  const loadNews = async (page = 1) => {
    try {
      setIsLoading(true);
      const response = await getNews(page, itemsPerPage);
      if (response.success) {
        setAllNews(response.data as unknown as NewsItem[]);
        setPagination(response.pagination as unknown as {
          currentPage: number;
          totalPages: number;
          totalItems: number;
          itemsPerPage: number;
          hasNextPage: boolean;
          hasPrevPage: boolean;
        });
      } else {
        setAllNews(SAMPLE_NEWS);
        setPagination(null);
      }
    } catch (error) {
      console.error('Error loading news:', error);
      setAllNews(SAMPLE_NEWS);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredNews = useMemo(() => {
    if (selectedCategory === "All") return allNews;
    return allNews.filter((newsItem) => newsItem.category === selectedCategory);
  }, [selectedCategory, allNews]);

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

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div 
            className="animate-spin rounded-full h-12 w-12 border-b-2"
            style={{ borderColor: primaryAccentColor }}
          ></div>
        </div>
      ) : (
        <>
          {/* News Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {filteredNews.map((news) => (
              <NewsCard key={news._id} news={news} />
            ))}
          </div>

          {/* No results message */}
          {filteredNews.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="mb-4">
                <svg 
                  className="h-16 w-16 mx-auto opacity-50" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  style={{ color: primaryAccentColor }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <p 
                className="text-xl font-medium mb-2"
                style={{ color: secondaryAccentColor }}
              >
                No news articles found
              </p>
              <p 
                className="text-sm opacity-70"
                style={{ color: primaryAccentColor }}
              >
                {selectedCategory !== "All" 
                  ? `No articles found in "${selectedCategory}" category.`
                  : "No news articles available at the moment."
                }
              </p>
            </div>
          )}

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && selectedCategory === "All" && (
            <div className="mt-16 flex items-center justify-center">
              <div className="flex items-center gap-2">
                {/* First Page */}
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1 || isLoading}
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    color: currentPage === 1 ? primaryAccentColor : secondaryAccentColor,
                    backgroundColor: currentPage === 1 ? 'transparent' : `${primaryAccentColor}10`,
                    border: `1px solid ${primaryAccentColor}`,
                  }}
                >
                  First
                </button>

                {/* Previous Page */}
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={!pagination.hasPrevPage || isLoading}
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    color: !pagination.hasPrevPage ? primaryAccentColor : secondaryAccentColor,
                    backgroundColor: !pagination.hasPrevPage ? 'transparent' : `${primaryAccentColor}10`,
                    border: `1px solid ${primaryAccentColor}`,
                  }}
                >
                  Previous
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1 mx-4">
                  {[...Array(pagination.totalPages)].map((_, index) => {
                    const pageNum = index + 1;
                    // Show first page, last page, current page, and pages around current
                    const showPage = pageNum === 1 || 
                                     pageNum === pagination.totalPages || 
                                     Math.abs(pageNum - currentPage) <= 1;
                    
                    if (!showPage && pageNum === 2 && currentPage > 4) {
                      return (
                        <span 
                          key={pageNum} 
                          className="px-2 text-sm"
                          style={{ color: primaryAccentColor }}
                        >
                          ...
                        </span>
                      );
                    }
                    if (!showPage && pageNum === pagination.totalPages - 1 && currentPage < pagination.totalPages - 3) {
                      return (
                        <span 
                          key={pageNum} 
                          className="px-2 text-sm"
                          style={{ color: primaryAccentColor }}
                        >
                          ...
                        </span>
                      );
                    }
                    if (!showPage) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        disabled={isLoading}
                        className="px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 disabled:cursor-not-allowed hover:scale-105"
                        style={{
                          color: currentPage === pageNum ? '#fff' : secondaryAccentColor,
                          backgroundColor: currentPage === pageNum 
                            ? `linear-gradient(90deg, ${secondaryAccentColor} 0%, ${primaryAccentColor} 100%)`
                            : `${primaryAccentColor}10`,
                          border: `1px solid ${currentPage === pageNum ? 'transparent' : primaryAccentColor}`,
                          background: currentPage === pageNum 
                            ? `linear-gradient(90deg, ${secondaryAccentColor} 0%, ${primaryAccentColor} 100%)`
                            : `${primaryAccentColor}10`,
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                {/* Next Page */}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                  disabled={!pagination.hasNextPage || isLoading}
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    color: !pagination.hasNextPage ? primaryAccentColor : secondaryAccentColor,
                    backgroundColor: !pagination.hasNextPage ? 'transparent' : `${primaryAccentColor}10`,
                    border: `1px solid ${primaryAccentColor}`,
                  }}
                >
                  Next
                </button>

                {/* Last Page */}
                <button
                  onClick={() => setCurrentPage(pagination.totalPages)}
                  disabled={currentPage === pagination.totalPages || isLoading}
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    color: currentPage === pagination.totalPages ? primaryAccentColor : secondaryAccentColor,
                    backgroundColor: currentPage === pagination.totalPages ? 'transparent' : `${primaryAccentColor}10`,
                    border: `1px solid ${primaryAccentColor}`,
                  }}
                >
                  Last
                </button>
              </div>
            </div>
          )}

          {/* Pagination Info */}
          {pagination && pagination.totalPages > 1 && selectedCategory === "All" && (
            <div className="mt-6 text-center">
              <p 
                className="text-sm opacity-70"
                style={{ color: primaryAccentColor }}
              >
                Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, pagination.totalItems)} of{" "}
                {pagination.totalItems} articles
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NewsPage;
