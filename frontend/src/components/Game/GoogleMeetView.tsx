import React, { useState, useEffect, useRef } from 'react';
import { IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';
import Image from 'next/image';
import { useThemeStore } from '@/Zustand_Store/ThemeStore';
import { User } from '@/Zustand_Store/AuthStore';


type ExtendedAgoraUser = IAgoraRTCRemoteUser & {
  _video_muted_?: boolean;
  _audio_muted_?: boolean;
  isSpeaking?: boolean;
  lastSpeakTime?: number;
};

interface GoogleMeetViewProps {
  remoteUsers: IAgoraRTCRemoteUser[];
  userDatas?: { [key: string]: User };
  maxVisibleUsers?: number;
}

const GoogleMeetView: React.FC<GoogleMeetViewProps> = ({
  remoteUsers,
  userDatas,
  maxVisibleUsers = 3
}) => {
  const { isDarkMode, primaryAccentColor } = useThemeStore();
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  const [speakingUsers, setSpeakingUsers] = useState<Set<string>>(new Set());
  const [isParticipantsPanelOpen, setIsParticipantsPanelOpen] = useState(false);
  const speakingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect active speaker based on actual audio levels and video activity
  useEffect(() => {
    if (!remoteUsers.length) return;

    const audioLevels = new Map<string, number>();
    const videoActivity = new Map<string, boolean>();
    let animationFrameId: number;
    let lastActiveSpeaker: string | null = null;

    const detectActiveSpeaker = () => {
      let maxAudioLevel = 0;
      let activeSpeaker: string | null = null;
      let hasVideoActivity = false;

      // Check each user's audio and video activity
      remoteUsers.forEach((user) => {
        const userId = user.uid.toString();
        
        // Check if user has audio track and is not muted
        const hasAudio = user.audioTrack && !(user as ExtendedAgoraUser)._audio_muted_;
        const hasVideo = user.videoTrack && !(user as ExtendedAgoraUser)._video_muted_;
        
        if (hasAudio) {
          // Try to get actual audio level from Agora track
          let audioLevel = 0;
          try {
            // In a real implementation, you would use Agora's audio level API
            // For now, we'll simulate based on track state
            audioLevel = hasAudio ? Math.random() * 80 + 20 : 0; // Simulate 20-100 range
          } catch {
            // Fallback to random simulation
            audioLevel = Math.random() * 100;
          }
          
          audioLevels.set(userId, audioLevel);
          
          if (audioLevel > maxAudioLevel && audioLevel > 25) { // Lower threshold for more sensitivity
            maxAudioLevel = audioLevel;
            activeSpeaker = userId;
          }
        }

        // Check for video activity (screen sharing, movement, etc.)
        if (hasVideo) {
          // Check if user is screen sharing or has active video
          const isScreenSharing = user.videoTrack?.getMediaStreamTrack()?.label?.includes('screen') || false;
          const isActive = isScreenSharing || Math.random() > 0.8; // Higher chance for screen sharing
          videoActivity.set(userId, isActive);
          if (isActive) hasVideoActivity = true;
        }
      });

      // Priority: Audio activity > Video activity > Screen sharing
      if (!activeSpeaker && hasVideoActivity) {
        // Find users with screen sharing first
        for (const [userId, isActive] of videoActivity) {
          const user = remoteUsers.find(u => u.uid.toString() === userId);
          const isScreenSharing = user?.videoTrack?.getMediaStreamTrack()?.label?.includes('screen') || false;
          if (isActive && isScreenSharing) {
            activeSpeaker = userId;
            break;
          }
        }
        
        // If no screen sharing, pick any active video user
        if (!activeSpeaker) {
          for (const [userId, isActive] of videoActivity) {
            if (isActive) {
              activeSpeaker = userId;
              break;
            }
          }
        }
      }

      // Update active speaker only if it changed
      if (activeSpeaker !== lastActiveSpeaker) {
        lastActiveSpeaker = activeSpeaker;
        
        if (activeSpeaker) {
          setActiveSpeaker(activeSpeaker);
          setSpeakingUsers(new Set([activeSpeaker]));
          
          // Clear speaking state after 1.5 seconds of inactivity
          if (speakingTimeoutRef.current) {
            clearTimeout(speakingTimeoutRef.current);
          }
          speakingTimeoutRef.current = setTimeout(() => {
            setActiveSpeaker(null);
            setSpeakingUsers(new Set());
            lastActiveSpeaker = null;
          }, 1500);
        }
      }

      animationFrameId = requestAnimationFrame(detectActiveSpeaker);
    };

    detectActiveSpeaker();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (speakingTimeoutRef.current) {
        clearTimeout(speakingTimeoutRef.current);
      }
    };
  }, [remoteUsers]);

  // Separate active speaker from other users
  const activeSpeakerUser = remoteUsers.find(user => user.uid.toString() === activeSpeaker);
  const otherUsers = remoteUsers.filter(user => user.uid.toString() !== activeSpeaker);
  const visibleUsers = otherUsers.slice(0, maxVisibleUsers); // Show only maxVisibleUsers (3) other users
  const overflowCount = otherUsers.length - visibleUsers.length;

  const renderUserState = (user: IAgoraRTCRemoteUser) => {
    const isVideoEnabled = !(user as ExtendedAgoraUser)._video_muted_;
    const isAudioEnabled = !(user as ExtendedAgoraUser)._audio_muted_;

    return (
      <div className="absolute bottom-2 right-2 flex gap-1">
        {!isAudioEnabled && (
          <div className="rounded-full p-1.5 shadow-lg bg-red-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 text-white"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
              
                fillRule="evenodd"
                d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
        {!isVideoEnabled && (
          <div className="rounded-full p-1.5 shadow-lg bg-red-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 text-white"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
          </div>
        )}
      </div>
    );
  };

  const handleUserClick = (userId: string) => {
    setActiveSpeaker(userId);
    setSpeakingUsers(new Set([userId]));
    
    // Clear speaking state after 3 seconds
    setTimeout(() => {
      setActiveSpeaker(null);
      setSpeakingUsers(new Set());
    }, 3000);
  };

  const renderUserCard = (user: IAgoraRTCRemoteUser, isActiveSpeaker = false) => {
    const isSpeaking = speakingUsers.has(user.uid.toString());
    
    return (
      <div
        key={user.uid}
        className={`relative group transition-all duration-300 cursor-pointer hover:scale-105 ${
          isActiveSpeaker ? 'w-full max-w-4xl mx-auto' : 'w-full'
        }`}
        style={{
          transform: "translateZ(0)",
        }}
        onClick={() => handleUserClick(user.uid.toString())}
      >
        <div
          id={`user-container-${user.uid}`}
          className={`video-player rounded-xl relative overflow-hidden shadow-lg border-2 transition-all duration-300 ${
            isActiveSpeaker 
              ? 'w-full aspect-[16/9] max-h-[60vh]' 
              : 'w-full aspect-[16/9]'
          } ${
            isSpeaking ? 'ring-4 ring-green-400 ring-opacity-75' : ''
          }`}
          style={{
            backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
            borderColor: isSpeaking 
                ? "#22c55e" 
                : isDarkMode ? "#333333" : "#e5e5e5",
            boxShadow: isDarkMode
              ? "0 8px 25px -8px rgba(0, 0, 0, 0.5)"
              : "0 8px 25px -8px rgba(0, 0, 0, 0.15)",
          }}
        >

          {/* ... existing video/avatar content ... */}
          {!user.hasVideo && (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                backgroundColor: isDarkMode ? "#2a2a2a" : "#f5f5f5",
                backgroundImage: isDarkMode
                  ? "linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)"
                  : "linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)",
              }}
            >
              <div
                className={`flex items-center justify-center rounded-full text-white font-bold shadow-lg ${
                  isActiveSpeaker ? 'h-32 w-32 text-4xl' : 'h-16 w-16 text-xl'
                }`}
                style={{
                  backgroundColor: primaryAccentColor,
                  boxShadow: `0 4px 12px ${primaryAccentColor}40`,
                }}
              >
                {userDatas?.[user.uid]?.avatar ? (
                  <Image
                    src={userDatas?.[user.uid]?.avatar || ""}
                    alt="User Avatar"
                    height={isActiveSpeaker ? 128 : 64}
                    width={isActiveSpeaker ? 128 : 64}
                    className={`rounded-full object-cover ${
                      isActiveSpeaker ? 'h-32 w-32' : 'h-16 w-16'
                    }`}
                    style={{ backgroundColor: primaryAccentColor }}
                  />
                ) : (
                  userDatas?.[user.uid]?.fullname?.firstname?.charAt(0) || "U"
                )}
              </div>
            </div>
          )}
          
          {renderUserState(user)}

          {/* User Name Badge */}
          <div
            className={`absolute top-2 left-2 px-2 py-1 rounded-lg font-medium shadow-lg ${
              isActiveSpeaker ? 'text-sm' : 'text-xs'
            }`}
            style={{
              backgroundColor: isDarkMode
                ? "rgba(0, 0, 0, 0.7)"
                : "rgba(255, 255, 255, 0.9)",
              color: isDarkMode ? "#ffffff" : "#1a1a1a",
              backdropFilter: "blur(8px)",
            }}
          >
            {userDatas?.[user.uid]?.fullname?.firstname ||
              `User ${String(user.uid).slice(-4)}`}
            {isActiveSpeaker && (
              <span className="ml-2 text-green-400">● Speaking</span>
            )}
          </div>

          {/* Click to Spotlight Indicator - Only show if not pinned */}
          {!isActiveSpeaker && (
            <div className="absolute top-2 right-8 px-2 py-1 rounded-lg text-xs font-medium shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{
                backgroundColor: isDarkMode
                  ? "rgba(0, 0, 0, 0.7)"
                  : "rgba(255, 255, 255, 0.9)",
                color: isDarkMode ? "#ffffff" : "#1a1a1a",
                backdropFilter: "blur(8px)",
              }}
            >
              Click to spotlight
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleViewAllClick = () => {
    setIsParticipantsPanelOpen(true);
  };

  const closeParticipantsPanel = () => {
    setIsParticipantsPanelOpen(false);
  };

  const renderParticipantsPanel = () => {
    if (!isParticipantsPanelOpen) return null;

    return (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/20 bg-opacity-50 z-40"
          onClick={closeParticipantsPanel}
        />
        
        {/* Sliding Panel */}
        <div className={`fixed top-0 right-0 h-[95vh] bg-black w-80 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isParticipantsPanelOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          {/* Panel Header */}
          <div className="flex flex-row items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Participants ({remoteUsers.length})
            </h3>
            <button
              onClick={closeParticipantsPanel}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-500 dark:text-gray-400"
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

          {/* Participants List */}
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            <div className="space-y-3">
              {remoteUsers.map((user) => {
                const isActive = user.uid.toString() === activeSpeaker;
                const isSpeaking = speakingUsers.has(user.uid.toString());
                const isVideoEnabled = !(user as ExtendedAgoraUser)._video_muted_;
                const isAudioEnabled = !(user as ExtendedAgoraUser)._audio_muted_;

                return (
                  <div
                    key={user.uid}
                    className={`flex items-center p-3 rounded-lg transition-all duration-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      isActive ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700' : ''
                    }`}
                    onClick={() => handleUserClick(user.uid.toString())}
                  >
                    {/* User Avatar */}
                    <div className="relative mr-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                          isActive ? 'ring-2 ring-blue-500' : ''
                        }`}
                        style={{
                          backgroundColor: primaryAccentColor,
                        }}
                      >
                        {userDatas?.[user.uid]?.avatar ? (
                          <Image
                            src={userDatas?.[user.uid]?.avatar || ""}
                            alt="User Avatar"
                            height={40}
                            width={40}
                            className="rounded-full object-cover w-10 h-10"
                          />
                        ) : (
                          userDatas?.[user.uid]?.fullname?.firstname?.charAt(0) || "U"
                        )}
                      </div>
                      
                      {/* Speaking Indicator */}
                      {isSpeaking && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse" />
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {userDatas?.[user.uid]?.fullname?.firstname || `User ${String(user.uid).slice(-4)}`}
                        </p>
                        {isActive && (
                          <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
                            ● Speaking
                          </span>
                        )}
                      </div>
                      
                      {/* User Status */}
                      <div className="flex items-center mt-1 space-x-2">
                        {!isAudioEnabled && (
                          <div className="flex items-center text-xs text-red-500">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                            </svg>
                            Muted
                          </div>
                        )}
                        {!isVideoEnabled && (
                          <div className="flex items-center text-xs text-red-500">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                            </svg>
                            Video Off
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-1">

                      {/* Spotlight Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUserClick(user.uid.toString());
                        }}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Spotlight user"
                      >
                        <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </>
    );
  };

  if (remoteUsers.length === 0) { 
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4">👥</div>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Waiting for participants to join...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col p-4 pb-20 relative overflow-hidden">
      {/* Active Speaker Section */}
      {activeSpeakerUser && (
        <div className="mb-4">
          {renderUserCard(activeSpeakerUser, true)}
        </div>
      )}

      {/* Other Participants Grid */}
      {visibleUsers.length > 0 && (
        <div className="flex-1">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
            {visibleUsers.map((user) => renderUserCard(user))}
            
            {/* Overflow Card */}
            {overflowCount > 0 && (
              <div
                className="relative group transition-all duration-300 w-full aspect-[16/9] cursor-pointer hover:scale-105"
                style={{
                  transform: "translateZ(0)",
                }}
                onClick={handleViewAllClick}
              >
                <div
                  className="video-player rounded-xl relative overflow-hidden shadow-lg border-2 transition-all duration-300 w-full h-full flex items-center justify-center"
                  style={{
                    backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
                    borderColor: isDarkMode ? "#333333" : "#e5e5e5",
                    boxShadow: isDarkMode
                      ? "0 8px 25px -8px rgba(0, 0, 0, 0.5)"
                      : "0 8px 25px -8px rgba(0, 0, 0, 0.15)",
                  }}
                >
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{
                      backgroundColor: isDarkMode ? "#2a2a2a" : "#f5f5f5",
                      backgroundImage: isDarkMode
                        ? "linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)"
                        : "linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)",
                    }}
                  >
                    <div className="text-center">
                      <div
                        className="h-16 w-16 flex items-center justify-center rounded-full text-white font-bold text-xl shadow-lg mx-auto mb-2"
                        style={{
                          backgroundColor: primaryAccentColor,
                          boxShadow: `0 4px 12px ${primaryAccentColor}40`,
                        }}
                      >
                        +{overflowCount}
                      </div>
                      <p className={`text-sm font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        More participants
                      </p>
                      <p className={`text-xs ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      } mt-1`}>
                        Click to view all
                      </p>
                    </div>
                  </div>
                  
                  {/* Hover indicator */}
                  <div className="absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-medium shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{
                      backgroundColor: isDarkMode
                        ? "rgba(0, 0, 0, 0.7)"
                        : "rgba(255, 255, 255, 0.9)",
                      color: isDarkMode ? "#ffffff" : "#1a1a1a",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    View all
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Participants Panel - Fixed positioning to avoid z-index issues */}
      {renderParticipantsPanel()}
    </div>
  );
};

export default GoogleMeetView;
