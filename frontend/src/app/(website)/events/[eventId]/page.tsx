'use client';

import { useThemeStore } from "@/Zustand_Store/ThemeStore";
import useEventStore from "@/Zustand_Store/EventStore";
import useAuthStore from "@/Zustand_Store/AuthStore";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FaCalendarAlt, FaUsers, FaTrophy, FaClock, FaBuilding, FaGlobe, FaLinkedin, FaTimes, FaCopy } from "react-icons/fa";
import type { IconType } from "react-icons";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

interface Stage {
  stageName: string;
  stageDescription?: string;
  stageStartDate: Date;
  stageEndDate?: Date;
  onVaultMeet: boolean;
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
    prize1?: string;
    prize2?: string;
    prize3?: string;
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
        {stage.onVaultMeet && (
          <span className="px-3 py-1 rounded-full text-sm bg-green-500/20 text-green-400">
            On VaultMeet
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
  const { 
    getEventById, 
    currentEvent, 
    loading, 
    error, 
    userRegistration, 
    userTeam,
    registerForEvent,
    getRegistrationStatus,
    createTeam
  } = useEventStore();
  const { user, isAuthenticated } = useAuthStore();
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  
  // UI states
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showProfileIncompleteModal, setShowProfileIncompleteModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  
  // Registration form data
  const [registrationData, setRegistrationData] = useState({
    experience: '',
    motivation: '',
    skills: '',
    previousProjects: '',
    expectations: '',
    teamPreference: 'individual', // 'individual', 'with_team', 'find_team'
  });

  useEffect(() => {
    if (params.eventId) {
      setHasAttemptedFetch(true);
      getEventById(params.eventId as string);
      
      // Check if user is registered and load their registration/team data
      if (isAuthenticated && user) {
        checkUserRegistration();
      }
    }
  }, [params.eventId, getEventById, isAuthenticated, user]);

  // Check if user profile is at least 75% complete
  const checkProfileCompletion = () => {
    if (!user) return false;
    
    const fields = [
      user.fullname.firstname,
      user.fullname.lastname,
      user.email,
      user.bio,
      user.location,
      user.skills,
      user.interests,
      user.social?.github || user.social?.linkedin || user.website,
    ];
    
    const completedFields = fields.filter(field => field && field.trim() !== '').length;
    const completionPercentage = (completedFields / fields.length) * 100;
    
    return completionPercentage >= 75;
  };

  // Check user registration status
  const checkUserRegistration = async () => {
    try {
      if (params.eventId) {
        await getRegistrationStatus(params.eventId as string);
      }
    } catch (error) {
      console.error('Error checking registration:', error);
    }
  };

  // Handle registration button click
  const handleRegisterClick = () => {
    if (!isAuthenticated) {
      toast.error('Please login to register for this event');
      router.push('/login');
      return;
    }

    if (!checkProfileCompletion()) {
      setShowProfileIncompleteModal(true);
      return;
    }

    if (userRegistration) {
      // User is already registered, show team management
      setShowTeamModal(true);
    } else {
      // Show registration form
      setShowRegistrationModal(true);
    }
  };

  // Handle registration submission
  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await registerForEvent(params.eventId as string, registrationData);
      setShowRegistrationModal(false);
      setShowTeamModal(true);
      toast.success('Registration successful! You can now manage your team.');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Failed to register. Please try again.');
    }
  };

  // Handle team creation
  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      toast.error('Please enter a team name');
      return;
    }

    try {
      await createTeam(params.eventId as string, teamName.trim());
      setTeamName('');
      toast.success('Team created successfully!');
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Failed to create team. Please try again.');
    }
  };

  // Check if event has started
  const isEventStarted = () => {
    if (!currentEvent) return false;
    return new Date() >= new Date(currentEvent.startDate);
  };

  // Check if user can join virtual space
  // const canJoinVirtualSpace = () => {
  //   return isEventStarted() && 
  //          userRegistration?.status === 'approved' && 
  //          (currentEvent?.mode === 'online' || currentEvent?.mode === 'hybrid');
  // };

  // Get registration button text and action
  const getRegistrationButtonProps = () => {
    if (!isAuthenticated) {
      return { text: 'Login to Register', disabled: false };
    }
    
    if (userRegistration) {
      if (isEventStarted()) {
        return { text: 'Manage Team', disabled: false };
      }
      return { text: 'Manage Team', disabled: false };
    }
    
    if (isEventStarted()) {
      return { text: 'Registration Closed', disabled: true };
    }
    
    return { text: 'Register Now', disabled: false };
  };

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
                onClick={handleRegisterClick}
                disabled={getRegistrationButtonProps().disabled}
                className={`px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-300 hover:scale-105 ${
                  getRegistrationButtonProps().disabled 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:scale-105'
                }`}
                style={{
                  background: getRegistrationButtonProps().disabled 
                    ? '#666' 
                    : `linear-gradient(90deg, ${secondaryAccentColor} 0%, ${primaryAccentColor} 100%)`,
                  color: '#222',
                }}
              >
                {getRegistrationButtonProps().text}
              </button>
              
              {/* Show Join Virtual Space button only for approved users when event has started */}
              {/* {canJoinVirtualSpace() && ( */}
              {true && (
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
                    {event.prizes.prize1 && (
                      <div className={`text-center p-6 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-100/80'}`}>
                        <h4 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>1st Prize</h4>
                        <p className="text-lg">{event.prizes.prize1}</p>
                      </div>
                    )}
                    {event.prizes.prize2 && (
                      <div className={`text-center p-6 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-100/80'}`}>
                        <h4 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>2nd Prize</h4>
                        <p className="text-lg">{event.prizes.prize2}</p>
                      </div>
                    )}
                    {event.prizes.prize3 && (
                      <div className={`text-center p-6 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-100/80'}`}>
                        <h4 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-orange-200' : 'text-orange-700'}`}>3rd Prize</h4>
                        <p className="text-lg">{event.prizes.prize3}</p>
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
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Maximum Participants</p>
                  <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{event.maxParticipants}</p>
                </div>
              </div>
            </InfoCard>
          </div>
        </div>
      </div>

      {/* Profile Incomplete Modal */}
      {showProfileIncompleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 w-full max-w-md`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Complete Your Profile
              </h2>
              <button
                onClick={() => setShowProfileIncompleteModal(false)}
                className={`p-2 rounded-lg hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-700' : ''}`}
              >
                <FaTimes className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
              </button>
            </div>
            <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Please complete at least 75% of your profile to register for this event. This helps organizers understand participants better.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowProfileIncompleteModal(false)}
                className={`px-4 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowProfileIncompleteModal(false);
                  router.push('/me');
                }}
                className="px-4 py-2 rounded-lg text-white"
                style={{ backgroundColor: primaryAccentColor }}
              >
                Complete Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {showRegistrationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Register for {event.name}
              </h2>
              <button
                onClick={() => setShowRegistrationModal(false)}
                className={`p-2 rounded-lg hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-700' : ''}`}
              >
                <FaTimes className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
              </button>
            </div>
            
            <form onSubmit={handleRegistrationSubmit} className="space-y-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Experience Level *
                </label>
                <select
                  value={registrationData.experience}
                  onChange={(e) => setRegistrationData(prev => ({ ...prev, experience: e.target.value }))}
                  className={`w-full p-3 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-800'
                  } focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                  style={{ '--tw-ring-color': primaryAccentColor } as React.CSSProperties}
                  required
                >
                  <option value="">Select your experience level</option>
                  <option value="beginner">Beginner (0-1 years)</option>
                  <option value="intermediate">Intermediate (1-3 years)</option>
                  <option value="advanced">Advanced (3-5 years)</option>
                  <option value="expert">Expert (5+ years)</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Why do you want to participate? *
                </label>
                <textarea
                  value={registrationData.motivation}
                  onChange={(e) => setRegistrationData(prev => ({ ...prev, motivation: e.target.value }))}
                  className={`w-full p-3 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-800'
                  } focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                  style={{ '--tw-ring-color': primaryAccentColor } as React.CSSProperties}
                  rows={4}
                  placeholder="Tell us what motivates you to join this event..."
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Relevant Skills *
                </label>
                <input
                  type="text"
                  value={registrationData.skills}
                  onChange={(e) => setRegistrationData(prev => ({ ...prev, skills: e.target.value }))}
                  className={`w-full p-3 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-800'
                  } focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                  style={{ '--tw-ring-color': primaryAccentColor } as React.CSSProperties}
                  placeholder="e.g., React, Python, UI/UX, Project Management"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Previous Projects/Experience
                </label>
                <textarea
                  value={registrationData.previousProjects}
                  onChange={(e) => setRegistrationData(prev => ({ ...prev, previousProjects: e.target.value }))}
                  className={`w-full p-3 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-800'
                  } focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                  style={{ '--tw-ring-color': primaryAccentColor } as React.CSSProperties}
                  rows={3}
                  placeholder="Describe any relevant projects or experience..."
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  What do you expect to gain? *
                </label>
                <textarea
                  value={registrationData.expectations}
                  onChange={(e) => setRegistrationData(prev => ({ ...prev, expectations: e.target.value }))}
                  className={`w-full p-3 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-800'
                  } focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                  style={{ '--tw-ring-color': primaryAccentColor } as React.CSSProperties}
                  rows={3}
                  placeholder="What skills, connections, or achievements do you hope to gain?"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Team Preference *
                </label>
                <div className="space-y-3">
                  {[
                    { value: 'individual', label: 'I want to participate individually' },
                    { value: 'with_team', label: 'I have my own team' },
                    { value: 'find_team', label: 'Help me find a team' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="teamPreference"
                        value={option.value}
                        checked={registrationData.teamPreference === option.value}
                        onChange={(e) => setRegistrationData(prev => ({ ...prev, teamPreference: e.target.value }))}
                        className="w-4 h-4"
                        style={{ accentColor: primaryAccentColor }}
                      />
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRegistrationModal(false)}
                  className={`px-6 py-2 rounded-lg border ${
                    isDarkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg text-white transition-all hover:scale-105 disabled:opacity-50"
                  style={{ backgroundColor: primaryAccentColor }}
                  disabled={loading}
                >
                  {loading ? 'Registering...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Team Management Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Team Management
              </h2>
              <button
                onClick={() => setShowTeamModal(false)}
                className={`p-2 rounded-lg hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-700' : ''}`}
              >
                <FaTimes className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
              </button>
            </div>

            {/* Registration Status */}
            <div className={`p-4 rounded-lg mb-6 ${
              userRegistration?.status === 'approved' 
                ? 'bg-green-100 border border-green-200' 
                : userRegistration?.status === 'rejected'
                ? 'bg-red-100 border border-red-200'
                : 'bg-yellow-100 border border-yellow-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  userRegistration?.status === 'approved' 
                    ? 'bg-green-500' 
                    : userRegistration?.status === 'rejected'
                    ? 'bg-red-500'
                    : 'bg-yellow-500'
                }`} />
                <span className={`font-medium ${
                  userRegistration?.status === 'approved' 
                    ? 'text-green-800' 
                    : userRegistration?.status === 'rejected'
                    ? 'text-red-800'
                    : 'text-yellow-800'
                }`}>
                  Registration Status: {userRegistration?.status?.toUpperCase()}
                </span>
              </div>
              <p className={`text-sm mt-1 ${
                userRegistration?.status === 'approved' 
                  ? 'text-green-700' 
                  : userRegistration?.status === 'rejected'
                  ? 'text-red-700'
                  : 'text-yellow-700'
              }`}>
                {userRegistration?.status === 'approved' 
                  ? 'You are approved to participate in this event!'
                  : userRegistration?.status === 'rejected'
                  ? 'Your registration was not approved for this event.'
                  : 'Your registration is under review. You\'ll be notified once it\'s processed.'
                }
              </p>
            </div>

            {/* Team Section */}
            {userRegistration?.status !== 'rejected' && (
              <div className="space-y-6">
                {userTeam ? (
                  /* Existing Team */
                  <div>
                    <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      Your Team: {userTeam.name}
                    </h3>
                    
                                         {/* Team Members */}
                     <div className="space-y-3 mb-4">
                       {userTeam.members.map((member) => (
                         <div key={member.userId._id} className={`flex items-center justify-between p-3 rounded-lg ${
                           isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                         }`}>
                           <div className="flex items-center gap-3">
                             <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                               isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                             }`}>
                               {member.userId.avatar ? (
                                 <Image src={member.userId.avatar} alt={`${member.userId.fullname.firstname} ${member.userId.fullname.lastname}`} width={40} height={40} className="rounded-full" />
                               ) : (
                                 <span className={`font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                   {member.userId.fullname.firstname.charAt(0)}
                                 </span>
                               )}
                             </div>
                             <div>
                               <div className="flex items-center gap-2">
                                 <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                   {member.userId.fullname.firstname} {member.userId.fullname.lastname}
                                 </p>
                                 {member.userId._id === userTeam.leaderId._id && (
                                   <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                     isDarkMode 
                                       ? 'bg-blue-900/30 text-blue-300' 
                                       : 'bg-blue-100 text-blue-800'
                                   }`}>
                                     Team Leader
                                   </span>
                                 )}
                               </div>
                               <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                 {member.userId.email}
                               </p>
                             </div>
                           </div>
                           <span className={`px-2 py-1 rounded-full text-xs ${
                             member.status === 'accepted' 
                               ? 'bg-green-100 text-green-800' 
                               : member.status === 'declined'
                               ? 'bg-red-100 text-red-800'
                               : 'bg-yellow-100 text-yellow-800'
                           }`}>
                             {member.status}
                           </span>
                         </div>
                       ))}
                     </div>

                                         {/* Invite Link - Only show to team leader */}
                     {user && userTeam.leaderId._id === user._id && (
                       <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                         <h4 className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                           Invite Team Members
                         </h4>
                         <div className="flex gap-2">
                           <input
                             type="text"
                             value={`${window.location.origin}/events/${params.eventId}/join-team/${userTeam.inviteCode}`}
                             readOnly
                             className={`flex-1 p-2 rounded-lg border ${
                               isDarkMode 
                                 ? 'bg-gray-600 border-gray-500 text-white' 
                                 : 'bg-white border-gray-300 text-gray-800'
                             }`}
                           />
                           <button
                             onClick={() => {
                               navigator.clipboard.writeText(`${window.location.origin}/events/${params.eventId}/join-team/${userTeam.inviteCode}`);
                               toast.success('Invite link copied!');
                             }}
                             className={`px-4 py-2 rounded-lg ${
                               isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
                             }`}
                           >
                             <FaCopy className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
                           </button>
                         </div>
                         <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                           Share this link with your team members ({userTeam.members.length}/{userTeam.maxMembers} members)
                         </p>
                       </div>
                     )}
                     
                     {/* Team info for non-leaders */}
                     {user && userTeam.leaderId._id !== user._id && (
                       <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                         <h4 className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                           Team Information
                         </h4>
                         <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                           You are a member of this team. Only the team leader can invite new members.
                         </p>
                         <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                           Team Members: {userTeam.members.length}/{userTeam.maxMembers}
                         </p>
                       </div>
                     )}
                  </div>
                ) : (
                                     /* Create Team */
                   <div>
                     <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                       Create Your Team
                     </h3>
                     <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                       As the team creator, you will become the team leader and can invite other members.
                     </p>
                     <div className="space-y-4">
                       <input
                         type="text"
                         placeholder="Enter team name"
                         value={teamName}
                         onChange={(e) => setTeamName(e.target.value)}
                         className={`w-full p-3 rounded-lg border ${
                           isDarkMode 
                             ? 'bg-gray-700 border-gray-600 text-white' 
                             : 'bg-white border-gray-300 text-gray-800'
                         } focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                         style={{ '--tw-ring-color': primaryAccentColor } as React.CSSProperties}
                       />
                       <button
                         onClick={handleCreateTeam}
                         disabled={loading}
                         className="w-full py-3 rounded-lg text-white transition-all hover:scale-105 disabled:opacity-50"
                         style={{ backgroundColor: primaryAccentColor }}
                       >
                         {loading ? 'Creating Team...' : 'Create Team & Become Leader'}
                       </button>
                     </div>
                   </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
