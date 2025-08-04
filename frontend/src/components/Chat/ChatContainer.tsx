'use client';

import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';
import useChatStore, { Conversation } from '@/Zustand_Store/ChatStore';

interface ChatContainerProps {
  isAuthenticated: boolean;
}

export default function ChatContainer({ isAuthenticated }: ChatContainerProps) {
  const { openChats, openChat, closeChat, minimizeChat } = useChatStore();

  const handleOpenChat = (conversation: Conversation) => {
    openChat(conversation);
  };

  const handleCloseChat = (conversationId: string) => {
    closeChat(conversationId);
  };

  const handleMinimizeChat = (conversationId: string) => {
    minimizeChat(conversationId);
  };

  // Calculate position for chat windows (stacked to the left of sidebar)
  const getChatWindowStyle = (index: number) => {
    const rightOffset = 336 + (index * 324); // 336px for sidebar + 324px per window (320px width + 4px gap)
    return { right: `${rightOffset}px` };
  };

  return (
    <>
      {/* Chat Sidebar */}
      <ChatSidebar
        onOpenChat={handleOpenChat}
        isAuthenticated={isAuthenticated}
      />

      {/* Open Chat Windows */}
      {openChats.map((openChat, index) => (
        <div
          key={openChat.conversation.conversationId}
          style={getChatWindowStyle(index)}
          className="fixed bottom-0 z-50"
        >
          <ChatWindow
            conversation={openChat.conversation}
            onClose={() => handleCloseChat(openChat.conversation.conversationId)}
            onMinimize={() => handleMinimizeChat(openChat.conversation.conversationId)}
            isMinimized={openChat.isMinimized}
          />
        </div>
      ))}
    </>
  );
} 