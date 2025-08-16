'use client';

import { useThemeStore } from "@/Zustand_Store/ThemeStore";
import useEventStore from "@/Zustand_Store/EventStore";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import type { Event } from "@/Zustand_Store/EventStore";
import toast from "react-hot-toast";
import ParticipantDetailsModal from "@/components/Dashboard/ParticipantDetailsModal";

type EventStatus = 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';

// Create extended interface for dashboard
interface DashboardEvent extends Event {
  createdAt?: Date;
  updatedAt?: Date;
  sponsors?: Array<{
    name: string;
    logo: string;
    website: string;
  }>;
}


export default function EventDashboard() {
  const params = useParams();
  const eventId = params.eventId as string;
  const { primaryAccentColor, secondaryAccentColor } = useThemeStore();
  const { getEventById, updateEvent, publishEvent, unpublishEvent, deleteEvent, getEventParticipants, updateParticipantStatus, bulkUpdateParticipants, loading, error } = useEventStore();
  
  // Update component state
  const [event, setEvent] = useState<DashboardEvent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [editedEvent, setEditedEvent] = useState<DashboardEvent | null>(null);
  
  // Participant management states
  const [participantStats, setParticipantStats] = useState<{
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  }>({ total: 0, approved: 0, pending: 0, rejected: 0 });
  const [participantFilters, setParticipantFilters] = useState({
    status: '',
    search: '',
    page: 1,
    limit: 10
  });
  // const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [participantLoading, setParticipantLoading] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantWithPopulatedUser | null>(null);
  const [showParticipantModal, setShowParticipantModal] = useState(false);

  // Update participants state type
  const [participants, setParticipants] = useState<ParticipantWithPopulatedUser[]>([]);

  useEffect(() => {
    if (eventId) {
      loadEvent();
      loadParticipants(); // Load participant stats immediately
    }
  }, [eventId]);

  useEffect(() => {
    if (activeTab === 'participants') {
      loadParticipants();
    }
  }, [activeTab, participantFilters]);

  // Fix event loading
  const loadEvent = async () => {
    try {
      const eventData = await getEventById(eventId);
      setEvent(eventData as DashboardEvent);
      setEditedEvent(eventData as DashboardEvent);
    } catch (error) {
      console.error('Error loading event:', error);
    }
  };

  // Fix the participants interface
  interface ParticipantWithPopulatedUser {
    _id: string;
    userId: {
      _id: string;
      fullname: { firstname: string; lastname: string };
      email: string;
      avatar?: string;
      username?: string;
    };
    eventId: string;
    status: 'pending' | 'approved' | 'rejected';
    experience: string;
    motivation: string;
    skills: string;
    previousProjects?: string;
    expectations: string;
    teamPreference: string;
    teamId?: {
      _id: string;
      name: string;
      leaderId: string;
    } | null;
    createdAt: string;
  }

  // Fix loadParticipants with proper type assertion
  const loadParticipants = async () => {
    if (!eventId) return;
       setParticipantLoading(true);
    try {
      const response = await getEventParticipants(eventId, participantFilters) as unknown as {
        participants: ParticipantWithPopulatedUser[];
        stats: { total: number; approved: number; pending: number; rejected: number; };
      };
      // Handle the response structure properly
      if (response && typeof response === 'object') {
        setParticipants(response.participants || []);
        setParticipantStats(response.stats || { total: 0, approved: 0, pending: 0, rejected: 0 });
      }
    } catch (error) {
      console.error('Failed to load participants:', error);
      toast.error('Failed to load participants');
    } finally {
      setParticipantLoading(false);
    }
  };

  // Fix handleSave function
  const handleSave = async () => {
    if (!editedEvent) return;
    
    try {
      await updateEvent(eventId, editedEvent as unknown as Event);
      setEvent(editedEvent);
      setIsEditing(false);
      toast.success('Event updated successfully');
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
    }
  };

  const handlePublish = async () => {
    try {
      await publishEvent(eventId);
      await loadEvent(); // Reload to get updated status
      toast.success('Event published successfully');
    } catch (error) {
      console.error('Error publishing event:', error);
      toast.error('Failed to publish event');
    }
  };

  const handleUnpublish = async () => {
    if (!confirm('Are you sure you want to unpublish this event? It will be moved back to draft status.')) {
      return;
    }
    try {
      await unpublishEvent(eventId);
      await loadEvent(); // Reload to get updated status
      toast.success('Event unpublished successfully');
    } catch (error) {
      console.error('Error unpublishing event:', error);
      toast.error('Failed to unpublish event');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteEvent(eventId);
      toast.success('Event deleted successfully');
      // Redirect to events list or dashboard
      window.location.href = '/host';
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  const handleChange = (field: string, value: string | number | boolean | Date) => {
    if (!editedEvent) return;
    
    const keys = field.split('.');
    const newEvent = { ...editedEvent };
    let current: Record<string, unknown> = newEvent as Record<string, unknown>;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]] as Record<string, unknown>;
    }
    current[keys[keys.length - 1]] = value;
    
    setEditedEvent(newEvent);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: EventStatus) => {
    switch (status) {
      case 'draft': return '#FFA500';
      case 'published': return '#00FF00';
      case 'ongoing': return '#0066FF';
      case 'completed': return '#666666';
      case 'cancelled': return '#FF0000';
      default: return '#FFA500';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'details', label: 'Event Details' },
    { id: 'venue', label: 'Venue & Logistics' },
    { id: 'prizes', label: 'Prizes & Sponsors' },
    { id: 'participants', label: 'Participants' },
    { id: 'analytics', label: 'Analytics' }
  ];

  if (!event) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading event...</p>
        </div>
      </div>
    );
  }

  const handleParticipantStatusUpdate = async (participantId: string, newStatus: string) => {
    try {
      await updateParticipantStatus(eventId, participantId, newStatus);
      await loadParticipants();
    } catch (error) {
      console.error('Failed to update participant status:', error);
    }
  };

  const handleTeamStatusUpdate = async (memberIds: string[], newStatus: string) => {
    try {
      await bulkUpdateParticipants(eventId, memberIds, newStatus);
      await loadParticipants();
    } catch (error) {
      console.error('Failed to update team status:', error);
    }
  };

  const handleParticipantClick = (participant: ParticipantWithPopulatedUser) => {
    setSelectedParticipant(participant);
    setShowParticipantModal(true);
  };

  const handleCloseParticipantModal = () => {
    setShowParticipantModal(false);
    setSelectedParticipant(null);
  };

  const handleParticipantStatusUpdateFromModal = async (participantId: string, status: string) => {
    await handleParticipantStatusUpdate(participantId, status);
    handleCloseParticipantModal();
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: primaryAccentColor }}>
              {event.name}
            </h1>
            <div className="flex items-center gap-4">
              <span 
                className="px-3 py-1 rounded-full text-sm font-semibold"
                style={{ 
                  backgroundColor: getStatusColor(event.status) + '20',
                  color: getStatusColor(event.status),
                  border: `1px solid ${getStatusColor(event.status)}`
                }}
              >
                {event.status.toUpperCase()}
              </span>
              <span className="text-gray-400">
                Created: {(event as DashboardEvent)?.createdAt ? formatDate(new Date((event as DashboardEvent).createdAt!)) : 'N/A'}
              </span>
              <span className="text-gray-400">
                Last Updated: {(event as DashboardEvent)?.updatedAt ? formatDate(new Date((event as DashboardEvent).updatedAt!)) : 'N/A'}
              </span>
            </div>
          </div>
          
          <div className="flex gap-3">
            {event.status === 'draft' && (
              <>
                <button
                  onClick={handlePublish}
                  disabled={loading}
                  className="px-6 py-2 rounded-lg font-semibold"
                  style={{ backgroundColor: '#00FF00', color: '#000' }}
                >
                  {loading ? 'Publishing...' : 'Publish Event'}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-6 py-2 rounded-lg font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  {loading ? 'Deleting...' : 'Delete Event'}
                </button>
              </>
            )}
            {event.status === 'published' && (
              <button
                onClick={handleUnpublish}
                disabled={loading}
                className="px-6 py-2 rounded-lg font-semibold bg-yellow-600 hover:bg-yellow-700 text-white transition-colors"
              >
                {loading ? 'Unpublishing...' : 'Unpublish Event'}
              </button>
            )}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-6 py-2 rounded-lg"
              style={{ backgroundColor: `${primaryAccentColor}40`, color: primaryAccentColor }}
            >
              {isEditing ? 'Cancel' : 'Edit Event'}
            </button>
            {isEditing && (
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-2 rounded-lg"
                style={{ backgroundColor: primaryAccentColor, color: 'white' }}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500 text-white">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-600 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-semibold ${
                activeTab === tab.id
                  ? 'border-b-2 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              style={{
                borderBottomColor: activeTab === tab.id ? primaryAccentColor : 'transparent'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-3 gap-8">
            {/* Stats Cards */}
            <div className="md:col-span-2 grid md:grid-cols-2 gap-6">
              <div 
                className="p-6 rounded-xl"
                style={{ backgroundColor: `${primaryAccentColor}20` }}
              >
                <h3 className="text-xl font-semibold mb-2" style={{ color: primaryAccentColor }}>
                  Registered Participants
                </h3>
                <p className="text-3xl font-bold text-white">
                  {participantStats.total || 0}
                </p>
                <p className="text-gray-400">of {event.maxParticipants} max</p>
              </div>
              
              <div 
                className="p-6 rounded-xl"
                style={{ backgroundColor: `${secondaryAccentColor}20` }}
              >
                <h3 className="text-xl font-semibold mb-2" style={{ color: secondaryAccentColor }}>
                  Approved Participants
                </h3>
                <p className="text-3xl font-bold text-white">
                  {participantStats.approved || 0}
                </p>
                <p className="text-gray-400">ready to participate</p>
              </div>

              <div 
                className="p-6 rounded-xl"
                style={{ backgroundColor: `${primaryAccentColor}20` }}
              >
                <h3 className="text-xl font-semibold mb-2" style={{ color: primaryAccentColor }}>
                  Event Type
                </h3>
                <p className="text-xl font-semibold text-white capitalize">
                  {event.type}
                </p>
                <p className="text-gray-400">{event.mode} event</p>
              </div>

              <div 
                className="p-6 rounded-xl"
                style={{ backgroundColor: `${secondaryAccentColor}20` }}
              >
                <h3 className="text-xl font-semibold mb-2" style={{ color: secondaryAccentColor }}>
                  Duration
                </h3>
                <p className="text-xl font-semibold text-white">
                  {event.duration}
                </p>
                <p className="text-gray-400">
                  {formatDate(event.startDate)} - {formatDate(event.endDate)}
                </p>
              </div>
            </div>

            {/* Event Info */}
            <div 
              className="p-6 rounded-xl"
              style={{ backgroundColor: `${primaryAccentColor}20` }}
            >
              <h3 className="text-xl font-semibold mb-4" style={{ color: primaryAccentColor }}>
                Quick Info
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-400">Target Audience:</span>
                  <p className="text-white capitalize">{event.targetAudience}</p>
                </div>
                <div>
                  <span className="text-gray-400">Company:</span>
                  <p className="text-white">{event.company.name}</p>
                </div>
                <div>
                  <span className="text-gray-400">Contact:</span>
                  <p className="text-white">{event.contact.name}</p>
                  <p className="text-gray-300 text-sm">{event.contact.email}</p>
                </div>
                {event.venue && (
                  <div>
                    <span className="text-gray-400">Venue:</span>
                    <p className="text-white">{event.venue.name}</p>
                    <p className="text-gray-300 text-sm">{event.venue.city}, {event.venue.country}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'details' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div 
              className="p-6 rounded-xl"
              style={{ backgroundColor: `${primaryAccentColor}20` }}
            >
              <h3 className="text-xl font-semibold mb-4" style={{ color: primaryAccentColor }}>
                Event Information
              </h3>
              <div className="space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <label className="block mb-2 text-gray-300">Event Name</label>
                      <input
                        type="text"
                        value={editedEvent?.name || ''}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-gray-300">Description</label>
                      <textarea
                        value={editedEvent?.description || ''}
                        onChange={(e) => handleChange('description', e.target.value)}
                        className="w-full p-2 rounded-lg border border-white bg-transparent text-white h-32"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-gray-300">Event Type</label>
                      <select
                        value={editedEvent?.type || ''}
                        onChange={(e) => handleChange('type', e.target.value)}
                        className="w-full p-2 rounded-lg border border-white text-white bg-gray-800"
                      >
                        <option value="hackathon">Hackathon</option>
                        <option value="workshop">Workshop</option>
                        <option value="webinar">Webinar</option>
                        <option value="tech-talk">Tech Talk</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-2 text-gray-300">Target Audience</label>
                      <select
                        value={editedEvent?.targetAudience || ''}
                        onChange={(e) => handleChange('targetAudience', e.target.value)}
                        className="w-full p-2 rounded-lg border border-white text-white bg-gray-800"
                      >
                        <option value="students">Students</option>
                        <option value="professionals">Professionals</option>
                        <option value="startups">Startups</option>
                        <option value="all">All</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-2 text-gray-300">Max Participants</label>
                      <input
                        type="number"
                        value={editedEvent?.maxParticipants || ''}
                        onChange={(e) => handleChange('maxParticipants', parseInt(e.target.value))}
                        className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-gray-400">Description:</span>
                      <p className="text-white mt-1">{event.description}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Type:</span>
                      <p className="text-white capitalize">{event.type}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Mode:</span>
                      <p className="text-white capitalize">{event.mode}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Target Audience:</span>
                      <p className="text-white capitalize">{event.targetAudience}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Max Participants:</span>
                      <p className="text-white">{event.maxParticipants}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div 
              className="p-6 rounded-xl"
              style={{ backgroundColor: `${secondaryAccentColor}20` }}
            >
              <h3 className="text-xl font-semibold mb-4" style={{ color: secondaryAccentColor }}>
                Event Stages
              </h3>
              {event.stages && event.stages.length > 0 ? (
                <div className="space-y-3">
                  {event.stages.map((stage, index) => (
                    <div key={index} className="p-3 border border-gray-600 rounded-lg">
                      <h4 className="font-semibold text-white">{stage.stageName}</h4>
                      <p className="text-gray-300 text-sm">{stage.stageDescription}</p>
                      <p className="text-gray-400 text-xs mt-1">
                        {formatDate(new Date(stage.stageStartDate))}
                        {stage.onVaultMeet && (
                          <span className="ml-2 px-2 py-1 bg-green-600 text-white text-xs rounded">
                            On VaultMeet
                          </span>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No stages defined</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'venue' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div 
              className="p-6 rounded-xl"
              style={{ backgroundColor: `${primaryAccentColor}20` }}
            >
              <h3 className="text-xl font-semibold mb-4" style={{ color: primaryAccentColor }}>
                Event Mode & Venue
              </h3>
              <div className="space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <label className="block mb-2 text-gray-300">Event Mode</label>
                      <select
                        value={editedEvent?.mode || ''}
                        onChange={(e) => handleChange('mode', e.target.value)}
                        className="w-full p-2 rounded-lg border border-white text-white bg-gray-800"
                      >
                        <option value="online">Online</option>
                        <option value="offline">Offline</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>
                    {(editedEvent?.mode === 'offline' || editedEvent?.mode === 'hybrid') && (
                      <>
                        <div>
                          <label className="block mb-2 text-gray-300">Venue Name</label>
                          <input
                            type="text"
                            value={editedEvent?.venue?.name || ''}
                            onChange={(e) => handleChange('venue.name', e.target.value)}
                            className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                          />
                        </div>
                        <div>
                          <label className="block mb-2 text-gray-300">Address</label>
                          <input
                            type="text"
                            value={editedEvent?.venue?.address || ''}
                            onChange={(e) => handleChange('venue.address', e.target.value)}
                            className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                          />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block mb-2 text-gray-300">City</label>
                            <input
                              type="text"
                              value={editedEvent?.venue?.city || ''}
                              onChange={(e) => handleChange('venue.city', e.target.value)}
                              className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                            />
                          </div>
                          <div>
                            <label className="block mb-2 text-gray-300">Country</label>
                            <input
                              type="text"
                              value={editedEvent?.venue?.country || ''}
                              onChange={(e) => handleChange('venue.country', e.target.value)}
                              className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-gray-400">Mode:</span>
                      <p className="text-white capitalize">{event.mode}</p>
                    </div>
                    {event.venue && (
                      <>
                        <div>
                          <span className="text-gray-400">Venue:</span>
                          <p className="text-white">{event.venue.name}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Address:</span>
                          <p className="text-white">{event.venue.address}</p>
                          <p className="text-gray-300">{event.venue.city}, {event.venue.country}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Contact Person:</span>
                          <p className="text-white">{event.venue.contactPerson}</p>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            <div 
              className="p-6 rounded-xl"
              style={{ backgroundColor: `${secondaryAccentColor}20` }}
            >
              <h3 className="text-xl font-semibold mb-4" style={{ color: secondaryAccentColor }}>
                Schedule & Duration
              </h3>
              <div className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-2 text-gray-300">Start Date</label>
                        <input
                          type="datetime-local"
                          value={editedEvent?.startDate ? new Date(editedEvent.startDate).toISOString().slice(0, 16) : ''}
                          onChange={(e) => handleChange('startDate', new Date(e.target.value))}
                          className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                        />
                      </div>
                      <div>
                        <label className="block mb-2 text-gray-300">End Date</label>
                        <input
                          type="datetime-local"
                          value={editedEvent?.endDate ? new Date(editedEvent.endDate).toISOString().slice(0, 16) : ''}
                          onChange={(e) => handleChange('endDate', new Date(e.target.value))}
                          className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block mb-2 text-gray-300">Duration</label>
                      <input
                        type="text"
                        value={editedEvent?.duration || ''}
                        onChange={(e) => handleChange('duration', e.target.value)}
                        className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-gray-400">Start Date:</span>
                      <p className="text-white">{formatDate(event.startDate)}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">End Date:</span>
                      <p className="text-white">{formatDate(event.endDate)}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Duration:</span>
                      <p className="text-white">{event.duration}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'prizes' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div 
              className="p-6 rounded-xl"
              style={{ backgroundColor: `${primaryAccentColor}20` }}
            >
              <h3 className="text-xl font-semibold mb-4" style={{ color: primaryAccentColor }}>
                Prizes & Incentives
              </h3>
              <div className="space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <label className="block mb-2 text-gray-300">Has Prizes?</label>
                      <select
                        value={editedEvent?.prizes.hasPrizes ? 'yes' : 'no'}
                        onChange={(e) => handleChange('prizes.hasPrizes', e.target.value === 'yes')}
                        className="w-full p-2 rounded-lg border border-white text-white bg-gray-800"
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                    {editedEvent?.prizes.hasPrizes && (
                      <>
                        <div>
                          <label className="block mb-2 text-gray-300">Prize Pool</label>
                          <input
                            type="text"
                            value={editedEvent?.prizes.prizePool || ''}
                            onChange={(e) => handleChange('prizes.prizePool', e.target.value)}
                            className="w-full p-2 rounded-lg border border-white bg-transparent text-white"
                          />
                        </div>
                        <div>
                          <label className="block mb-2 text-gray-300">Prize Details</label>
                          <textarea
                            value={editedEvent?.prizes.details || ''}
                            onChange={(e) => handleChange('prizes.details', e.target.value)}
                            className="w-full p-2 rounded-lg border border-white bg-transparent text-white h-32"
                          />
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-gray-400">Has Prizes:</span>
                      <p className="text-white">{event.prizes.hasPrizes ? 'Yes' : 'No'}</p>
                    </div>
                    {event.prizes.hasPrizes && (
                      <>
                        {event.prizes.prizePool && (
                          <div>
                            <span className="text-gray-400">Prize Pool:</span>
                            <p className="text-white">{event.prizes.prizePool}</p>
                          </div>
                        )}
                        {event.prizes.details && (
                          <div>
                            <span className="text-gray-400">Details:</span>
                            <p className="text-white mt-1">{event.prizes.details}</p>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            <div 
              className="p-6 rounded-xl"
              style={{ backgroundColor: `${secondaryAccentColor}20` }}
            >
              <h3 className="text-xl font-semibold mb-4" style={{ color: secondaryAccentColor }}>
                Sponsors
              </h3>
              {(event as DashboardEvent)?.sponsors && (event as DashboardEvent).sponsors!.length > 0 ? (
                (event as DashboardEvent).sponsors!.map((sponsor: { name: string; logo: string; website: string }, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                    <div className="relative w-12 h-12">
                      <Image
                        src={sponsor.logo}
                        alt={sponsor.name}
                        width={48}
                        height={48}
                        className="object-contain rounded"
                      />
                    </div>
                    <div>
                      <p className="text-white font-medium">{sponsor.name}</p>
                      <a 
                        href={sponsor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        Visit Website
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">No sponsors added</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'participants' && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-3 gap-6">
              <div 
                className="p-6 rounded-xl text-center"
                style={{ backgroundColor: `${primaryAccentColor}20` }}
              >
                <h3 className="text-lg font-semibold mb-2" style={{ color: primaryAccentColor }}>
                  Total Registered
                </h3>
                <p className="text-4xl font-bold text-white">
                  {participantStats.total || 0}
                </p>
              </div>
              
              <div 
                className="p-6 rounded-xl text-center"
                style={{ backgroundColor: `${secondaryAccentColor}20` }}
              >
                <h3 className="text-lg font-semibold mb-2" style={{ color: secondaryAccentColor }}>
                  Approved
                </h3>
                <p className="text-4xl font-bold text-white">
                  {participantStats.approved || 0}
                </p>
              </div>

              <div 
                className="p-6 rounded-xl text-center"
                style={{ backgroundColor: `${primaryAccentColor}20` }}
              >
                <h3 className="text-lg font-semibold mb-2" style={{ color: primaryAccentColor }}>
                  Pending
                </h3>
                <p className="text-4xl font-bold text-white">
                  {participantStats.pending || 0}
                </p>
              </div>
            </div>

            {/* Participant Management */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-6 text-white">Participant Management</h3>
              
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <input
                  type="text"
                  placeholder="Search participants..."
                  value={participantFilters.search}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setParticipantFilters((prev: { status: string; search: string; page: number; limit: number; }) => ({ ...prev, search: e.target.value, page: 1 }))}
                  className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-white/40"
                />
                <select
                  value={participantFilters.status}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setParticipantFilters((prev: { status: string; search: string; page: number; limit: number; }) => ({ ...prev, status: e.target.value, page: 1 }))}
                  className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-white/40"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Participants Table */}
              {participantLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-white/70">Loading participants...</p>
                </div>
              ) : participants.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white/70">No participants found</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Group by teamId */}
                  {Object.entries(
                    participants.reduce((acc, participant) => {
                      const teamKey = participant.teamId ? participant.teamId._id : 'solo';
                      if (!acc[teamKey]) acc[teamKey] = [];
                      acc[teamKey].push(participant);
                      return acc;
                    }, {} as Record<string, ParticipantWithPopulatedUser[]>)
                  ).map(([teamId, members]: [string, ParticipantWithPopulatedUser[]]) => (
                    <div key={teamId} className="bg-white/10 rounded-xl p-4">
                      <h4 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                        {teamId === 'solo' ? 'Solo Participants' : (
                          <>
                            <span className="text-blue-300">Team:</span> {members[0].teamId?.name}
                          </>
                        )}
                      </h4>
                      {/* Team-level Approve/Reject for teams */}
                      {teamId !== 'solo' && (
                        <div className="flex gap-2 mb-4">
                          {!members.some((m: ParticipantWithPopulatedUser) => m.status === 'approved') && (
                            <button
                              onClick={() => handleTeamStatusUpdate(members.map((m: ParticipantWithPopulatedUser) => m._id), 'approved')}
                              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                            >
                              Approve Team
                            </button>
                          )}
                          {!members.some((m: ParticipantWithPopulatedUser) => m.status === 'rejected') && (
                            <button
                              onClick={() => handleTeamStatusUpdate(members.map((m: ParticipantWithPopulatedUser) => m._id), 'rejected')}
                              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                            >
                              Reject Team
                            </button>
                          )}
                        </div>
                      )}
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-white/20">
                              <th className="text-left p-3 text-white/80">Participant</th>
                              <th className="text-left p-3 text-white/80">Experience</th>
                              <th className="text-left p-3 text-white/80">Status</th>
                              <th className="text-left p-3 text-white/80">Registered</th>
                              {teamId === 'solo' && (
                                <th className="text-left p-3 text-white/80">Actions</th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {members.map((participant: ParticipantWithPopulatedUser) => (
                              <tr key={participant._id} className="border-b border-white/10 hover:bg-white/5">
                                <td className="p-3">
                                  <div 
                                    className="flex items-center gap-3 cursor-pointer hover:bg-white/5 rounded-lg p-2 -m-2 transition-colors"
                                    onClick={() => handleParticipantClick(participant)}
                                  >
                                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                      {participant.userId.avatar ? (
                                        <Image 
                                          src={participant.userId.avatar} 
                                          alt={`${participant.userId.fullname.firstname} ${participant.userId.fullname.lastname}`}
                                          width={40} 
                                          height={40} 
                                          className="rounded-full" 
                                        />
                                      ) : (
                                        <span className="text-white font-semibold">
                                          {participant.userId.fullname.firstname.charAt(0)}
                                        </span>
                                      )}
                                    </div>
                                    <div>
                                      <p className="text-white font-medium hover:text-blue-300 transition-colors">
                                        {participant.userId.fullname.firstname} {participant.userId.fullname.lastname}
                                      </p>
                                      <p className="text-white/60 text-sm">{participant.userId.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3">
                                  <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs capitalize">
                                    {participant.experience}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    participant.status === 'approved' ? 'bg-green-100 text-green-800' :
                                    participant.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {participant.status}
                                  </span>
                                </td>
                                <td className="p-3 text-white/70 text-sm">
                                  {new Date(participant.createdAt).toLocaleDateString()}
                                </td>
                                {teamId === 'solo' && (
                                  <td className="p-3">
                                    <div className="flex gap-2">
                                      {participant.status !== 'approved' && (
                                        <button
                                          onClick={() => handleParticipantStatusUpdate(participant._id, 'approved')}
                                          className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                                        >
                                          Approve
                                        </button>
                                      )}
                                      {participant.status !== 'rejected' && (
                                        <button
                                          onClick={() => handleParticipantStatusUpdate(participant._id, 'rejected')}
                                          className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                                        >
                                          Reject
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div 
                className="p-6 rounded-xl"
                style={{ backgroundColor: `${primaryAccentColor}20` }}
              >
                <h3 className="text-xl font-semibold mb-4" style={{ color: primaryAccentColor }}>
                  Registration Analytics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Registration Rate:</span>
                    <span className="text-white font-semibold">
                      {((participantStats.total / event.maxParticipants) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Approval Rate:</span>
                    <span className="text-white font-semibold">
                      {participantStats.total > 0 
                        ? ((participantStats.approved / participantStats.total) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full"
                      style={{ 
                        backgroundColor: primaryAccentColor,
                        width: `${(participantStats.total / event.maxParticipants) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div 
                className="p-6 rounded-xl"
                style={{ backgroundColor: `${secondaryAccentColor}20` }}
              >
                <h3 className="text-xl font-semibold mb-4" style={{ color: secondaryAccentColor }}>
                  Event Status
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Current Status:</span>
                    <span 
                      className="px-3 py-1 rounded-full text-sm font-semibold"
                      style={{ 
                        backgroundColor: getStatusColor(event.status) + '20',
                        color: getStatusColor(event.status),
                        border: `1px solid ${getStatusColor(event.status)}`
                      }}
                    >
                      {event.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Days Until Start:</span>
                    <span className="text-white font-semibold">
                      {Math.ceil((event.startDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Target Audience:</span>
                    <span className="text-white font-semibold capitalize">{event.targetAudience}</span>
                  </div>
                </div>
              </div>
            </div>

            <div 
              className="p-6 rounded-xl"
              style={{ backgroundColor: `${primaryAccentColor}20` }}
            >
              <h3 className="text-xl font-semibold mb-4" style={{ color: primaryAccentColor }}>
                Detailed Analytics
              </h3>
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">Advanced analytics coming soon!</p>
                <p className="text-gray-500 text-sm">
                  Here you&apos;ll see detailed charts, participant demographics, engagement metrics, and more.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Participant Details Modal */}
        <ParticipantDetailsModal
          isOpen={showParticipantModal}
          onClose={handleCloseParticipantModal}
          participant={selectedParticipant}
          onStatusUpdate={handleParticipantStatusUpdateFromModal}
        />
      </div>
    </div>
  );
} 