import http from 'http';
import app from './app.js';
import "dotenv/config";

const port = process.env.PORT || 4002;

const server = http.createServer(app);

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});