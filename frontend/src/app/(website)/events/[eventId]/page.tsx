'use client';

import { useThemeStore } from "@/Zustand_Store/ThemeStore";
import useEventStore from "@/Zustand_Store/EventStore";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FaCalendarAlt, FaUsers, FaTrophy, FaClock, FaBuilding, FaGlobe, FaLinkedin } from "react-icons/fa";
import type { IconType } from "react-icons";

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
  const { primaryAccentColor } = useThemeStore();
  
  return (
    <div className="bg-white/5 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Icon size={24} color={primaryAccentColor} />
        <h3 className="text-xl font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
};

const StageCard = ({ stage }: { stage: Stage }) => (
  <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm">
    <h4 className="text-xl font-semibold mb-2">{stage.stageName}</h4>
    {stage.stageDescription && (
      <p className="text-gray-300 mb-4">{stage.stageDescription}</p>
    )}
    <div className="flex flex-wrap gap-4">
      <div className="flex items-center gap-2">
        <FaCalendarAlt />
        <span>{new Date(stage.stageStartDate).toLocaleDateString()}</span>
      </div>
      {stage.stageEndDate && (
        <div className="flex items-center gap-2">
          <FaClock />
          <span>{new Date(stage.stageEndDate).toLocaleDateString()}</span>
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

const SponsorCard = ({ sponsor }: { sponsor: Sponsor }) => (
  <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm flex items-center gap-4">
    <div className="relative w-16 h-16">
      <Image
        src={sponsor.logo}
        alt={sponsor.name}
        fill
        className="object-contain"
      />
    </div>
    <div>
      <h4 className="text-lg font-semibold">{sponsor.name}</h4>
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

export default function EventDetailsPage() {
  const { primaryAccentColor, secondaryAccentColor } = useThemeStore();
  const { getEventById, currentEvent, loading, error } = useEventStore();
  const params = useParams();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (params.eventId) {
      getEventById(params.eventId as string);
    }
  }, [params.eventId, getEventById]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !currentEvent) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error || 'Event not found'}
      </div>
    );
  }

  const event = currentEvent as Event;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[40vh] min-h-[400px]">
        <Image
          src={event.banner}
          alt={event.name}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl">
              <h1 
                className="text-4xl md:text-5xl font-bold mb-4"
                style={{ color: secondaryAccentColor }}
              >
                {event.name}
              </h1>
              <div className="flex flex-wrap gap-4 mb-6">
                <span className="px-4 py-2 rounded-full bg-white/10">
                  {event.type}
                </span>
                <span className="px-4 py-2 rounded-full bg-white/10">
                  {event.mode}
                </span>
                <span className="px-4 py-2 rounded-full bg-white/10">
                  {event.targetAudience}
                </span>
              </div>
              <button
                className="px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-300 hover:scale-105"
                style={{
                  background: `linear-gradient(90deg, ${secondaryAccentColor} 0%, ${primaryAccentColor} 100%)`,
                  color: '#222',
                }}
              >
                Register Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Main Content */}
          <div className="flex-1">
            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-white/10">
              {['overview', 'schedule', 'prizes', 'sponsors'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === tab
                      ? 'border-b-2'
                      : 'text-gray-400 hover:text-white'
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
                    <p className="text-gray-300 whitespace-pre-line">
                      {event.description}
                    </p>
                  </InfoCard>

                  <InfoCard title="Event Details" icon={FaCalendarAlt}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-lg font-medium mb-2">Date & Time</h4>
                        <p className="text-gray-300">
                          {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                        </p>
                        <p className="text-gray-300">{event.duration}</p>
                      </div>
                      <div>
                        <h4 className="text-lg font-medium mb-2">Location</h4>
                        {event.mode === 'online' ? (
                          <p className="text-gray-300">Virtual Event</p>
                        ) : (
                          <div className="text-gray-300">
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
                      <div className="text-center p-6 rounded-xl bg-white/5">
                        <h4 className="text-2xl font-bold mb-2">Prize Pool</h4>
                        <p className="text-xl">{event.prizes.prizePool}</p>
                      </div>
                    )}
                  </div>
                  {event.prizes.details && (
                    <p className="mt-6 text-gray-300">{event.prizes.details}</p>
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
                  <h4 className="text-lg font-semibold">{event.company.name}</h4>
                  <p className="text-sm text-gray-300">{event.company.industry}</p>
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
                  <h4 className="font-medium mb-1">{event.contact.name}</h4>
                  <p className="text-sm text-gray-300">{event.contact.email}</p>
                  <p className="text-sm text-gray-300">{event.contact.phone}</p>
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
                  <p className="text-sm text-gray-300">Registered Participants</p>
                  <p className="text-2xl font-bold">{event.stats.registeredParticipants}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-300">Approved Participants</p>
                  <p className="text-2xl font-bold">{event.stats.approvedParticipants}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-300">Maximum Participants</p>
                  <p className="text-2xl font-bold">{event.maxParticipants}</p>
                </div>
              </div>
            </InfoCard>
          </div>
        </div>
      </div>
    </div>
  );
}
