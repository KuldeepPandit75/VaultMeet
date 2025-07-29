'use client';

import { useThemeStore } from '@/Zustand_Store/ThemeStore';
import useAuthStore from '@/Zustand_Store/AuthStore';
import { FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useState } from 'react';

interface RemoveConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
  targetUserName: string;
  onConnectionRemoved: () => void;
}

export default function RemoveConnectionModal({ 
  isOpen, 
  onClose, 
  targetUserId, 
  targetUserName,
  onConnectionRemoved 
}: RemoveConnectionModalProps) {
  const { primaryAccentColor, secondaryAccentColor, isDarkMode } = useThemeStore();
  const { removeConnection } = useAuthStore();
  
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemoveConnection = async () => {
    setIsRemoving(true);
    try {
      await removeConnection(targetUserId);
      toast.success('Connection removed successfully');
      onConnectionRemoved();
      onClose();
    } catch (error) {
      console.error('Error removing connection:', error);
      toast.error('Failed to remove connection');
    } finally {
      setIsRemoving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl w-full max-w-md overflow-hidden`}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100">
              <FaExclamationTriangle className="text-red-600" size={20} />
            </div>
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Remove Connection
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-700' : ''}`}
          >
            <FaTimes className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
            Are you sure you want to remove your connection with{' '}
            <span className="font-semibold">{targetUserName}</span>?
          </p>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-6`}>
            This action cannot be undone. You will no longer be connected to this user.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isRemoving}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDarkMode 
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            } border`}
          >
            Cancel
          </button>
          <button
            onClick={handleRemoveConnection}
            disabled={isRemoving}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-white"
            style={{ backgroundColor: '#ef4444' }}
          >
            {isRemoving ? 'Removing...' : 'Remove Connection'}
          </button>
        </div>
      </div>
    </div>
  );
} 