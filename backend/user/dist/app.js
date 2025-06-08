"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const db_js_1 = __importDefault(require("./db/db.js"));
const user_routes_js_1 = __importDefault(require("./routes/user.routes.js"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
require("dotenv/config");
const app = (0, express_1.default)();
(0, db_js_1.default)();
app.use((0, cors_1.default)({
    origin: [process.env.FRONTEND_URL, 'http://localhost:3000', 'https://hack-meet-puce.vercel.app'],
    credentials: true,
    // secure: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Set-Cookie', 'Cookie']
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use('/', user_routes_js_1.default);
app.get('/', (req, res) => {
    res.send("Hello World");
});
exports.default = app;
