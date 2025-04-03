const connectedPlayers = new Map();

const handleSocketEvents = (io) => {
    io.on("connection", (socket) => {
        console.log(`A user connected: ${socket.id}`);

        // Send existing players to the newly connected player
        const existingPlayers = Array.from(connectedPlayers.entries()).map(([id, pos]) => ({
            id,
            x: pos.x,
            y: pos.y
        }));
        socket.emit('currentPlayers', existingPlayers);

        // Add new player with default position
        connectedPlayers.set(socket.id, { x: 300, y: 300 });

        // Notify all other clients
        socket.broadcast.emit('playerJoined', socket.id);

        // Handle player movement
        socket.on("playerMove", (data) => {
            connectedPlayers.set(socket.id, { x: data.x, y: data.y });
            socket.broadcast.emit("playerMoved", data);
        });

        // Handle disconnection
        socket.on("disconnect", () => {
            console.log(`A user disconnected: ${socket.id}`);
            connectedPlayers.delete(socket.id);
            io.emit("playerDisconnected", socket.id);
        });
    });
};

export default handleSocketEvents;
