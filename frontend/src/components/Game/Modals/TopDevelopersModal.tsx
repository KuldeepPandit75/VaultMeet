"use client";

import React, { useState } from 'react';
import { useThemeStore } from "@/Zustand_Store/ThemeStore";
import axios from 'axios';

interface Project {
  rank: number;
  projectName: string;
  developer: string;
  description: string;
  techStack: string[];
  githubUrl: string;
  demoUrl: string;
  stars: number;
  forks: number;
  category: string;
  imageUrl?: string;
}

interface ProjectSubmission {
  projectName: string;
  developer: string;
  description: string;
  techStack: string[];
  githubUrl: string;
  demoUrl?: string;
  category: string;
  isHosted: boolean;
}

interface ApiProject {
  _id: string;
  projectName: string;
  developer: string;
  description: string;
  techStack: string[];
  githubUrl: string;
  demoUrl?: string;
  category: string;
  stars?: number;
  forks?: number;
  status: string;
  rank?: number;
  createdAt: string;
  updatedAt: string;
}

interface TopDevelopersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TopDevelopersModal: React.FC<TopDevelopersModalProps> = ({ isOpen, onClose }) => {
  const { isDarkMode, primaryAccentColor } = useThemeStore();
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState<ProjectSubmission>({
    projectName: '',
    developer: '',
    description: '',
    techStack: [],
    githubUrl: '',
    demoUrl: '',
    category: '',
    isHosted: false
  });

  const [techStackInput, setTechStackInput] = useState('');
  const [topProjects, setTopProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});



  // Fetch top ranked projects from API
  const fetchApprovedProjects = async () => {
    try {
      setLoadingProjects(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'}/user/projects/top-ranked`
      );
      console.log(response)
      
      if (response.data.success && response.data.data.length > 0) {
        // Transform API data to match our Project interface
        const apiProjects = response.data.data.map((project: ApiProject) => ({
          rank: project.rank || 0,
          projectName: project.projectName,
          developer: project.developer,
          description: project.description,
          techStack: project.techStack || [],
          githubUrl: project.githubUrl,
          demoUrl: project.demoUrl,
          stars: project.stars || 0,
          forks: project.forks || 0,
          category: project.category,
          imageUrl: "/logo_final.png" // Default image
        }));
        setTopProjects(apiProjects);
      } else {
        // No ranked projects found
        console.log("No ranked projects found");
        setTopProjects([]);
      }
    } catch (error) {
      console.error('Error fetching top ranked projects:', error);
      // Set empty array on error
      setTopProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  // Fetch projects when modal opens
  React.useEffect(() => {
    if (isOpen) {
      fetchApprovedProjects();
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

  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Project name validation
    if (!formData.projectName.trim()) {
      errors.push('Project name is required');
    } else if (formData.projectName.length > 100) {
      errors.push('Project name cannot exceed 100 characters');
    }

    // Developer username validation
    if (!formData.developer.trim()) {
      errors.push('Developer username is required');
    } else if (formData.developer.length > 50) {
      errors.push('Developer username cannot exceed 50 characters');
    }

    // Description validation
    if (!formData.description.trim()) {
      errors.push('Project description is required');
    } else if (formData.description.length > 1000) {
      errors.push('Project description cannot exceed 1000 characters');
    }

    // GitHub URL validation
    if (!formData.githubUrl.trim()) {
      errors.push('GitHub URL is required');
    } else if (!/^https:\/\/github\.com\/[^\/]+\/[^\/]+/.test(formData.githubUrl)) {
      errors.push('Please provide a valid GitHub repository URL');
    }

    // Category validation
    if (!formData.category) {
      errors.push('Project category is required');
    }

    // Demo URL validation for hosted projects
    if (formData.isHosted && !formData.demoUrl?.trim()) {
      errors.push('Demo URL is required when project is hosted');
    } else if (formData.isHosted && formData.demoUrl && !/^https?:\/\/.+/.test(formData.demoUrl)) {
      errors.push('Please provide a valid URL for the demo');
    }

    // Tech stack validation
    formData.techStack.forEach((tech) => {
      if (tech.length > 30) {
        errors.push(`Tech stack item "${tech}" cannot exceed 30 characters`);
      }
    });

    return { isValid: errors.length === 0, errors };
  };

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Frontend validation
    const validation = validateForm();
    if (!validation.isValid) {
      setSubmissionMessage({
        type: 'error',
        message: validation.errors.join(', ')
      });
      return;
    }

    setIsSubmitting(true);
    setSubmissionMessage(null);

    try {
      const token = JSON.parse(localStorage.getItem('hackmeet-auth') || '{}').state?.token;
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'}/user/projects/submit`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setSubmissionMessage({
        type: 'success',
        message: 'Project submitted successfully! It will be reviewed and added to the leaderboard.'
      });

      // Reset form
      setFormData({
        projectName: '',
        developer: '',
        description: '',
        techStack: [],
        githubUrl: '',
        demoUrl: '',
        category: '',
        isHosted: false
      });
      setTechStackInput('');

      // Hide form after successful submission
      setTimeout(() => {
        setShowSubmissionForm(false);
        setSubmissionMessage(null);
      }, 3000);

    } catch (error: unknown) {
      console.error('Error submitting project:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error.response as { data?: { message?: string } })?.data?.message || 'Failed to submit project. Please try again.'
        : 'Failed to submit project. Please try again.';
      setSubmissionMessage({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTechStack = () => {
    if (techStackInput.trim() && !formData.techStack.includes(techStackInput.trim())) {
      setFormData(prev => ({
        ...prev,
        techStack: [...prev.techStack, techStackInput.trim()]
      }));
      setTechStackInput('');
    }
  };

  const removeTechStack = (index: number) => {
    setFormData(prev => ({
      ...prev,
      techStack: prev.techStack.filter((_, i) => i !== index)
    }));
  };

  const handleInputChange = (field: keyof ProjectSubmission, value: string | boolean | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
      <div
        className="relative w-[95vw] max-w-6xl flex flex-col h-[90vh] rounded-lg shadow-xl border overflow-hidden"
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
          <div>
            <h2
              className="text-2xl font-bold mb-1"
              style={{ color: isDarkMode ? "#ffffff" : "#1a1a1a" }}
            >
              Top Developers
            </h2>
            <p className="text-sm opacity-70"
               style={{ color: isDarkMode ? "#cccccc" : "#666666" }}>
              Amazing projects from our community
            </p>
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
        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
          {loadingProjects ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" 
                     style={{ borderColor: primaryAccentColor }}></div>
                <p style={{ color: isDarkMode ? "#ffffff" : "#1a1a1a" }}>
                  Loading amazing projects...
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {topProjects.length > 0 ? (
                topProjects.map((project) => (
                <div
                  key={project.rank}
                  className="p-6 rounded-lg border transition-all duration-200 hover:scale-[1.01]"
                  style={{
                    backgroundColor: isDarkMode ? "#2a2a2a" : "#ffffff",
                    borderColor: isDarkMode ? "#444444" : "#e5e5e5",
                  }}
                >
                  <div className="flex items-start gap-6">
                    {/* Rank and Image */}
                    <div className="flex-shrink-0 flex flex-col items-center gap-3">
                      <div className="w-16 h-16 flex items-center justify-center rounded-full font-bold text-2xl"
                           style={{
                             backgroundColor: isDarkMode ? "#333333" : "#f5f5f5",
                             color: getRankColor(project.rank),
                           }}>
                        {getRankIcon(project.rank)}
                      </div>
                    </div>

                    {/* Project Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold mb-1"
                              style={{ color: isDarkMode ? "#ffffff" : "#1a1a1a" }}>
                            {project.projectName}
                          </h3>
                          <p className="text-sm font-semibold mb-2"
                             style={{ color: primaryAccentColor }}>
                            by {project.developer}
                          </p>
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium"
                                 style={{
                                   backgroundColor: primaryAccentColor + '20',
                                   color: primaryAccentColor,
                                 }}>
                            {project.category}
                          </span>
                        </div>
                        
                        {/* GitHub Stats */}
                        <div className="flex-shrink-0 text-right">
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-500">⭐</span>
                              <span style={{ color: isDarkMode ? "#cccccc" : "#666666" }}>
                                {project.stars.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-blue-500">🔀</span>
                              <span style={{ color: isDarkMode ? "#cccccc" : "#666666" }}>
                                {project.forks.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <p className="text-sm mb-4 leading-relaxed"
                         style={{ color: isDarkMode ? "#cccccc" : "#666666" }}>
                        {project.description}
                      </p>

                      {/* Tech Stack */}
                      <div className="mb-4">
                        <p className="text-xs font-semibold mb-2 uppercase tracking-wide"
                           style={{ color: isDarkMode ? "#aaaaaa" : "#888888" }}>
                          Tech Stack
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {project.techStack.map((tech, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 rounded text-xs font-medium"
                              style={{
                                backgroundColor: isDarkMode ? "#333333" : "#f5f5f5",
                                color: isDarkMode ? "#cccccc" : "#666666",
                              }}
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Links */}
                      <div className="flex gap-3">
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                          style={{
                            backgroundColor: "#333333",
                            color: "#ffffff",
                          }}
                        >
                          📁 View on GitHub
                        </a>
                        <a
                          href={project.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                          style={{
                            backgroundColor: primaryAccentColor,
                            color: "#ffffff",
                          }}
                        >
                          🚀 Live Demo
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))
              ) : (
                <div className="text-center py-12">
                  <div className="mb-6">
                    <div className="text-6xl mb-4">🏆</div>
                    <h3 className="text-xl font-bold mb-2"
                        style={{ color: isDarkMode ? "#ffffff" : "#1a1a1a" }}>
                      No Projects Ranked Yet
                    </h3>
                    <p className="text-sm opacity-70"
                       style={{ color: isDarkMode ? "#cccccc" : "#666666" }}>
                      Be the first to submit your project and get it ranked here!
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 text-center p-4 rounded-lg border"
               style={{
                 backgroundColor: isDarkMode ? "#2a2a2a" : "#f8f9fa",
                 borderColor: isDarkMode ? "#444444" : "#e5e5e5",
               }}>
            <p className="text-sm opacity-70"
               style={{ color: isDarkMode ? "#cccccc" : "#666666" }}>
              These projects represent the best of our developer community. 
              Each one demonstrates innovation, technical excellence, and real-world impact.
            </p>
            
            {/* Submit Your Project Button */}
            <button
              onClick={() => setShowSubmissionForm(true)}
              className="mt-4 px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: primaryAccentColor,
                color: "#ffffff",
              }}
            >
              🚀 Submit Your Project
            </button>
          </div>

          {/* Submission Form */}
          {showSubmissionForm && (
            <div className="mt-6 p-6 rounded-lg border"
                 style={{
                   backgroundColor: isDarkMode ? "#2a2a2a" : "#ffffff",
                   borderColor: isDarkMode ? "#444444" : "#e5e5e5",
                 }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold"
                    style={{ color: isDarkMode ? "#ffffff" : "#1a1a1a" }}>
                  Submit Your Project
                </h3>
                <button
                  onClick={() => setShowSubmissionForm(false)}
                  className="text-xl font-bold hover:opacity-70 transition-opacity"
                  style={{ color: isDarkMode ? "#aaa" : "#666" }}
                >
                  ×
                </button>
              </div>

              

              <form onSubmit={handleSubmitProject} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2"
                           style={{ color: isDarkMode ? "#ffffff" : "#1a1a1a" }}>
                      Project Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.projectName}
                      onChange={(e) => handleInputChange('projectName', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border transition-colors"
                      style={{
                        backgroundColor: isDarkMode ? "#333333" : "#ffffff",
                        borderColor: isDarkMode ? "#555555" : "#e5e5e5",
                        color: isDarkMode ? "#ffffff" : "#1a1a1a",
                      }}
                      placeholder="Enter your project name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2"
                           style={{ color: isDarkMode ? "#ffffff" : "#1a1a1a" }}>
                      Developer Username *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.developer}
                      onChange={(e) => handleInputChange('developer', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border transition-colors"
                      style={{
                        backgroundColor: isDarkMode ? "#333333" : "#ffffff",
                        borderColor: isDarkMode ? "#555555" : "#e5e5e5",
                        color: isDarkMode ? "#ffffff" : "#1a1a1a",
                      }}
                      placeholder="Your username"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2"
                         style={{ color: isDarkMode ? "#ffffff" : "#1a1a1a" }}>
                    Project Description *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border transition-colors resize-none"
                    style={{
                      backgroundColor: isDarkMode ? "#333333" : "#ffffff",
                      borderColor: isDarkMode ? "#555555" : "#e5e5e5",
                      color: isDarkMode ? "#ffffff" : "#1a1a1a",
                    }}
                    placeholder="Describe your project, its features, and impact..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2"
                           style={{ color: isDarkMode ? "#ffffff" : "#1a1a1a" }}>
                      Category *
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border transition-colors"
                      style={{
                        backgroundColor: isDarkMode ? "#333333" : "#ffffff",
                        borderColor: isDarkMode ? "#555555" : "#e5e5e5",
                        color: isDarkMode ? "#ffffff" : "#1a1a1a",
                      }}
                    >
                      <option value="">Select a category</option>
                      <option value="Full-Stack Platform">Full-Stack Platform</option>
                      <option value="AI/ML Tool">AI/ML Tool</option>
                      <option value="Mobile App">Mobile App</option>
                      <option value="Web Application">Web Application</option>
                      <option value="API/Backend">API/Backend</option>
                      <option value="Game Development">Game Development</option>
                      <option value="Data Science">Data Science</option>
                      <option value="DevOps Tool">DevOps Tool</option>
                      <option value="Browser Extension">Browser Extension</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2"
                           style={{ color: isDarkMode ? "#ffffff" : "#1a1a1a" }}>
                      GitHub Repository URL *
                    </label>
                    <input
                      type="url"
                      required
                      value={formData.githubUrl}
                      onChange={(e) => handleInputChange('githubUrl', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border transition-colors"
                      style={{
                        backgroundColor: isDarkMode ? "#333333" : "#ffffff",
                        borderColor: isDarkMode ? "#555555" : "#e5e5e5",
                        color: isDarkMode ? "#ffffff" : "#1a1a1a",
                      }}
                      placeholder="https://github.com/username/repo"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={formData.isHosted}
                      onChange={(e) => handleInputChange('isHosted', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium"
                          style={{ color: isDarkMode ? "#ffffff" : "#1a1a1a" }}>
                      Is your project hosted online?
                    </span>
                  </label>
                  
                  {formData.isHosted && (
                    <div className="mt-2">
                      <label className="block text-sm font-medium mb-2"
                             style={{ color: isDarkMode ? "#ffffff" : "#1a1a1a" }}>
                        Live Demo URL *
                      </label>
                      <input
                        type="url"
                        required={formData.isHosted}
                        value={formData.demoUrl}
                        onChange={(e) => handleInputChange('demoUrl', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border transition-colors"
                        style={{
                          backgroundColor: isDarkMode ? "#333333" : "#ffffff",
                          borderColor: isDarkMode ? "#555555" : "#e5e5e5",
                          color: isDarkMode ? "#ffffff" : "#1a1a1a",
                        }}
                        placeholder="https://your-project-demo.com"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2"
                         style={{ color: isDarkMode ? "#ffffff" : "#1a1a1a" }}>
                    Tech Stack
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={techStackInput}
                      onChange={(e) => setTechStackInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechStack())}
                      className="flex-1 px-3 py-2 rounded-lg border transition-colors"
                      style={{
                        backgroundColor: isDarkMode ? "#333333" : "#ffffff",
                        borderColor: isDarkMode ? "#555555" : "#e5e5e5",
                        color: isDarkMode ? "#ffffff" : "#1a1a1a",
                      }}
                      placeholder="Add a technology (e.g., React, Node.js)"
                    />
                    <button
                      type="button"
                      onClick={addTechStack}
                      className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                      style={{
                        backgroundColor: primaryAccentColor,
                        color: "#ffffff",
                      }}
                    >
                      Add
                    </button>
                  </div>
                  
                  {formData.techStack.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.techStack.map((tech, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2"
                          style={{
                            backgroundColor: isDarkMode ? "#333333" : "#f5f5f5",
                            color: isDarkMode ? "#cccccc" : "#666666",
                          }}
                        >
                          {tech}
                          <button
                            type="button"
                            onClick={() => removeTechStack(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {submissionMessage && (
                <div className={`mb-4 p-3 rounded-lg ${
                  submissionMessage.type === 'success' 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  {submissionMessage.message}
                </div>
              )}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50"
                    style={{
                      backgroundColor: primaryAccentColor,
                      color: "#ffffff",
                    }}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Project'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSubmissionForm(false)}
                    className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 border"
                    style={{
                      borderColor: isDarkMode ? "#555555" : "#e5e5e5",
                      color: isDarkMode ? "#ffffff" : "#1a1a1a",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopDevelopersModal; 