import http from 'http';
import app from './app';
const port=process.env.PORT || 4000;

const server=http.createServer(app);

server.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
});