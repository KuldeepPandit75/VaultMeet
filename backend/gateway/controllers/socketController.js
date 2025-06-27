const connectedPlayers = new Map();
const playerRooms = new Map(); // Track which rooms each player is in
const roomPlayers = new Map(); // Track which players are in each room
const userMap = new Map(); // userId -> socketId

const handleSocketEvents = (io) => {
  io.on("connection", (socket) => {
    console.log(`A user connected: ${socket.id}`);

    connectedPlayers.set(socket.id, { x: 300, y: 300 });

    socket.broadcast.emit("playerJoined", socket.id);

    socket.on("registerPlayer", ({ userId }) => {
      // If userId is already mapped, force disconnect old socket
      if(userId){

        const oldSocketId = userMap.get(userId);
        if (oldSocketId && oldSocketId !== socket.id) {
          io.to(oldSocketId).emit("duplicateLogin");
          io.sockets.sockets.get(oldSocketId)?.disconnect();
        }
        
        userMap.set(userId, socket.id);
        socket.userId = userId;
      }
    });

    socket.on("ready", () => {
      const existingPlayers = Array.from(connectedPlayers.entries()).map(
        ([id, pos]) => ({
          id,
          x: pos.x,
          y: pos.y,
        })
      );

      socket.emit("currentPlayers", existingPlayers);
    });

    socket.on("sendMessageToPeer", (msg, targetId) => {
      // Check if the target peer is connected
      if (connectedPlayers.has(targetId)) {
        // Emit the message to the specific peer
        io.to(targetId).emit("messageFromPeer", msg, socket.id);
      }
    });

    socket.on("playerMove", (data) => {
      connectedPlayers.set(socket.id, { x: data.x, y: data.y });
      socket.broadcast.emit("playerMoved", data);
    });

    socket.on("joinRoom", ({ roomId }) => {
      /* idempotent join */
      socket.join(roomId);

      playerRooms.set(socket.id, roomId);
      if (!roomPlayers.has(roomId)) roomPlayers.set(roomId, new Set());
      roomPlayers.get(roomId).add(socket.id);

      io.to(roomId).emit("joinedRoom", {
        roomId,
        players: Array.from(roomPlayers.get(roomId)),
        socketId: socket.id,
      });

      console.log("playerRooms",playerRooms);
      console.log("roomPlayers",roomPlayers);
    });

    socket.on("leaveRoom", ({ playerId }) => {
      const roomId = playerRooms.get(playerId);
      if (roomId) {
        socket.leave(roomId);

        if (roomPlayers.has(roomId)) {
          roomPlayers.get(roomId).delete(playerId);

          if (roomPlayers.get(roomId).size === 1) {
            roomPlayers.delete(roomId);
          }
        }

        playerRooms.delete(playerId);

        if (roomPlayers.has(roomId)) {
          io.to(roomId).emit("leftRoom", {
            roomId,
            playerId,
            remainingPlayers: Array.from(roomPlayers.get(roomId)),
          });
        }

        console.log(`Player ${playerId} left room ${roomId}`);
      }
      console.log("playerRooms",playerRooms);
      console.log("roomPlayers",roomPlayers);
    });

    socket.on("sendMsg", (data) => {
      const roomId = playerRooms.get(socket.id);
      if (roomId) {
        io.to(roomId).emit("receiveMessage", {
          message: data.message,
          senderId: socket.id,
        });
      }
    });

    socket.on("disconnect", () => {
      console.log(`A user disconnected: ${socket.id}`);
      const roomId = playerRooms.get(socket.id);
      if (roomId) {
        socket.leave(roomId);

        if (roomPlayers.has(roomId)) {
          roomPlayers.get(roomId).delete(socket.id);

          if (roomPlayers.get(roomId).size === 0) {
            roomPlayers.delete(roomId);
          } else {
            io.to(roomId).emit("leftRoom", {
              roomId,
              playerId: socket.id,
              remainingPlayers: Array.from(roomPlayers.get(roomId)),
            });
          }
        }

        playerRooms.delete(socket.id);
      }
      connectedPlayers.delete(socket.id);
      if (socket.userId && userMap.get(socket.userId) === socket.id) {
        userMap.delete(socket.userId);
      }
      io.emit("playerDisconnected", socket.id);
    });

    // --- START CONVERSATION LOGIC ---
    socket.on("startConversation", async ({ targetSocketId }) => {
      if (!targetSocketId || !connectedPlayers.has(targetSocketId)) {
        socket.emit("conversationError", { message: "Target player not found." });
        return;
      }

      // Helper to leave current room if in one
      const leaveCurrentRoom = (sock) => {
        const currentRoom = playerRooms.get(sock.id);
        if (currentRoom) {
          sock.leave(currentRoom);
          if (roomPlayers.has(currentRoom)) {
            roomPlayers.get(currentRoom).delete(sock.id);
            if (roomPlayers.get(currentRoom).size === 0) {
              roomPlayers.delete(currentRoom);
            }
          }
          playerRooms.delete(sock.id);
        }
      };

      // Check if target is in a room
      const targetRoom = playerRooms.get(targetSocketId);
      if (targetRoom) {
        // Target is already in a room, join that room
        leaveCurrentRoom(socket);
        socket.join(targetRoom);
        playerRooms.set(socket.id, targetRoom);
        if (!roomPlayers.has(targetRoom)) roomPlayers.set(targetRoom, new Set());
        roomPlayers.get(targetRoom).add(socket.id);
        // Notify both users
        io.to(targetRoom).emit("joinedRoom", {
          roomId: targetRoom,
          players: Array.from(roomPlayers.get(targetRoom)),
          socketId: socket.id,
        });
      } else {
        // Target is not in a room, create a new room
        const newRoomId = `room_${socket.id}_${targetSocketId}_${Date.now()}`;
        // Both leave any current rooms
        leaveCurrentRoom(socket);
        const targetSocket = io.sockets.sockets.get(targetSocketId);
        if (targetSocket) leaveCurrentRoom(targetSocket);
        // Both join new room
        socket.join(newRoomId);
        playerRooms.set(socket.id, newRoomId);
        if (targetSocket) {
          targetSocket.join(newRoomId);
          playerRooms.set(targetSocketId, newRoomId);
        }
        roomPlayers.set(newRoomId, new Set([socket.id, targetSocketId]));
        // Notify both users
        io.to(newRoomId).emit("joinedRoom", {
          roomId: newRoomId,
          players: [socket.id, targetSocketId],
          socketId: socket.id,
        });

        console.log('roomPlayers', roomPlayers)
        console.log('playerRooms',playerRooms)
      }
    });
    // --- END CONVERSATION LOGIC ---
  });
};

export default handleSocketEvents;
