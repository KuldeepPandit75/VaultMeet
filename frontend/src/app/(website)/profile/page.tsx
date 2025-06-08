"use client";

import { useEffect, useState } from "react";
import useAuthStore from "@/Zustand_Store/AuthStore";
import { useThemeStore } from "@/Zustand_Store/ThemeStore";
import Image from "next/image";
import { toast } from "react-hot-toast";

export default function ProfilePage() {
  const { user, loading, error, updateProfile } = useAuthStore();
  const { primaryAccentColor, secondaryAccentColor } = useThemeStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    skills: [] as string[],
    interests: [] as string[],
    featuredProject: {
      title: "",
      description: "",
      link: "",
      techUsed: [] as string[],
    },
  });

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
        skills: user.skills || [],
        interests: user.interests || [],
        featuredProject: user.featuredProject || {
          title: "",
          description: "",
          link: "",
          techUsed: [],
        },
      });
    }
  }, [user]);

  console.log(user);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateProfile(formData);
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">Error loading profile: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Banner */}

      {user?.banner ? (
        <div
          className="h-64 w-full relative overflow-hidden"
          style={{
            backgroundColor: primaryAccentColor,
            backgroundImage: `url(${user.banner})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        ></div>
      ) : (
        <div
          className="h-64 w-full relative overflow-hidden flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
          style={{ backgroundColor: `${primaryAccentColor}20` }}
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
            <span className="text-lg font-medium text-white/70">Add Banner Image</span>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto">
        {/* Profile Header */}
        <div className="relative px-8 pt-8 pb-6 -mt-28">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
            {/* Profile Picture */}
            <div className="relative">
              <div
                className="flex items-center justify-center h-40 w-40 rounded-full ring-4 ring-white shadow-lg"
                style={{ backgroundColor: secondaryAccentColor }}
              >
                {user?.avatar ? (
                  <Image
                    src={user.avatar}
                    alt="Profile"
                    width={160}
                    height={160}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <span className="text-5xl font-bold text-black">
                    {user?.fullname.firstname.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="absolute bottom-0 right-0 p-2 rounded-full bg-white shadow-lg cursor-pointer hover:bg-gray-100">
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
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-8">
                <h1
                  className="text-4xl font-bold"
                  style={{ color: secondaryAccentColor }}
                >
                  {user?.fullname.firstname} {user?.fullname.lastname}
                </h1>
              </div>
              <p className="text-white/80 text-lg">{user?.email}</p>

              {user?.location && (
                <div className="flex items-center gap-2 mt-2 text-white/80">
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
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {user.location}
                </div>
              )}
            </div>

            {/* Edit Button */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-6 py-2.5 rounded-lg text-sm font-medium transition-all hover:scale-105"
              style={{
                backgroundColor: secondaryAccentColor,
                color: "#000",
              }}
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
          </div>
        </div>
        {/* Profile Content */}
        <div className="mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div
            className="rounded-2xl shadow-xl overflow-hidden"
            style={{ backgroundColor: `${primaryAccentColor}20` }}
          >
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
                        value={formData.skills.join(", ")}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            skills: e.target.value
                              .split(",")
                              .map((skill) => skill.trim())
                              .filter(Boolean),
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
                        value={formData.interests.join(", ")}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            interests: e.target.value
                              .split(",")
                              .map((interest) => interest.trim())
                              .filter(Boolean),
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
                            value={formData.featuredProject.techUsed.join(", ")}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                featuredProject: {
                                  ...prev.featuredProject,
                                  techUsed: e.target.value
                                    .split(",")
                                    .map((tech) => tech.trim())
                                    .filter(Boolean),
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
                                techUsed: [],
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
                    {formData.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {formData.skills.map((skill) => (
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
                              {user?.featuredProject.techUsed.map((tech, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 text-black text-xs rounded-full bg-gray-200"
                                >
                                  {tech}
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
                      Achievements & Certifications
                    </h2>
                    <p className="text-gray-500 italic">
                      Add your achievements and certifications to highlight your
                      accomplishments
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
