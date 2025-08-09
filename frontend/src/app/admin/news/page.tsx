"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore, { Role } from "@/Zustand_Store/AuthStore";
import useEventStore from "@/Zustand_Store/EventStore";
import toast from "react-hot-toast";
import Image from "next/image";


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

export default function NewsPage() {
  const router = useRouter();
  const { isAuthenticated, user, loading } = useAuthStore();
  const { postNews, getNews } = useEventStore();
  
  const [newsLink, setNewsLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<{
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } | null>(null);
  const itemsPerPage = 6;

  useEffect(() => {
    // Don't redirect while loading
    if (loading) return;

    if (!loading && (user?.role !== Role.Admin || !isAuthenticated)) {
      toast.error("You don't have permission to access this page");
      router.push("/admin");
      return;
    }
  }, [isAuthenticated, user?.role, router, loading]);

  useEffect(() => {
    // Load existing news on component mount
    loadNews(currentPage);
  }, [currentPage]);

  const loadNews = async (page = currentPage) => {
    try {
      setIsLoadingNews(true);
      const response = await getNews(page, itemsPerPage);
      if (response.success) {
        setNewsItems(response.data as unknown as NewsItem[]);
        setPagination(response.pagination as unknown as {
          currentPage: number;
          totalPages: number;
          totalItems: number;
          itemsPerPage: number;
          hasNextPage: boolean;
          hasPrevPage: boolean;
        });
      }
    } catch (error) {
      console.error('Error loading news:', error);
      toast.error('Failed to load news');
    } finally {
      setIsLoadingNews(false);
    }
  };

  const handleSubmitNews = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newsLink.trim()) {
      toast.error("Please enter a news link");
      return;
    }

    // Basic URL validation
    try {
      new URL(newsLink);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    try {
      setIsSubmitting(true);
      await postNews(newsLink);
      toast.success("News article processed successfully!");
      setNewsLink("");
      // Reset to first page and reload news to show the new item
      setCurrentPage(1);
      await loadNews(1);
    } catch (error) {
      console.error('Error posting news:', error);
      toast.error("Failed to process news article");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show access denied if not authenticated or not admin
  if (!isAuthenticated || user?.role !== Role.Admin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">News Management</h1>
            <p className="mt-2 text-gray-600">
              Add news articles by providing links to extract content automatically
            </p>
          </div>
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Add News Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add News Article</h2>
          <form onSubmit={handleSubmitNews} className="space-y-4">
            <div>
              <label htmlFor="newsLink" className="block text-sm font-medium text-gray-700 mb-2">
                News Article URL
              </label>
              <input
                type="url"
                id="newsLink"
                value={newsLink}
                onChange={(e) => setNewsLink(e.target.value)}
                placeholder="https://example.com/news-article"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter a URL to a news article. Our AI will extract the title, description, and other details automatically.
              </p>
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !newsLink.trim()}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                'Add News Article'
              )}
            </button>
          </form>
        </div>

        {/* News Items List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">News Articles</h2>
            <div className="flex items-center gap-2">
              {pagination && (
                <span className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, pagination.totalItems)} of{" "}
                  {pagination.totalItems} articles
                </span>
              )}
              <button
                onClick={() => loadNews(currentPage)}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>

          {isLoadingNews ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : newsItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {newsItems.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  {item.imageUrl && (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      width={500}
                      height={500}
                      className="w-full h-48 object-cover rounded-md mb-4"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  )}
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {item.category}
                      </span>
                      <span>{item.date}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{item.source}</span>
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          View Original
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-gray-400 mb-4">
                <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <p className="text-lg">No news articles yet</p>
              <p className="text-sm mt-2">Add your first news article using the form above.</p>
            </div>
          )}
          
          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1 || isLoadingNews}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  First
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={!pagination.hasPrevPage || isLoadingNews}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
              </div>
              
              <div className="flex items-center gap-1">
                {[...Array(pagination.totalPages)].map((_, index) => {
                  const pageNum = index + 1;
                  // Show first page, last page, current page, and pages around current
                  const showPage = pageNum === 1 || 
                                   pageNum === pagination.totalPages || 
                                   Math.abs(pageNum - currentPage) <= 1;
                  
                  if (!showPage && pageNum === 2 && currentPage > 4) {
                    return <span key={pageNum} className="px-2 text-gray-400">...</span>;
                  }
                  if (!showPage && pageNum === pagination.totalPages - 1 && currentPage < pagination.totalPages - 3) {
                    return <span key={pageNum} className="px-2 text-gray-400">...</span>;
                  }
                  if (!showPage) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      disabled={isLoadingNews}
                      className={`px-3 py-1 text-sm border rounded disabled:cursor-not-allowed ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                  disabled={!pagination.hasNextPage || isLoadingNews}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
                <button
                  onClick={() => setCurrentPage(pagination.totalPages)}
                  disabled={currentPage === pagination.totalPages || isLoadingNews}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}