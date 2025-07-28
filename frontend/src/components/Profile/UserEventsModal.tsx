"use client";

import { useEffect, useState } from "react";
import { useThemeStore } from "@/Zustand_Store/ThemeStore";
import useEventStore, { Event } from "@/Zustand_Store/EventStore";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

interface UserEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

export default function UserEventsModal({
  isOpen,
  onClose,
  userId,
  userName,
}: UserEventsModalProps) {
  const { primaryAccentColor, secondaryAccentColor } = useThemeStore();
  const { getUserCreatedEvents, userEvents, userEventsPagination, loading, deleteEvent, unpublishEvent, publishEvent } =
    useEventStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"published" | "draft">(
    "published"
  );
  const router = useRouter();
  const pathname=usePathname();

  useEffect(() => {
    if (isOpen && userId) {
      fetchEvents(1);
    }
  }, [isOpen, userId, activeTab]);

  const fetchEvents = async (page: number) => {
    try {
      await getUserCreatedEvents(userId, {
        page,
        limit: 10,
        status: activeTab,
      });
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching user events:", error);
    }
  };

  const handleTabChange = (tab: "published" | "draft") => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page !== currentPage) {
        fetchEvents(page);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const handleEventClick = (eventId: string, event?: React.MouseEvent) => {
    // Prevent navigation if clicking on action buttons
    if (event && (event.target as HTMLElement).closest('.event-actions')) {
      return;
    }
    
    if(pathname==='/me'){
      router.push(`/host/${eventId}/dashboard`);
    }else{
      router.push(`/events/${eventId}`);
    }
  };

  const handleDeleteEvent = async (eventId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteEvent(eventId);
      toast.success('Event deleted successfully');
      // Refresh the events list
      fetchEvents(currentPage);
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  const handleUnpublishEvent = async (eventId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!confirm('Are you sure you want to unpublish this event? It will be moved back to draft status.')) {
      return;
    }
    try {
      await unpublishEvent(eventId);
      toast.success('Event unpublished successfully');
      // Refresh the events list
      fetchEvents(currentPage);
    } catch (error) {
      console.error('Error unpublishing event:', error);
      toast.error('Failed to unpublish event');
    }
  };

  const handlePublishEvent = async (eventId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await publishEvent(eventId);
      toast.success('Event published successfully');
      // Refresh the events list
      fetchEvents(currentPage);
    } catch (error) {
      console.error('Error publishing event:', error);
      toast.error('Failed to publish event');
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        style={{ backgroundColor: "#111" }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b border-white/20"
          style={{ backgroundColor: `${secondaryAccentColor}90` }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-3">
                Events by {userName}
              </h2>

              {/* Tabs */}
              {pathname==='/me' && (
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleTabChange("published")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === "published"
                        ? "bg-white/20 text-white"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    Published
                  </button>
                  <button
                    onClick={() => handleTabChange("draft")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === "draft"
                        ? "bg-white/20 text-white"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    Drafts
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div
                className="animate-spin rounded-full h-12 w-12 border-b-2"
                style={{ borderColor: secondaryAccentColor }}
              ></div>
            </div>
          ) : userEvents.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3a2 2 0 012-2h8a2 2 0 012 2v4m-6 9l2 2 4-4m-4-8V3a2 2 0 00-2-2H4a2 2 0 00-2 2v16a2 2 0 002 2h16a2 2 0 002-2V7"
                />
              </svg>
              <p className="text-gray-500 text-lg">
                {activeTab === "published"
                  ? "No published events found"
                  : "No draft events found"}
              </p>
            </div>
          ) : (
            <>
              {/* Events Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userEvents.map((event: Event) => (
                  <div
                    key={event._id}
                    className="rounded-xl overflow-hidden shadow-lg transition-transform hover:scale-105 cursor-pointer"
                    style={{ backgroundColor: `${secondaryAccentColor}20` }}
                    onClick={() => handleEventClick(event._id)}
                  >
                    {/* Event Banner */}
                    <div className="h-48 relative overflow-hidden">
                      {event.banner ? (
                        <Image
                          src={event.banner}
                          alt={event.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div
                          className="h-full w-full flex items-center justify-center"
                          style={{ backgroundColor: `${primaryAccentColor}40` }}
                        >
                          <svg
                            className="w-16 h-16 text-white/50"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3a2 2 0 012-2h8a2 2 0 012 2v4m-6 9l2 2 4-4m-4-8V3a2 2 0 00-2-2H4a2 2 0 00-2 2v16a2 2 0 002 2h16a2 2 0 002-2V7"
                            />
                          </svg>
                        </div>
                      )}

                      {/* Status Badge */}
                      <div className="absolute top-3 right-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            event.status === "published"
                              ? "bg-green-500"
                              : event.status === "ongoing"
                              ? "bg-blue-500"
                              : event.status === "completed"
                              ? "bg-gray-500"
                              : "bg-yellow-500"
                          } text-white`}
                        >
                          {event.status.charAt(0).toUpperCase() +
                            event.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    {/* Event Details */}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {event.company.logo && (
                          <Image
                            src={event.company.logo}
                            alt={event.company.name}
                            width={24}
                            height={24}
                            className="rounded"
                          />
                        )}
                        <span className="text-sm text-gray-300">
                          {event.company.name}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
                        {event.name}
                      </h3>

                      <div className="flex items-center gap-4 text-sm text-gray-300 mb-3">
                        <div className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3a2 2 0 012-2h8a2 2 0 012 2v4m-6 9l2 2 4-4m-4-8V3a2 2 0 00-2-2H4a2 2 0 00-2 2v16a2 2 0 002 2h16a2 2 0 002-2V7"
                            />
                          </svg>
                          <span className="capitalize">{event.type}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                          </svg>
                          <span className="capitalize">{event.mode}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-300">
                          {formatDate(event.startDate)} -{" "}
                          {formatDate(event.endDate)}
                        </span>
                        {event.prizes.prizePool && (
                          <span
                            className="font-medium"
                            style={{ color: `${primaryAccentColor}` }}
                          >
                            {event.prizes.prizePool}
                          </span>
                        )}
                      </div>

                                             {/* Stats */}
                       <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                         <div className="text-sm text-gray-300">
                           <span className="font-medium">
                             {event.stats?.registeredParticipants || 0}
                           </span>{" "}
                           registered
                         </div>
                       </div>
                       
                       {/* Action Buttons - Only show for own events */}
                       {pathname === '/me' && (
                         <div className="event-actions mt-3 pt-3 border-t border-white/10 flex gap-2">
                           {event.status === 'draft' && (
                             <>
                               <button
                                 onClick={(e) => handlePublishEvent(event._id, e)}
                                 className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                               >
                                 Publish
                               </button>
                               <button
                                 onClick={(e) => handleDeleteEvent(event._id, e)}
                                 className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                               >
                                 Delete
                               </button>
                             </>
                           )}
                           {event.status === 'published' && (
                             <button
                               onClick={(e) => handleUnpublishEvent(event._id, e)}
                               className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded transition-colors"
                             >
                               Unpublish
                             </button>
                           )}
                         </div>
                       )}
                     </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {userEventsPagination && userEventsPagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!userEventsPagination.hasPreviousPage}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      userEventsPagination.hasPreviousPage
                        ? "hover:bg-white/10 text-white"
                        : "text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    Previous
                  </button>

                  {Array.from(
                    { length: userEventsPagination.totalPages },
                    (_, i) => i + 1
                  ).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        page === currentPage
                          ? "text-black font-medium"
                          : "text-white hover:bg-white/10"
                      }`}
                      style={{
                        backgroundColor:
                          page === currentPage
                            ? secondaryAccentColor
                            : "transparent",
                      }}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!userEventsPagination.hasNextPage}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      userEventsPagination.hasNextPage
                        ? "hover:bg-white/10 text-white"
                        : "text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
