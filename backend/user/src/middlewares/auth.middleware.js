"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const User = require("../models/user.model");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const BlacklistToken = require('../models/blacklistToken.model');
const authMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const token = ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.token) || ((_b = req.headers.authorization) === null || _b === void 0 ? void 0 : _b.split(" ")[1]);
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const isBlacklisted = yield BlacklistToken.findOne({ token });
    if (isBlacklisted) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = yield User.findById(decoded._id);
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        req.user = user;
        return next();
    }
    catch (error) {
        return res.status(401).json({ message: "Unauthorized" });
    }
});
exports.default = authMiddleware;
