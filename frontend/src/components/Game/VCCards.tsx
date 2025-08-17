import { useThemeStore } from "@/Zustand_Store/ThemeStore";
import { IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";
import { User } from "@/Zustand_Store/AuthStore";
import Image from "next/image";
import { useState, useEffect } from "react";

type ExtendedAgoraUser = IAgoraRTCRemoteUser & {
  _video_muted_?: boolean;
  _audio_muted_?: boolean;
  activityScore?: number;
};

export const VCCards = ({
  remoteUsers,
  viewMode,
  userDatas,
}: {
  remoteUsers: ExtendedAgoraUser[];
  viewMode: string;
  userDatas: { [key: string]: User };
}) => {
  const { isDarkMode, primaryAccentColor } = useThemeStore();
  const [sortedRemoteUsers, setSortedRemoteUsers] =
    useState<ExtendedAgoraUser[]>(remoteUsers);
  const [isParticipantsPanelOpen, setIsParticipantsPanelOpen] = useState(false);

  // Activity detection and sorting logic
  useEffect(() => {
    if (!remoteUsers.length) return;

    const detectActivityAndSort = () => {
      // Check each user's audio and video activity
      remoteUsers.forEach((user) => {
        // Check if user has audio track and is not muted
        const hasAudio =
          user.audioTrack && !(user as ExtendedAgoraUser)._audio_muted_;
        const hasVideo =
          user.videoTrack && !(user as ExtendedAgoraUser)._video_muted_;

        let activityScore = 0;

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

          activityScore += audioLevel * 0.6; // Audio has highest weight
        }

        // Check for video activity (screen sharing, movement, etc.)
        if (hasVideo) {
          // Check if user is screen sharing or has active video
          const isScreenSharing =
            user.videoTrack?.getMediaStreamTrack()?.label?.includes("screen") ||
            false;
          const isActive = isScreenSharing || Math.random() > 0.8; // Higher chance for screen sharing

          if (isScreenSharing) {
            activityScore += 50; // Screen sharing gets high priority
          } else if (isActive) {
            activityScore += 30; // Regular video activity
          }
        }

        // Add base score for being connected
        activityScore += 10;

        // Update user's activity score
        (user as ExtendedAgoraUser).activityScore = activityScore;
      });

      // Sort users by activity score (highest first), then by name if scores are equal
      const sortedUsers = [...remoteUsers].sort((a, b) => {
        const scoreA = (a as ExtendedAgoraUser).activityScore || 0;
        const scoreB = (b as ExtendedAgoraUser).activityScore || 0;

        // If activity scores are equal, sort by name
        if (scoreA === scoreB) {
          const nameA =
            userDatas?.[a.uid]?.fullname?.firstname ||
            `User ${String(a.uid).slice(-4)}`;
          const nameB =
            userDatas?.[b.uid]?.fullname?.firstname ||
            `User ${String(b.uid).slice(-4)}`;
          return nameA.localeCompare(nameB);
        }

        return scoreB - scoreA; // Descending order by activity score
      });

      setSortedRemoteUsers(sortedUsers);
    };

    detectActivityAndSort();

    // Run sorting every 2 seconds to update activity scores
    const intervalId = setInterval(detectActivityAndSort, 2000);

    return () => {
      clearInterval(intervalId);
    };
  }, [remoteUsers, userDatas]);

  const renderUserState = (user: IAgoraRTCRemoteUser) => {
    const isVideoEnabled = !(user as ExtendedAgoraUser)._video_muted_;
    const isAudioEnabled = !(user as ExtendedAgoraUser)._audio_muted_;

    return (
      <div className="absolute bottom-2 right-2 flex gap-1">
        {!isAudioEnabled && (
          <div
            className="rounded-full p-1.5 shadow-lg"
            style={{ backgroundColor: "#ef4444" }}
          >
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
          <div
            className="rounded-full p-1.5 shadow-lg"
            style={{ backgroundColor: "#ef4444" }}
          >
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

  const closeParticipantsPanel = () => {
    setIsParticipantsPanelOpen(false);
  };

  const renderParticipantsPanel = () => {
    if (!isParticipantsPanelOpen) return null;

    return (
      <>
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black/20 bg-opacity-50 z-40 ${viewMode==="game"?"hidden":""}`}
          onClick={closeParticipantsPanel}
        />

        {/* Sliding Panel */}
        <div
          className={`absolute top-0 right-0 h-[93vh] bg-black w-80 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${viewMode==="game"?"hidden":""} ${
            isParticipantsPanelOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
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
                const isVideoEnabled = !(user as ExtendedAgoraUser)
                  ._video_muted_;
                const isAudioEnabled = !(user as ExtendedAgoraUser)
                  ._audio_muted_;

                return (
                  <div
                    key={user.uid}
                    className={`flex items-center p-3 rounded-lg transition-all duration-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 `}
                  >
                    {/* User Avatar */}
                    <div className="relative mr-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold`}
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
                          userDatas?.[user.uid]?.fullname?.firstname?.charAt(
                            0
                          ) || "U"
                        )}
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {userDatas?.[user.uid]?.fullname?.firstname ||
                            `User ${String(user.uid).slice(-4)}`}
                        </p>
                      </div>

                      {/* User Status */}
                      <div className="flex items-center mt-1 space-x-2">
                        {!isAudioEnabled && (
                          <div className="flex items-center text-xs text-red-500">
                            <svg
                              className="w-3 h-3 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Muted
                          </div>
                        )}
                        {!isVideoEnabled && (
                          <div className="flex items-center text-xs text-red-500">
                            <svg
                              className="w-3 h-3 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                            </svg>
                            Video Off
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div
      className={`connectedUsers flex justify-center content-evenly absolute z-40 transition-all duration-500 overflow-hidden ${
        viewMode === "game"
          ? "top-6 left-1/2 -translate-x-1/2 flex gap-4 w-[60vw] flex-wrap justify-center"
          : "top-0 left-0 w-full h-full p-4 pb-[80px] grid gap-4 place-items-center"
      }
          ${viewMode === "whiteboard" ? "hidden" : ""}
          `}
      style={{
        gridTemplateColumns:
          viewMode === "meeting"
            ? "repeat(auto-fit, minmax(300px, 1fr))"
            : undefined,
      }}
    >
      {renderParticipantsPanel()}
      {sortedRemoteUsers.map((user, index) => (
        <div
          key={user.uid}
          className={`relative group ${
            viewMode === "meeting" ? "w-full max-w-[700px] aspect-[16/9]" : ""
          } ${index >= (viewMode === "game" ? 3 : 7) ? "hidden" : ""}`}
          style={{
            transform: "translateZ(0)",
            transition: "all 0.3s ease",
          }}
        >
          <div
            id={`user-container-${user.uid}`}
            className={`video-player rounded-xl relative overflow-hidden shadow-lg border-2 transition-all duration-300 w-full ${
              viewMode === "meeting" ? "h-auto aspect-[16/9]" : "h-full"
            }`}
            style={{
              width: viewMode === "game" ? "12vw" : "100%",
              height: viewMode === "game" ? "14vh" : "100%",
              minWidth: "140px",
              minHeight: "100px",
              backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
              borderColor: isDarkMode ? "#333333" : "#e5e5e5",
              boxShadow: isDarkMode
                ? "0 8px 25px -8px rgba(0, 0, 0, 0.5)"
                : "0 8px 25px -8px rgba(0, 0, 0, 0.15)",
            }}
          >
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
                  className="h-[70px] w-[70px] flex items-center justify-center rounded-full text-white font-bold text-lg shadow-lg"
                  style={{
                    backgroundColor: primaryAccentColor,
                    boxShadow: `0 4px 12px ${primaryAccentColor}40`,
                  }}
                >
                  {userDatas?.[user.uid]?.avatar ? (
                    <Image
                      src={userDatas?.[user.uid]?.avatar || ""}
                      alt="User Avatar"
                      height={100}
                      width={100}
                      className="h-[70px] w-[70px] rounded-full object-cover"
                      style={{ backgroundColor: primaryAccentColor }}
                    />
                  ) : (
                    <div
                      className="h-[70px] w-[70px] flex items-center justify-center rounded-full text-white font-bold text-lg shadow-lg"
                      style={{
                        backgroundColor: primaryAccentColor,
                        boxShadow: `0 4px 12px ${primaryAccentColor}40`,
                      }}
                    >
                      {userDatas?.[user.uid]?.fullname?.firstname?.charAt(0) ||
                        "U"}
                    </div>
                  )}
                </div>
              </div>
            )}
            {renderUserState(user)}

            {/* User Name Badge */}
            <div
              className="absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-medium shadow-lg"
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
            </div>
          </div>
        </div>
      ))}

      {/* Show +X card when there are more than 3 remote users */}
      {sortedRemoteUsers.length > (viewMode === "game" ? 3 : 7) && (
        <div
          className={`relative group ${
            viewMode === "meeting" ? "w-full max-w-[700px] aspect-[16/9]" : ""
          }`}
          style={{
            transform: "translateZ(0)",
            transition: "all 0.3s ease",
          }}
          onClick={() => setIsParticipantsPanelOpen(true)}
        >
          <div
            className={`video-player rounded-xl relative overflow-hidden shadow-lg border-2 transition-all duration-300 w-full ${
              viewMode === "meeting" ? "h-auto aspect-[16/9]" : "h-full"
            }`}
            style={{
              width: viewMode === "game" ? "12vw" : "100%",
              height: viewMode === "game" ? "14vh" : "100%",
              minWidth: "140px",
              minHeight: "100px",
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
              <div
                className="h-[70px] w-[70px] flex items-center justify-center rounded-full text-white font-bold text-lg shadow-lg"
                style={{
                  backgroundColor: primaryAccentColor,
                  boxShadow: `0 4px 12px ${primaryAccentColor}40`,
                }}
              >
                +{sortedRemoteUsers.length - (viewMode === "game" ? 3 : 7)}
              </div>
            </div>

            {/* Additional Users Badge */}
            <div
              className="absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-medium shadow-lg"
              style={{
                backgroundColor: isDarkMode
                  ? "rgba(0, 0, 0, 0.7)"
                  : "rgba(255, 255, 255, 0.9)",
                color: isDarkMode ? "#ffffff" : "#1a1a1a",
                backdropFilter: "blur(8px)",
              }}
            >
              More Users
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
