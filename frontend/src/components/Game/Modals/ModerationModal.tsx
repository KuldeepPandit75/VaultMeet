import React, { useState } from 'react';
import { useThemeStore } from "@/Zustand_Store/ThemeStore";
import { IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";
import { User } from "@/Zustand_Store/AuthStore";
import { useSocketStore, Room } from "@/Zustand_Store/SocketStore";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { Socket } from "socket.io-client";

type ExtendedAgoraUser = IAgoraRTCRemoteUser & {
  _video_muted_?: boolean;
  _audio_muted_?: boolean;
  activityScore?: number;
};

interface ModerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  remoteUsers: ExtendedAgoraUser[];
  userDatas: { [key: string]: User };
  roomId: string;
  socket: Socket | null;
  room?: Room;
}

const ModerationModal: React.FC<ModerationModalProps> = ({
  isOpen,
  onClose,
  remoteUsers,
  userDatas,
  roomId,
  socket
}) => {
  const { isDarkMode, primaryAccentColor } = useThemeStore();
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [actionType, setActionType] = useState<'mute-audio' | 'mute-video' | 'unmute-audio' | 'unmute-video' | 'ban' | 'remove-participant' | 'make-admin'>('mute-audio');

  if (!isOpen) return null;

  const handleSelectAll = () => {
    if (selectedUsers.length === remoteUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(remoteUsers.map(user => user.uid.toString()));
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleModerationAction = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one participant");
      return;
    }

    if (!socket) {
      toast.error("Socket connection not available");
      return;
    }

    try {
      if (actionType === 'ban') {
        // Handle ban action through API
        const banStore = useSocketStore.getState();
        
        // Ban each selected user
        for (const userId of selectedUsers) {
          const result = await banStore.banParticipant({
            roomId,
            participantId: userId
          });
          
          if (!result.success) {
            toast.error(`Failed to ban user: ${result.message}`);
            return;
          }
        }
        
        // Emit socket event to notify other clients
        socket.emit("moderationAction", {
          roomId,
          actionType,
          targetUserIds: selectedUsers,
          action: actionType
        });
        
        toast.success(`Banned ${selectedUsers.length} participant(s)`);
      } else if (actionType === 'remove-participant') {
        // Handle remove participant action through API
        const socketStore = useSocketStore.getState();
        
        // Set each selected user as pending
        for (const userId of selectedUsers) {
          const result = await socketStore.setParticipantPending({
            roomId,
            participantId: userId
          });
          
          if (!result.success) {
            toast.error(`Failed to remove user: ${result.message}`);
            return;
          }
        }
        
        // Emit socket event to notify other clients
        socket.emit("moderationAction", {
          roomId,
          actionType,
          targetUserIds: selectedUsers,
          action: actionType
        });
        
        toast.success(`Removed ${selectedUsers.length} participant(s)`);
      } else if (actionType === 'make-admin') {
        // Handle make admin action through API
        const socketStore = useSocketStore.getState();
        
        // Make each selected user an admin
        for (const userId of selectedUsers) {
          const result = await socketStore.makeAdmin({
            roomId,
            participantId: userId
          });
          
          if (!result.success) {
            toast.error(`Failed to make user admin: ${result.message}`);
            return;
          }
        }
        
        // Emit socket event to notify other clients
        socket.emit("moderationAction", {
          roomId,
          actionType,
          targetUserIds: selectedUsers,
          action: actionType
        });
        
        toast.success(`Made ${selectedUsers.length} participant(s) admin`);
      } else {
        // Handle audio/video moderation through socket
        socket.emit("moderationAction", {
          roomId,
          actionType,
          targetUserIds: selectedUsers,
          action: actionType
        });

        // Show success message
        const actionText = actionType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
        toast.success(`${actionText} applied to ${selectedUsers.length} participant(s)`);
      }

      // Reset selection
      setSelectedUsers([]);
    } catch (error) {
      console.error("Error applying moderation action:", error);
      toast.error("Failed to apply moderation action");
    }
  };

  const getActionButtonText = () => {
    switch (actionType) {
      case 'mute-audio': return 'Mute Audio';
      case 'mute-video': return 'Mute Video';
      case 'ban': return 'Ban Participants';
      case 'remove-participant': return 'Remove Participants';
      case 'make-admin': return 'Make Admin';
      default: return 'Apply Action';
    }
  };

  const getActionButtonColor = () => {
    switch (actionType) {
      case 'ban': return '#ef4444'; // Red for ban
      case 'remove-participant': return '#eab308'; // Yellow for remove
      case 'make-admin': return '#8b5cf6'; // Purple for make admin
      case 'mute-audio':
      case 'mute-video': return '#f59e0b'; // Orange for mute
      default: return primaryAccentColor;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[80vh] z-50 rounded-lg shadow-xl overflow-hidden`}
        style={{
          backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
          color: isDarkMode ? "#ffffff" : "#1a1a1a",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold">Room Moderation</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg
              className="w-5 h-5"
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

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Action Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3">Select Action:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setActionType('mute-audio')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  actionType === 'mute-audio' 
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                  <span>Mute Audio</span>
                </div>
              </button>

              <button
                onClick={() => setActionType('mute-video')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  actionType === 'mute-video' 
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                  </svg>
                  <span>Mute Video</span>
                </div>
              </button>
            </div>

            {/* Ban Action */}
            <button
              onClick={() => setActionType('ban')}
              className={`w-full mt-3 p-3 rounded-lg border-2 transition-all ${
                actionType === 'ban' 
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-red-300'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                </svg>
                <span>Ban Participants</span>
              </div>
            </button>

            {/* Remove Participant Action */}
            <button
              onClick={() => setActionType('remove-participant')}
              className={`w-full mt-3 p-3 rounded-lg border-2 transition-all ${
                actionType === 'remove-participant' 
                  ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-yellow-300'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" clipRule="evenodd" />
                </svg>
                <span>Remove Participants</span>
              </div>
            </button>

            {/* Make Admin Action */}
            <button
              onClick={() => setActionType('make-admin')}
              className={`w-full mt-3 p-3 rounded-lg border-2 transition-all ${
                actionType === 'make-admin' 
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                </svg>
                <span>Make Admin</span>
              </div>
            </button>
          </div>

          {/* Participants List */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium">
                Select Participants ({selectedUsers.length}/{remoteUsers.length}):
              </label>
              <button
                onClick={handleSelectAll}
                className="text-sm px-3 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {selectedUsers.length === remoteUsers.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {remoteUsers.map((user) => {
                const isSelected = selectedUsers.includes(user.uid.toString());
                const isVideoEnabled = !user._video_muted_;
                const isAudioEnabled = !user._audio_muted_;
                const userName = userDatas?.[user.uid]?.fullname?.firstname || `User ${String(user.uid).slice(-4)}`;

                return (
                  <div
                    key={user.uid}
                    onClick={() => handleUserSelect(user.uid.toString())}
                    className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {/* Checkbox */}
                    <div className="mr-3">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-500' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>

                    {/* User Avatar */}
                    <div className="mr-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                        style={{ backgroundColor: primaryAccentColor }}
                      >
                        {userDatas?.[user.uid]?.avatar ? (
                          <Image
                            src={userDatas?.[user.uid]?.avatar || ""}
                            alt="User Avatar"
                            height={32}
                            width={32}
                            className="rounded-full object-cover w-8 h-8"
                          />
                        ) : (
                          userName.charAt(0)
                        )}
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{userName}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        {!isAudioEnabled && (
                          <span className="text-xs text-red-500 flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                            </svg>
                            Audio Muted
                          </span>
                        )}
                        {!isVideoEnabled && (
                          <span className="text-xs text-red-500 flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                            </svg>
                            Video Muted
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleModerationAction}
            disabled={selectedUsers.length === 0}
            className="px-6 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: getActionButtonColor() }}
          >
            {getActionButtonText()}
          </button>
        </div>
      </div>
    </>
  );
};

export default ModerationModal;
