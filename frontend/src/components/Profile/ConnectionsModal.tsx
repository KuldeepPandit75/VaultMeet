'use client';

import { useState, useEffect } from 'react';
import { useThemeStore } from '@/Zustand_Store/ThemeStore';
import useAuthStore from '@/Zustand_Store/AuthStore';
import Image from 'next/image';
import { FaTimes, FaChevronLeft, FaChevronRight, FaMapMarkerAlt, FaEnvelope } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface Connection {
  _id: string;
  fullname: { firstname: string; lastname: string };
  avatar?: string;
  username?: string;
  email: string;
  location?: string;
}

interface ConnectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

export default function ConnectionsModal({ isOpen, onClose, userId, userName }: ConnectionsModalProps) {
  const { secondaryAccentColor, isDarkMode, primaryAccentColor } = useThemeStore();
  const { getConnections } = useAuthStore();
  
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalConnections: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  const fetchConnections = async (page: number = 1) => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const result = await getConnections(userId, page, 10);
      setConnections(result.connections);
      setPagination(result.pagination);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast.error('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      fetchConnections(1);
    }
  }, [isOpen, userId]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchConnections(newPage);
    }
  };

  const handleProfileClick = (connection: Connection) => {
    if (connection.username) {
      window.open(`/profile/${connection.username}`, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`${isDarkMode ? 'bg-[#333]' : 'bg-white'} rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden`}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {userName}&apos;s Connections
            </h2>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
              {pagination.totalConnections} total connections
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-700' : ''}`}
          >
            <FaTimes className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : connections.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">👥</div>
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                No connections yet
              </p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mt-2`}>
                {userName} hasn&apos;t made any connections yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {connections.map((connection) => (
                <div
                  key={connection._id}
                  className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.02] ${
                    isDarkMode ? 'bg-[#222] hover:bg-[#111]' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => handleProfileClick(connection)}
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {connection.avatar ? (
                      <Image
                        src={connection.avatar}
                        alt={`${connection.fullname.firstname} ${connection.fullname.lastname}`}
                        width={50}
                        height={50}
                        className="rounded-full"
                      />
                    ) : (
                      <div
                        className="w-[50px] h-[50px] rounded-full flex items-center justify-center text-lg font-bold"
                        style={{ backgroundColor: secondaryAccentColor, color: '#000' }}
                      >
                        {connection.fullname.firstname.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        {connection.fullname.firstname} {connection.fullname.lastname}
                      </h3>
                      {connection.username && (
                        <span className={`text-sm px-2 py-1 rounded-full`}
                        style={{ backgroundColor:  `${primaryAccentColor}cc` , color: isDarkMode ? '#000' : '#fff' }}
                        >
                          @{connection.username}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <FaEnvelope className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} size={12} />
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                          {connection.email}
                        </span>
                      </div>
                      {connection.location && (
                        <div className="flex items-center gap-1">
                          <FaMapMarkerAlt className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} size={12} />
                          <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                            {connection.location}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* View Profile Button */}
                  <button
                    className={`px-3 py-1.5 text-xs rounded-lg transition-colors`}
                    style={{ backgroundColor: `${primaryAccentColor}cc`, color: isDarkMode ? '#000' : '#fff' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProfileClick(connection);
                    }}
                  >
                    View Profile
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-between items-center p-6 border-t border-gray-200">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!pagination.hasPrevPage}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                pagination.hasPrevPage
                  ? isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <FaChevronLeft size={14} />
              Previous
            </button>

            <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Page {currentPage} of {pagination.totalPages}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                pagination.hasNextPage
                  ? isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              Next
              <FaChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 