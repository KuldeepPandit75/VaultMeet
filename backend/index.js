import express from 'express'
import 'dotenv/config'
import cors from 'cors'
import connection from './database/db.js'
import router from './routes/route.js'
import { Server } from 'socket.io'
import handleSocketEvents from './controllers/socketController.js'

const app = express();
const port = process.env.PORT || 2020;

app.use(cors());
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.use("/", router)

const server = app.listen(port, () => {
    console.log("listening on port, ", port);
});

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

handleSocketEvents(io);

connection();