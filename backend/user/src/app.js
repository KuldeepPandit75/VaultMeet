"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = require('dotenv');
dotenv.config();
const express_1 = __importDefault(require("express"));
const cors = require('cors');
const app = (0, express_1.default)();
const connectDB = require('./db/db');
const userRoutes = require('./routes/user.routes');
const cookieParser = require('cookie-parser');
connectDB();
app.use(cors({
    origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'https://hack-meet-five.vercel.app'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Set-Cookie', 'Cookie']
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/', userRoutes);
app.get('/', (req, res) => {
    res.send("Hello World");
});
exports.default = app;
