const connectedPlayers = new Map();
const playerRooms = new Map(); // Track which rooms each player is in
const roomPlayers = new Map(); // Track which players are in each room

const handleSocketEvents = (io) => {
    io.on("connection", (socket) => {
        console.log(`A user connected: ${socket.id}`);

        const existingPlayers = Array.from(connectedPlayers.entries()).map(([id, pos]) => ({
            id,
            x: pos.x,
            y: pos.y
        }));
        
        socket.emit('currentPlayers', existingPlayers);

        connectedPlayers.set(socket.id, { x: 300, y: 300 });

        socket.broadcast.emit('playerJoined', socket.id);

        socket.on("playerMove", (data) => {
            connectedPlayers.set(socket.id, { x: data.x, y: data.y });
            socket.broadcast.emit("playerMoved", data);
        });

        // Handle room joining
        socket.on('joinRoom', ({ roomId, playerIds }) => {
            // Check if all players exist and are connected
            const validPlayers = playerIds.filter(id => connectedPlayers.has(id));
            
            if (validPlayers.length > 0) {
                // Join the room
                socket.join(roomId);
                
                // Track the room for this player
                playerRooms.set(socket.id, roomId);
                
                // Track players in this room
                if (!roomPlayers.has(roomId)) {
                    roomPlayers.set(roomId, new Set());
                }
                roomPlayers.get(roomId).add(socket.id);
                
                // Notify all players in the room
                io.to(roomId).emit('joinedRoom', {
                    roomId,
                    players: Array.from(roomPlayers.get(roomId))
                });
                
                console.log(`Player ${socket.id} joined room ${roomId}`);
            }
        });

        // Handle room leaving
        socket.on('leaveRoom', ({ playerId }) => {
            const roomId = playerRooms.get(playerId);
            if (roomId) {
                // Leave the room
                socket.leave(roomId);
                
                // Remove player from room tracking
                if (roomPlayers.has(roomId)) {
                    roomPlayers.get(roomId).delete(playerId);
                    
                    // If room is empty, delete it
                    if (roomPlayers.get(roomId).size === 0) {
                        roomPlayers.delete(roomId);
                    }
                }
                
                // Remove room tracking for player
                playerRooms.delete(playerId);
                
                // Notify remaining players in the room
                if (roomPlayers.has(roomId)) {
                    io.to(roomId).emit('leftRoom', {
                        roomId,
                        playerId,
                        remainingPlayers: Array.from(roomPlayers.get(roomId))
                    });
                }
                
                console.log(`Player ${playerId} left room ${roomId}`);
            }
        });

        // Handle room-specific messages
        socket.on('sendMsg', (data) => {
            const roomId = playerRooms.get(socket.id);
            if (roomId) {
                // Send message to all players in the room
                io.to(roomId).emit('receiveMessage', {
                    message: data.message,
                    senderId: socket.id
                });
            }
        });

        socket.on("disconnect", () => {
            console.log(`A user disconnected: ${socket.id}`);
            // Leave all rooms when disconnecting
            const roomId = playerRooms.get(socket.id);
            if (roomId) {
                socket.leave(roomId);
                
                // Remove player from room tracking
                if (roomPlayers.has(roomId)) {
                    roomPlayers.get(roomId).delete(socket.id);
                    
                    // If room is empty, delete it
                    if (roomPlayers.get(roomId).size === 0) {
                        roomPlayers.delete(roomId);
                    } else {
                        // Notify remaining players
                        io.to(roomId).emit('leftRoom', {
                            roomId,
                            playerId: socket.id,
                            remainingPlayers: Array.from(roomPlayers.get(roomId))
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
