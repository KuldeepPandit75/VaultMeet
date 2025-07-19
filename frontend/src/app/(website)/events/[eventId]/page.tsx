'use client';

import { useThemeStore } from "@/Zustand_Store/ThemeStore";
import useEventStore from "@/Zustand_Store/EventStore";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FaCalendarAlt, FaUsers, FaTrophy, FaClock, FaBuilding, FaGlobe, FaLinkedin } from "react-icons/fa";
import type { IconType } from "react-icons";
import { useRouter } from "next/navigation";

interface Stage {
  stageName: string;
  stageDescription?: string;
  stageStartDate: Date;
  stageEndDate?: Date;
  onHackMeet: boolean;
}

interface Sponsor {
  name: string;
  logo: string;
  website: string;
}

interface Event {
  _id: string;
  company: {
    name: string;
    website: string;
    industry: string;
    logo: string;
  };
  contact: {
    name: string;
    email: string;
    phone: string;
    socialProfiles?: string;
  };
  name: string;
  banner: string;
  type: string;
  description: string;
  mode: 'online' | 'offline' | 'hybrid';
  startDate: Date;
  endDate: Date;
  duration: string;
  targetAudience: string;
  maxParticipants: number;
  venue?: {
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
  };
  stages?: Stage[];
  prizes: {
    hasPrizes: boolean;
    details?: string;
    sponsorshipDetails?: string;
    prizePool?: string;
  };
  promotion: {
    needsPromotion: boolean;
    marketingMaterials: string[];
  };
  sponsors?: Sponsor[];
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  stats: {
    registeredParticipants: number;
    approvedParticipants: number;
  };
}

interface InfoCardProps {
  title: string;
  icon: IconType;
  children: React.ReactNode;
}

const InfoCard = ({ title, icon: Icon, children }: InfoCardProps) => {
  const { primaryAccentColor, isDarkMode } = useThemeStore();
  
  return (
    <div className={`${isDarkMode ? 'bg-white/5' : 'bg-gray-100/80'} rounded-xl p-6 ${isDarkMode ? 'backdrop-blur-sm' : 'shadow-lg'}`}>
      <div className="flex items-center gap-3 mb-4">
        <Icon size={24} color={primaryAccentColor} />
        <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{title}</h3>
      </div>
      {children}
    </div>
  );
};

const StageCard = ({ stage }: { stage: Stage }) => {
  const { isDarkMode } = useThemeStore();
  
  return (
    <div className={`${isDarkMode ? 'bg-white/5' : 'bg-gray-100/80'} rounded-xl p-6 ${isDarkMode ? 'backdrop-blur-sm' : 'shadow-lg'}`}>
      <h4 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{stage.stageName}</h4>
      {stage.stageDescription && (
        <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{stage.stageDescription}</p>
      )}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <FaCalendarAlt className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>{new Date(stage.stageStartDate).toLocaleDateString()}</span>
        </div>
        {stage.stageEndDate && (
          <div className="flex items-center gap-2">
            <FaClock className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>{new Date(stage.stageEndDate).toLocaleDateString()}</span>
          </div>
        )}
        {stage.onHackMeet && (
          <span className="px-3 py-1 rounded-full text-sm bg-green-500/20 text-green-400">
            On HackMeet
          </span>
        )}
      </div>
    </div>
  );
};

const SponsorCard = ({ sponsor }: { sponsor: Sponsor }) => {
  const { isDarkMode } = useThemeStore();
  
  return (
    <div className={`${isDarkMode ? 'bg-white/5' : 'bg-gray-100/80'} rounded-xl p-6 ${isDarkMode ? 'backdrop-blur-sm' : 'shadow-lg'} flex items-center gap-4`}>
      <div className="relative w-16 h-16">
        <Image
          src={sponsor.logo}
          alt={sponsor.name}
          fill
          className="object-contain"
        />
      </div>
      <div>
        <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{sponsor.name}</h4>
        <a 
          href={sponsor.website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          Visit Website
        </a>
      </div>
    </div>
  );
};

export default function EventDetailsPage() {
  const { primaryAccentColor, secondaryAccentColor, isDarkMode } = useThemeStore();
  const { getEventById, currentEvent, loading, error } = useEventStore();
  const params = useParams();
  const router=useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

  useEffect(() => {
    if (params.eventId) {
      setHasAttemptedFetch(true);
      getEventById(params.eventId as string);
    }
  }, [params.eventId, getEventById]);

  // Show loading state while fetching data or before first fetch attempt
  if (loading || !hasAttemptedFetch) {
    return (
      <div className={`min-h-[85vh] flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading event details...</p>
        </div>
      </div>
    );
  }

  // Show error state or when no event is found (only after fetch attempt)
  if (error || !currentEvent) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="text-red-500 text-xl mb-2">⚠️</div>
          <p className={`text-red-500 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
            {error || 'Event not found'}
          </p>
        </div>
      </div>
    );
  }

  const event = currentEvent as Event;

  return (
    <div className={`min-h-screen`}>
      {/* Hero Section */}
      <div className="relative h-[40vh] min-h-[400px]">
        <Image
          src={event.banner}
          alt={event.name}
          fill
          className="object-cover"
        />
      </div>

      {/* Event Details Section */}
      <div className={`relative z-10`}>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl">
            <h1 
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ color: secondaryAccentColor }}
            >
              {event.name}
            </h1>
            <div className={`flex flex-wrap gap-4 mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              <div className={`px-4 py-2 rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-white/80'} flex items-center gap-2`}>
                <span className="text-sm font-medium">Type:</span>
                <span>{event.type}</span>
              </div>
              <div className={`px-4 py-2 rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-white/80'} flex items-center gap-2`}>
                <span className="text-sm font-medium">Mode:</span>
                <span>{event.mode}</span>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                className="px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-300 hover:scale-105"
                style={{
                  background: `linear-gradient(90deg, ${secondaryAccentColor} 0%, ${primaryAccentColor} 100%)`,
                  color: '#222',
                }}
              >
                Register Now
              </button>
              {(event.mode === 'online' || event.mode === 'hybrid') && (
                <button
                  onClick={() => router.push(`/event-space/${event._id}`)}
                  className={`px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-300 hover:scale-105 border-2 ${
                    isDarkMode 
                      ? 'border-white text-white hover:bg-white hover:text-black' 
                      : 'border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  Join Virtual Space
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Main Content */}
          <div className="flex-1">
            {/* Tabs */}
            <div className={`flex gap-4 mb-8 border-b ${isDarkMode ? 'border-white/10' : 'border-gray-300'}`}>
              {['overview', 'schedule', 'prizes', 'sponsors'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === tab
                      ? 'border-b-2 text-white'
                      : isDarkMode 
                        ? 'text-gray-400 hover:text-white' 
                        : 'text-gray-500 hover:text-gray-800'
                  }`}
                  style={{
                    borderColor: activeTab === tab ? secondaryAccentColor : 'transparent'
                  }}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="space-y-8">
              {activeTab === 'overview' && (
                <>
                  <InfoCard title="About" icon={FaBuilding}>
                    <p className={`whitespace-pre-line ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {event.description}
                    </p>
                  </InfoCard>

                  <InfoCard title="Event Details" icon={FaCalendarAlt}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Date & Time</h4>
                        <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                          {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                        </p>
                        <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>{event.duration}</p>
                      </div>
                      <div>
                        <h4 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Location</h4>
                        {event.mode === 'online' ? (
                          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Virtual Event</p>
                        ) : (
                          <div className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                            <p>{event.venue?.name}</p>
                            <p>{event.venue?.address}</p>
                            <p>{event.venue?.city}, {event.venue?.state}</p>
                            <p>{event.venue?.country}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </InfoCard>
                </>
              )}

              {activeTab === 'schedule' && (
                <div className="space-y-6">
                  {event.stages?.map((stage, index) => (
                    <StageCard key={index} stage={stage} />
                  ))}
                </div>
              )}

              {activeTab === 'prizes' && event.prizes.hasPrizes && (
                <InfoCard title="Prizes" icon={FaTrophy}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {event.prizes.prizePool && (
                      <div className={`text-center p-6 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-100/80'}`}>
                        <h4 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Prize Pool</h4>
                        <p className="text-xl">{event.prizes.prizePool}</p>
                      </div>
                    )}
                  </div>
                  {event.prizes.details && (
                    <p className={`mt-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{event.prizes.details}</p>
                  )}
                </InfoCard>
              )}

              {activeTab === 'sponsors' && event.sponsors && event.sponsors.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {event.sponsors.map((sponsor, index) => (
                    <SponsorCard key={index} sponsor={sponsor} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:w-80 space-y-6">
            <InfoCard title="Organizer" icon={FaBuilding}>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative w-16 h-16">
                  <Image
                    src={event.company.logo}
                    alt={event.company.name}
                    fill
                    className="object-contain"
                  />
                </div>
                <div>
                  <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{event.company.name}</h4>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{event.company.industry}</p>
                </div>
              </div>
              <a 
                href={event.company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 flex items-center gap-2"
              >
                <FaGlobe />
                Visit Website
              </a>
            </InfoCard>

            <InfoCard title="Contact" icon={FaUsers}>
              <div className="space-y-4">
                <div>
                  <h4 className={`font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{event.contact.name}</h4>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{event.contact.email}</p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{event.contact.phone}</p>
                </div>
                {event.contact.socialProfiles && (
                  <a 
                    href={event.contact.socialProfiles}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-2"
                  >
                    <FaLinkedin />
                    LinkedIn Profile
                  </a>
                )}
              </div>
            </InfoCard>

            <InfoCard title="Event Stats" icon={FaUsers}>
              <div className="space-y-4">
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Registered Participants</p>
                  <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{event.stats.registeredParticipants}</p>
                </div>
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Approved Participants</p>
                  <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{event.stats.approvedParticipants}</p>
                </div>
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Maximum Participants</p>
                  <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{event.maxParticipants}</p>
                </div>
              </div>
            </InfoCard>
          </div>
        </div>
      </div>
    </div>
  );
}
