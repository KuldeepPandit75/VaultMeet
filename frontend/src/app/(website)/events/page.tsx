'use client';

import { useThemeStore } from "@/Zustand_Store/ThemeStore";
import Image from "next/image";
import { useState, useMemo } from "react";

// Types
type EventStatus = 'upcoming' | 'ongoing' | 'completed';
type TeamSize = '1-2' | '3-4' | '5+';
type Category = 'AI/ML' | 'Web3' | 'Sustainability' | 'Mobile' | 'Web';

interface TeamSizeRange {
  min: number;
  max: number;
}

interface Event {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  location: string;
  isVirtual: boolean;
  prizePool: string;
  participants: number;
  maxParticipants: number;
  organizer: string;
  category: Category;
  tags: string[];
  registrationDeadline: string;
  teamSize: TeamSizeRange;
  eligibility: string[];
  tracks: string[];
  sponsors: string[];
  status: EventStatus;
}

// Constants
const CATEGORIES: Category[] = ['AI/ML', 'Web3', 'Sustainability', 'Mobile', 'Web'];
const STATUSES: EventStatus[] = ['upcoming', 'ongoing', 'completed'];
const TEAM_SIZES: TeamSize[] = ['1-2', '3-4', '5+'];

// Sample data
const SAMPLE_EVENTS: Event[] = [
  {
    id: 1,
    title: "AI Innovation Challenge 2024",
    description: "Build the next generation of AI applications. Focus on practical solutions that can make a real impact in healthcare, education, or environmental sustainability.",
    imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995",
    startDate: "2024-04-15",
    endDate: "2024-04-17",
    location: "Virtual",
    isVirtual: true,
    prizePool: "$10,000",
    participants: 150,
    maxParticipants: 200,
    organizer: "TechCorp",
    category: "AI/ML",
    tags: ["AI", "Machine Learning", "Healthcare", "Education"],
    registrationDeadline: "2024-04-10",
    teamSize: { min: 2, max: 4 },
    eligibility: ["Students", "Professionals", "Startups"],
    tracks: ["Healthcare", "Education", "Environment"],
    sponsors: ["Google", "Microsoft", "AWS"],
    status: "upcoming"
  },
  {
    id: 2,
    title: "Web3 Development Hackathon",
    description: "Create innovative solutions using blockchain technology. Build DApps, smart contracts, or explore new use cases for Web3 technology.",
    imageUrl: "https://images.unsplash.com/photo-1639762681057-408e52192e55",
    startDate: "2024-05-01",
    endDate: "2024-05-03",
    location: "San Francisco, CA",
    isVirtual: false,
    prizePool: "$15,000",
    participants: 200,
    maxParticipants: 300,
    organizer: "Blockchain Foundation",
    category: "Web3",
    tags: ["Blockchain", "Smart Contracts", "DeFi", "NFTs"],
    registrationDeadline: "2024-04-25",
    teamSize: { min: 3, max: 5 },
    eligibility: ["Students", "Professionals"],
    tracks: ["DeFi", "NFTs", "Gaming"],
    sponsors: ["Ethereum Foundation", "Polygon", "Chainlink"],
    status: "upcoming"
  },
  {
    id: 3,
    title: "GreenTech Solutions",
    description: "Develop sustainable technology solutions to address climate change. Focus on renewable energy, waste management, or carbon reduction.",
    imageUrl: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9",
    startDate: "2024-06-10",
    endDate: "2024-06-12",
    location: "Virtual",
    isVirtual: true,
    prizePool: "$20,000",
    participants: 180,
    maxParticipants: 250,
    organizer: "EcoTech Initiative",
    category: "Sustainability",
    tags: ["Climate Change", "Renewable Energy", "Sustainability"],
    registrationDeadline: "2024-06-01",
    teamSize: { min: 2, max: 4 },
    eligibility: ["Students", "Professionals", "Startups"],
    tracks: ["Renewable Energy", "Waste Management", "Carbon Reduction"],
    sponsors: ["Tesla", "SolarCity", "Greenpeace"],
    status: "upcoming"
  }
];

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
    {category}
  </span>
);

const EventCard = ({ event, primaryColor, secondaryColor }: { 
  event: Event; 
  primaryColor: string;
  secondaryColor: string;
}) => (
  <div 
    className="rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
    style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
  >
    <div className="flex flex-col md:flex-row">
      <div className="relative w-full md:w-1/3 h-48 md:h-auto">
        <Image
          src={event.imageUrl}
          alt={event.title}
          fill
          className="object-cover"
        />
        <StatusBadge status={event.status} />
      </div>

      <div className="flex-1 p-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <CategoryBadge category={event.category} color={primaryColor} />
          {event.isVirtual && (
            <CategoryBadge category="Virtual" color={secondaryColor} />
          )}
          <span className="text-sm text-gray-400">
            by {event.organizer}
          </span>
        </div>

        <h3 
          className="text-2xl font-bold mb-2"
          style={{ color: secondaryColor }}
        >
          {event.title}
        </h3>
        <p className="text-gray-300 mb-4">{event.description}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <EventInfo label="Date" value={`${new Date(event.startDate).toLocaleDateString()} - ${new Date(event.endDate).toLocaleDateString()}`} />
          <EventInfo label="Location" value={event.location} />
          <EventInfo label="Prize Pool" value={event.prizePool} />
          <EventInfo label="Team Size" value={`${event.teamSize.min}-${event.teamSize.max}`} />
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {event.tags.map((tag, index) => (
            <span 
              key={index}
              className="px-2 py-1 rounded-full text-xs"
              style={{ 
                backgroundColor: primaryColor + '20',
                color: primaryColor
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-400">
            Registration closes: {new Date(event.registrationDeadline).toLocaleDateString()}
          </div>
          <button
            className="px-6 py-2 rounded-lg font-semibold transition-colors duration-300"
            style={{
              background: `linear-gradient(90deg, ${secondaryColor} 0%, ${primaryColor} 100%)`,
              color: '#222',
            }}
          >
            Register Now
          </button>
        </div>
      </div>
    </div>
  </div>
);

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedTeamSize, setSelectedTeamSize] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const filteredEvents = useMemo(() => {
    return SAMPLE_EVENTS.filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          event.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || event.status === selectedStatus;
      
      const matchesTeamSize = selectedTeamSize === 'all' || 
        (selectedTeamSize === '1-2' && event.teamSize.max <= 2) ||
        (selectedTeamSize === '3-4' && event.teamSize.min >= 3 && event.teamSize.max <= 4) ||
        (selectedTeamSize === '5+' && event.teamSize.min >= 5);

      return matchesSearch && matchesCategory && matchesStatus && matchesTeamSize;
    });
  }, [searchQuery, selectedCategory, selectedStatus, selectedTeamSize]);

  return (
    <div className="min-h-screen px-4 sm:px-6 md:px-8 lg:px-[80px] py-8 md:py-[40px]">
      <div className="text-center mb-8 md:mb-16">
        <h1 
          className="text-3xl md:text-5xl font-bold mb-4 md:mb-6"
          style={{ color: secondaryAccentColor }}
        >
          Listed Hackathons
        </h1>
        <p 
          className="text-base md:text-xl max-w-2xl mx-auto mb-4 md:mb-8"
          style={{ color: primaryAccentColor }}
        >
          Join exciting hackathons, showcase your skills, and win amazing prizes
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
              label="Category"
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={['all', ...CATEGORIES]}
            />
            <FilterSelect
              label="Status"
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={['all', ...STATUSES]}
            />
            <FilterSelect
              label="Team Size"
              value={selectedTeamSize}
              onChange={setSelectedTeamSize}
              options={['all', ...TEAM_SIZES]}
            />
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        {filteredEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            primaryColor={primaryAccentColor}
            secondaryColor={secondaryAccentColor}
          />
        ))}
      </div>
    </div>
  );
} 