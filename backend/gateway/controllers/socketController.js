const connectedPlayers = new Map();
const playerRooms = new Map(); // Track which rooms each player is in
const roomPlayers = new Map(); // Track which players are in each room
const userMap = new Map(); // userId -> socketId
const whiteboardRooms = new Map(); // Track whiteboard rooms and their data
const whiteboardRoomPlayers = new Map(); // Track which players are in each whiteboard room

// NEW: Event-specific room management
const eventRooms = new Map(); // eventId -> roomId
const eventPlayers = new Map(); // eventId -> Set of player socketIds
const playerEvents = new Map(); // socketId -> eventId

const handleSocketEvents = (io) => {
  io.on("connection", (socket) => {
    console.log(`A user connected: ${socket.id}`);

    connectedPlayers.set(socket.id, { x: 300, y: 300 });

    // Don't broadcast playerJoined immediately - it will be handled by event-specific events

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

    // NEW: Join event-specific virtual space
    socket.on("joinEventSpace", ({ eventId, userId }) => {
      console.log(`User ${socket.id} joining event space for event ${eventId}`);
      
      // Leave any existing event space
      const currentEventId = playerEvents.get(socket.id);
      if (currentEventId && currentEventId !== eventId) {
        leaveEventSpace(socket, currentEventId);
      }
      
      // Create or get event room
      let eventRoomId = eventRooms.get(eventId);
      if (!eventRoomId) {
        eventRoomId = `event-${eventId}-${Date.now()}`;
        eventRooms.set(eventId, eventRoomId);
        eventPlayers.set(eventId, new Set());
      }
      
      // Join the event room
      socket.join(eventRoomId);
      playerEvents.set(socket.id, eventId);
      eventPlayers.get(eventId).add(socket.id);
      
      console.log(`Player ${socket.id} now in event ${eventId}. Total players in event: ${eventPlayers.get(eventId).size}`);
      console.log(`All players in events:`, Array.from(playerEvents.entries()));
      
      // Get existing players in this event
      const existingEventPlayers = Array.from(eventPlayers.get(eventId))
        .filter(id => id !== socket.id && connectedPlayers.has(id))
        .map(id => ({
          id,
          x: connectedPlayers.get(id).x,
          y: connectedPlayers.get(id).y,
        }));
      
      // Send current players to the joining user
      socket.emit("eventSpaceJoined", {
        eventId,
        roomId: eventRoomId,
        existingPlayers: existingEventPlayers
      });
      
      // Notify other players in the event
      socket.to(eventRoomId).emit("playerJoinedEvent", {
        eventId,
        playerId: socket.id,
        userId: userId
      });
      
      console.log(`User ${socket.id} joined event ${eventId}. Total players: ${eventPlayers.get(eventId).size}`);
    });

    // NEW: Leave event-specific virtual space
    socket.on("leaveEventSpace", ({ eventId }) => {
      leaveEventSpace(socket, eventId);
    });

    // Helper function to leave event space
    const leaveEventSpace = (socket, eventId) => {
      const eventRoomId = eventRooms.get(eventId);
      if (eventRoomId) {
        socket.leave(eventRoomId);
        playerEvents.delete(socket.id);
        
        if (eventPlayers.has(eventId)) {
          eventPlayers.get(eventId).delete(socket.id);
          
          // If no players left in event, clean up
          if (eventPlayers.get(eventId).size === 0) {
            eventPlayers.delete(eventId);
            eventRooms.delete(eventId);
          } else {
            // Notify remaining players
            socket.to(eventRoomId).emit("playerLeftEvent", {
              eventId,
              playerId: socket.id
            });
          }
        }
        
        console.log(`User ${socket.id} left event ${eventId}`);
      }
    };

    socket.on("ready", () => {
      // Check if player is in an event space
      const eventId = playerEvents.get(socket.id);
      console.log(`Player ${socket.id} ready. Event ID: ${eventId}`);
      
      if (eventId) {
        // Send only players in the same event
        const eventRoomId = eventRooms.get(eventId);
        if (eventRoomId) {
          const existingEventPlayers = Array.from(eventPlayers.get(eventId))
            .filter(id => id !== socket.id && connectedPlayers.has(id))
            .map(id => ({
              id,
              x: connectedPlayers.get(id).x,
              y: connectedPlayers.get(id).y,
            }));
          console.log(`Sending ${existingEventPlayers.length} event players to ${socket.id} in event ${eventId}`);
          socket.emit("currentPlayers", existingEventPlayers);
        }
      } else {
        // Send only players who are NOT in any event space for general space (coding-space)
        const existingPlayers = Array.from(connectedPlayers.entries())
          .filter(([id, pos]) => !playerEvents.has(id)) // Only players not in any event
          .map(([id, pos]) => ({
            id,
            x: pos.x,
            y: pos.y,
          }));
        console.log(`Sending ${existingPlayers.length} general players to ${socket.id} in general space`);
        socket.emit("currentPlayers", existingPlayers);
        
        // Notify other general space players about this new player
        // Only send to players who are NOT in any event space
        const generalSpacePlayers = Array.from(connectedPlayers.keys())
          .filter(id => !playerEvents.has(id) && id !== socket.id);
        
        generalSpacePlayers.forEach(playerId => {
          io.to(playerId).emit("playerJoined", socket.id);
        });
      }
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
      
      // Broadcast to event-specific room if player is in an event
      const eventId = playerEvents.get(socket.id);
      if (eventId) {
        const eventRoomId = eventRooms.get(eventId);
        if (eventRoomId) {
          socket.to(eventRoomId).emit("playerMoved", data);
        }
      } else {
        // Broadcast to general space if not in event
        socket.broadcast.emit("playerMoved", data);
      }
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

    // Whiteboard room management
    socket.on("joinWhiteboardRoom", ({ roomId }) => {
      console.log(`User ${socket.id} joining whiteboard room ${roomId}`);
      
      socket.join(`whiteboard-${roomId}`);
      
      if (!whiteboardRoomPlayers.has(roomId)) {
        whiteboardRoomPlayers.set(roomId, new Set());
      }
      whiteboardRoomPlayers.get(roomId).add(socket.id);

      // Initialize whiteboard data if it doesn't exist
      if (!whiteboardRooms.has(roomId)) {
        whiteboardRooms.set(roomId, {
          elements: [],
          appState: {},
          files: {},
          collaborators: {}
        });
      }

      // Notify the user they joined the whiteboard room
      socket.emit("whiteboardRoomJoined", {
        roomId,
        players: Array.from(whiteboardRoomPlayers.get(roomId)),
        whiteboardData: whiteboardRooms.get(roomId)
      });

      // Notify other users in the room
      socket.to(`whiteboard-${roomId}`).emit("whiteboardUserJoined", {
        roomId,
        userId: socket.id,
        players: Array.from(whiteboardRoomPlayers.get(roomId))
      });

      console.log(`User ${socket.id} joined whiteboard room ${roomId}. Total players: ${whiteboardRoomPlayers.get(roomId).size}`);
      console.log("Current whiteboard rooms:", Array.from(whiteboardRoomPlayers.keys()));
    });

    socket.on("leaveWhiteboardRoom", ({ roomId }) => {
      socket.leave(`whiteboard-${roomId}`);
      
      if (whiteboardRoomPlayers.has(roomId)) {
        whiteboardRoomPlayers.get(roomId).delete(socket.id);
        
        if (whiteboardRoomPlayers.get(roomId).size === 0) {
          whiteboardRoomPlayers.delete(roomId);
          whiteboardRooms.delete(roomId);
        }
      }

      // Notify other users in the room
      socket.to(`whiteboard-${roomId}`).emit("whiteboardUserLeft", {
        roomId,
        userId: socket.id,
        remainingPlayers: Array.from(whiteboardRoomPlayers.get(roomId) || [])
      });

      console.log(`User ${socket.id} left whiteboard room ${roomId}`);
    });

    socket.on("whiteboardUpdate", (data) => {
      const { roomId, elements, appState, files, userId } = data;
      
      console.log(`Whiteboard update from ${userId} in room ${roomId}`);
      
      // Update the whiteboard data for this room
      if (whiteboardRooms.has(roomId)) {
        whiteboardRooms.set(roomId, {
          ...whiteboardRooms.get(roomId),
          elements: elements || [],
          appState: appState || {},
          files: files || {}
        });
      }

      // Broadcast the update to other users in the room (excluding the sender)
      socket.to(`whiteboard-${roomId}`).emit("whiteboardUpdate", {
        roomId,
        elements,
        appState,
        files,
        userId
      });
      
      console.log(`Broadcasted whiteboard update to room ${roomId}`);
    });

    socket.on("excalidrawEvent", (data) => {
      const { roomId, event, eventData, userId } = data;
      
      console.log(`Excalidraw event from ${userId} in room ${roomId}: ${event}`);
      
      // Broadcast the Excalidraw event to other users in the room (excluding the sender)
      socket.to(`whiteboard-${roomId}`).emit("excalidrawEvent", {
        roomId,
        event,
        eventData,
        userId
      });
      
      console.log(`Broadcasted excalidraw event to room ${roomId}`);
    });

    socket.on("whiteboardInteraction", ({ action, playerId }) => {
      console.log(`Whiteboard interaction: ${action} by ${playerId}`);
      // Handle whiteboard interaction events
      if (action === "open") {
        // You can add logic here to handle whiteboard opening
        console.log(`Player ${playerId} opened whiteboard`);
      }
    });

    socket.on("disconnect", () => {
      console.log(`A user disconnected: ${socket.id}`);
      
      // Handle regular room cleanup
      const roomId = playerRooms.get(socket.id);
      if (roomId) {
        socket.leave(roomId);

        if (roomPlayers.has(roomId)) {
          roomPlayers.get(roomId).delete(socket.id);

          if (roomPlayers.get(roomId).size <= 1) {
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

      // Handle whiteboard room cleanup
      for (const [roomId, players] of whiteboardRoomPlayers.entries()) {
        if (players.has(socket.id)) {
          players.delete(socket.id);
          
          if (players.size === 0) {
            whiteboardRoomPlayers.delete(roomId);
            whiteboardRooms.delete(roomId);
          } else {
            socket.to(`whiteboard-${roomId}`).emit("whiteboardUserLeft", {
              roomId,
              userId: socket.id,
              remainingPlayers: Array.from(players)
            });
          }
          break;
        }
      }

      // Handle event room cleanup
      const eventId = playerEvents.get(socket.id);
      if (eventId) {
        leaveEventSpace(socket, eventId);
      }

      connectedPlayers.delete(socket.id);
      if (socket.userId && userMap.get(socket.userId) === socket.id) {
        userMap.delete(socket.userId);
      }
      
      // Emit playerDisconnected to event-specific room if player was in an event
      const disconnectedEventId = playerEvents.get(socket.id);
      if (disconnectedEventId) {
        const eventRoomId = eventRooms.get(disconnectedEventId);
        if (eventRoomId) {
          socket.to(eventRoomId).emit("playerDisconnected", socket.id);
        }
      } else {
        // Emit to general space if not in event
        io.emit("playerDisconnected", socket.id);
      }
    });

    // --- START CONVERSATION LOGIC ---
    socket.on("startConversation", async ({ targetSocketId }) => {

      let operationExecuted=false;

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

      // Check if user is in a room
      const userRoom=playerRooms.get(socket.id);
      const targetRoom = playerRooms.get(targetSocketId);

      if(userRoom && !targetRoom && !operationExecuted){
        const targetSocket=io.sockets.sockets.get(targetSocketId)
        targetSocket.join(userRoom);
        playerRooms.set(targetSocketId,userRoom);
        console.log('userRoom',userRoom);
        roomPlayers.get(userRoom)?.add(targetSocketId);

        io.to(userRoom).emit("joinedRoom", {
          roomId: userRoom,
          players: Array.from(roomPlayers.get(userRoom)),
          socketId: socket.id,
        });
        operationExecuted=true;
      }

      // Check if target is in a room
      if (((userRoom && targetRoom) || (!userRoom && targetRoom)) && !operationExecuted) {
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
        operationExecuted=true;
      } 
      
      if(!userRoom && !targetRoom && !operationExecuted){
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

        operationExecuted=true;
      }
    });
    // --- END CONVERSATION LOGIC ---

    socket.on("gotAway", ({ otherId, nearbyPlayers }) => {
      const roomId = playerRooms.get(socket.id);

      if (roomPlayers.get(roomId)) {
        console.log("gotawaylog", Array.from(roomPlayers?.get(roomId)));

        let found = false;
        Array.from(roomPlayers.get(roomId)).forEach(id => {
          for (let npid of nearbyPlayers) {
            if (id === npid) {
              found = true;
              return;
            }
          }
        });
        if (!found) {
          socket.leave(roomId)
          if (roomPlayers.has(roomId)) {
            io.to(roomId).emit("leftRoom", {
              roomId,
              playerId: socket.id,
              remainingPlayers: Array.from(roomPlayers.get(roomId)),
            });
          }
          io.to(socket.id).emit('leaveChannel')
          console.log('emitted leave channel',socket.id)
        }

      }
    });
  });
};

export default handleSocketEvents;
