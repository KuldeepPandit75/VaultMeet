"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const db_js_1 = __importDefault(require("./db/db.js"));
const user_routes_js_1 = __importDefault(require("./routes/user.routes.js"));
const room_routes_js_1 = __importDefault(require("./routes/room.routes.js"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
require("dotenv/config");
const app = (0, express_1.default)();
(0, db_js_1.default)();
app.use((0, cors_1.default)({
    origin: [process.env.FRONTEND_URL, 'http://localhost:3000', 'https://hack-meet-nine.vercel.app', 'http://192.168.1.38:3000', 'https://www.vaultmeet.xyz', 'https://vaultmeet.xyz', 'https://api.vaultmeet.xyz'],
    credentials: true,
    // secure: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Set-Cookie', 'Cookie']
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use((req, _, next) => {
    console.log(`[${req.method}] ${req.originalUrl}`);
    next();
});
app.use('/', user_routes_js_1.default);
app.use('/rooms', room_routes_js_1.default);
app.get('/', (req, res) => {
    res.send("Hello World");
});
exports.default = app;
