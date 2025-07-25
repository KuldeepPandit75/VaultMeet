'use client';

import { useThemeStore } from "@/Zustand_Store/ThemeStore";
import useEventStore from "@/Zustand_Store/EventStore";
import useAuthStore from "@/Zustand_Store/AuthStore";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Image from "next/image";

// Import types from EventStore
type Team = {
  _id: string;
  name: string;
  eventId: string;
  leaderId: {
    _id: string;
    fullname: { firstname: string; lastname: string };
    email: string;
    avatar?: string;
  };
  members: Array<{
    userId: {
      _id: string;
      fullname: { firstname: string; lastname: string };
      email: string;
      avatar?: string;
    };
    status: 'pending' | 'accepted' | 'declined';
    joinedAt: Date;
  }>;
  inviteCode: string;
  maxMembers: number;
  createdAt: Date;
};

type EventData = {
  _id: string;
  name: string;
  banner: string;
  company: {
    name: string;
    website: string;
    industry: string;
    logo: string;
  };
  startDate: Date;
  endDate: Date;
  status: string;
};

export default function JoinTeamPage() {
  const { primaryAccentColor, isDarkMode } = useThemeStore();
  const { 
    loading, 
    error,
    joinTeam,
    getRegistrationStatus,
    getTeamByInviteCode,
    userRegistration 
  } = useEventStore();
  const { isAuthenticated, loading: authLoading } = useAuthStore();
  const params = useParams();
  const router = useRouter();
  
  const [teamData, setTeamData] = useState<Team | null>(null);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    // Don't redirect while auth is still loading
    if (authLoading) {
      return;
    }

    // Load team data first (public endpoint)
    if (params.eventId && params.inviteCode) {
      loadEventAndTeamData();
    }
  }, [params.eventId, params.inviteCode, authLoading]);

  // Separate effect for handling authentication redirects
  useEffect(() => {
    // Only check authentication after auth loading is complete and we have team data
    if (!authLoading && !isAuthenticated && teamData) {
      // Don't redirect immediately, let user see the team invite page
      // They can still see the registration prompt
    }
  }, [authLoading, isAuthenticated, teamData]);

  const loadEventAndTeamData = async () => {
    try {
      // Get team and event data by invite code (public endpoint)
      const { team, event } = await getTeamByInviteCode(
        params.eventId as string, 
        params.inviteCode as string
      );
      
      setTeamData(team);
      setEventData(event as unknown as EventData);
      
      // Check user registration status if authenticated and auth loading is complete
      if (!authLoading && isAuthenticated) {
        await getRegistrationStatus(params.eventId as string);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Invalid invite link or team not found');
      router.push(`/events/${params.eventId}`);
    }
  };

  const handleJoinTeam = async () => {
    // Check authentication first
    if (!isAuthenticated) {
      toast.error('Please login to join a team');
      router.push('/login');
      return;
    }

    if (!userRegistration) {
      toast.error('You must be registered for this event to join a team');
      router.push(`/events/${params.eventId}`);
      return;
    }

    if (userRegistration.teamId) {
      toast.error('You are already part of a team');
      router.push(`/events/${params.eventId}`);
      return;
    }

    setIsJoining(true);
    try {
      await joinTeam(
        params.eventId as string, 
        teamData!._id, 
        teamData!.inviteCode
      );
      toast.success('Successfully joined the team!');
      router.push(`/events/${params.eventId}`);
    } catch (error) {
      console.error('Error joining team:', error);
      toast.error('Failed to join team. The invite may have expired or the team may be full.');
    } finally {
      setIsJoining(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !eventData || !teamData) {
    return (
      <div className={`min-h-screen flex items-center justify-center`}>
        <div className="text-center">
          <div className="text-red-500 text-xl mb-2">⚠️</div>
          <p className="text-red-500 mb-4">Invalid invite link or event not found</p>
          <button
            onClick={() => router.push('/events')}
            className="px-6 py-2 rounded-lg"
            style={{ backgroundColor: primaryAccentColor, color: 'white' }}
          >
            Browse Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        {/* Event Info */}
        <div className={`p-6 rounded-xl mb-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                     <div className="flex items-center gap-4 mb-4">
             <div className="relative w-16 h-16">
               <Image
                 src={eventData?.banner || '/banner.png'}
                 alt={eventData?.name || 'Event'}
                 fill
                 className="object-cover rounded-lg"
               />
             </div>
             <div>
               <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                 {eventData?.name}
               </h1>
               <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                 {eventData?.company?.name}
               </p>
             </div>
           </div>
        </div>

        {/* Team Invite */}
        <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <div className="text-center mb-6">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <svg className={`w-8 h-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
                         <h2 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
               Join Team: {teamData?.name}
             </h2>
             <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
               You&apos;ve been invited to join this team for the {eventData?.name} event.
             </p>
          </div>

                     {/* Registration Status Check */}
           {!isAuthenticated ? (
             <div className="text-center py-8">
               <div className="bg-blue-100 border border-blue-200 rounded-lg p-4 mb-4">
                 <p className="text-blue-800 font-medium">Login Required</p>
                 <p className="text-blue-700 text-sm mt-1">
                   Please login to join this team.
                 </p>
               </div>
               <button
                 onClick={() => router.push('/login')}
                 className="px-6 py-2 rounded-lg"
                 style={{ backgroundColor: primaryAccentColor, color: 'white' }}
               >
                 Login
               </button>
             </div>
                        ) : !userRegistration ? (
             <div className="text-center py-8">
               <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-4 mb-4">
                 <p className="text-yellow-800 font-medium">Registration Required</p>
                 <p className="text-yellow-700 text-sm mt-1">
                   You must register for this event before joining a team.
                 </p>
               </div>
               <div className="flex justify-center gap-3">
                 <button
                   onClick={() => router.push(`/events/${params.eventId}`)}
                   className="px-6 py-2 rounded-lg"
                   style={{ backgroundColor: primaryAccentColor, color: 'white' }}
                 >
                   Register for Event
                 </button>
                 <button
                   onClick={() => {
                     console.log('Manually checking registration status...');
                     getRegistrationStatus(params.eventId as string).catch(console.error);
                   }}
                   className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
                 >
                   Check Registration
                 </button>
               </div>
             </div>
          ) : userRegistration.teamId ? (
            <div className="text-center py-8">
              <div className="bg-red-100 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800 font-medium">Already in a Team</p>
                <p className="text-red-700 text-sm mt-1">
                  You are already part of a team for this event.
                </p>
              </div>
              <button
                onClick={() => router.push(`/events/${params.eventId}`)}
                className="px-6 py-2 rounded-lg"
                style={{ backgroundColor: primaryAccentColor, color: 'white' }}
              >
                Go to Event
              </button>
            </div>
          ) : (
            <div className="text-center">
              <div className="bg-green-100 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800 font-medium">Ready to Join</p>
                                 <p className="text-green-700 text-sm mt-1">
                   You can join this team since you&apos;re registered for the event.
                 </p>
              </div>
              
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => router.push(`/events/${params.eventId}`)}
                  className={`px-6 py-2 rounded-lg border ${
                    isDarkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoinTeam}
                  disabled={isJoining}
                  className="px-6 py-2 rounded-lg text-white transition-all hover:scale-105 disabled:opacity-50"
                  style={{ backgroundColor: primaryAccentColor }}
                >
                  {isJoining ? 'Joining...' : 'Join Team'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 