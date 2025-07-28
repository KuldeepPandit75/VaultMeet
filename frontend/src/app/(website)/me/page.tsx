"use client";

import { useEffect, useState, useRef } from "react";
import useAuthStore from "@/Zustand_Store/AuthStore";
import { useThemeStore } from "@/Zustand_Store/ThemeStore";
import useEventStore from "@/Zustand_Store/EventStore";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { AxiosError } from "axios";
import UserEventsModal from "@/components/Profile/UserEventsModal";

export default function MePage() {
  const { user, updateProfile, updateAvatar, updateBanner, sendOTP, verifyOTP, verifyUser, checkUsernameAvailability } =
    useAuthStore();
  const { primaryAccentColor, secondaryAccentColor } = useThemeStore();
  const { getUserCreatedEvents } = useEventStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [userEventsCount, setUserEventsCount] = useState(0);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    fullname: {
      firstname: "",
      lastname: "",
    },
    username: "",
    bio: "",
    location: "",
    college: "",
    social: {
      github: "",
      linkedin: "",
      x: "",
    },
    website: "",
    skills: "",
    interests: "",
    featuredProject: {
      title: "",
      description: "",
      link: "",
      techUsed: "",
    },
    achievements: "" as string,
  });
  const [usernameStatus, setUsernameStatus] = useState<null | "checking" | "available" | "taken">(null);
  const [usernameError, setUsernameError] = useState<string>("");
  const usernameCheckTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        fullname: {
          firstname: user.fullname.firstname,
          lastname: user.fullname.lastname,
        },
        username: user.username || "",
        bio: user.bio || "",
        location: user.location || "",
        college: user.college || "",
        social: {
          github: user.social?.github || "",
          linkedin: user.social?.linkedin || "",
          x: user.social?.x || "",
        },
        website: user.website || "",
        skills: user.skills || "",
        interests: user.interests || "",
        featuredProject: user.featuredProject || {
          title: "",
          description: "",
          link: "",
          techUsed: "",
        },
        achievements: user.achievements || "",
      });
      
      // Fetch user events count
      fetchUserEventsCount();
    }
  }, [user]);

  const fetchUserEventsCount = async () => {
    if (!user?._id) return;
    try {
      const result = await getUserCreatedEvents(user._id, { page: 1, limit: 1, status: 'published' });
      setUserEventsCount(result.pagination.totalEvents);
    } catch (error) {
      console.error('Error fetching user events count:', error);
    }
  };

  // Username check effect
  useEffect(() => {
    if (!isEditing) return;
    if (!formData.username || formData.username === user?.username) {
      setUsernameStatus(null);
      setUsernameError("");
      return;
    }
    setUsernameStatus("checking");
    setUsernameError("");
    if (usernameCheckTimeout.current) clearTimeout(usernameCheckTimeout.current);
    usernameCheckTimeout.current = setTimeout(async () => {
      try {
        const available = await checkUsernameAvailability(formData.username);
        if (available) {
          setUsernameStatus("available");
          setUsernameError("");
        } else {
          setUsernameStatus("taken");
          setUsernameError("Username is already taken");
        }
      } catch {
        setUsernameStatus(null);
        setUsernameError("Error checking username");
      }
    }, 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.username, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && formData.username !== user?.username && usernameStatus === "taken") {
      toast.error("Username is already taken");
      return;
    }
    setIsSubmitting(true);
    try {
      await updateProfile(formData);
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (error: unknown) {
      console.error("Error updating profile:", error);
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message || "Failed to update profile");
      } else {
        toast.error("Failed to update profile");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await updateAvatar(file);
      toast.success("Profile picture updated successfully");
    } catch (err: unknown) {
      console.error("Error updating avatar:", err);
      if (err instanceof AxiosError) {
        toast.error(err.response?.data?.message || "Failed to update profile picture");
      } else {
        toast.error("Failed to update profile picture");
      }
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await updateBanner(file);
      toast.success("Banner updated successfully");
    } catch (err: unknown) {
      console.error("Error updating banner:", err);
      if (err instanceof AxiosError) {
        toast.error(err.response?.data?.message || "Failed to update banner");
      } else {
        toast.error("Failed to update banner");
      }
    }
  };

  const handleSendOTP = async () => {
    try {
      await sendOTP(user?.email || "");
      toast.success("OTP sent to your email");
      setShowOTPModal(true);
    } catch (error) {
      console.error("Error sending OTP:", error);
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message || "Failed to send OTP");
      } else {
        toast.error("Failed to send OTP");
      }
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      toast.error("Please enter the OTP");
      return;
    }
    setIsVerifying(true);
    try {
      const result = await verifyOTP(user?.email || "", otp);
      if (result.result === "VERIFIED" || result.result === "VALID") {
        toast.success("Email verified successfully");
        setShowOTPModal(false);
        setOtp("");
        await verifyUser();
      } else {
        toast.error("Invalid OTP");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message || "Failed to verify OTP");
      } else {
        toast.error("Failed to verify OTP");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen">
    
      {/* Banner */}
      <input
        type="file"
        ref={bannerInputRef}
        onChange={handleBannerChange}
        accept="image/*"
        className="hidden"
      />
      {user?.banner ? (
        <div
          className="h-64 w-full relative overflow-hidden"
          style={{
            backgroundImage: `url(${user.banner})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div
          onClick={() => bannerInputRef.current?.click()}
          className="absolute bottom-4 right-10 rounded-full bg-white p-2"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="black"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
        </div>
      ) : (
        <div
          className="h-64 w-full relative overflow-hidden flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
          style={{ backgroundColor: `${primaryAccentColor}20` }}
          onClick={() => bannerInputRef.current?.click()}
        >
          <div className="flex flex-col items-center text-white/70">
            <svg
              className="w-12 h-12 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-lg font-medium text-white/70">
              Add Banner Image
            </span>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto">
        {/* Profile Header */}
        <div className="relative px-8 pt-8 pb-6 -mt-22">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
            {/* Profile Picture */}
            <input
              type="file"
              ref={avatarInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />
            <div className="relative">
              <div
                className="flex items-center justify-center h-40 w-40 rounded-full ring-4 ring-white shadow-lg cursor-pointer"
                style={{ backgroundColor: secondaryAccentColor }}
                onClick={() => avatarInputRef.current?.click()}
              >
                {user?.avatar ? (
                  <Image
                    src={user.avatar}
                    alt="Profile"
                    fill
                    className="rounded-full object-cover"
                  />
                ) : (
                  <span className="text-5xl font-bold text-black">
                    {user?.fullname.firstname.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              {/* Share Button */}
              {user?.username && (
                <button
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-700 rounded-full p-2 shadow transition-colors"
                  title="Copy profile link"
                  onClick={() => {
                    const url = `${window.location.origin}/profile/${user.username}`;
                    navigator.clipboard.writeText(url);
                    toast.success("Profile link copied!");
                  }}
                >
                  {/* Link icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" 
     width="24" height="24" viewBox="0 0 24 24" 
     fill="none" stroke="currentColor" stroke-width="2" 
     stroke-linecap="round" stroke-linejoin="round" 
     className="feather feather-share-2">
  <circle cx="18" cy="5" r="3"></circle>
  <circle cx="6" cy="12" r="3"></circle>
  <circle cx="18" cy="19" r="3"></circle>
  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
</svg>

                </button>
              )}
              <div
                className="absolute bottom-0 right-0 p-2 rounded-full bg-white shadow-lg cursor-pointer hover:bg-gray-100"
                onClick={() => avatarInputRef.current?.click()}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left">
              <div className="flex flex-col items-center sm:items-start w-full">
                <div className="flex items-center gap-3 w-full justify-center sm:justify-start">
                  <h1
                    className="text-4xl font-bold leading-tight"
                    style={{ color: secondaryAccentColor }}
                  >
                    {user?.fullname.firstname} {user?.fullname.lastname}
                  </h1>
                  {!user?.isVerified && (
                    <button
                      onClick={handleSendOTP}
                      className="px-3 py-1 text-sm rounded-full bg-yellow-500 text-black hover:bg-yellow-600 transition-colors"
                    >
                      Verify Email
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-[30px] w-full mt-1">
                {/* Username display */}
                {!isEditing ? (
                  <div className="mt-1 mb-2 flex items-center gap-2">
                    <span className="text-base font-mono text-white/80 bg-black/20 px-3 py-1 rounded-full border border-white/10">@{user?.username}</span>
                  </div>
                ) : (
                  <div className="mb-2 max-w-xs w-full">
                    <input
                      type="text"
                      value={formData.username}
                      onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                      style={{ "--tw-ring-color": secondaryAccentColor } as React.CSSProperties }
                      autoComplete="off"
                    />
                    {formData.username && formData.username !== user?.username && (
                      <div className="mt-1 text-xs">
                        {usernameStatus === "checking" && <span className="text-gray-400">Checking availability...</span>}
                        {usernameStatus === "available" && <span className="text-green-500">Username is available</span>}
                        {usernameStatus === "taken" && <span className="text-red-500">Username is already taken</span>}
                        {usernameError && <span className="text-red-500">{usernameError}</span>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            {/* Edit Button */}
            <div className="mt-6 sm:mt-0 sm:self-end flex-shrink-0 w-full sm:w-auto flex justify-center sm:justify-end">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-6 py-2.5 rounded-lg text-sm font-medium transition-all hover:scale-105 shadow-md"
                style={{
                  backgroundColor: secondaryAccentColor,
                  color: "#000",
                }}
              >
                {isEditing ? "Cancel" : "Edit Profile"}
              </button>
            </div>
          </div>
        </div>
        {/* Profile Content */}
        <div className="mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div
            className="rounded-2xl shadow-xl overflow-hidden"
            style={{ backgroundColor: `${primaryAccentColor}20` }}
          >
            {/* Email and Location Row - moved here to match public profile */}
            {(user?.email || user?.location) && (
              <div className="px-0 pt-4 pb-2 mx-8">
                <div 
                  className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-start sm:items-center p-4 rounded-xl justify-between"
                  // style={{ backgroundColor: `${secondaryAccentColor}15` }}
                >
                  {user?.email && (
                    <div className="flex items-center gap-3 text-white">
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${secondaryAccentColor}30` }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-base font-medium">{user.email}</span>
                    </div>
                  )}
                  {user?.location && (
                    <div className="flex items-center gap-3 text-white">
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${secondaryAccentColor}30` }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <span className="text-base font-medium">{user.location}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Profile Details */}
            <div className="px-8 py-6">
              {isEditing ? (
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: secondaryAccentColor }}
                      >
                        First Name
                      </label>
                      <input
                        type="text"
                        value={formData.fullname.firstname}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            fullname: {
                              ...prev.fullname,
                              firstname: e.target.value,
                            },
                          }))
                        }
                        className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                        style={
                          {
                            "--tw-ring-color": secondaryAccentColor,
                          } as React.CSSProperties
                        }
                      />
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: secondaryAccentColor }}
                      >
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={formData.fullname.lastname}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            fullname: {
                              ...prev.fullname,
                              lastname: e.target.value,
                            },
                          }))
                        }
                        className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                        style={
                          {
                            "--tw-ring-color": secondaryAccentColor,
                          } as React.CSSProperties
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: secondaryAccentColor }}
                    >
                      Bio
                    </label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          bio: e.target.value,
                        }))
                      }
                      rows={3}
                      className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                      style={
                        {
                          "--tw-ring-color": secondaryAccentColor,
                        } as React.CSSProperties
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: secondaryAccentColor }}
                      >
                        Location
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            location: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                        style={
                          {
                            "--tw-ring-color": secondaryAccentColor,
                          } as React.CSSProperties
                        }
                      />
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: secondaryAccentColor }}
                      >
                        Website
                      </label>
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            website: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                        style={
                          {
                            "--tw-ring-color": secondaryAccentColor,
                          } as React.CSSProperties
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: secondaryAccentColor }}
                      >
                        GitHub
                      </label>
                      <input
                        type="url"
                        value={formData.social.github}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            social: { ...prev.social, github: e.target.value },
                          }))
                        }
                        className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                        style={
                          {
                            "--tw-ring-color": secondaryAccentColor,
                          } as React.CSSProperties
                        }
                      />
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: secondaryAccentColor }}
                      >
                        LinkedIn
                      </label>
                      <input
                        type="url"
                        value={formData.social.linkedin}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            social: {
                              ...prev.social,
                              linkedin: e.target.value,
                            },
                          }))
                        }
                        className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                        style={
                          {
                            "--tw-ring-color": secondaryAccentColor,
                          } as React.CSSProperties
                        }
                      />
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: secondaryAccentColor }}
                      >
                        Twitter
                      </label>
                      <input
                        type="url"
                        value={formData.social.x}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            social: { ...prev.social, x: e.target.value },
                          }))
                        }
                        className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                        style={
                          {
                            "--tw-ring-color": secondaryAccentColor,
                          } as React.CSSProperties
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: secondaryAccentColor }}
                      >
                        Skills (comma separated)
                      </label>
                      <input
                        type="text"
                        value={formData.skills}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            skills: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                        style={
                          {
                            "--tw-ring-color": secondaryAccentColor,
                          } as React.CSSProperties
                        }
                        placeholder="e.g. React, Node.js, TypeScript"
                      />
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: secondaryAccentColor }}
                      >
                        Interests (comma separated)
                      </label>
                      <input
                        type="text"
                        value={formData.interests}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            interests: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                        style={
                          {
                            "--tw-ring-color": secondaryAccentColor,
                          } as React.CSSProperties
                        }
                        placeholder="e.g. AI/ML, Web Development, UI/UX"
                      />
                    </div>
                  </div>

                  {/* Achievements Input */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: secondaryAccentColor }}
                    >
                      Achievements (comma separated)
                    </label>
                    <input
                      type="text"
                      value={formData.achievements}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          achievements: e.target.value,
                        }));
                        console.log(e);
                      }}
                      className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                      style={
                        {
                          "--tw-ring-color": secondaryAccentColor,
                        } as React.CSSProperties
                      }
                      placeholder="e.g. First Place in Hackathon, Best Project Award, Top Contributor"
                    />
                  </div>

                  {/* Projects Section */}
                  <div>
                    <h2
                      className="text-xl font-semibold mb-4"
                      style={{ color: secondaryAccentColor }}
                    >
                      Featured Projects
                    </h2>
                    <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label
                            className="block text-sm font-medium mb-2"
                            style={{ color: secondaryAccentColor }}
                          >
                            Project Title
                          </label>
                          <input
                            type="text"
                            value={formData.featuredProject.title}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                featuredProject: {
                                  ...prev.featuredProject,
                                  title: e.target.value,
                                },
                              }))
                            }
                            className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                            style={
                              {
                                "--tw-ring-color": secondaryAccentColor,
                              } as React.CSSProperties
                            }
                          />
                        </div>
                        <div>
                          <label
                            className="block text-sm font-medium mb-2"
                            style={{ color: secondaryAccentColor }}
                          >
                            Description
                          </label>
                          <textarea
                            value={formData.featuredProject.description}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                featuredProject: {
                                  ...prev.featuredProject,
                                  description: e.target.value,
                                },
                              }))
                            }
                            rows={3}
                            className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                            style={
                              {
                                "--tw-ring-color": secondaryAccentColor,
                              } as React.CSSProperties
                            }
                          />
                        </div>
                        <div>
                          <label
                            className="block text-sm font-medium mb-2"
                            style={{ color: secondaryAccentColor }}
                          >
                            Project Link
                          </label>
                          <input
                            type="url"
                            value={formData.featuredProject.link}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                featuredProject: {
                                  ...prev.featuredProject,
                                  link: e.target.value,
                                },
                              }))
                            }
                            className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                            style={
                              {
                                "--tw-ring-color": secondaryAccentColor,
                              } as React.CSSProperties
                            }
                          />
                        </div>
                        <div>
                          <label
                            className="block text-sm font-medium mb-2"
                            style={{ color: secondaryAccentColor }}
                          >
                            Technologies Used (comma separated)
                          </label>
                          <input
                            type="text"
                            value={formData.featuredProject.techUsed}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                featuredProject: {
                                  ...prev.featuredProject,
                                  techUsed: e.target.value,
                                },
                              }))
                            }
                            className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                            style={
                              {
                                "--tw-ring-color": secondaryAccentColor,
                              } as React.CSSProperties
                            }
                            placeholder="e.g. React, Node.js, MongoDB"
                          />
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              featuredProject: {
                                title: "",
                                description: "",
                                link: "",
                                techUsed: "",
                              },
                            })
                          }
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove Project
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: "transparent",
                        color: secondaryAccentColor,
                        border: `1px solid ${secondaryAccentColor}`,
                      }}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: secondaryAccentColor,
                        color: "#000",
                      }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-8">
                  {/* Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div
                      className="text-center p-6 rounded-xl transition-colors cursor-pointer hover:scale-105"
                      style={{
                        backgroundColor: `${secondaryAccentColor}20`,
                      }}
                      onClick={() => setShowEventsModal(true)}
                    >
                      <div
                        className="text-3xl font-bold mb-1"
                        style={{ color: secondaryAccentColor }}
                      >
                        {userEventsCount}
                      </div>
                      <div className="text-sm text-white">Events Hosted</div>
                    </div>
                    <div
                      className="text-center p-6 rounded-xl transition-colors"
                      style={{
                        backgroundColor: `${secondaryAccentColor}20`,
                      }}
                    >
                      <div
                        className="text-3xl font-bold mb-1"
                        style={{ color: secondaryAccentColor }}
                      >
                        0
                      </div>
                      <div className="text-sm text-white">Events Attended</div>
                    </div>
                    <div
                      className="text-center p-6 rounded-xl transition-colors"
                      style={{
                        backgroundColor: `${secondaryAccentColor}20`,
                      }}
                    >
                      <div
                        className="text-3xl font-bold mb-1"
                        style={{ color: secondaryAccentColor }}
                      >
                        0
                      </div>
                      <div className="text-sm text-white">Connections</div>
                    </div>
                    <div
                      className="text-center p-6 rounded-xl transition-colors"
                      style={{
                        backgroundColor: `${secondaryAccentColor}20`,
                      }}
                    >
                      <div
                        className="text-3xl font-bold mb-1"
                        style={{ color: secondaryAccentColor }}
                      >
                        0
                      </div>
                      <div className="text-sm text-white">Badges</div>
                    </div>
                  </div>

                  {/* Skills Section */}
                  <div>
                    <div className="mb-8 flex flex-col gap-2">
                      <h2
                        className="text-xl font-semibold"
                        style={{ color: secondaryAccentColor }}
                      >
                        Bio
                      </h2>
                      {user?.bio ? (
                        <p className="text-white max-w-2xl text-lg ">
                          {user.bio}
                        </p>
                      ) : (
                        <p className="text-gray-500 italic">
                          Add a bio to tell others about yourself
                        </p>
                      )}
                    </div>
                    <h2
                      className="text-xl font-semibold mb-4"
                      style={{ color: secondaryAccentColor }}
                    >
                      Skills & Expertise
                    </h2>
                    {user?.skills && user?.skills?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {user?.skills?.split(",").map((skill: string) => (
                          <span
                            key={skill}
                            className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 hover:bg-gray-200 transition-colors"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">
                        Add your skills to showcase your expertise
                      </p>
                    )}

                    <h2
                      className="text-xl font-semibold mb-4 mt-8"
                      style={{ color: secondaryAccentColor }}
                    >
                      Interests
                    </h2>
                    {user?.interests && user?.interests?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {user?.interests?.split(",").map((interest: string) => (
                          <span
                            key={interest}
                            className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 hover:bg-gray-200 transition-colors"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">
                        Add your interests to show what you&apos;re passionate about
                      </p>
                    )}
                  </div>

                  {/* Social Links */}
                  <div>
                    <h2
                      className="text-xl font-semibold mb-4"
                      style={{ color: secondaryAccentColor }}
                    >
                      Connect With Me
                    </h2>
                    {formData.social.github ||
                    formData.social.linkedin ||
                    formData.social.x ||
                    formData.website ? (
                      <div className="flex flex-wrap gap-4 text-white">
                        {formData.website && (
                          <a
                            href={formData.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                            style={{
                              backgroundColor: `${secondaryAccentColor}20`,
                            }}
                          >
                            <svg
                              className="w-5 h-5"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                            </svg>
                            Website
                          </a>
                        )}
                        {formData.social.github && (
                          <a
                            href={formData.social.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                            style={{
                              backgroundColor: `${secondaryAccentColor}20`,
                            }}
                          >
                            <svg
                              className="w-5 h-5"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                            </svg>
                            GitHub
                          </a>
                        )}
                        {formData.social.linkedin && (
                          <a
                            href={formData.social.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                            style={{
                              backgroundColor: `${secondaryAccentColor}20`,
                            }}
                          >
                            <svg
                              className="w-5 h-5"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                            </svg>
                            LinkedIn
                          </a>
                        )}
                        {formData.social.x && (
                          <a
                            href={formData.social.x}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                            style={{
                              backgroundColor: `${secondaryAccentColor}20`,
                            }}
                          >
                            <svg
                              className="w-5 h-5"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                            </svg>
                            Twitter
                          </a>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">
                        Add your social media links to connect with others
                      </p>
                    )}
                  </div>

                  {/* Projects Section */}
                  <div>
                    <h2
                      className="text-xl font-semibold mb-4"
                      style={{ color: secondaryAccentColor }}
                    >
                      Featured Projects
                    </h2>
                    {user?.featuredProject.title !== "" ? (
                      <div
                        className="p-4 rounded-lg transition-colors text-gray-400"
                        style={{
                          backgroundColor: `${secondaryAccentColor}20`,
                        }}
                      >
                        <h3 className="font-medium mb-2 text-white text-xl">
                          {user?.featuredProject.title}
                        </h3>
                        <p className="text-sm mb-3">
                          {user?.featuredProject.description}
                        </p>
                        {user?.featuredProject.techUsed &&
                          user?.featuredProject?.techUsed?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {user?.featuredProject.techUsed.split(",").map((tech, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 text-black text-xs rounded-full bg-gray-200"
                                >
                                  {tech.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        {user?.featuredProject.link && (
                          <a
                            href={user?.featuredProject.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium hover:underline"
                            style={{ color: secondaryAccentColor }}
                          >
                            View Project →
                          </a>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">
                        Add your projects to showcase your work
                      </p>
                    )}
                  </div>

                  {/* Achievements Section */}
                  <div>
                    <h2
                      className="text-xl font-semibold mb-4"
                      style={{ color: secondaryAccentColor }}
                    >
                      Achievements
                    </h2>
                    {user?.achievements &&
                    user.achievements?.split(",").length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {user?.achievements
                          ?.split(",")
                          .map((achievement: string, index: number) => (
                            <div
                              key={index}
                              className="p-4 rounded-lg transition-colors"
                              style={{
                                backgroundColor: `${secondaryAccentColor}20`,
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <svg
                                  className="w-6 h-6"
                                  fill="none"
                                  stroke="white"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                                  />
                                </svg>
                                <span className="text-white">
                                  {achievement}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">
                        Add your achievements to highlight your accomplishments
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      {showOTPModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Verify Your Email</h2>
            <p className="text-gray-600 mb-4">
              Enter the OTP sent to your email address
            </p>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-opacity-50 mb-4"
              style={{
                "--tw-ring-color": secondaryAccentColor,
              } as React.CSSProperties}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowOTPModal(false);
                  setOtp("");
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: "transparent",
                  color: secondaryAccentColor,
                  border: `1px solid ${secondaryAccentColor}`,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyOTP}
                disabled={isVerifying}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: secondaryAccentColor,
                  color: "#000",
                }}
              >
                {isVerifying ? "Verifying..." : "Verify"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Events Modal */}
      {user && (
        <UserEventsModal
          isOpen={showEventsModal}
          onClose={() => setShowEventsModal(false)}
          userId={user._id}
          userName={`${user.fullname.firstname} ${user.fullname.lastname}`}
        />
      )}
    </div>
  );
}
