"use client";

import { useState, useEffect, useRef } from "react";
import { useThemeStore } from "@/Zustand_Store/ThemeStore";
import useAuthStore from "@/Zustand_Store/AuthStore";
import useChatSocketStore from "@/Zustand_Store/ChatSocketStore";
import Image from "next/image";
import { FaTimes, FaMinus, FaPaperPlane } from "react-icons/fa";
import { toast } from "react-hot-toast";

interface Message {
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

interface ChatWindowProps {
  conversation: {
    conversationId: string;
    otherUser: {
      _id: string;
      fullname: { firstname: string; lastname: string };
      avatar?: string;
      username?: string;
      isOnline?: boolean;
      lastSeen?: string;
    };
  };
  onClose: () => void;
  onMinimize: () => void;
  isMinimized: boolean;
}

export default function ChatWindow({
  conversation,
  onClose,
  onMinimize,
  isMinimized,
}: ChatWindowProps) {
  const { primaryAccentColor, secondaryAccentColor, isDarkMode } =
    useThemeStore();
  const {
    getMessages,
    sendMessage: apiSendMessage,
    markMessagesAsRead,
    user,
  } = useAuthStore();
  const {
    socket,
    connect,
    on: socketOn,
    off: socketOff,
    sendMessage: socketSendMessage,
  } = useChatSocketStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const result = await getMessages(conversation.conversationId);
      setMessages(result.messages);

      // Mark messages as read
      await markMessagesAsRead(conversation.conversationId);

      // Emit custom event to notify other components that messages were marked as read
      window.dispatchEvent(
        new CustomEvent("messages-marked-read", {
          detail: { conversationId: conversation.conversationId },
        })
      );
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isMinimized) {
      fetchMessages();
    }
  }, [conversation.conversationId, isMinimized]);

  // Mark messages as read when chat window is unminimized
  useEffect(() => {
    if (!isMinimized) {
      const markAsRead = async () => {
        try {
          await markMessagesAsRead(conversation.conversationId);
          // Emit event to update other components
          window.dispatchEvent(
            new CustomEvent("messages-marked-read", {
              detail: { conversationId: conversation.conversationId },
            })
          );
        } catch (error) {
          console.error("Error marking messages as read on unminimize:", error);
        }
      };
      markAsRead();
    }
  }, [isMinimized, conversation.conversationId]);

  // Socket connection and event listeners
  useEffect(() => {
    if (!socket) {
      connect();
    }

    if (socket && user) {
      // Join user's chat room
      socket.emit("join-chat", user._id);

      // Listen for new messages
      socketOn("new-message", async (data) => {
        const messageData = data as {
          conversationId: string;
          message: string;
          senderId: string;
          timestamp: string;
        };
        if (messageData.conversationId === conversation.conversationId) {
          // Add the new message to the conversation
          const newMsg: Message = {
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
            isRead: !isMinimized, // Mark as read if chat window is open and not minimized
          };
          setMessages((prev) => [...prev, newMsg]);

          // If the chat window is open and not minimized, mark the message as read
          if (!isMinimized) {
            try {
              await markMessagesAsRead(conversation.conversationId);
              // Emit event to update other components
              window.dispatchEvent(
                new CustomEvent("messages-marked-read", {
                  detail: { conversationId: conversation.conversationId },
                })
              );
            } catch (error) {
              console.error("Error marking new message as read:", error);
            }
          }
        }
      });

      // Listen for typing indicators
      socketOn("user-typing", (data) => {
        const typingData = data as {
          conversationId: string;
          isTyping: boolean;
        };
        if (typingData.conversationId === conversation.conversationId) {
          setIsTyping(typingData.isTyping);
        }
      });

      // Listen for message sent confirmation
      socketOn("message-sent", (data) => {
        const sentData = data as { success: boolean };
        if (sentData.success) {
          setSending(false);
        }
      });

      // Listen for message errors
      socketOn("message-error", (data) => {
        const errorData = data as { error?: string };
        toast.error(errorData.error || "Failed to send message");
        setSending(false);
      });
    }

    return () => {
      socketOff("new-message");
      socketOff("user-typing");
      socketOff("message-sent");
      socketOff("message-error");
    };
  }, [socket, user, conversation.conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      // Send via API first
      const result = await apiSendMessage(
        conversation.otherUser._id,
        newMessage.trim()
      );

      // Add the new message to the local state
      setMessages((prev) => [...prev, { ...result.data, isRead: true }]);
      setNewMessage("");

      // Send via socket for real-time delivery
      if (socket) {
        socketSendMessage({
          senderId: user?._id || "",
          receiverId: conversation.otherUser._id,
          message: newMessage.trim(),
          conversationId: conversation.conversationId,
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    if (socket && user) {
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Emit typing start
      socket.emit("typing-start", {
        senderId: user._id,
        receiverId: conversation.otherUser._id,
        conversationId: conversation.conversationId,
      });

      // Set timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("typing-stop", {
          senderId: user._id,
          receiverId: conversation.otherUser._id,
          conversationId: conversation.conversationId,
        });
      }, 1000);
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

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year:
          date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  const shouldShowDateHeader = (
    currentMessage: Message,
    previousMessage?: Message
  ) => {
    if (!previousMessage) return true;

    const currentDate = new Date(currentMessage.createdAt).toDateString();
    const previousDate = new Date(previousMessage.createdAt).toDateString();

    return currentDate !== previousDate;
  };

  return (
    <div
      className={`fixed bottom-0 right-96 z-100 ${
        isDarkMode ? "bg-[#111]" : "bg-white"
      } rounded-t-lg shadow-lg transition-all duration-300 overflow-hidden ${
        isMinimized ? "h-12" : "h-96"
      } w-80`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between p-3 border-gray-200 ${
          isDarkMode ? "bg-[#333]" : "bg-gray-50"
        }`}
      >
        <div
          className="flex items-center gap-3 flex-1 min-w-0"
          onClick={onMinimize}
        >
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {conversation.otherUser.avatar ? (
              <Image
                src={conversation.otherUser.avatar}
                alt={`${conversation.otherUser.fullname.firstname} ${conversation.otherUser.fullname.lastname}`}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: secondaryAccentColor, color: "#000" }}
              >
                {conversation.otherUser.fullname.firstname
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}
            {conversation.otherUser.isOnline && (
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
              {conversation.otherUser.fullname.firstname}{" "}
              {conversation.otherUser.fullname.lastname}
            </div>
            <div
              className={`text-xs ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {conversation.otherUser.isOnline ? "Active now" : "Offline"}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onMinimize}
            className={`p-1 rounded hover:bg-gray-200 ${
              isDarkMode ? "hover:bg-gray-600" : ""
            }`}
          >
            <FaMinus
              className={isDarkMode ? "text-gray-300" : "text-gray-600"}
              size={12}
            />
          </button>
          <button
            onClick={onClose}
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
      </div>

      {/* Messages */}
      {!isMinimized && (
        <div className="flex flex-col h-80">
          <div className="flex-1 overflow-y-auto p-3 space-y-2 chat-scroll">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <p
                  className={`text-sm ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  No messages yet. Start the conversation!
                </p>
              </div>
            ) : (
              <>
                {messages.map((message, index) => {
                  const isOwnMessage = message.senderId._id === user?._id;
                  const previousMessage =
                    index > 0 ? messages[index - 1] : undefined;
                  const showDateHeader = shouldShowDateHeader(
                    message,
                    previousMessage
                  );

                  return (
                    <div key={message._id}>
                      {/* Date Header */}
                      {showDateHeader && (
                        <div className="text-center py-2">
                          <span
                            className={`text-xs px-3 py-1 rounded-full ${
                              isDarkMode
                                ? "bg-gray-700 text-gray-300"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {formatDate(message.createdAt)}
                          </span>
                        </div>
                      )}

                      {/* Message */}
                      <div
                        className={`flex ${
                          isOwnMessage ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-xs px-3 py-2 rounded-lg ${
                            isOwnMessage
                              ? "text-white"
                              : isDarkMode
                              ? "bg-gray-700 text-white"
                              : "bg-gray-200 text-gray-800"
                          }`}
                          style={
                            isOwnMessage
                              ? { backgroundColor: primaryAccentColor }
                              : isDarkMode
                              ? { backgroundColor: "#333" }
                              : {}
                          }
                        >
                          <p className="text-sm whitespace-pre-wrap">
                            {message.message}
                          </p>
                          <p
                            className={`text-xs mt-1 ${
                              isOwnMessage
                                ? "text-white/70"
                                : isDarkMode
                                ? "text-gray-400"
                                : "text-gray-500"
                            }`}
                          >
                            {formatTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200 p-3">
            {isTyping && (
              <div
                className={`text-xs mb-2 ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {conversation.otherUser.fullname.firstname} is typing...
              </div>
            )}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                placeholder="Type a message..."
                className={`flex-1 px-3 py-2 text-sm rounded-lg ${
                  isDarkMode
                    ? "bg-[#333] text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-800 placeholder-gray-500"
                } focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                style={
                  {
                    "--tw-ring-color": primaryAccentColor,
                  } as React.CSSProperties
                }
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className={`p-2 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{ backgroundColor: primaryAccentColor }}
              >
                <FaPaperPlane size={14} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
