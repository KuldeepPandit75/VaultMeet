"use client";

import Link from "next/link";
import { useThemeStore } from "../../Zustand_Store/ThemeStore";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import useAuthStore from "@/Zustand_Store/AuthStore";
import toast from "react-hot-toast";
import Image from "next/image";

// Types
interface NavLink {
  href: string;
  label: string;
}

interface NavButton {
  href: string;
  label: string;
  isPrimary?: boolean;
}

interface Notification {
  _id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  senderId?: {
    _id: string;
    fullname: { firstname: string; lastname: string };
    avatar?: string;
    username?: string;
  };
}

// Constants
const NAV_LINKS: NavLink[] = [
  { href: "/news", label: "News" },
  { href: "/events", label: "Events" },
  { href: "/host", label: "Host" },
  { href: "/about", label: "About" },
];

const NAV_BUTTONS: NavButton[] = [
  { href: "/login", label: "Login", isPrimary: false },
  { href: "/register", label: "Sign Up", isPrimary: true },
];

// Components
const NotificationItem = ({ 
  notification
}: { 
  notification: Notification; 
}) => {
  const { markNotificationAsRead, respondToConnectionRequest, getNotifications } = useAuthStore();

  const handleAction = async (action: 'accept' | 'decline') => {
    try {
      if (notification.type === 'connection_request' && notification.senderId) {
        await respondToConnectionRequest(notification.senderId._id, action);
        await handleMarkAsRead();
        await getNotifications(); // Refresh notifications
        toast.success(`Connection request ${action}ed`);
      }
    } catch (error) {
      console.log(error);
      toast.error(`Failed to ${action} connection request`);
    }
  };

  const handleMarkAsRead = async () => {
    if (!notification.isRead) {
      try {
        await markNotificationAsRead(notification._id);
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
  };

  return (
    <div 
      className={`px-4 py-3 hover:bg-gray-50 border-l-4 ${
        notification.isRead 
          ? 'border-transparent bg-gray-50/50' 
          : 'border-blue-500 bg-blue-50/30'
      }`}
      onClick={notification.type === 'connection_request' ? handleMarkAsRead : undefined}
    >
      <div className="flex items-start gap-3">
        {notification.senderId?.avatar ? (
          <Image
            src={notification.senderId.avatar}
            alt={`${notification.senderId.fullname.firstname} ${notification.senderId.fullname.lastname}`}
            className="w-8 h-8 rounded-full"
            width={32}
            height={32}
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-xs font-semibold text-gray-600">
              {notification.senderId?.fullname.firstname.charAt(0)}
            </span>
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900">{notification.message}</p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(notification.createdAt).toLocaleDateString()}
          </p>
          
          {notification.type === 'connection_request' && !notification.isRead && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction('accept');
                }}
                className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
              >
                Accept
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction('decline');
                }}
                className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
              >
                Decline
              </button>
            </div>
          )}
        </div>
        
        {!notification.isRead && (
          <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
        )}
      </div>
    </div>
  );
};

const NavLink = ({ href, label }: NavLink) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  const { primaryAccentColor } = useThemeStore();

  return (
    <Link
      href={href}
      className={`
        transition-all duration-200 
        ${isActive ? "font-bold" : "font-normal opacity-60"} 
        hover:opacity-100 hover:font-medium
        px-4 py-1 rounded-xl
      `}
      style={{
        color: "#000",
        backgroundColor: isActive ? `${primaryAccentColor}20` : "transparent",
      }}
    >
      {label}
    </Link>
  );
};

const NavButton = ({ href, label, isPrimary }: NavButton) => {
  const { primaryAccentColor, secondaryAccentColor } = useThemeStore();

  return (
    <Link
      href={href}
      style={
        isPrimary
          ? { backgroundColor: primaryAccentColor }
          : { color: secondaryAccentColor }
      }
      className={`text-[18px] ${
        isPrimary ? "text-black rounded-[20px] px-[18px] py-1" : ""
      }`}
    >
      {label}
    </Link>
  );
};

// Main Component
const Navbar = () => {
  const router = useRouter();
  const { primaryAccentColor, secondaryAccentColor } = useThemeStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showConnectionRequests, setShowConnectionRequests] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);

  const { 
    isAuthenticated, 
    user, 
    logout, 
    getUnreadNotificationCount,
    notifications,
    getNotifications,
    markAllNotificationsAsRead 
  } = useAuthStore();

  // Filter connection requests from notifications
  const connectionRequests = notifications.filter(n => n.type === 'connection_request' && !n.isRead);
  const generalNotifications = notifications.filter(n => n.type !== 'connection_request');

  // Fetch notifications and unread count when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      getUnreadNotificationCount();
      getNotifications();
    }
  }, [isAuthenticated, getUnreadNotificationCount, getNotifications]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      console.log(target.closest('.notification-dropdown'));
      if (showNotifications && !target.closest('.notification-dropdown') && !target.closest('.notification-icon')) {
        setShowNotifications(false);
      }
      if (showConnectionRequests && !target.closest('.connection-requests-dropdown') && !target.closest('.connection-requests-icon')) {
        setShowConnectionRequests(false);
      }
      if (isDropdownOpen && !target.closest('.profile-dropdown') && !target.closest('.profile-icon')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications, showConnectionRequests, isDropdownOpen]);

  return (
    <nav className="px-[20px] md:px-[40px] lg:px-[80px] py-[20px] flex justify-between items-center relative z-[100000]">
      <div
        id="logo"
        className="text-[36px] font-[900] cursor-pointer flex items-center"
        style={{ color: secondaryAccentColor }}
        onClick={() => router.push("/")}
      >
        {/* <Image src="/logo_final.png" height={80} width={80} alt="VaultMeet Logo" className="pr-6"/> */}
        <p>
          Vault<span style={{ color: primaryAccentColor }}>Meet</span>
        </p>
      </div>

      {/* Mobile Menu Button */}
      <button
        className={`md:hidden text-black p-2 rounded-lg transition-colors mr-6`}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle mobile menu"
      >
        <div
          className={`flex flex-col gap-2 relative transition-all duration-300 ${
            isMenuOpen ? "h-0" : "h-4"
          }`}
        >
          <div
            className={`w-6 rounded-full border-t-[3px] border-[#999] absolute transition-all duration-300  ${
              isMenuOpen ? "rotate-45 top-[50%] -translate-y-[50%]" : "top-0"
            }`}
          ></div>
          <div
            className={`w-6 rounded-full border-t-[3px] border-[#999] absolute transition-all duration-300  ${
              isMenuOpen
                ? " -rotate-45 top-[50%] -translate-y-[50%]"
                : "bottom-0"
            }`}
          ></div>
        </div>
      </button>

      {/* Desktop Navigation */}
      <div
        className={`rounded-[25px] w-[450px] py-1 ${
          isAuthenticated ? "ml-0" : "ml-[50px]"
        } text-[18px] hidden md:flex justify-around items-center`}
        style={{ backgroundColor: primaryAccentColor }}
      >
        {NAV_LINKS.map((link) => (
          <NavLink key={link.href} {...link} />
        ))}
      </div>

      <div className="hidden md:flex gap-[30px] text-[18px] items-center ml-8">
        {isAuthenticated ? (
          <div className="flex items-center gap-4">
            {/* Connection Requests Icon */}
            <div className="relative connection-requests-icon">
              <button
                onClick={() => setShowConnectionRequests(!showConnectionRequests)}
                className="relative p-2 rounded-lg hover:bg-gray-100/10 transition-colors"
                style={{ color: primaryAccentColor }}
              >
                {/* Person Plus Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" height={20} width={20} fill={primaryAccentColor}>
                  <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512H418.3c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3zM544 128V64c0-17.7-14.3-32-32-32s-32 14.3-32 32v64H416c-17.7 0-32 14.3-32 32s14.3 32 32 32h64v64c0 17.7 14.3 32 32 32s32-14.3 32-32V192h64c17.7 0 32-14.3 32-32s-14.3-32-32-32H544z"/>
                </svg>
                {/* Connection Requests Badge */}
                {connectionRequests.length > 0 && (
                  <span
                    className="absolute -top-1 -right-1 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
                    style={{ backgroundColor: secondaryAccentColor }}
                  >
                    {connectionRequests.length > 99 ? '99+' : connectionRequests.length}
                  </span>
                )}
              </button>
            </div>

            {/* Notification Icon */}
            <div className="relative notification-icon">
              <button
                onClick={async () => {
                  setShowNotifications(!showNotifications);
                  // Mark all general notifications as read when opening dropdown
                  if (!showNotifications && generalNotifications.some(n => !n.isRead)) {
                    try {
                      await markAllNotificationsAsRead();
                    } catch (error) {
                      console.error('Failed to mark notifications as read:', error);
                    }
                  }
                }}
                className="relative p-2 rounded-lg hover:bg-gray-100/10 transition-colors"
                style={{ color: primaryAccentColor }}
              >
                {/* Bell Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" height={20} width={20} fill={primaryAccentColor}><path d="M320 64C302.3 64 288 78.3 288 96L288 99.2C215 114 160 178.6 160 256L160 277.7C160 325.8 143.6 372.5 113.6 410.1L103.8 422.3C98.7 428.6 96 436.4 96 444.5C96 464.1 111.9 480 131.5 480L508.4 480C528 480 543.9 464.1 543.9 444.5C543.9 436.4 541.2 428.6 536.1 422.3L526.3 410.1C496.4 372.5 480 325.8 480 277.7L480 256C480 178.6 425 114 352 99.2L352 96C352 78.3 337.7 64 320 64zM258 528C265.1 555.6 290.2 576 320 576C349.8 576 374.9 555.6 382 528L258 528z"/></svg>
                {/* Notification Badge */}
                {generalNotifications.filter(n => !n.isRead).length > 0 && (
                  <span
                    className="absolute -top-1 -right-1 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
                    style={{ backgroundColor: secondaryAccentColor }}
                  >
                    {generalNotifications.filter(n => !n.isRead).length > 99 ? '99+' : generalNotifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </button>
            </div>

            {/* User Profile Dropdown */}
            <div className="relative profile-icon">
              <div
                className="flex items-center gap-2 cursor-pointer"
                style={{ color: primaryAccentColor }}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
              {!user?.avatar ? (
                <div
                  className="flex items-center justify-center h-[40px] w-[40px] rounded-full"
                  style={{ backgroundColor: secondaryAccentColor }}
                >
                  <p className="text-[18px] text-black font-bold">
                    {user?.fullname.firstname.charAt(0).toUpperCase()}
                  </p>
                </div>
              ) : (
                <div
                  className="flex items-center justify-center h-[40px] w-[40px] rounded-full"
                  style={{
                    backgroundImage: `url(${user?.avatar})`,
                    backgroundPosition: "center",
                    backgroundSize: "cover",
                  }}
                ></div>
              )}
              <svg
                className={`w-4 h-4 ml-1 inline-block transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>

            {/* Dropdown Menu */}
            <div
              className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white transform transition-all duration-200 ease-in-out profile-dropdown ${
                isDropdownOpen
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-2 pointer-events-none"
              }`}
            >
              <div className="py-1">
                <button
                  onClick={() => router.push("/me")}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Profile
                </button>
                <button
                  onClick={() => {
                    logout();
                    toast.success("Logged out successfully");
                    router.push("/");
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            </div>

            {/* Connection Requests Dropdown */}
            <div
              className={`absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white transform transition-all duration-200 ease-in-out connection-requests-dropdown ${
                showConnectionRequests
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-2 pointer-events-none"
              }`}
              style={{ zIndex: 1000 }}
            >
              <div className="py-2">
                <div className="px-4 py-2 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900">Connection Requests</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {connectionRequests.length === 0 ? (
                    <div className="px-4 py-6 text-center text-gray-500 text-sm">
                      No connection requests
                    </div>
                  ) : (
                    connectionRequests.slice(0, 10).map((notification) => (
                      <NotificationItem 
                        key={notification._id} 
                        notification={notification}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Notification Dropdown */}
            <div
              className={`absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white transform transition-all duration-200 ease-in-out notification-dropdown ${
                showNotifications
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-2 pointer-events-none"
              }`}
              style={{ zIndex: 1000 }}
            >
              <div className="py-2">
                <div className="px-4 py-2 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {generalNotifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-gray-500 text-sm">
                      No notifications yet
                    </div>
                  ) : (
                    generalNotifications.slice(0, showAllNotifications ? generalNotifications.length : 10).map((notification) => (
                      <NotificationItem 
                        key={notification._id} 
                        notification={notification}
                      />
                    ))
                  )}
                </div>
                {generalNotifications.length > 10 && (
                  <div className="px-4 py-2 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setShowAllNotifications(!showAllNotifications);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {showAllNotifications ? 'Show less' : `View all ${generalNotifications.length} notifications`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        ) : (
          NAV_BUTTONS.map((button) => (
            <NavButton key={button.label} {...button} />
          ))
        )}
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden absolute top-full left-0 right-0 bg-white shadow-lg rounded-b-lg transition-all duration-300 ease-in-out transform origin-top py-[20px] ${
          isMenuOpen
            ? "opacity-100 scale-y-100"
            : "opacity-0 scale-y-0 pointer-events-none"
        }`}
        style={{ backgroundColor: primaryAccentColor }}
      >
        <div
          className={`flex flex-col space-y-6 transition-all duration-300 delay-100 ${
            isMenuOpen
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-4"
          }`}
        >
          <div className="flex flex-col space-y-4 px-6">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.href} {...link} />
            ))}
          </div>

          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-4 w-full px-6 py-4 border-t border-b border-gray-200/30">
                {!user?.avatar ? (
                  <div
                    className="flex items-center justify-center h-[50px] w-[50px] rounded-full shadow-md"
                    style={{ backgroundColor: secondaryAccentColor }}
                  >
                    <p className="text-[20px] text-black font-bold">
                      {user?.fullname.firstname.charAt(0).toUpperCase()}
                    </p>
                  </div>
                ) : (
                  <div
                    className="flex items-center justify-center h-[50px] w-[50px] rounded-full shadow-md"
                    style={{
                      backgroundImage: `url(${user?.avatar})`,
                      backgroundPosition: "center",
                      backgroundSize: "cover",
                    }}
                  ></div>
                )}
                <div className="flex flex-col">
                  <span className="text-black font-semibold text-lg">
                    {user?.fullname.firstname} {user?.fullname.lastname}
                  </span>
                  <span className="text-black/60 text-sm">View Profile</span>
                </div>
              </div>
              <div className="flex flex-col space-y-2 px-6">
                <button
                  onClick={() => router.push("/me")}
                  className="w-full text-left px-4 py-3 text-black hover:bg-black/5 rounded-xl transition-all duration-200 flex items-center gap-3"
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Profile
                </button>
                <button
                  onClick={() => {
                    logout();
                    toast.success("Logged out successfully");
                    router.push("/");
                  }}
                  className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 flex items-center gap-3"
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
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col space-y-3 px-6">
              <Link
                href="/login"
                className="text-[18px] text-black rounded-xl px-6 py-3 text-center hover:bg-black/5 transition-all duration-200"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="text-[18px] text-black rounded-xl px-6 py-3 text-center bg-black/10 hover:bg-black/20 transition-all duration-200"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

// Exports
export default Navbar;
