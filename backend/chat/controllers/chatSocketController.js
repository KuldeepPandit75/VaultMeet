export default function handleChatSocketEvents(io) {
    
  io.on("connection", (socket) => {

    // Chat events
    socket.on("join-chat", (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined chat room`);
    });

    socket.on("send-message", async (data) => {
      try {
        const { senderId, receiverId, message, conversationId } = data;

        // Emit to sender's room (for confirmation)
        socket.emit("message-sent", { success: true, messageId: Date.now() });

        // Emit to receiver's room
        socket.to(`user_${receiverId}`).emit("new-message", {
          senderId,
          message,
          conversationId,
          timestamp: new Date(),
        });

        console.log(`Message sent from ${senderId} to ${receiverId}`);
      } catch (error) {
        console.error("Error handling message:", error);
        socket.emit("message-error", { error: "Failed to send message" });
      }
    });

    socket.on("typing-start", (data) => {
      const { senderId, receiverId, conversationId } = data;
      socket.to(`user_${receiverId}`).emit("user-typing", {
        senderId,
        conversationId,
        isTyping: true,
      });
    });

    socket.on("typing-stop", (data) => {
      const { senderId, receiverId, conversationId } = data;
      socket.to(`user_${receiverId}`).emit("user-typing", {
        senderId,
        conversationId,
        isTyping: false,
      });
    });

    socket.on("mark-read", (data) => {
      const { conversationId, userId } = data;
      socket.to(`user_${userId}`).emit("messages-read", {
        conversationId,
        readBy: socket.id,
      });
    });
  });
};
