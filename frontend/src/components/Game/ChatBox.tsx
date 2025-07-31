import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Message } from "@/Zustand_Store/SocketStore";
import { useThemeStore } from "@/Zustand_Store/ThemeStore";
import { Socket } from "socket.io-client";
import { useEffect, useState } from "react";
import useAuthStore from "@/Zustand_Store/AuthStore";

interface ChatBoxProps {
  messages: Message[];
  socket: Socket | null;
  handleSentMsg: () => void;
  setTypedMsg: (msg: string) => void;
  typedMsg: string;
  onChatOpen?: () => void;
}

export const ChatBox = ({ messages, socket, handleSentMsg, setTypedMsg, typedMsg, onChatOpen }: ChatBoxProps) => {
  const { primaryAccentColor, isDarkMode } = useThemeStore();
  const { getUserBySocketId } = useAuthStore();
  const [userNames, setUserNames] = useState<{ [key: string]: string }>({});

  // Clear unread count when chat box is opened
  useEffect(() => {
    if (onChatOpen) {
      onChatOpen();
    }
  }, [onChatOpen]);

  // Fetch usernames for message senders
  useEffect(() => {
    const fetchUserNames = async () => {
      const names: { [key: string]: string } = {};
      const uniqueSenderIds = [...new Set(messages.map(msg => msg.senderId))];
      
      for (const senderId of uniqueSenderIds) {
        if (senderId !== socket?.id && !userNames[senderId]) {
          try {
            const userData = await getUserBySocketId(senderId);
            names[senderId] = userData.fullname?.firstname || `User ${senderId.slice(-4)}`;
          } catch (error) {
            console.error("Error fetching user name:", error);
            names[senderId] = `User ${senderId.slice(-4)}`;
          }
        }
      }
      
      setUserNames(prev => ({ ...prev, ...names }));
    };

    if (messages.length > 0) {
      fetchUserNames();
    }
  }, [messages, socket?.id, getUserBySocketId, userNames]);

  const getDisplayName = (senderId: string) => {
    if (senderId === socket?.id) {
      return 'You';
    }
    return userNames[senderId] || `User ${senderId.slice(-4)}`;
  };

  return (
    <div 
      className="z-50 h-[60vh] w-[25vw] absolute bottom-20 right-10 rounded-lg !p-5 flex flex-col shadow-2xl border"
      style={{ 
        backgroundColor: isDarkMode ? '#000000' : '#ffffff',
        borderColor: isDarkMode ? '#1a1a1a' : '#e5e5e5',
        boxShadow: isDarkMode 
          ? '0 25px 50px -12px rgba(0, 0, 0, 0.9)' 
          : '0 25px 50px -12px rgba(0, 0, 0, 0.15)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b" style={{ borderColor: isDarkMode ? '#333333' : '#e5e5e5' }}>
        <h3 className="font-semibold" style={{ color: isDarkMode ? '#ffffff' : '#1a1a1a' }}>
          Chat Room
        </h3>
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: primaryAccentColor }}></div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2" style={{ maxWidth: '100%' }}>
        {messages
          .sort((a, b) => a.timestamp - b.timestamp)
          .map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.senderId === socket?.id ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] min-w-[60px] !p-3 rounded-2xl shadow-sm ${
                  msg.senderId === socket?.id 
                    ? "rounded-br-md" 
                    : "rounded-bl-md"
                }`}
                style={{
                  backgroundColor: msg.senderId === socket?.id 
                    ? primaryAccentColor 
                    : isDarkMode ? '#0a0a0a' : '#f5f5f5',
                  color: msg.senderId === socket?.id 
                    ? '#ffffff' 
                    : isDarkMode ? '#ffffff' : '#1a1a1a',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  whiteSpace: 'pre-line',
                  boxShadow: isDarkMode
                    ? '0 2px 8px rgba(0,0,0,0.7)'
                    : '0 2px 8px rgba(0,0,0,0.08)'
                }}
              >
                <div className="text-sm font-medium mb-1 opacity-70 truncate" style={{ maxWidth: '100%' }}>
                  {getDisplayName(msg.senderId)}
                </div>
                <div className="text-sm leading-relaxed break-words" style={{ maxWidth: '100%' }}>
                  {msg.message}
                </div>
              </div>
            </div>
          ))}
        {messages.length === 0 && (
          <div className="text-center py-8 opacity-50" style={{ color: isDarkMode ? '#888888' : '#666666' }}>
            <div className="text-4xl mb-2">💬</div>
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="w-full flex items-center gap-3">
        <input
          type="text"
          id='chatInput'
          className={`flex-1 h-10 rounded-xl !px-4 text-sm transition-all duration-200 focus:outline-none focus:ring-2 ${isDarkMode ? 'placeholder-dark' : 'placeholder-light'}`}
          placeholder="Type your message..."
          value={typedMsg}
          onChange={(e) => setTypedMsg(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") {
              handleSentMsg();
            }
          }}
          style={{
            backgroundColor: isDarkMode ? '#0a0a0a' : '#f5f5f5',
            color: isDarkMode ? '#ffffff' : '#1a1a1a',
            border: `1px solid ${isDarkMode ? '#1a1a1a' : '#e5e5e5'}`,
            boxShadow: isDarkMode ? 'inset 0 1px 3px rgba(0, 0, 0, 0.5)' : 'inset 0 1px 3px rgba(0, 0, 0, 0.1)',
            maxWidth: '100%',
            minWidth: 0
          }}
        />
        <button
          className="h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
          onClick={handleSentMsg}
          style={{ 
            backgroundColor: primaryAccentColor,
            boxShadow: `0 4px 12px ${primaryAccentColor}40`
          }}
        >
          <FontAwesomeIcon
            icon={faPaperPlane}
            className="h-4 w-4 text-white"
          />
        </button>
      </div>
    </div>
  );
};
