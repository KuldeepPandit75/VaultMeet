const connectedPlayers = new Map();
const playerRooms = new Map(); // Track which rooms each player is in
const roomPlayers = new Map(); // Track which players are in each room

const handleSocketEvents = (io) => {
  io.on("connection", (socket) => {
    console.log(`A user connected: ${socket.id}`);

    connectedPlayers.set(socket.id, { x: 300, y: 300 });

    socket.broadcast.emit("playerJoined", socket.id);

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
    });

    socket.on("leaveRoom", ({ playerId }) => {
      const roomId = playerRooms.get(playerId);
      if (roomId) {
        socket.leave(roomId);

        if (roomPlayers.has(roomId)) {
          roomPlayers.get(roomId).delete(playerId);

          if (roomPlayers.get(roomId).size === 0) {
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
      io.emit("playerDisconnected", socket.id);
    });
  });
};

export default handleSocketEvents;
