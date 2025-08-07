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

// NEW: Room-based game space management (for general space rooms)
const roomGameSpaces = new Map(); // roomId -> Set of player socketIds
const playerRoomGameSpaces = new Map(); // socketId -> roomId (for game space)

// NEW: Join request management
const pendingJoinRequests = new Map(); // roomId -> Set of pending requests
const roomAdmins = new Map(); // roomId -> adminSocketId

// NEW: Challenge management
const pendingChallenges = new Map(); // challengeId -> challenge data
const challengeIdCounter = 1; // Simple counter for challenge IDs

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

    // NEW: Handle send challenge
    socket.on("sendChallenge", ({ targetSocketId, challengerInfo, question }) => {
      console.log(`Challenge sent from ${socket.id} to ${targetSocketId} with question: ${question?.title}`);
      
      if (!connectedPlayers.has(targetSocketId)) {
        socket.emit("challengeError", { message: "Target user is not online" });
        return;
      }

      const challengeId = `challenge_${Date.now()}_${socket.id}`;
      const challengeData = {
        id: challengeId,
        challengerSocketId: socket.id,
        targetSocketId: targetSocketId,
        challengerInfo: challengerInfo,
        question: question,
        timestamp: Date.now(),
        status: 'pending'
      };

      pendingChallenges.set(challengeId, challengeData);

      // Send challenge notification to target
      io.to(targetSocketId).emit("receiveChallenge", {
        challengeId: challengeId,
        challengerInfo: challengerInfo,
        question: question,
        timestamp: Date.now()
      });

      // Confirm challenge sent to challenger
      socket.emit("challengeSent", { challengeId });
    });

    // NEW: Handle challenge response (accept/reject)
    socket.on("respondToChallenge", ({ challengeId, response }) => {
      console.log(`Challenge response: ${response} for challenge ${challengeId}`);
      
      const challenge = pendingChallenges.get(challengeId);
      if (!challenge) {
        socket.emit("challengeError", { message: "Challenge not found" });
        return;
      }

      if (response === 'accept') {
        // Notify challenger that challenge was accepted
        io.to(challenge.challengerSocketId).emit("challengeAccepted", {
          challengeId: challengeId,
          targetSocketId: socket.id
        });

        // Create a room for the challenge
        const challengeRoomId = `challenge_${challengeId}`;
        socket.join(challengeRoomId);
        const challengerSocket = io.sockets.sockets.get(challenge.challengerSocketId);
        if (challengerSocket) {
          challengerSocket.join(challengeRoomId);
        }
        
        // Both users join the challenge room with question data
        io.to(challenge.challengerSocketId).emit("challengeRoomCreated", {
          roomId: challengeRoomId,
          question: challenge.question,
          opponent: {
            socketId: socket.id,
            userId: socket.userId
          },
          role: 'challenger'
        });

        socket.emit("challengeRoomCreated", {
          roomId: challengeRoomId,
          question: challenge.question,
          opponent: {
            socketId: challenge.challengerSocketId,
            userId: challenge.challengerInfo.userId
          },
          role: 'accepter'
        });

      } else if (response === 'reject') {
        // Notify challenger that challenge was rejected
        io.to(challenge.challengerSocketId).emit("challengeRejected", {
          challengeId: challengeId,
          targetSocketId: socket.id
        });
      }

      // Remove challenge from pending
      pendingChallenges.delete(challengeId);
    });

    // NEW: Handle challenge progress updates
    socket.on("challengeProgress", ({ roomId, testsPassed, totalTests }) => {
      console.log(`Challenge progress from ${socket.id}: ${testsPassed}/${totalTests} tests passed`);
      socket.to(roomId).emit("opponentProgress", { testsPassed, totalTests });
    });

    // NEW: Handle challenge completion
    socket.on("challengeCompleted", ({ roomId, winner, completionTime, testsPassed, totalTests }) => {
      console.log(`Challenge completed by ${winner} in room ${roomId}`);
      
      // Award points for winning (base points + bonus for difficulty and speed)
      const basePoints = 100;
      const speedBonus = Math.max(0, Math.floor((300 - completionTime) / 10)); // Bonus for faster completion
      const winnerPoints = basePoints + speedBonus;
      
      io.to(roomId).emit("challengeCompleted", {
        winner,
        completionTime,
        testsPassed,
        totalTests,
        pointsAwarded: winnerPoints
      });

      // Emit points update to winner using their userId
      const winnerSocket = io.sockets.sockets.get(winner);
      if (winnerSocket && winnerSocket.userId) {
        io.to(winner).emit("pointsUpdate", {
          userId: winnerSocket.userId,
          pointsChange: winnerPoints,
          reason: `Won coding challenge in ${Math.floor(completionTime / 60)}:${(completionTime % 60).toString().padStart(2, '0')}`
        });
      }
    });

    // NEW: Handle challenge timeout
    socket.on("challengeTimeout", ({ roomId }) => {
      console.log(`Challenge timeout in room ${roomId}`);
      io.to(roomId).emit("challengeTimeout");
    });

    // NEW: Handle challenge surrender
    socket.on("challengeSurrender", ({ roomId, opponentSocketId }) => {
      console.log(`Challenge surrender by ${socket.id} in room ${roomId}`);
      
      const surrenderPenalty = -50; // Lose 50 points for surrendering
      const opponentReward = 25; // Opponent gets 25 points for opponent surrendering
      
      // Notify both users about surrender
      io.to(roomId).emit("challengeSurrender", {
        surrenderSocketId: socket.id,
        surrenderUserId: socket.userId,
        opponentSocketId,
        surrenderPenalty,
        opponentReward
      });

      // Emit points updates using userIds
      if (socket.userId) {
        socket.emit("pointsUpdate", {
          userId: socket.userId,
          pointsChange: surrenderPenalty,
          reason: "Surrendered coding challenge"
        });
      }

      const opponentSocket = io.sockets.sockets.get(opponentSocketId);
      if (opponentSocket && opponentSocket.userId) {
        io.to(opponentSocketId).emit("pointsUpdate", {
          userId: opponentSocket.userId,
          pointsChange: opponentReward,
          reason: "Opponent surrendered coding challenge"
        });
      }
    });

    // NEW: Handle join room requests
    socket.on("joinRoomRequest", ({ roomId, socketId, userId, userInfo }) => {
      console.log(`Join request for room ${roomId} from user ${userId} (socket: ${socketId})`);
      
      // Store the pending request
      if (!pendingJoinRequests.has(roomId)) {
        pendingJoinRequests.set(roomId, new Map());
      }
      pendingJoinRequests.get(roomId).set(userId, { 
        socketId, 
        userId, 
        userInfo,
        timestamp: Date.now() 
      });
      
      // Notify room admin about the pending request
      const adminSocketId = roomAdmins.get(roomId);
      if (adminSocketId) {
        io.to(adminSocketId).emit("newJoinRequest", {
          roomId,
          socketId,
          userId,
          userInfo,
          timestamp: Date.now()
        });
      }
    });

    // NEW: Handle join request approval/rejection
    socket.on("approveJoinRequest", ({ roomId, participantId }) => {
      console.log(`Approving join request for room ${roomId}, participant ${participantId}`);
      
      // Remove from pending requests
      const pendingRequests = pendingJoinRequests.get(roomId);
      if (pendingRequests) {
        pendingRequests.delete(participantId);
      }
      
      // Notify the approved user
      const participantSocketId = userMap.get(participantId);
      if (participantSocketId) {
        io.to(participantSocketId).emit("approvedJoinRequest", { roomId });
      }
      
      // Notify all admins of the room about the approval
      const adminSocketId = roomAdmins.get(roomId);
      if (adminSocketId) {
        io.to(adminSocketId).emit("joinRequestApproved", { roomId, participantId });
      }
    });

    socket.on("rejectJoinRequest", ({ roomId, participantId }) => {
      console.log(`Rejecting join request for room ${roomId}, participant ${participantId}`);
      
      // Remove from pending requests
      const pendingRequests = pendingJoinRequests.get(roomId);
      if (pendingRequests) {
        pendingRequests.delete(participantId);
      }
      
      // Notify the rejected user
      const participantSocketId = userMap.get(participantId);
      if (participantSocketId) {
        io.to(participantSocketId).emit("rejectedJoinRequest", { roomId });
      }
      
      // Notify all admins of the room about the rejection
      const adminSocketId = roomAdmins.get(roomId);
      if (adminSocketId) {
        io.to(adminSocketId).emit("joinRequestRejected", { roomId, participantId });
      }
    });

    // NEW: Set room admin
    socket.on("setRoomAdmin", ({ roomId }) => {
      roomAdmins.set(roomId, socket.id);
      console.log(`Set admin for room ${roomId}: ${socket.id}`);
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

         // NEW: Join room-based game space (for general space rooms)
     socket.on("joinRoomGameSpace", ({ roomId, userId }) => {
       console.log(`User ${socket.id} joining room game space for room ${roomId}`);
       
       // Leave any existing room game space
       const currentRoomId = playerRoomGameSpaces.get(socket.id);
       if (currentRoomId && currentRoomId !== roomId) {
         leaveRoomGameSpace(socket, currentRoomId);
       }
       
       // Create or get room game space
       if (!roomGameSpaces.has(roomId)) {
         roomGameSpaces.set(roomId, new Set());
       }
       
       // Join the Socket.IO room
       socket.join(roomId);
       
       // Join the room game space
       playerRoomGameSpaces.set(socket.id, roomId);
       roomGameSpaces.get(roomId).add(socket.id);
      
      console.log(`Player ${socket.id} now in room ${roomId}. Total players in room: ${roomGameSpaces.get(roomId).size}`);
      
      // Get existing players in this room
      const existingRoomPlayers = Array.from(roomGameSpaces.get(roomId))
        .filter(id => id !== socket.id && connectedPlayers.has(id))
        .map(id => ({
          id,
          x: connectedPlayers.get(id).x,
          y: connectedPlayers.get(id).y,
        }));
      
      // Send current players to the joining user
      socket.emit("roomGameSpaceJoined", {
        roomId,
        existingPlayers: existingRoomPlayers
      });
      
      // Notify other players in the room
      socket.to(roomId).emit("playerJoinedRoom", {
        roomId,
        playerId: socket.id,
        userId: userId
      });
      
      console.log(`User ${socket.id} joined room ${roomId}. Total players: ${roomGameSpaces.get(roomId).size}`);
    });

    // NEW: Leave room-based game space
    socket.on("leaveRoomGameSpace", ({ roomId }) => {
      leaveRoomGameSpace(socket, roomId);
    });

         // Helper function to leave room game space
     const leaveRoomGameSpace = (socket, roomId) => {
       if (roomGameSpaces.has(roomId)) {
         // Leave the Socket.IO room
         socket.leave(roomId);
         
         roomGameSpaces.get(roomId).delete(socket.id);
         playerRoomGameSpaces.delete(socket.id);
         
         // If no players left in room, clean up
         if (roomGameSpaces.get(roomId).size === 0) {
           roomGameSpaces.delete(roomId);
         } else {
           // Notify remaining players
           socket.to(roomId).emit("playerLeftRoom", {
             roomId,
             playerId: socket.id
           });
         }
         
         console.log(`User ${socket.id} left room ${roomId}`);
       }
     };

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
      // Check if player is in a room game space
      const roomId = playerRoomGameSpaces.get(socket.id);
      
      console.log(`Player ${socket.id} ready. Event ID: ${eventId}, Room ID: ${roomId}`);
      
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
      } else if (roomId) {
        // Send only players in the same room game space
        const existingRoomPlayers = Array.from(roomGameSpaces.get(roomId))
          .filter(id => id !== socket.id && connectedPlayers.has(id))
          .map(id => ({
            id,
            x: connectedPlayers.get(id).x,
            y: connectedPlayers.get(id).y,
          }));
        console.log(`Sending ${existingRoomPlayers.length} room players to ${socket.id} in room ${roomId}`);
        socket.emit("currentPlayers", existingRoomPlayers);
        
        // Notify other room players about this new player
        const roomPlayers = Array.from(roomGameSpaces.get(roomId))
          .filter(id => id !== socket.id);
        
        roomPlayers.forEach(playerId => {
          io.to(playerId).emit("playerJoinedRoom", {
            roomId,
            playerId: socket.id,
            userId: socket.userId
          });
        });
      } else {
        // Send only players who are NOT in any event or room space for general space
        const existingPlayers = Array.from(connectedPlayers.entries())
          .filter(([id, pos]) => !playerEvents.has(id) && !playerRoomGameSpaces.has(id)) // Only players not in any event or room
          .map(([id, pos]) => ({
            id,
            x: pos.x,
            y: pos.y,
          }));
        console.log(`Sending ${existingPlayers.length} general players to ${socket.id} in general space`);
        socket.emit("currentPlayers", existingPlayers);
        
        // Notify other general space players about this new player
        // Only send to players who are NOT in any event or room space
        const generalSpacePlayers = Array.from(connectedPlayers.keys())
          .filter(id => !playerEvents.has(id) && !playerRoomGameSpaces.has(id) && id !== socket.id);
        
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
        // Check if player is in a room game space
        const roomId = playerRoomGameSpaces.get(socket.id);
        if (roomId) {
          // Broadcast to room-specific game space
          socket.to(roomId).emit("playerMoved", data);
        } else {
          // Broadcast to general space if not in event or room
          socket.broadcast.emit("playerMoved", data);
        }
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
        io.emit("receiveMessage", {
          message: data.message,
          senderId: socket.id,
        });
    });

    // Whiteboard room management
    socket.on("joinWhiteboardRoom", ({ roomId }) => {
      try {
        console.log(`User ${socket.id} joining whiteboard room ${roomId}`);
        
        if (!roomId) {
          console.error("No roomId provided for whiteboard join");
          socket.emit("whiteboardError", { message: "No room ID provided" });
          return;
        }
        
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

        const currentRoomData = whiteboardRooms.get(roomId);
        const currentPlayers = Array.from(whiteboardRoomPlayers.get(roomId));

        // Notify the user they joined the whiteboard room
        socket.emit("whiteboardRoomJoined", {
          roomId,
          players: currentPlayers,
          whiteboardData: currentRoomData
        });

        // Notify other users in the room
        socket.to(`whiteboard-${roomId}`).emit("whiteboardUserJoined", {
          roomId,
          userId: socket.id,
          players: currentPlayers
        });

        console.log(`User ${socket.id} joined whiteboard room ${roomId}. Total players: ${currentPlayers.length}`);
        console.log("Current whiteboard rooms:", Array.from(whiteboardRoomPlayers.keys()));
      } catch (error) {
        console.error("Error joining whiteboard room:", error);
        socket.emit("whiteboardError", { message: "Failed to join whiteboard room" });
      }
    });

    socket.on("leaveWhiteboardRoom", ({ roomId }) => {
      socket.leave(`whiteboard-${roomId}`);
      
      if (whiteboardRoomPlayers.has(roomId)) {
        whiteboardRoomPlayers.get(roomId).delete(socket.id);
        
        if (whiteboardRoomPlayers.get(roomId).size === 0) {
          whiteboardRoomPlayers.delete(roomId);
          // whiteboardRooms.delete(roomId);
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

      // Handle room game space cleanup
      const roomGameSpaceId = playerRoomGameSpaces.get(socket.id);
      if (roomGameSpaceId) {
        leaveRoomGameSpace(socket, roomGameSpaceId);
      }

      // Handle pending challenges cleanup
      for (const [challengeId, challenge] of pendingChallenges.entries()) {
        if (challenge.challengerSocketId === socket.id || challenge.targetSocketId === socket.id) {
          pendingChallenges.delete(challengeId);
          
          // Notify the other party about the cancellation
          const otherSocketId = challenge.challengerSocketId === socket.id 
            ? challenge.targetSocketId 
            : challenge.challengerSocketId;
          
          if (connectedPlayers.has(otherSocketId)) {
            io.to(otherSocketId).emit("challengeCancelled", { challengeId });
          }
        }
      }

      connectedPlayers.delete(socket.id);
      if (socket.userId && userMap.get(socket.userId) === socket.id) {
        userMap.delete(socket.userId);
      }
      
      // Emit playerDisconnected to the appropriate space
      const disconnectedEventId = playerEvents.get(socket.id);
      const disconnectedRoomId = playerRoomGameSpaces.get(socket.id);
      
      if (disconnectedEventId) {
        const eventRoomId = eventRooms.get(disconnectedEventId);
        if (eventRoomId) {
          socket.to(eventRoomId).emit("playerDisconnected", socket.id);
        }
      } else if (disconnectedRoomId) {
        // Emit to room game space
        socket.to(disconnectedRoomId).emit("playerDisconnected", socket.id);
      } else {
        // Emit to general space if not in event or room
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
          players: Array.from(roomPlayers?.get(userRoom) || []),
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

    // Notification events
    socket.on("sendNotification", ({ targetUserId, notification }) => {
      const targetSocketId = userMap.get(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("receiveNotification", notification);
      }
    });

    socket.on("markNotificationRead", ({ notificationId }) => {
      // This could be handled by the client making an API call instead
      // but we can emit to update real-time UI if needed
      socket.emit("notificationMarkedRead", { notificationId });
    });

    socket.on("requestNotificationCount", ({ userId }) => {
      // This would typically be handled by API calls, but we can emit real-time updates
      socket.emit("notificationCountUpdate", { count: 0 }); // This would be dynamic
    });

    
  });
};

export default handleSocketEvents;
