'use client';

import { useThemeStore } from "@/Zustand_Store/ThemeStore";
import useEventStore from "@/Zustand_Store/EventStore";
import Image from "next/image";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

// Types
type EventStatus = 'upcoming' | 'ongoing' | 'completed';
type EventMode = 'online' | 'offline' | 'hybrid';

interface Event {
  _id: string;
  company: {
    name: string;
    website: string;
    industry: string;
    logo: string;
  };
  name: string;
  banner: string;
  type: string;
  description: string;
  mode: EventMode;
  startDate: Date;
  endDate: Date;
  targetAudience: string;
  venue?: {
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
  };
  prizes: {
    prizePool?: string;
  };
}

// Components
const StatusBadge = ({ status }: { status: EventStatus }) => {
  const getStatusColor = (status: EventStatus): string => {
    switch (status) {
      case 'upcoming': return '#4CAF50';
      case 'ongoing': return '#2196F3';
      case 'completed': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  return (
    <div 
      className="absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium"
      style={{ 
        backgroundColor: getStatusColor(status),
        color: '#fff'
      }}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </div>
  );
};

const CategoryBadge = ({ category, color }: { category: string; color: string }) => (
  <span 
    className="px-3 py-1 rounded-full text-sm"
    style={{ 
      backgroundColor: color + '20',
      color: color
    }}
  >
    {category.charAt(0).toUpperCase() + category.slice(1)}
  </span>
);

const EventCard = ({ event, primaryColor, secondaryColor }: { 
  event: Event; 
  primaryColor: string;
  secondaryColor: string;
}) => {
  const router = useRouter();
  const getEventStatus = (startDate: Date, endDate: Date): EventStatus => {
    const now = new Date();
    if (now < startDate) return 'upcoming';
    if (now > endDate) return 'completed';
    return 'ongoing';
  };

  const status = getEventStatus(event.startDate, event.endDate);

  console.log(event.startDate,event.endDate)

  return (
    <div 
      className="rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
      style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
    >
      <div className="flex flex-col md:flex-row">
        <div className="relative w-full md:w-1/3 h-48 md:h-auto">
          <Image
            src={event.company.logo || '/default-event-banner.jpg'}
            alt={event.name}
            fill
            className="object-contain p-6"
          />
          <StatusBadge status={status} />
        </div>

        <div className="flex-1 p-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <CategoryBadge category={event.type} color={primaryColor} />
            {event.mode === 'online' && (
              <CategoryBadge category="Virtual" color={secondaryColor} />
            )}
            <span className="text-sm text-gray-400">
              by {event.company.name}
            </span>
          </div>

          <h3 
            className="text-2xl font-bold mb-2"
            style={{ color: secondaryColor }}
          >
            {event.name}
          </h3>
          <p className="text-gray-300 mb-4">{event.description}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <EventInfo label="Date" value={`${event.startDate?.toLocaleDateString()} - ${event.endDate.toLocaleDateString()}`} />
            <EventInfo label="Location" value={event.mode === 'online' ? 'Virtual' : event.venue?.name || 'TBA'} />
            <EventInfo label="Prize Pool" value={event.prizes?.prizePool || 'TBA'} />
            <EventInfo label="Mode" value={event.mode.charAt(0).toUpperCase() + event.mode.slice(1)} />
          </div>

          <div className="flex justify-end items-center">
            <button
              className="px-6 py-2 rounded-lg font-semibold transition-colors duration-300"
              style={{
                background: `linear-gradient(90deg, ${secondaryColor} 0%, ${primaryColor} 100%)`,
                color: '#222',
              }}
              onClick={() => router.push(`/events/${event._id}`)}
            >
              Register Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EventInfo = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div className="text-sm text-gray-400">{label}</div>
    <div className="text-white">{value}</div>
  </div>
);

const FilterSelect = ({ 
  label, 
  value, 
  onChange, 
  options 
}: { 
  label: string; 
  value: string; 
  onChange: (value: string) => void; 
  options: string[];
}) => (
  <div>
    <label className="block text-sm font-medium mb-2">{label}</label>
    <select
      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-gray-600 text-white"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map(option => (
        <option key={option} value={option} className="text-black">
          {option === 'all' ? 'Any' : option.charAt(0).toUpperCase() + option.slice(1)}
        </option>
      ))}
    </select>
  </div>
);

// Main Component
export default function EventsPage() {
  const { primaryAccentColor, secondaryAccentColor } = useThemeStore();
  const { events, pagination, loading, error, getPublishedEvents } = useEventStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMode, setSelectedMode] = useState<EventMode | 'all'>('all');
  const [selectedType, setSelectedType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const router=useRouter();

  useEffect(()=>{
    if(process.env.NODE_ENV!=="development"){
      toast("Under Development")
      router.push("/")
    }
  })

  useEffect(() => {
    fetchEvents();
  }, [currentPage, selectedMode, selectedType]);

  const fetchEvents = async () => {
    const params = {
      page: currentPage,
      limit: 10,
      ...(selectedMode !== 'all' && { mode: selectedMode }),
      ...(selectedType !== 'all' && { type: selectedType })
    };

    await getPublishedEvents(params);
  };

  const filteredEvents = useMemo(() => {
    if (!searchQuery) return events;
    
    return events.filter(event => {
      return event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             event.company.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [events, searchQuery]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  return (
    <div className="min-h-screen px-4 sm:px-6 md:px-8 lg:px-[80px] py-8 md:py-[40px]">
      <div className="text-center mb-8 md:mb-16">
        <h1 
          className="text-3xl md:text-5xl font-bold mb-4 md:mb-6"
          style={{ color: secondaryAccentColor }}
        >
          Listed Events
        </h1>
        <p 
          className="text-base md:text-xl max-w-2xl mx-auto mb-4 md:mb-8"
          style={{ color: primaryAccentColor }}
        >
          Discover all listed events, find your next challenge, and compete for top prizes
        </p>
      </div>

      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <input
            type="text"
            placeholder="Search hackathons..."
            className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-gray-600 text-white focus:outline-none focus:border-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            className="px-6 py-2 rounded-lg font-semibold whitespace-nowrap"
            style={{
              background: `linear-gradient(90deg, ${secondaryAccentColor} 0%, ${primaryAccentColor} 100%)`,
              color: '#222',
            }}
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {showFilters && (
          <div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 rounded-lg bg-white/5"
            style={{ color: primaryAccentColor }}
          >
            <FilterSelect
              label="Mode"
              value={selectedMode}
              onChange={(value) => setSelectedMode(value as EventMode | 'all')}
              options={['all', 'online', 'offline', 'hybrid']}
            />
            <FilterSelect
              label="Type"
              value={selectedType}
              onChange={setSelectedType}
              options={['all', 'hackathon', 'workshop', 'webinar', 'tech-talk']}
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading events...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">
          {error}
        </div>
      ) : (
        <>
          <div className="max-w-6xl mx-auto space-y-6">
            {filteredEvents.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                primaryColor={primaryAccentColor}
                secondaryColor={secondaryAccentColor}
              />
            ))}
          </div>

          {pagination && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!pagination.hasPreviousPage}
                className={`px-4 py-2 rounded-lg ${
                  pagination.hasPreviousPage 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                Previous
              </button>
              <span className="text-white">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className={`px-4 py-2 rounded-lg ${
                  pagination.hasNextPage 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
} 