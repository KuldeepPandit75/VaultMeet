import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import BlacklistToken from '../models/blacklistToken.model.js';

const socketAuthMiddleware = async (socket, next) => {
  try {
    // Get token from handshake auth or query
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error("Authentication token required"));
    }

    // Check if token is blacklisted
    const isBlacklisted = await BlacklistToken.findOne({ token });
    if (isBlacklisted) {
      return next(new Error("Token is blacklisted"));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded._id);
    if (!user) {
      return next(new Error("User not found"));
    }

    // Attach user to socket
    socket.user = user;
    socket.userId = user._id.toString();
    
    next();
  } catch (error) {
    console.error("Socket authentication error:", error.message);
    next(new Error("Authentication failed"));
  }
};

export default socketAuthMiddleware; 