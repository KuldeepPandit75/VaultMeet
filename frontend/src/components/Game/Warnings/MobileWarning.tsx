import React from 'react';
import { useThemeStore } from '@/Zustand_Store/ThemeStore';

const MobileWarning: React.FC = () => {
  const { primaryAccentColor, secondaryAccentColor, isDarkMode } = useThemeStore();

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-[10000000]"
      style={{
        background: isDarkMode
          ? 'rgba(20, 20, 20, 0.97)'
          : 'rgba(255, 255, 255, 0.97)',
        transition: 'background 0.3s',
      }}
    >
      <div
        className="rounded-xl p-6 max-w-md w-full text-center shadow-2xl"
        style={{
          background: isDarkMode ? '#232323' : '#fff',
          boxShadow: `0 8px 32px 0 ${secondaryAccentColor}40, 0 1.5px 6px 0 ${secondaryAccentColor}30`,
        }}
      >
        <div className="mb-4">
          <svg
            className="w-16 h-16 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke={primaryAccentColor}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h2
          className="text-2xl font-bold mb-4"
          style={{ color: primaryAccentColor }}
        >
          Desktop View Recommended
        </h2>
        <p
          className="mb-6"
          style={{ color: isDarkMode ? '#e0e0e0' : '#444' }}
        >
          For the best learning experience, please view this website on a desktop or laptop computer. Our interactive features and games are specially for desktops and laptops. We will soon launch it for mobile devices.
        </p>
        <button
          className="px-6 py-2 rounded-lg font-semibold shadow-md transition-colors"
          style={{
            background: primaryAccentColor,
            color: '#fff',
          }}
          onClick={() => window.location.href = "/"}
        >
          Go to Home Page
        </button>
      </div>
    </div>
  );
};

export default MobileWarning; 