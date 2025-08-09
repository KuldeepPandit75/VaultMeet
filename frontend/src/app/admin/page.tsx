"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore, { Role } from "@/Zustand_Store/AuthStore";
import toast from "react-hot-toast";
import axios from "axios";

interface Project {
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
  status: 'pending' | 'approved' | 'rejected';
  rank?: number;
  createdAt: string;
  updatedAt: string;
}

interface Report {
  _id: string;
  reporterId: {
    _id: string;
    fullname: {
      firstname: string;
      lastname: string;
    };
    username: string;
    avatar?: string;
  };
  type: 'bug' | 'feature' | 'feedback' | 'abuse' | 'technical';
  category: 'game' | 'whiteboard' | 'chat' | 'video' | 'audio' | 'general' | 'other';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  roomId?: string;
  eventId?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: {
    _id: string;
    fullname: {
      firstname: string;
      lastname: string;
    };
    username: string;
  };
  resolution?: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { isAuthenticated, user, loading } = useAuthStore();
  const [activeSection, setActiveSection] = useState<'dashboard' | 'news' | 'projects' | 'reports'>('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);

  useEffect(() => {
    // Don't redirect while loading
    if (loading) return;

    if (!loading && (user?.role !== Role.Admin || !isAuthenticated)) {
      toast.error("You don't have permission to access this page");
    //   router.push("/");
      return;
    }
  }, [isAuthenticated, user?.role, router, loading]);

  // Fetch projects when projects section is active
  useEffect(() => {
    if (activeSection === 'projects') {
      fetchProjects();
    }
  }, [activeSection]);

  // Fetch reports when reports section is active
  useEffect(() => {
    if (activeSection === 'reports') {
      fetchReports();
    }
  }, [activeSection]);

  // Fetch all submitted projects
  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);
      const token = JSON.parse(localStorage.getItem('hackmeet-auth') || '{}').state?.token;
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001'}/user/projects/admin/all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.data.success) {
        setProjects(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to fetch projects');
    } finally {
      setLoadingProjects(false);
    }
  };

  // Fetch all reports
  const fetchReports = async () => {
    try {
      setLoadingReports(true);
      const token = JSON.parse(localStorage.getItem('hackmeet-auth') || '{}').state?.token;
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001'}/user/admin/reports`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.data.reports) {
        setReports(response.data.reports);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to fetch reports');
    } finally {
      setLoadingReports(false);
    }
  };

  // Update report status
  const updateReportStatus = async (reportId: string, status: string, resolution?: string) => {
    try {
      const token = JSON.parse(localStorage.getItem('hackmeet-auth') || '{}').state?.token;
      await axios.patch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001'}/user/reports/${reportId}/status`,
        { status, resolution },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      toast.success('Report status updated successfully');
      fetchReports(); // Refresh the list
    } catch (error) {
      console.error('Error updating report:', error);
      toast.error('Failed to update report status');
    }
  };

  // Update project rank and status
  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    try {
      const token = JSON.parse(localStorage.getItem('hackmeet-auth') || '{}').state?.token;
      await axios.patch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001'}/user/projects/admin/${projectId}`,
        updates,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      toast.success('Project updated successfully');
      fetchProjects(); // Refresh the list
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show access denied if not authenticated or not admin
  if (!isAuthenticated || user?.role !== Role.Admin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bug': return 'bg-red-100 text-red-800';
      case 'feature': return 'bg-blue-100 text-blue-800';
      case 'feedback': return 'bg-green-100 text-green-800';
      case 'abuse': return 'bg-orange-100 text-orange-800';
      case 'technical': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderReportsManagement = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports Management</h2>
          <p className="text-gray-600">Review and manage user reports and feedback</p>
        </div>
        <button
          onClick={() => setActiveSection('dashboard')}
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>

      {loadingReports ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report._id} className="border rounded-lg p-6 bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <h3 className="text-xl font-semibold text-gray-900">{report.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                      {report.status.replace('_', ' ')}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(report.severity)}`}>
                      {report.severity}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(report.type)}`}>
                      {report.type}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-gray-600 mb-1">
                        <strong>Reporter:</strong> {report.reporterId.fullname.firstname} {report.reporterId.fullname.lastname} (@{report.reporterId.username})
                      </p>
                      <p className="text-gray-600 mb-1">
                        <strong>Category:</strong> {report.category}
                      </p>
                      <p className="text-gray-600 mb-1">
                        <strong>Priority:</strong> {report.priority}
                      </p>
                      {report.roomId && (
                        <p className="text-gray-600 mb-1">
                          <strong>Room ID:</strong> {report.roomId}
                        </p>
                      )}
                      {report.eventId && (
                        <p className="text-gray-600 mb-1">
                          <strong>Event ID:</strong> {report.eventId}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">
                        <strong>Created:</strong> {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-gray-600 mb-1">
                        <strong>Updated:</strong> {new Date(report.updatedAt).toLocaleDateString()}
                      </p>
                      {report.resolvedAt && (
                        <p className="text-gray-600 mb-1">
                          <strong>Resolved:</strong> {new Date(report.resolvedAt).toLocaleDateString()}
                        </p>
                      )}
                      {report.resolvedBy && (
                        <p className="text-gray-600 mb-1">
                          <strong>Resolved by:</strong> {report.resolvedBy.fullname.firstname} {report.resolvedBy.fullname.lastname}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Description:</h4>
                    <p className="text-gray-700 bg-white p-3 rounded border">{report.description}</p>
                  </div>
                  
                  {report.resolution && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Resolution:</h4>
                      <p className="text-gray-700 bg-green-50 p-3 rounded border">{report.resolution}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex-shrink-0 ml-6 space-y-2">
                  <div className="flex gap-2">
                    <select
                      value={report.status}
                      onChange={(e) => updateReportStatus(report._id, e.target.value)}
                      className="px-3 py-1 border rounded-md text-sm"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateReportStatus(report._id, 'resolved', 'Issue has been resolved')}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                      disabled={report.status === 'resolved'}
                    >
                      Resolve
                    </button>
                    <button
                      onClick={() => updateReportStatus(report._id, 'closed', 'Issue has been closed')}
                      className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                      disabled={report.status === 'closed'}
                    >
                      Close
                    </button>
                  </div>
                  
                  <button
                    onClick={() => updateReportStatus(report._id, 'in_progress')}
                    className="w-full px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
                    disabled={report.status === 'in_progress'}
                  >
                    Mark In Progress
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {reports.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No reports submitted yet.
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderProjectRankings = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Project Rankings</h2>
          <p className="text-gray-600">Manage submitted projects and set rankings</p>
        </div>
        <button
          onClick={() => setActiveSection('dashboard')}
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>

      {loadingProjects ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <div key={project._id} className="border rounded-lg p-6 bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <h3 className="text-xl font-semibold text-gray-900">{project.projectName}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      project.status === 'approved' ? 'bg-green-100 text-green-800' :
                      project.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {project.status}
                    </span>
                    {project.rank && (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Rank #{project.rank}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-2">
                    <strong>Developer:</strong> {project.developer}
                  </p>
                  <p className="text-gray-600 mb-2">
                    <strong>Category:</strong> {project.category}
                  </p>
                  <p className="text-gray-700 mb-4">{project.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.techStack.map((tech, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {tech}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex gap-4 text-sm">
                    <a 
                      href={project.githubUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      📁 GitHub
                    </a>
                    {project.demoUrl && (
                      <a 
                        href={project.demoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        🚀 Demo
                      </a>
                    )}
                  </div>
                </div>
                
                <div className="flex-shrink-0 ml-6 space-y-2">
                  <div className="flex gap-2">
                    <select
                      value={project.rank || ''}
                      onChange={(e) => updateProject(project._id, { 
                        rank: e.target.value ? parseInt(e.target.value) : undefined,
                        status: e.target.value ? 'approved' : project.status
                      })}
                      className="px-3 py-1 border rounded-md text-sm"
                    >
                      <option value="">No Rank</option>
                      <option value="1">Rank 1</option>
                      <option value="2">Rank 2</option>
                      <option value="3">Rank 3</option>
                    </select>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateProject(project._id, { status: 'approved' })}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                      disabled={project.status === 'approved'}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateProject(project._id, { status: 'rejected' })}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                      disabled={project.status === 'rejected'}
                    >
                      Reject
                    </button>
                  </div>
                  
                  <button
                    onClick={() => updateProject(project._id, { status: 'pending' })}
                    className="w-full px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
                  >
                    Mark Pending
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {projects.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No projects submitted yet.
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderNewsManagement = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">News Management</h2>
          <p className="text-gray-600">Manage news articles and announcements</p>
        </div>
        <button
          onClick={() => setActiveSection('dashboard')}
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
      
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">News Management functionality will be implemented later.</p>
        <p className="text-sm mt-2">This section will allow you to create, edit, and manage news articles.</p>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User Management Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">User Management</h3>
              <p className="text-sm text-gray-500">Manage users, roles, and permissions</p>
            </div>
          </div>
          <div className="mt-4">
            <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Manage Users
            </button>
          </div>
        </div>

        {/* Content Management Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Content Management</h3>
              <p className="text-sm text-gray-500">Manage news, announcements, and content</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <button 
              onClick={() => router.push('/admin/news')}
              className="w-full bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
            >
              News Management
            </button>
            <button 
              onClick={() => setActiveSection('projects')}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
            >
              Project Rankings
            </button>
          </div>
        </div>

        {/* Reports Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Reports</h3>
              <p className="text-sm text-gray-500">Review and manage user reports</p>
            </div>
          </div>
          <div className="mt-4">
            <button 
              onClick={() => setActiveSection('reports')}
              className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              View Reports
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900">1,234</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Events</p>
              <p className="text-2xl font-semibold text-gray-900">12</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Submitted Projects</p>
              <p className="text-2xl font-semibold text-gray-900">{projects.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Open Reports</p>
              <p className="text-2xl font-semibold text-gray-900">
                {reports.filter(r => r.status === 'open').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {activeSection === 'dashboard' ? 'Admin Dashboard' : 
             activeSection === 'news' ? 'News Management' : 
             activeSection === 'projects' ? 'Project Rankings' : 'Reports Management'}
          </h1>
          <p className="mt-2 text-gray-600">
            {activeSection === 'dashboard' 
              ? `Welcome back, ${user?.fullname.firstname}! Manage your platform from here.`
              : activeSection === 'news' 
              ? 'Manage news articles and announcements'
              : activeSection === 'projects'
              ? 'Review and rank submitted projects'
              : 'Review and manage user reports and feedback'
            }
          </p>
        </div>

        {activeSection === 'dashboard' && renderDashboard()}
        {activeSection === 'news' && renderNewsManagement()}
        {activeSection === 'projects' && renderProjectRankings()}
        {activeSection === 'reports' && renderReportsManagement()}
      </div>
    </div>
  );
} 