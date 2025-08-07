"use client";

import React, { useState, useEffect } from 'react';
import { useThemeStore } from "@/Zustand_Store/ThemeStore";
import { toast } from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {  faCopy, faShare, faUsers } from "@fortawesome/free-solid-svg-icons";

interface RoomInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomName?: string;
}

const RoomInviteModal: React.FC<RoomInviteModalProps> = ({ 
  isOpen, 
  onClose, 
  roomId, 
  roomName = "Coding Room" 
}) => {
  const { isDarkMode, primaryAccentColor } = useThemeStore();
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  // Generate invite link when modal opens
  useEffect(() => {
    if (isOpen && roomId) {
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/room/${roomId}`;
      setInviteLink(link);
    }
  }, [isOpen, roomId]);

  // Copy invite link to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success("Invite link copied to clipboard!");
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
      toast.error("Failed to copy link");
    }
  };

  // Share via native share API if available
  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${roomName}`,
          text: `Join me in ${roomName}!`,
          url: inviteLink,
        });
        toast.success("Link shared successfully!");
      } catch (error) {
        console.error("Error sharing:", error);
        // Fallback to copy if share fails
        copyToClipboard();
      }
    } else {
      // Fallback to copy if share API not available
      copyToClipboard();
    }
  };

  // Generate QR code for the invite link
  const generateQRCode = () => {
    // This would integrate with a QR code library
    // For now, we'll just show the link
    toast("QR code feature coming soon!");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
      <div
        className="relative w-full max-w-md mx-4 rounded-xl shadow-2xl border overflow-hidden"
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
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: primaryAccentColor }}
            >
              <FontAwesomeIcon 
                icon={faUsers} 
                className="text-white text-lg" 
              />
            </div>
            <div>
              <h2
                className="text-xl font-bold"
                style={{ color: isDarkMode ? "#ffffff" : "#1a1a1a" }}
              >
                Invite to Room
              </h2>
              <p className="text-sm opacity-70" style={{ color: isDarkMode ? "#cccccc" : "#666666" }}>
                {roomName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-2xl font-bold hover:opacity-70 transition-opacity"
            style={{ color: isDarkMode ? "#aaa" : "#666" }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Room Info */}
          <div className="mb-6 p-4 rounded-lg border"
               style={{
                 backgroundColor: isDarkMode ? "#2a2a2a" : "#f8f9fa",
                 borderColor: isDarkMode ? "#444444" : "#e5e5e5",
               }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium" style={{ color: isDarkMode ? "#ffffff" : "#1a1a1a" }}>
                Room ID
              </span>
              <span className="text-sm font-mono px-2 py-1 rounded bg-gray-100 dark:bg-gray-700"
                    style={{ color: primaryAccentColor }}>
                {roomId}
              </span>
            </div>
            <p className="text-xs opacity-70" style={{ color: isDarkMode ? "#cccccc" : "#666666" }}>
              Share this link with others to invite them to your room
            </p>
          </div>

          {/* Invite Link */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" style={{ color: isDarkMode ? "#ffffff" : "#1a1a1a" }}>
              Invite Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 px-3 py-2 rounded-lg border text-sm font-mono"
                style={{
                  backgroundColor: isDarkMode ? "#2a2a2a" : "#f8f9fa",
                  borderColor: isDarkMode ? "#444444" : "#e5e5e5",
                  color: isDarkMode ? "#ffffff" : "#1a1a1a",
                }}
              />
              <button
                onClick={copyToClipboard}
                className={`px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                  copied ? 'bg-green-500' : ''
                }`}
                style={{
                  backgroundColor: copied ? '#22c55e' : primaryAccentColor,
                  color: "#ffffff",
                }}
              >
                <FontAwesomeIcon icon={faCopy} className="text-sm" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={shareLink}
              className="w-full px-4 py-3 rounded-lg transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
              style={{
                backgroundColor: primaryAccentColor,
                color: "#ffffff",
              }}
            >
              <FontAwesomeIcon icon={faShare} className="text-sm" />
              Share Link
            </button>
            
            <button
              onClick={generateQRCode}
              className="w-full px-4 py-3 rounded-lg transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2 border"
              style={{
                backgroundColor: isDarkMode ? "#2a2a2a" : "#f8f9fa",
                borderColor: isDarkMode ? "#444444" : "#e5e5e5",
                color: isDarkMode ? "#ffffff" : "#1a1a1a",
              }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
              </svg>
              Generate QR Code
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 rounded-lg border"
               style={{
                 backgroundColor: isDarkMode ? "#2a2a2a" : "#f8f9fa",
                 borderColor: isDarkMode ? "#444444" : "#e5e5e5",
               }}>
            <h4 className="text-sm font-medium mb-2" style={{ color: isDarkMode ? "#ffffff" : "#1a1a1a" }}>
              How to invite others:
            </h4>
            <ul className="text-xs space-y-1" style={{ color: isDarkMode ? "#cccccc" : "#666666" }}>
              <li>• Copy the invite link above</li>
              <li>• Share it via message, email, or social media</li>
              <li>• Others can join by clicking the link</li>
              <li>• Room admin will need to approve join requests</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomInviteModal;