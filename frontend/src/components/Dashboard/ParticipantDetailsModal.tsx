"use client";

import { useThemeStore } from "@/Zustand_Store/ThemeStore";
import Image from "next/image";

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

interface ParticipantDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: ParticipantWithPopulatedUser | null;
  onStatusUpdate?: (participantId: string, status: string) => void;
}

export default function ParticipantDetailsModal({
  isOpen,
  onClose,
  participant,
  onStatusUpdate,
}: ParticipantDetailsModalProps) {
  const { primaryAccentColor, secondaryAccentColor } = useThemeStore();

  if (!isOpen || !participant) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        style={{ backgroundColor: "#111" }}
      >
        {/* Header */}
        <div 
          className="px-6 py-4 border-b border-white/20"
          style={{ backgroundColor: `${secondaryAccentColor}90` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                {participant.userId.avatar ? (
                  <Image 
                    src={participant.userId.avatar} 
                    alt={`${participant.userId.fullname.firstname} ${participant.userId.fullname.lastname}`}
                    width={48} 
                    height={48} 
                    className="rounded-full object-cover" 
                  />
                ) : (
                  <span className="text-white font-bold text-lg">
                    {participant.userId.fullname.firstname.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {participant.userId.fullname.firstname} {participant.userId.fullname.lastname}
                </h2>
                <p className="text-white/70">{participant.userId.email}</p>
                {participant.userId.username && (
                  <p className="text-white/60 text-sm">@{participant.userId.username}</p>
                )}
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Registration Status & Info */}
            <div 
              className="p-6 rounded-xl"
              style={{ backgroundColor: `${secondaryAccentColor}20` }}
            >
              <h3 className="text-xl font-bold text-white mb-4">Registration Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Current Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(participant.status)}`}>
                    {participant.status.charAt(0).toUpperCase() + participant.status.slice(1)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Registered:</span>
                  <span className="text-white">{formatDate(participant.createdAt)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Experience Level:</span>
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm capitalize">
                    {participant.experience}
                  </span>
                </div>
                
                {participant.teamId && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Team:</span>
                    <span className="text-white">{participant.teamId.name}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Team Preference:</span>
                  <span className="text-white capitalize">{participant.teamPreference}</span>
                </div>
              </div>

              {/* Action Buttons */}
              {onStatusUpdate && (
                <div className="mt-6 pt-4 border-t border-white/10">
                  <h4 className="text-white font-medium mb-3">Update Status:</h4>
                  <div className="flex gap-2">
                    {participant.status !== 'approved' && (
                      <button
                        onClick={() => onStatusUpdate(participant._id, 'approved')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        Approve
                      </button>
                    )}
                    {participant.status !== 'rejected' && (
                      <button
                        onClick={() => onStatusUpdate(participant._id, 'rejected')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        Reject
                      </button>
                    )}
                    {participant.status !== 'pending' && (
                      <button
                        onClick={() => onStatusUpdate(participant._id, 'pending')}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                      >
                        Mark Pending
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Skills & Technical Info */}
            <div 
              className="p-6 rounded-xl"
              style={{ backgroundColor: `${primaryAccentColor}20` }}
            >
              <h3 className="text-xl font-bold text-white mb-4">Skills & Technical Background</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-gray-300 text-sm font-medium">Skills:</label>
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-2">
                      {participant.skills.split(',').map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-white/10 text-white rounded-full text-sm"
                        >
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {participant.previousProjects && (
                  <div>
                    <label className="text-gray-300 text-sm font-medium">Previous Projects:</label>
                    <div 
                      className="mt-2 p-3 rounded-lg text-white"
                      style={{ backgroundColor: `${secondaryAccentColor}15` }}
                    >
                      <p className="text-sm leading-relaxed">{participant.previousProjects}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Motivation */}
            <div 
              className="p-6 rounded-xl"
              style={{ backgroundColor: `${secondaryAccentColor}20` }}
            >
              <h3 className="text-xl font-bold text-white mb-4">Motivation</h3>
              <div 
                className="p-4 rounded-lg"
                style={{ backgroundColor: `${primaryAccentColor}15` }}
              >
                <p className="text-white leading-relaxed">{participant.motivation}</p>
              </div>
            </div>

            {/* Expectations */}
            <div 
              className="p-6 rounded-xl"
              style={{ backgroundColor: `${primaryAccentColor}20` }}
            >
              <h3 className="text-xl font-bold text-white mb-4">Expectations</h3>
              <div 
                className="p-4 rounded-lg"
                style={{ backgroundColor: `${secondaryAccentColor}15` }}
              >
                <p className="text-white leading-relaxed">{participant.expectations}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 