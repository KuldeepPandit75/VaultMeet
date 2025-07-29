'use client';

import { useState, useEffect } from 'react';
import { useThemeStore } from '@/Zustand_Store/ThemeStore';
import useAuthStore from '@/Zustand_Store/AuthStore';
import useChatSocketStore from '@/Zustand_Store/ChatSocketStore';
import { Conversation } from '@/Zustand_Store/ChatStore';
import Image from 'next/image';
import { FaComments, FaChevronUp, FaChevronDown, FaSearch } from 'react-icons/fa';

interface ChatSidebarProps {
  onOpenChat: (conversation: Conversation) => void;
  isAuthenticated: boolean;
}

export default function ChatSidebar({ onOpenChat, isAuthenticated }: ChatSidebarProps) {
  const { primaryAccentColor, secondaryAccentColor, isDarkMode } = useThemeStore();
  const { getConversations, getUnreadMessageCount, user } = useAuthStore();
  const { socket, connect, on: socketOn, off: socketOff } = useChatSocketStore();
  
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalUnread, setTotalUnread] = useState(0);

  const fetchConversations = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const result = await getConversations(1, 10);
      setConversations(result.conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    if (!isAuthenticated) return;
    
    try {
      const result = await getUnreadMessageCount();
      setTotalUnread(result.unreadCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
      fetchUnreadCount();
    }
  }, [isAuthenticated]);

  // Listen for messages being marked as read
  useEffect(() => {
    const handleMessagesMarkedRead = () => {
      fetchUnreadCount();
      fetchConversations();
    };

    window.addEventListener('messages-marked-read', handleMessagesMarkedRead);

    return () => {
      window.removeEventListener('messages-marked-read', handleMessagesMarkedRead);
    };
  }, []);

  // Socket connection and real-time updates
  useEffect(() => {
    if (!socket) {
      connect();
    }

    if (socket && user) {
      // Join user's chat room
      socket.emit('join-chat', user._id);

      // Listen for new messages to update conversations
      socketOn('new-message', () => {
        // Refresh conversations to get updated last message
        fetchConversations();
        fetchUnreadCount();
      });

      // Listen for messages being read
      socketOn('messages-read', () => {
        // Refresh unread count
        fetchUnreadCount();
      });
    }

    return () => {
      socketOff('new-message');
      socketOff('messages-read');
    };
  }, [socket, user, isAuthenticated]);

  const filteredConversations = conversations.filter(conv =>
    `${conv.otherUser.fullname.firstname} ${conv.otherUser.fullname.lastname}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const formatLastMessage = (message: string, maxLength: number = 30) => {
    return message.length > maxLength ? `${message.substring(0, maxLength)}...` : message;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className={`fixed bottom-0 right-4 z-50 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border border-gray-200 rounded-t-lg shadow-lg transition-all duration-300 ${
      isCollapsed ? 'h-12' : 'h-96'
    } w-80`}>
      {/* Header */}
      <div 
        className={`flex items-center justify-between p-3 border-b border-gray-200 cursor-pointer ${
          isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
        }`}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <FaComments className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
          <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Messaging
          </span>
          {totalUnread > 0 && (
            <span 
              className="text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
              style={{ backgroundColor: secondaryAccentColor }}
            >
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          )}
        </div>
        {isCollapsed ? (
          <FaChevronUp className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
        ) : (
          <FaChevronDown className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
        )}
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="flex flex-col h-80">
          {/* Search */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} size={14} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 text-sm rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                style={{ '--tw-ring-color': primaryAccentColor } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-8">
                <FaComments 
                  className={`mx-auto mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} 
                  size={32} 
                />
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {searchTerm ? 'No conversations found' : 'No conversations yet'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.conversationId}
                    className={`p-3 cursor-pointer transition-colors ${
                      isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => onOpenChat(conversation)}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        {conversation.otherUser.avatar ? (
                          <Image
                            src={conversation.otherUser.avatar}
                            alt={`${conversation.otherUser.fullname.firstname} ${conversation.otherUser.fullname.lastname}`}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                            style={{ backgroundColor: secondaryAccentColor, color: '#000' }}
                          >
                            {conversation.otherUser.fullname.firstname.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {conversation.otherUser.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                                                 <div className="flex items-center justify-between mb-1">
                           <span className={`font-medium text-sm truncate ${
                             isDarkMode ? 'text-white' : 'text-gray-800'
                           }`}>
                             {conversation.otherUser.fullname.firstname} {conversation.otherUser.fullname.lastname}
                           </span>
                           {conversation.lastMessage && (
                             <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                               {formatTime(conversation.lastMessage.createdAt)}
                             </span>
                           )}
                         </div>
                         <div className="flex items-center justify-between">
                           {conversation.lastMessage ? (
                             <span className={`text-xs truncate ${
                               isDarkMode ? 'text-gray-400' : 'text-gray-600'
                             }`}>
                               {conversation.lastMessage.senderId === user?._id ? 'You: ' : ''}
                               {formatLastMessage(conversation.lastMessage.message)}
                             </span>
                           ) : (
                             <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                               No messages yet
                             </span>
                           )}
                           {conversation.unreadCount && conversation.unreadCount > 0 && (
                             <span 
                               className="text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center ml-2"
                               style={{ backgroundColor: '#ef4444', fontSize: '10px' }}
                             >
                               {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                             </span>
                           )}
                         </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 