"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faGamepad,
  faUsers,
  faChalkboard,
  faComments,
  faVideo,
  faMicrophone,
  faDesktop,
  faTrophy,
  faCode,
  faLightbulb,
  faHandshake,
  faMapMarkerAlt,
  faKeyboard,
  faQuestionCircle,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import { useThemeStore } from "@/Zustand_Store/ThemeStore";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal = ({ isOpen, onClose }: HelpModalProps) => {
  const { isDarkMode, primaryAccentColor } = useThemeStore();
  const [activeTab, setActiveTab] = useState("controls");

  const tabs = [
    { id: "controls", label: "Controls", icon: faKeyboard },
    { id: "features", label: "Features", icon: faGamepad },
    { id: "interactions", label: "Interactions", icon: faHandshake },
    { id: "troubleshooting", label: "Troubleshooting", icon: faQuestionCircle },
  ];

  const controlInstructions = [
    {
      icon: faKeyboard,
      title: "Movement",
      description: "Use Arrow keys to move your character around the space",
      keys: ["↑", "↓", "←", "→"],
    },
    {
      icon: faUsers,
      title: "Interact",
      description: "Click on other users' avatars to interact when in proximity",
      keys: ["Click Avatar"],
    },
    {
      icon: faChalkboard,
      title: "Whiteboard",
      description: "Press 'SpaceBar' to open collaborative whiteboard",
      keys: ["SpaceBar"],
    },
    {
      icon: faComments,
      title: "Chat",
      description: "Click the chat icon to open the chat panel",
      keys: ["Chat Icon"],
    },
    {
      icon: faVideo,
      title: "Video Toggle",
      description: "Click the video icon to turn your camera on/off",
      keys: ["Video Button"],
    },
    {
      icon: faMicrophone,
      title: "Microphone Toggle",
      description: "Click the microphone icon to mute/unmute your audio",
      keys: ["Mic Button"],
    },
    {
      icon: faDesktop,
      title: "Screen Share",
      description: "Click the screen share icon to share your screen with others",
      keys: ["Screen Share Button"],
    },
  ];

  const features = [
    {
      icon: faUsers,
      title: "Proximity-Based Interactions",
      description: "Get closer to other users to interact with them. Click on their avatars to start conversations or collaborations.",
      color: "#3b82f6",
    },
    {
      icon: faCode,
      title: "Send Code Snippets",
      description: "Share code snippets in any programming language directly in the chat. Use the code block button or wrap your code with triple backticks (```) and specify the language for syntax highlighting.",
      color: "#6366f1",
    },
    {
      icon: faChalkboard,
      title: "Collaborative Whiteboard",
      description: "Real-time collaborative whiteboard where multiple users can draw, write, and share ideas simultaneously.",
      color: "#10b981",
    },
    {
      icon: faComments,
      title: "Real-time Chat",
      description: "Text chat with all users in the room. Supports emojis and real-time messaging.",
      color: "#f59e0b",
    },
    {
      icon: faVideo,
      title: "Video Conferencing",
      description: "High-quality video and audio communication with all participants in the room.",
      color: "#ef4444",
    },
    {
      icon: faTrophy,
      title: "Developer Leaderboard",
      description: "Compete with other developers on the leaderboard. Earn points through challenges and collaborations.",
      color: "#8b5cf6",
    },
    {
      icon: faCode,
      title: "Coding Challenges",
      description: "Challenge other developers to coding competitions. Solve DSA problems and earn points.",
      color: "#06b6d4",
    },
    {
      icon: faDesktop,
      title: "Screen Sharing",
      description: "Share your screen to demonstrate code, presentations, or collaborate on projects.",
      color: "#84cc16",
    },
    {
      icon: faLightbulb,
      title: "Smart Notifications",
      description: "Receive notifications for challenges, messages, and important events in real-time.",
      color: "#f97316",
    },
  ];

  const interactions = [
    {
      icon: faMapMarkerAlt,
      title: "Proximity Radius",
      description: "You can only interact with users who are within your proximity radius. Move closer to see interaction options.",
      color: "#3b82f6",
    },
    {
      icon: faHandshake,
      title: "Avatar Interactions",
      description: "Click on any user's avatar to view their profile, send messages, or start challenges.",
      color: "#10b981",
    },
    {
      icon: faCode,
      title: "Coding Challenges",
      description: "Challenge nearby developers to coding competitions. Accept or decline challenges from the notification panel.",
      color: "#f59e0b",
    },
    {
      icon: faChalkboard,
      title: "Whiteboard Collaboration",
      description: "Join the whiteboard to draw, write, and collaborate with others in real-time.",
      color: "#ef4444",
    },
    {
      icon: faComments,
      title: "Chat Conversations",
      description: "Use the chat to communicate with all users in the room. Messages are visible to everyone.",
      color: "#8b5cf6",
    },
    {
      icon: faTrophy,
      title: "Leaderboard Competition",
      description: "Check the leaderboard to see top developers and compete for the highest score.",
      color: "#06b6d4",
    },
  ];

  const troubleshooting = [
    {
      icon: faVideo,
      title: "Video Not Working",
      description: "Check your camera permissions and try refreshing the page. Make sure no other app is using your camera.",
      color: "#ef4444",
    },
    {
      icon: faMicrophone,
      title: "Audio Issues",
      description: "Check microphone permissions and browser settings. Try switching audio devices in the settings.",
      color: "#f59e0b",
    },
    {
      icon: faDesktop,
      title: "Screen Share Problems",
      description: "Ensure you're connected to a User & using a supported browser (Chrome, Firefox, Safari). Check screen sharing permissions.",
      color: "#3b82f6",
    },
    {
      icon: faChalkboard,
      title: "Whiteboard Not Loading",
      description: "Try refreshing the page or switching to a different browser. Check your internet connection.",
      color: "#10b981",
    },
    {
      icon: faComments,
      title: "Chat Not Working",
      description: "Check your internet connection and try refreshing the page. Messages may take a moment to load.",
      color: "#8b5cf6",
    },
    {
      icon: faGamepad,
      title: "Game Performance",
      description: "Close other browser tabs and applications to improve performance. Use a wired internet connection.",
      color: "#06b6d4",
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "controls":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Game Controls</h3>
            <div className="grid gap-4">
              {controlInstructions.map((control, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105"
                  style={{
                    backgroundColor: isDarkMode ? "#2a2a2a" : "#f8f9fa",
                    borderColor: isDarkMode ? "#333333" : "#e5e5e5",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: primaryAccentColor }}
                    >
                      <FontAwesomeIcon
                        icon={control.icon}
                        className="text-white text-lg"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{control.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {control.description}
                      </p>
                      <div className="flex gap-2">
                        {control.keys.map((key, keyIndex) => (
                          <span
                            key={keyIndex}
                            className="px-2 py-1 text-xs font-mono rounded bg-gray-200 dark:bg-gray-700"
                          >
                            {key}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "features":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Game Features</h3>
            <div className="grid gap-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105"
                  style={{
                    backgroundColor: isDarkMode ? "#2a2a2a" : "#f8f9fa",
                    borderColor: isDarkMode ? "#333333" : "#e5e5e5",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: feature.color }}
                    >
                      <FontAwesomeIcon
                        icon={feature.icon}
                        className="text-white text-lg"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{feature.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "interactions":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">User Interactions</h3>
            <div className="grid gap-4">
              {interactions.map((interaction, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105"
                  style={{
                    backgroundColor: isDarkMode ? "#2a2a2a" : "#f8f9fa",
                    borderColor: isDarkMode ? "#333333" : "#e5e5e5",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: interaction.color }}
                    >
                      <FontAwesomeIcon
                        icon={interaction.icon}
                        className="text-white text-lg"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{interaction.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {interaction.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "troubleshooting":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Troubleshooting</h3>
            <div className="grid gap-4">
              {troubleshooting.map((issue, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105"
                  style={{
                    backgroundColor: isDarkMode ? "#2a2a2a" : "#f8f9fa",
                    borderColor: isDarkMode ? "#333333" : "#e5e5e5",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: issue.color }}
                    >
                      <FontAwesomeIcon
                        icon={issue.icon}
                        className="text-white text-lg"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{issue.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {issue.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl border-2 transition-all duration-300 ${
          isDarkMode ? "border-gray-700" : "border-gray-200"
        }`}
        style={{
          backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
          color: isDarkMode ? "#ffffff" : "#1a1a1a",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon
              icon={faQuestionCircle}
              className="text-2xl"
              style={{ color: primaryAccentColor }}
            />
            <h2 className="text-2xl font-bold">Game Help & Instructions</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="text-lg" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 hover:scale-105 ${
                activeTab === tab.id
                  ? "border-b-2"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
              style={{
                borderColor: activeTab === tab.id ? primaryAccentColor : "transparent",
                color: activeTab === tab.id ? primaryAccentColor : isDarkMode ? "#ffffff" : "#1a1a1a",
              }}
            >
              <FontAwesomeIcon icon={tab.icon} className="mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <FontAwesomeIcon icon={faInfoCircle} />
              <span>Need more help? Use the report button to contact support.</span>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: primaryAccentColor,
                color: isDarkMode ? "#18181b" : "#ffffff",
              }}
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal; 