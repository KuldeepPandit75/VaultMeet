import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMicrophone,
  faMicrophoneSlash,
  faVideo,
  faVideoSlash,
  faMessage,
  faDesktop,
  faUsers,
  faGamepad,
} from "@fortawesome/free-solid-svg-icons";
import useAuthStore from "@/Zustand_Store/AuthStore";
import { useThemeStore } from "@/Zustand_Store/ThemeStore";
import Image from "next/image";

interface ControlBarProps {
  mic: boolean;
  video: boolean;
  screenShare: boolean;
  handleMicToggle: () => void;
  handleVideoToggle: () => void;
  handleScreenShareToggle: () => void;
  setBox: (box: (prev: boolean) => boolean) => void;
  viewMode: "game" | "meeting";
  handleViewToggle: () => void;
  isMeetingViewAvailable: boolean;
}

export const ControlBar = ({
  mic,
  video,
  screenShare,
  handleMicToggle,
  handleVideoToggle,
  handleScreenShareToggle,
  setBox,
  viewMode,
  handleViewToggle,
  isMeetingViewAvailable,
}: ControlBarProps) => {
  const { user } = useAuthStore();
  const { primaryAccentColor, secondaryAccentColor, isDarkMode } =
    useThemeStore();

  return (
    <div
      className="absolute z-50 w-[100vw] h-[70px] bottom-0 right-0 flex justify-between items-center !px-10 backdrop-blur-md border-t"
      style={{
        backgroundColor: isDarkMode
          ? "rgba(17, 17, 17, 0.95)"
          : "rgba(255, 255, 255, 0.95)",
        borderColor: isDarkMode ? "#333333" : "#e5e5e5",
        boxShadow: isDarkMode
          ? "0 -10px 30px -10px rgba(0, 0, 0, 0.5)"
          : "0 -10px 30px -10px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div className="flex gap-6 items-center">
        {/* Local Video Preview */}
        <div className="relative">
          <video
            className="video-player h-14 w-24 rounded-xl object-cover shadow-lg"
            style={{
              display: video ? "block" : "none",
              border: `2px solid ${isDarkMode ? "#333333" : "#e5e5e5"}`,
            }}
            id="user-1"
            autoPlay
            muted
            playsInline
          ></video>
          {!video && (
            <div
              className="h-14 w-24 rounded-xl flex justify-center items-center shadow-lg"
              style={{
                backgroundColor: isDarkMode ? "#2a2a2a" : "#f5f5f5",
                border: `2px solid ${isDarkMode ? "#333333" : "#e5e5e5"}`,
              }}
            >
              {user?.avatar ? (
                <Image
                  src={user.avatar}
                  alt="User Avatar"
                  height={20}
                  width={20}
                  className="h-8 w-8 rounded-full object-cover"
                  style={{ backgroundColor: primaryAccentColor }}
                />
              ) : (
                <div
                  className="h-8 w-8 flex items-center justify-center rounded-full text-white font-semibold text-sm"
                  style={{ backgroundColor: primaryAccentColor }}
                >
                  {user?.fullname?.firstname.charAt(0)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex gap-4">
          {/* Microphone Button */}
          <button
            className="h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
            onClick={handleMicToggle}
            style={{
              backgroundColor: mic
                ? isDarkMode
                  ? "#2a2a2a"
                  : "#f5f5f5"
                : "#ef4444",
              color: mic ? (isDarkMode ? "#ffffff" : "#1a1a1a") : "#ffffff",
              border: `2px solid ${
                mic ? (isDarkMode ? "#333333" : "#e5e5e5") : "#ef4444"
              }`,
            }}
          >
            <FontAwesomeIcon
              icon={mic ? faMicrophone : faMicrophoneSlash}
              className="text-lg"
            />
          </button>

          {/* Video Button */}
          <button
            className="h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
            onClick={handleVideoToggle}
            style={{
              backgroundColor: video
                ? isDarkMode
                  ? "#2a2a2a"
                  : "#f5f5f5"
                : "#ef4444",
              color: video ? (isDarkMode ? "#ffffff" : "#1a1a1a") : "#ffffff",
              border: `2px solid ${
                video ? (isDarkMode ? "#333333" : "#e5e5e5") : "#ef4444"
              }`,
            }}
          >
            <FontAwesomeIcon
              icon={video ? faVideo : faVideoSlash}
              className="text-lg"
            />
          </button>

          {/* Screen Share Button */}
          <button
            className="h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
            onClick={handleScreenShareToggle}
            title={screenShare ? "Stop Screen Share" : "Start Screen Share"}
            style={{
              backgroundColor: screenShare
                ? secondaryAccentColor
                : isDarkMode
                ? "#2a2a2a"
                : "#f5f5f5",
              color: screenShare
                ? "#ffffff"
                : isDarkMode
                ? "#ffffff"
                : "#1a1a1a",
              border: `2px solid ${
                screenShare
                  ? secondaryAccentColor
                  : isDarkMode
                  ? "#333333"
                  : "#e5e5e5"
              }`,
              boxShadow: screenShare
                ? `0 4px 12px ${secondaryAccentColor}40`
                : "none",
            }}
          >
            <FontAwesomeIcon icon={faDesktop} className="text-lg" />
          </button>

          {/* Chat Button */}
          <button
            className="h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
            onClick={() => setBox((prev: boolean) => !prev)}
            style={{
              backgroundColor: isDarkMode ? "#2a2a2a" : "#f5f5f5",
              color: isDarkMode ? "#ffffff" : "#1a1a1a",
              border: `2px solid ${isDarkMode ? "#333333" : "#e5e5e5"}`,
            }}
          >
            <FontAwesomeIcon icon={faMessage} className="text-lg" />
          </button>
        </div>
      </div>

      <div
      className="flex gap-4"
      >
        {/* View Toggle Button */}
        {isMeetingViewAvailable && (
          <button
            className="h-12 rounded-xl px-4 flex items-center justify-center gap-6 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
            onClick={handleViewToggle}
            style={{
              backgroundColor: isDarkMode ? "#2a2a2a" : "#f5f5f5",
              color: isDarkMode ? "#ffffff" : "#1a1a1a",
              border: `2px solid ${isDarkMode ? "#333333" : "#e5e5e5"}`,
            }}
          >
            <FontAwesomeIcon
              icon={viewMode === "game" ? faUsers : faGamepad}
              className="text-lg"
            />
            <span className="font-medium">
              {viewMode === "game" ? "Meeting" : "Game"} View
            </span>
          </button>
        )}

        {/* Home Button */}
        <div
          className="h-12 w-12 flex justify-center items-center rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
          style={{
            backgroundColor: primaryAccentColor,
            boxShadow: `0 4px 12px ${primaryAccentColor}40`,
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            x="0px"
            y="0px"
            width="28"
            height="28"
            viewBox="0 0 64 64"
            fill="#fff"
          >
            <path d="M 32 8 C 31.08875 8 30.178047 8.3091875 29.435547 8.9296875 L 8.8007812 26.171875 C 8.0357812 26.810875 7.7634844 27.925203 8.2714844 28.783203 C 8.9184844 29.875203 10.35025 30.088547 11.28125 29.310547 L 12 28.710938 L 12 47 C 12 49.761 14.239 52 17 52 L 47 52 C 49.761 52 52 49.761 52 47 L 52 28.712891 L 52.71875 29.3125 C 53.09275 29.6255 53.546047 29.777344 53.998047 29.777344 C 54.693047 29.777344 55.382672 29.416656 55.763672 28.722656 C 56.228672 27.874656 55.954891 26.803594 55.212891 26.183594 L 52 23.498047 L 52 15 C 52 13.895 51.105 13 50 13 L 48 13 C 46.895 13 46 13.895 46 15 L 46 18.484375 L 34.564453 8.9296875 C 33.821953 8.3091875 32.91125 8 32 8 z M 32 12.152344 C 32.11475 12.152344 32.228766 12.191531 32.322266 12.269531 L 48 25.369141 L 48 46 C 48 47.105 47.105 48 46 48 L 38 48 L 38 34 C 38 32.895 37.105 32 36 32 L 28 32 C 26.895 32 26 32.895 26 34 L 26 48 L 18 48 C 16.895 48 16 47.105 16 46 L 16 25.367188 L 31.677734 12.269531 C 31.771234 12.191531 31.88525 12.152344 32 12.152344 z"></path>
          </svg>
        </div>
      </div>
    </div>
  );
};
