"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faBug,
  faLightbulb,
  faComment,
  faExclamationTriangle,
  faCog,
  faGamepad,
  faChalkboard,
  faComments,
  faVideo,
  faMicrophone,
  faCogs,
  faQuestion,
} from "@fortawesome/free-solid-svg-icons";
import { useThemeStore } from "@/Zustand_Store/ThemeStore";
import useAuthStore from "@/Zustand_Store/AuthStore";
import { toast } from "react-hot-toast";
import { AxiosError } from "axios";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId?: string;
  eventId?: string;
}

const ReportModal = ({ isOpen, onClose, roomId, eventId }: ReportModalProps) => {
  const { isDarkMode, primaryAccentColor} = useThemeStore();
  const { user, submitReport } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: "bug" as "bug" | "feature" | "feedback" | "abuse" | "technical",
    category: "general" as "game" | "whiteboard" | "chat" | "video" | "audio" | "general" | "other",
    title: "",
    description: "",
    severity: "medium" as "low" | "medium" | "high" | "critical",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    tags: [] as string[],
  });

  const reportTypes = [
    { value: "bug", label: "Bug Report", icon: faBug, color: "#ef4444" },
    { value: "feature", label: "Feature Request", icon: faLightbulb, color: "#3b82f6" },
    { value: "feedback", label: "Feedback", icon: faComment, color: "#10b981" },
    { value: "abuse", label: "Report Abuse", icon: faExclamationTriangle, color: "#f59e0b" },
    { value: "technical", label: "Technical Issue", icon: faCog, color: "#8b5cf6" },
  ];

  const categories = [
    { value: "game", label: "Game", icon: faGamepad, color: "#3b82f6" },
    { value: "whiteboard", label: "Whiteboard", icon: faChalkboard, color: "#10b981" },
    { value: "chat", label: "Chat", icon: faComments, color: "#f59e0b" },
    { value: "video", label: "Video", icon: faVideo, color: "#ef4444" },
    { value: "audio", label: "Audio", icon: faMicrophone, color: "#8b5cf6" },
    { value: "general", label: "General", icon: faCogs, color: "#6b7280" },
    { value: "other", label: "Other", icon: faQuestion, color: "#9ca3af" },
  ];

  const severityLevels = [
    { value: "low", label: "Low", color: "#10b981" },
    { value: "medium", label: "Medium", color: "#f59e0b" },
    { value: "high", label: "High", color: "#ef4444" },
    { value: "critical", label: "Critical", color: "#dc2626" },
  ];

  const priorityLevels = [
    { value: "low", label: "Low", color: "#10b981" },
    { value: "medium", label: "Medium", color: "#f59e0b" },
    { value: "high", label: "High", color: "#ef4444" },
    { value: "urgent", label: "Urgent", color: "#dc2626" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await submitReport({
        ...formData,
        roomId,
        eventId,
      });
      
      toast.success("Report submitted successfully!");
      onClose();
      setFormData({
        type: "bug",
        category: "general",
        title: "",
        description: "",
        severity: "medium",
        priority: "medium",
        tags: [],
      });
    } catch (error: unknown) {
      console.error("Error submitting report:", error);
      const errorMessage = error instanceof AxiosError ? 
        error.response?.data?.message || error.message : 
        error instanceof Error ? error.message : 
        "Failed to submit report";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    field: keyof typeof formData,
    value: string | string[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
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
        className={`relative w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border-2 transition-all duration-300 ${
          isDarkMode ? "border-gray-700" : "border-gray-200"
        }`}
        style={{
          backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
          color: isDarkMode ? "#ffffff" : "#1a1a1a",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold">Report Issue / Feedback</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="text-lg" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium mb-3">
              Report Type *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {reportTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleInputChange("type", type.value)}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                    formData.type === type.value
                      ? "border-opacity-100 shadow-lg"
                      : "border-opacity-30 hover:border-opacity-60"
                  }`}
                  style={{
                    backgroundColor: formData.type === type.value 
                      ? `${type.color}20` 
                      : isDarkMode ? "#2a2a2a" : "#f8f9fa",
                    borderColor: type.color,
                    color: isDarkMode ? "#ffffff" : "#1a1a1a",
                    transform: formData.type === type.value ? "scale(1.02)" : "scale(1)",
                  }}
                >
                  <FontAwesomeIcon
                    icon={type.icon}
                    className="text-lg mb-2"
                    style={{ color: type.color }}
                  />
                  <div className="text-sm font-medium">{type.label}</div>
                  {formData.type === type.value && (
                    <div className="absolute top-2 right-2">
                      <div 
                        className="w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: type.color }}
                      >
                        <FontAwesomeIcon 
                          icon={faTimes} 
                          className="text-white text-xs" 
                          style={{ transform: "rotate(45deg)" }}
                        />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-3">
              Category *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {categories.map((category) => (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => handleInputChange("category", category.value)}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105 relative ${
                    formData.category === category.value
                      ? "border-opacity-100 shadow-lg"
                      : "border-opacity-30 hover:border-opacity-60"
                  }`}
                  style={{
                    backgroundColor: formData.category === category.value 
                      ? `${category.color}20` 
                      : isDarkMode ? "#2a2a2a" : "#f8f9fa",
                    borderColor: category.color,
                    color: isDarkMode ? "#ffffff" : "#1a1a1a",
                    transform: formData.category === category.value ? "scale(1.02)" : "scale(1)",
                  }}
                >
                  <FontAwesomeIcon
                    icon={category.icon}
                    className="text-lg mb-2"
                    style={{ color: category.color }}
                  />
                  <div className="text-sm font-medium">{category.label}</div>
                  {formData.category === category.value && (
                    <div className="absolute top-2 right-2">
                      <div 
                        className="w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: category.color }}
                      >
                        <FontAwesomeIcon 
                          icon={faTimes} 
                          className="text-white text-xs" 
                          style={{ transform: "rotate(45deg)" }}
                        />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Brief description of the issue or feedback"
              className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2"
              style={{
                backgroundColor: isDarkMode ? "#2a2a2a" : "#f8f9fa",
                borderColor: isDarkMode ? "#333333" : "#e5e5e5",
                color: isDarkMode ? "#ffffff" : "#1a1a1a",
              }}
              maxLength={200}
              required
            />
            <div className="text-xs text-gray-500 mt-1">
              {formData.title.length}/200 characters
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Please provide detailed information about the issue, steps to reproduce, expected behavior, and actual behavior..."
              className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 resize-none"
              style={{
                backgroundColor: isDarkMode ? "#2a2a2a" : "#f8f9fa",
                borderColor: isDarkMode ? "#333333" : "#e5e5e5",
                color: isDarkMode ? "#ffffff" : "#1a1a1a",
              }}
              rows={6}
              maxLength={2000}
              required
            />
            <div className="text-xs text-gray-500 mt-1">
              {formData.description.length}/2000 characters
            </div>
          </div>

          {/* Severity and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Severity */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Severity
              </label>
              <div className="grid grid-cols-2 gap-2">
                {severityLevels.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => handleInputChange("severity", level.value)}
                    className={`p-2 rounded-lg border-2 transition-all duration-200 hover:scale-105 relative ${
                      formData.severity === level.value
                        ? "border-opacity-100 shadow-lg"
                        : "border-opacity-30 hover:border-opacity-60"
                    }`}
                    style={{
                      backgroundColor: formData.severity === level.value 
                        ? `${level.color}20` 
                        : isDarkMode ? "#2a2a2a" : "#f8f9fa",
                      borderColor: level.color,
                      color: isDarkMode ? "#ffffff" : "#1a1a1a",
                      transform: formData.severity === level.value ? "scale(1.02)" : "scale(1)",
                    }}
                  >
                    <div className="text-sm font-medium">{level.label}</div>
                    {formData.severity === level.value && (
                      <div className="absolute top-1 right-1">
                        <div 
                          className="w-3 h-3 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: level.color }}
                        >
                          <FontAwesomeIcon 
                            icon={faTimes} 
                            className="text-white text-xs" 
                            style={{ transform: "rotate(45deg)" }}
                          />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Priority
              </label>
              <div className="grid grid-cols-2 gap-2">
                {priorityLevels.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => handleInputChange("priority", level.value)}
                    className={`p-2 rounded-lg border-2 transition-all duration-200 hover:scale-105 relative ${
                      formData.priority === level.value
                        ? "border-opacity-100 shadow-lg"
                        : "border-opacity-30 hover:border-opacity-60"
                    }`}
                    style={{
                      backgroundColor: formData.priority === level.value 
                        ? `${level.color}20` 
                        : isDarkMode ? "#2a2a2a" : "#f8f9fa",
                      borderColor: level.color,
                      color: isDarkMode ? "#ffffff" : "#1a1a1a",
                      transform: formData.priority === level.value ? "scale(1.02)" : "scale(1)",
                    }}
                  >
                    <div className="text-sm font-medium">{level.label}</div>
                    {formData.priority === level.value && (
                      <div className="absolute top-1 right-1">
                        <div 
                          className="w-3 h-3 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: level.color }}
                        >
                          <FontAwesomeIcon 
                            icon={faTimes} 
                            className="text-white text-xs" 
                            style={{ transform: "rotate(45deg)" }}
                          />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Context Information */}
          {(roomId || eventId) && (
            <div className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium mb-2">Context Information</h4>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {roomId && <div>Room ID: {roomId}</div>}
                {eventId && <div>Event ID: {eventId}</div>}
                <div>Browser: {navigator.userAgent}</div>
                <div>Platform: {navigator.platform}</div>
                {user && <div>User: {user.fullname?.firstname} {user.fullname?.lastname} (@{user.username})</div>}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-lg border-2 transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: isDarkMode ? "#2a2a2a" : "#f8f9fa",
                borderColor: isDarkMode ? "#333333" : "#e5e5e5",
                color: isDarkMode ? "#ffffff" : "#1a1a1a",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.title || !formData.description}
              className="flex-1 px-6 py-3 rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: primaryAccentColor,
                color: isDarkMode ? "#18181b" : "#ffffff",
              }}
            >
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal; 