"use client";

import React, { useState, useEffect } from 'react';
import { useThemeStore } from "@/Zustand_Store/ThemeStore";
import Image from "next/image";
import axios from 'axios';

interface LeaderboardUser {
  rank: number;
  userId: string;
  fullname: {
    firstname: string;
    lastname: string;
  };
  username: string;
  avatar: string;
  points: number;
  createdAt: string;
}

interface LeaderboardData {
  leaderboard: LeaderboardUser[];
  currentUserRank: number | null;
  totalUsers: number;
}

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose }) => {
  const { isDarkMode, primaryAccentColor } = useThemeStore();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = JSON.parse(localStorage.getItem('hackmeet-auth') || '{}').state?.token;
      const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001'}/user/leaderboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setLeaderboardData(response.data);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen]);

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return '#FFD700'; // Gold
      case 2:
        return '#C0C0C0'; // Silver
      case 3:
        return '#CD7F32'; // Bronze
      default:
        return isDarkMode ? '#ffffff' : '#000000';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
      <div
        className="relative w-[90vw] max-w-4xl flex flex-col h-[80vh] rounded-lg shadow-xl border overflow-hidden"
        style={{
          backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
          borderColor: isDarkMode ? "#333333" : "#e5e5e5",
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{
            borderColor: isDarkMode ? "#333333" : "#e5e5e5",
          }}
        >
          <h2
            className="text-xl font-bold"
            style={{ color: isDarkMode ? "#ffffff" : "#1a1a1a" }}
          >
            Leaderboard
          </h2>
          <button
            onClick={onClose}
            className="text-2xl font-bold hover:opacity-70 transition-opacity"
            style={{ color: isDarkMode ? "#aaa" : "#666" }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" 
                     style={{ borderColor: primaryAccentColor }}></div>
                <p style={{ color: isDarkMode ? "#ffffff" : "#1a1a1a" }}>
                  Loading leaderboard...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                  onClick={fetchLeaderboard}
                  className="px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                  style={{
                    backgroundColor: primaryAccentColor,
                    color: "#ffffff",
                  }}
                >
                  Retry
                </button>
              </div>
            </div>
          ) : leaderboardData ? (
            <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
              {/* Current User Rank Section */}
              {leaderboardData.currentUserRank && (
                <div className="mb-6 p-4 rounded-lg border-2"
                     style={{
                       backgroundColor: isDarkMode ? "#2a2a2a" : "#f8f9fa",
                       borderColor: primaryAccentColor,
                     }}>
                  <h3 className="text-lg font-semibold mb-2" 
                      style={{ color: primaryAccentColor }}>
                    Your Rank
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="text-3xl font-bold" 
                         style={{ color: getRankColor(leaderboardData.currentUserRank) }}>
                      {getRankIcon(leaderboardData.currentUserRank)}
                    </div>
                    <div>
                      <p className="font-semibold" 
                         style={{ color: isDarkMode ? "#ffffff" : "#1a1a1a" }}>
                        Rank #{leaderboardData.currentUserRank} of {leaderboardData.totalUsers}
                      </p>
                      <p className="text-sm opacity-70" 
                         style={{ color: isDarkMode ? "#cccccc" : "#666666" }}>
                        Keep earning points to climb the leaderboard!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Leaderboard List */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold mb-4" 
                    style={{ color: isDarkMode ? "#ffffff" : "#1a1a1a" }}>
                  Top Players
                </h3>
                {leaderboardData.leaderboard.map((user) => (
                  <div
                    key={user.userId}
                    className="flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 hover:scale-[1.02]"
                    style={{
                      backgroundColor: isDarkMode ? "#2a2a2a" : "#ffffff",
                      borderColor: isDarkMode ? "#444444" : "#e5e5e5",
                    }}
                  >
                    {/* Rank */}
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full font-bold text-lg"
                         style={{
                           backgroundColor: isDarkMode ? "#333333" : "#f5f5f5",
                           color: getRankColor(user.rank),
                         }}>
                      {getRankIcon(user.rank)}
                    </div>

                    {/* Avatar */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                      {user.avatar ? (
                        <Image
                          src={user.avatar}
                          alt={`${user.fullname.firstname} ${user.fullname?.lastname}`}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg font-bold"
                             style={{ color: isDarkMode ? "#ffffff" : "#666666" }}>
                          {user.fullname?.firstname.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <a className="font-semibold truncate cursor-pointer hover:underline"
                           style={{ color: isDarkMode ? "#ffffff" : "#1a1a1a" }}
                           href={`/profile/${user.username}`}
                           target="_blank"
                           >
                          {user.fullname.firstname} {user.fullname?.lastname}
                        </a>
                        <span className="text-sm opacity-70"
                              style={{ color: isDarkMode ? "#cccccc" : "#666666" }}>
                          @{user.username}
                        </span>
                      </div>
                      <p className="text-sm opacity-70"
                         style={{ color: isDarkMode ? "#cccccc" : "#666666" }}>
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Points */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-2xl font-bold"
                         style={{ color: primaryAccentColor }}>
                        {user.points.toLocaleString()}
                      </p>
                      <p className="text-sm opacity-70"
                         style={{ color: isDarkMode ? "#cccccc" : "#666666" }}>
                        points
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-6 text-center">
                <p className="text-sm opacity-70"
                   style={{ color: isDarkMode ? "#cccccc" : "#666666" }}>
                  Showing top {leaderboardData.totalUsers} players with points
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardModal; 