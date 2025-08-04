import {
  faPaperPlane,
  faComments,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Message } from "@/Zustand_Store/SocketStore";
import { useThemeStore } from "@/Zustand_Store/ThemeStore";
import { Socket } from "socket.io-client";
import { useEffect, useRef, useState } from "react";
import useAuthStore from "@/Zustand_Store/AuthStore";
import useChatSocketStore from "@/Zustand_Store/ChatSocketStore";
import { Conversation } from "@/Zustand_Store/ChatStore";
import Image from "next/image";
import {
  FaSearch,
  FaTimes,
  FaPaperPlane as FaPaperPlaneIcon,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import useChatStore from "@/Zustand_Store/ChatStore";

interface ChatBoxProps {
  messages: Message[];
  socket: Socket | null;
  handleSentMsg: () => void;
  setTypedMsg: (msg: string) => void;
  typedMsg: string;
  onChatOpen?: () => void;
  initialSelectedConversation?: Conversation;
}

interface ChatMessage {
  _id: string;
  message: string;
  senderId: {
    _id: string;
    fullname: { firstname: string; lastname: string };
    avatar?: string;
  };
  receiverId: {
    _id: string;
    fullname: { firstname: string; lastname: string };
    avatar?: string;
  };
  createdAt: string;
  isRead: boolean;
}

// Game Chat Component
const GameChat = ({
  messages,
  socket,
  handleSentMsg,
  setTypedMsg,
  typedMsg,
  getDisplayName,
  primaryAccentColor,
  isDarkMode,
  messagesEndRef,
}: {
  messages: Message[];
  socket: Socket | null;
  handleSentMsg: () => void;
  setTypedMsg: (msg: string) => void;
  typedMsg: string;
  getDisplayName: (senderId: string) => string;
  primaryAccentColor: string;
  isDarkMode: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}) => {
  return (
    <>
      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2 chat-scroll"
        style={{ maxWidth: "100%" }}
      >
        {messages
          .sort((a, b) => a.timestamp - b.timestamp)
          .map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.senderId === socket?.id
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] min-w-[60px] !p-3 rounded-2xl shadow-sm ${
                  msg.senderId === socket?.id
                    ? "rounded-br-md"
                    : "rounded-bl-md"
                }`}
                style={{
                  backgroundColor:
                    msg.senderId === socket?.id
                      ? primaryAccentColor
                      : isDarkMode
                      ? "#0a0a0a"
                      : "#f5f5f5",
                  color:
                    msg.senderId === socket?.id
                      ? "#ffffff"
                      : isDarkMode
                      ? "#ffffff"
                      : "#1a1a1a",
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                  whiteSpace: "pre-line",
                  boxShadow: isDarkMode
                    ? "0 2px 8px rgba(0,0,0,0.7)"
                    : "0 2px 8px rgba(0,0,0,0.08)",
                }}
              >
                <div
                  className="text-sm font-medium mb-1 opacity-70 truncate"
                  style={{ maxWidth: "100%" }}
                >
                  {getDisplayName(msg.senderId)}
                </div>
                <div
                  className="text-sm leading-relaxed break-words"
                  style={{ maxWidth: "100%" }}
                >
                  {msg.message}
                </div>
              </div>
            </div>
          ))}
        {messages.length === 0 && (
          <div
            className="text-center py-8 opacity-50"
            style={{ color: isDarkMode ? "#888888" : "#666666" }}
          >
            <div className="text-4xl mb-2">💬</div>
            <p className="text-sm">
              No messages yet. Start the conversation!
            </p>
          </div>
        )}
        <div ref={messagesEndRef}></div>
      </div>

      {/* Input */}
      <div className="w-full flex items-center gap-3">
        <input
          type="text"
          id="chatInput"
          className={`flex-1 h-10 rounded-xl !px-4 text-sm transition-all duration-200 focus:outline-none focus:ring-2 ${
            isDarkMode ? "placeholder-dark" : "placeholder-light"
          }`}
          placeholder="Type your message..."
          value={typedMsg}
          autoComplete="off"
          onChange={(e) => setTypedMsg(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") {
              handleSentMsg();
            }
          }}
          style={{
            backgroundColor: isDarkMode ? "#0a0a0a" : "#f5f5f5",
            color: isDarkMode ? "#ffffff" : "#1a1a1a",
            border: `1px solid ${isDarkMode ? "#1a1a1a" : "#e5e5e5"}`,
            boxShadow: isDarkMode
              ? "inset 0 1px 3px rgba(0, 0, 0, 0.5)"
              : "inset 0 1px 3px rgba(0, 0, 0, 0.1)",
            maxWidth: "100%",
            minWidth: 0,
          }}
        />
        <button
          className="h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
          onClick={handleSentMsg}
          style={{
            backgroundColor: primaryAccentColor,
            boxShadow: `0 4px 12px ${primaryAccentColor}40`,
          }}
        >
          <FontAwesomeIcon
            icon={faPaperPlane}
            className="h-4 w-4 text-white"
          />
        </button>
      </div>
    </>
  );
};

// Conversation List Component
const ConversationList = ({
  conversations,
  loading,
  searchTerm,
  setSearchTerm,
  onSelectConversation,
  fetchChatMessages,
  user,
  isDarkMode,
  primaryAccentColor,
  secondaryAccentColor,
  formatTime,
  formatLastMessage,
}: {
  conversations: Conversation[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onSelectConversation: (conversation: Conversation) => void;
  fetchChatMessages: (conversationId: string) => void;
  user: { _id: string; fullname: { firstname: string; lastname: string } } | null;
  isDarkMode: boolean;
  primaryAccentColor: string;
  secondaryAccentColor: string;
  formatTime: (timestamp: string) => string;
  formatLastMessage: (message: string, maxLength?: number) => string;
}) => {
  const filteredConversations = conversations.filter((conv) =>
    `${conv.otherUser.fullname.firstname} ${conv.otherUser.fullname.lastname}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <FaSearch
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
            size={14}
          />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 text-sm rounded-lg ${
              isDarkMode
                ? "bg-[#111] text-white placeholder-gray-400"
                : "bg-gray-50 text-gray-800 placeholder-gray-500"
            } focus:outline-none focus:ring-2 focus:ring-opacity-50`}
            style={
              {
                "--tw-ring-color": primaryAccentColor,
              } as React.CSSProperties
            }
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div
              className="animate-spin rounded-full h-6 w-6 border-b-2"
              style={{ borderColor: primaryAccentColor }}
            ></div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-8">
            <FontAwesomeIcon
              icon={faComments}
              className={`mx-auto mb-2 ${
                isDarkMode ? "text-gray-500" : "text-gray-400"
              }`}
              size="2x"
            />
            <p
              className={`text-sm ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {searchTerm
                ? "No conversations found"
                : "No conversations yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.conversationId}
                className={`p-3 cursor-pointer rounded-lg transition-colors ${
                  isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                }`}
                onClick={() => {
                  onSelectConversation(conversation);
                  fetchChatMessages(conversation.conversationId);
                }}
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
                        style={{
                          backgroundColor: secondaryAccentColor,
                          color: "#000",
                        }}
                      >
                        {conversation.otherUser.fullname.firstname
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                    {conversation.otherUser.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`font-medium text-sm truncate ${
                          isDarkMode ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {conversation.otherUser.fullname.firstname}{" "}
                        {conversation.otherUser.fullname.lastname}
                      </span>
                      {conversation.lastMessage && (
                        <span
                          className={`text-xs ${
                            isDarkMode
                              ? "text-gray-400"
                              : "text-gray-500"
                          }`}
                        >
                          {formatTime(conversation.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      {conversation.lastMessage ? (
                        <span
                          className={`text-xs truncate ${
                            isDarkMode
                              ? "text-gray-400"
                              : "text-gray-600"
                          }`}
                        >
                          {conversation.lastMessage.senderId === user?._id
                            ? "You: "
                            : ""}
                          {formatLastMessage(conversation.lastMessage.message)}
                        </span>
                      ) : (
                        <span
                          className={`text-xs ${
                            isDarkMode
                              ? "text-gray-400"
                              : "text-gray-500"
                          }`}
                        >
                          No messages yet
                        </span>
                      )}
                      {conversation.unreadCount &&
                        conversation.unreadCount > 0 && (
                          <span
                            className="text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center ml-2"
                            style={{
                              backgroundColor: "#ef4444",
                              fontSize: "10px",
                            }}
                          >
                            {conversation.unreadCount > 9
                              ? "9+"
                              : conversation.unreadCount}
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
    </>
  );
};

// Individual Chat Component
const IndividualChat = ({
  selectedConversation,
  chatMessages,
  loading,
  newMessage,
  setNewMessage,
  handleSendChatMessage,
  sending,
  user,
  isDarkMode,
  primaryAccentColor,
  secondaryAccentColor,
  formatTime,
  messagesEndRef,
  onBack,
}: {
  selectedConversation: Conversation;
  chatMessages: ChatMessage[];
  loading: boolean;
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleSendChatMessage: (e: React.FormEvent) => void;
  sending: boolean;
  user: { _id: string; fullname: { firstname: string; lastname: string } } | null;
  isDarkMode: boolean;
  primaryAccentColor: string;
  secondaryAccentColor: string;
  formatTime: (timestamp: string) => string;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onBack: () => void;
}) => {
  return (
    <>
      {/* Chat Header */}
      <div
        className="flex items-center justify-between mb-4 pb-3 border-b"
        style={{ borderColor: isDarkMode ? "#333333" : "#e5e5e5" }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {selectedConversation.otherUser.avatar ? (
              <Image
                src={selectedConversation.otherUser.avatar}
                alt={`${selectedConversation.otherUser.fullname.firstname} ${selectedConversation.otherUser.fullname.lastname}`}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  backgroundColor: secondaryAccentColor,
                  color: "#000",
                }}
              >
                {selectedConversation.otherUser.fullname.firstname
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}
            {selectedConversation.otherUser.isOnline && (
              <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white"></div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div
              className={`font-medium text-sm truncate ${
                isDarkMode ? "text-white" : "text-gray-800"
              }`}
            >
              {selectedConversation.otherUser.fullname.firstname}{" "}
              {selectedConversation.otherUser.fullname.lastname}
            </div>
            <div
              className={`text-xs ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {selectedConversation.otherUser.isOnline
                ? "Active now"
                : "Offline"}
            </div>
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={onBack}
          className={`p-1 rounded hover:bg-gray-200 ${
            isDarkMode ? "hover:bg-gray-600" : ""
          }`}
        >
          <FaTimes
            className={isDarkMode ? "text-gray-300" : "text-gray-600"}
            size={12}
          />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-2 chat-scroll">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div
              className="animate-spin rounded-full h-6 w-6 border-b-2"
              style={{ borderColor: primaryAccentColor }}
            ></div>
          </div>
        ) : chatMessages.length === 0 ? (
          <div
            className="text-center py-8 opacity-50"
            style={{ color: isDarkMode ? "#888888" : "#666666" }}
          >
            <div className="text-4xl mb-2">💬</div>
            <p className="text-sm">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          <>
            {chatMessages.map((message) => {
              const isOwnMessage = message.senderId._id === user?._id;
              return (
                <div
                  key={message._id}
                  className={`flex ${
                    isOwnMessage ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] min-w-[60px] !p-3 rounded-2xl shadow-sm ${
                      isOwnMessage ? "rounded-br-md" : "rounded-bl-md"
                    }`}
                    style={{
                      backgroundColor: isOwnMessage
                        ? primaryAccentColor
                        : isDarkMode
                        ? "#0a0a0a"
                        : "#f5f5f5",
                      color: isOwnMessage
                        ? "#ffffff"
                        : isDarkMode
                        ? "#ffffff"
                        : "#1a1a1a",
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                      whiteSpace: "pre-line",
                      boxShadow: isDarkMode
                        ? "0 2px 8px rgba(0,0,0,0.7)"
                        : "0 2px 8px rgba(0,0,0,0.08)",
                    }}
                  >
                    <div
                      className="text-sm leading-relaxed break-words"
                      style={{ maxWidth: "100%" }}
                    >
                      {message.message}
                    </div>
                    <div className="text-xs mt-1 opacity-70">
                      {formatTime(message.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef}></div>
          </>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSendChatMessage}
        className="w-full flex items-center gap-3"
      >
        <input
          type="text"
          className={`flex-1 h-10 rounded-xl !px-4 text-sm transition-all duration-200 focus:outline-none focus:ring-2 ${
            isDarkMode ? "placeholder-dark" : "placeholder-light"
          }`}
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          style={{
            backgroundColor: isDarkMode ? "#0a0a0a" : "#f5f5f5",
            color: isDarkMode ? "#ffffff" : "#1a1a1a",
            border: `1px solid ${isDarkMode ? "#1a1a1a" : "#e5e5e5"}`,
            boxShadow: isDarkMode
              ? "inset 0 1px 3px rgba(0, 0, 0, 0.5)"
              : "inset 0 1px 3px rgba(0, 0, 0, 0.1)",
            maxWidth: "100%",
            minWidth: 0,
          }}
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: primaryAccentColor,
            boxShadow: `0 4px 12px ${primaryAccentColor}40`,
          }}
        >
          <FaPaperPlaneIcon className="h-4 w-4 text-white" />
        </button>
      </form>
    </>
  );
};

// Main ChatBox Component
export const ChatBox = ({
  messages,
  socket,
  handleSentMsg,
  setTypedMsg,
  typedMsg,
  onChatOpen,
  initialSelectedConversation,
}: ChatBoxProps) => {
  const { primaryAccentColor, secondaryAccentColor, isDarkMode } =
    useThemeStore();
  const {
    getUserBySocketId,
    getConversations,
    getMessages,
    sendMessage: apiSendMessage,
    markMessagesAsRead,
    user,
  } = useAuthStore();
  const {
    socket: chatSocket,
    connect,
    on: socketOn,
    off: socketOff,
    sendMessage: socketSendMessage,
  } = useChatSocketStore();
  const { setIsInGameChatOpen, openChat, gameChatTab, setGameChatTab, gameChatSelectedConversation, setGameChatSelectedConversation } = useChatStore();
  const [userNames, setUserNames] = useState<{ [key: string]: string }>({});
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(initialSelectedConversation || gameChatSelectedConversation || null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Clear unread count when chat box is opened
  useEffect(() => {
    if (onChatOpen) {
      onChatOpen();
    }
  }, [onChatOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView();
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, messages, gameChatTab, loading]);

  // Fetch usernames for message senders
  useEffect(() => {
    const fetchUserNames = async () => {
      const names: { [key: string]: string } = {};
      const uniqueSenderIds = [...new Set(messages.map((msg) => msg.senderId))];

      for (const senderId of uniqueSenderIds) {
        if (senderId !== socket?.id && !userNames[senderId]) {
          try {
            const userData = await getUserBySocketId(senderId);
            names[senderId] =
              userData.username || `User ${senderId.slice(-4)}`;
          } catch (error) {
            console.error("Error fetching user name:", error);
            names[senderId] = `User ${senderId.slice(-4)}`;
          }
        }
      }

      if (Object.keys(names).length > 0) {
        setUserNames((prev) => ({ ...prev, ...names }));
      }
    };

    if (messages.length > 0) {
      fetchUserNames();
    }
  }, [messages, socket?.id, getUserBySocketId]);

  // Fetch conversations for general chat
  const fetchConversations = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const result = await getConversations(1, 10);
      setConversations(result.conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for selected conversation
  const fetchChatMessages = async (conversationId: string) => {
    setLoading(true);
    try {
      const result = await getMessages(conversationId);
      setChatMessages(result.messages);
      await markMessagesAsRead(conversationId);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  // Socket connection for general chat
  useEffect(() => {
    if (!chatSocket && user) {
      connect();
    }

    if (chatSocket && user) {
      chatSocket.emit("join-chat", user._id);

      socketOn("new-message", async (data) => {
        const messageData = data as {
          conversationId: string;
          message: string;
          senderId: string;
          timestamp: string;
        };

        if (
          selectedConversation &&
          messageData.conversationId === selectedConversation.conversationId
        ) {
          const newMsg: ChatMessage = {
            _id: Date.now().toString(),
            message: messageData.message,
            senderId: {
              _id: messageData.senderId,
              fullname: { firstname: "", lastname: "" },
            },
            receiverId: {
              _id: user._id,
              fullname: { firstname: "", lastname: "" },
            },
            createdAt: messageData.timestamp,
            isRead: true,
          };
          setChatMessages((prev) => [...prev, newMsg]);
        }

        // Refresh conversations
        fetchConversations();
      });
    }

    return () => {
      socketOff("new-message");
    };
  }, [chatSocket, user, selectedConversation]);

  // Load conversations when switching to general tab
  useEffect(() => {
    if (gameChatTab === "general" && user) {
      fetchConversations();
    }
  }, [gameChatTab, user]);

  // Handle initial selected conversation
  useEffect(() => {
    if (initialSelectedConversation && gameChatTab === "general") {
      setSelectedConversation(initialSelectedConversation);
      fetchChatMessages(initialSelectedConversation.conversationId);
    }
  }, [initialSelectedConversation, gameChatTab]);

  // Handle game chat selected conversation
  useEffect(() => {
    if (gameChatSelectedConversation && gameChatTab === "general") {
      setSelectedConversation(gameChatSelectedConversation);
      fetchChatMessages(gameChatSelectedConversation.conversationId);
      // Clear the selected conversation from store after using it
      setGameChatSelectedConversation(null);
    }
  }, [gameChatSelectedConversation, gameChatTab, setGameChatSelectedConversation]);

  const getDisplayName = (senderId: string) => {
    if (senderId === socket?.id) {
      return "You";
    }
    return userNames[senderId] || `User ${senderId.slice(-4)}`;
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    fetchChatMessages(conversation.conversationId);
    openChat(conversation);
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !selectedConversation) return;

    setSending(true);
    try {
      const result = await apiSendMessage(
        selectedConversation.otherUser._id,
        newMessage.trim()
      );
      setChatMessages((prev) => [...prev, { ...result.data, isRead: true }]);
      setNewMessage("");

      if (chatSocket) {
        socketSendMessage({
          senderId: user?._id || "",
          receiverId: selectedConversation.otherUser._id,
          message: newMessage.trim(),
          conversationId: selectedConversation.conversationId,
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatLastMessage = (message: string, maxLength: number = 30) => {
    return message.length > maxLength
      ? `${message.substring(0, maxLength)}...`
      : message;
  };

  return (
    <div
      className="z-50 h-[60vh] w-[25vw] absolute bottom-20 right-10 rounded-lg !p-5 flex flex-col shadow-2xl border"
      style={{
        backgroundColor: isDarkMode ? "#000000" : "#ffffff",
        borderColor: isDarkMode ? "#1a1a1a" : "#e5e5e5",
        boxShadow: isDarkMode
          ? "0 25px 50px -12px rgba(0, 0, 0, 0.9)"
          : "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
      }}
    >
      {/* Header with Tabs */}
      <div
        className="flex items-center justify-between mb-4 pb-3 border-b"
        style={{ borderColor: isDarkMode ? "#333333" : "#e5e5e5" }}
      >
        <div className="flex gap-2">
          <button
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
              gameChatTab === "game"
                ? "text-white"
                : isDarkMode
                ? "text-gray-400"
                : "text-gray-600"
            }`}
            style={{
              backgroundColor:
                gameChatTab === "game" ? primaryAccentColor : "transparent",
            }}
            onClick={() => setGameChatTab("game")}
          >
            <FontAwesomeIcon icon={faComments} className="mr-2" />
            Game Chat
          </button>
          <button
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
              gameChatTab === "general"
                ? "text-white"
                : isDarkMode
                ? "text-gray-400"
                : "text-gray-600"
            }`}
            style={{
              backgroundColor:
                gameChatTab === "general" ? primaryAccentColor : "transparent",
            }}
            onClick={() => setGameChatTab("general")}
          >
            <FontAwesomeIcon icon={faUsers} className="mr-2" />
            General Chat
          </button>
        </div>
        <button
          className="ml-2 p-1 rounded-full text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          onClick={() => setIsInGameChatOpen(false)}
          aria-label="Close chat"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "28px",
            height: "28px",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Content based on active tab */}
             {gameChatTab === "game" ? (
         <GameChat
           messages={messages}
           socket={socket}
           handleSentMsg={handleSentMsg}
           setTypedMsg={setTypedMsg}
           typedMsg={typedMsg}
           getDisplayName={getDisplayName}
           primaryAccentColor={primaryAccentColor}
           isDarkMode={isDarkMode}
           messagesEndRef={messagesEndRef}
         />
       ) : (
        <>
          {!selectedConversation ? (
            <ConversationList
              conversations={conversations}
              loading={loading}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onSelectConversation={handleSelectConversation}
              fetchChatMessages={fetchChatMessages}
              user={user}
              isDarkMode={isDarkMode}
              primaryAccentColor={primaryAccentColor}
              secondaryAccentColor={secondaryAccentColor}
              formatTime={formatTime}
              formatLastMessage={formatLastMessage}
            />
          ) : (
            <IndividualChat
              selectedConversation={selectedConversation}
              chatMessages={chatMessages}
              loading={loading}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              handleSendChatMessage={handleSendChatMessage}
              sending={sending}
              user={user}
              isDarkMode={isDarkMode}
              primaryAccentColor={primaryAccentColor}
              secondaryAccentColor={secondaryAccentColor}
              formatTime={formatTime}
              messagesEndRef={messagesEndRef}
              onBack={() => setSelectedConversation(null)}
            />
          )}
        </>
      )}
    </div>
  );
};
