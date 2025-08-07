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
exports.getLeaderboard = exports.getUserPoints = exports.updateUserPoints = exports.removeConnection = exports.getConnections = exports.getConnectionsCount = exports.getUnreadNotificationCount = exports.markAllNotificationsAsRead = exports.markNotificationAsRead = exports.getNotifications = exports.getConnectionStatus = exports.respondToConnectionRequest = exports.sendConnectionRequest = exports.getUserBySocketId = exports.updateSocketId = exports.getUserProfileByUsername = exports.googleLogin = exports.updateProfilePicture = exports.updateBanner = exports.checkUsernameAvailability = exports.updateUser = exports.logoutUser = exports.getMe = exports.loginUser = exports.registerUser = void 0;
const user_model_js_1 = __importDefault(require("../models/user.model.js"));
const user_service_js_1 = __importDefault(require("../services/user.service.js"));
const express_validator_1 = require("express-validator");
const blacklistToken_model_js_1 = __importDefault(require("../models/blacklistToken.model.js"));
const cloudinary_js_1 = __importDefault(require("../config/cloudinary.js"));
const promises_1 = __importDefault(require("fs/promises")); // Add fs promises for async file operations
const bcrypt_1 = __importDefault(require("bcrypt"));
const user_model_js_2 = __importDefault(require("../models/user.model.js"));
const registerUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { fullname, email, password, role, username } = req.body;
    const existingUser = yield user_model_js_1.default.findOne({ username });
    if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
    }
    const existingEmail = yield user_model_js_1.default.findOne({ email });
    if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
    }
    const hashedPassword = yield bcrypt_1.default.hash(password, 10);
    const user = yield user_service_js_1.default.createUser({
        fullname: {
            firstname: fullname.firstname,
            lastname: fullname.lastname,
        },
        email,
        password: hashedPassword,
        role,
        username,
    });
    const token = user.generateAuthToken();
    res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "none",
    });
    res.status(201).json({ token, user });
});
exports.registerUser = registerUser;
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: "Invalid email or password", errors: errors.array() });
    }
    const { email, password } = req.body;
    const user = yield user_model_js_1.default.findOne({ email }).select("+password");
    if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
    }
    const isMatch = yield user.comparePassword(password);
    if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
    }
    const token = user.generateAuthToken();
    res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({ token, user });
});
exports.loginUser = loginUser;
const getMe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_js_1.default.findById(req.user._id);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
});
exports.getMe = getMe;
const logoutUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    res.cookie("token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });
    const token = req.cookies.token || ((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1]);
    yield blacklistToken_model_js_1.default.create({ token });
    res.status(200).json({ message: "Logged out successfully" });
});
exports.logoutUser = logoutUser;
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const allowedUpdates = [
        "fullname",
        "username",
        "avatar",
        "bio",
        "location",
        "college",
        "skills",
        "interests",
        "social",
        "featuredProject",
        "achievements",
    ];
    const updates = {};
    Object.keys(req.body).forEach((key) => {
        if (allowedUpdates.includes(key)) {
            updates[key] = req.body[key];
        }
    });
    // Handle featured projects update
    if (req.body.featuredProjects) {
        updates.featuredProject = {
            title: req.body.featuredProjects.title,
            description: req.body.featuredProjects.description,
            link: req.body.featuredProjects.link,
            techUsed: req.body.featuredProjects.techUsed,
        };
    }
    try {
        const user = yield user_model_js_1.default.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ user });
    }
    catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                message: "Username or email already exists",
            });
        }
        res.status(400).json({ message: error.message });
    }
});
exports.updateUser = updateUser;
const checkUsernameAvailability = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username } = req.params;
    if (!username) {
        return res.status(400).json({
            message: "Username is required",
        });
    }
    try {
        const existingUser = yield user_model_js_1.default.findOne({ username });
        res.status(200).json({
            available: !existingUser,
            message: existingUser
                ? "Username is already taken"
                : "Username is available",
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Error checking username availability",
        });
    }
});
exports.checkUsernameAvailability = checkUsernameAvailability;
const updateBanner = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        // Upload to Cloudinary
        const result = yield cloudinary_js_1.default.uploader.upload(req.file.path, {
            folder: "banners",
            resource_type: "auto",
        });
        // Update user's banner
        const user = yield user_model_js_1.default.findByIdAndUpdate(req.user._id, { banner: result.secure_url }, { new: true });
        if (!user) {
            // Clean up file if user not found
            yield promises_1.default.unlink(req.file.path);
            return res.status(404).json({ message: "User not found" });
        }
        // Delete the temporary file after successful upload
        yield promises_1.default.unlink(req.file.path);
        res.status(200).json({
            message: "Banner updated successfully",
            banner: result.secure_url,
        });
    }
    catch (error) {
        // If there's an error, try to clean up the temporary file
        if (req.file) {
            try {
                yield promises_1.default.unlink(req.file.path);
            }
            catch (cleanupError) {
                console.error("Error cleaning up temporary file:", cleanupError);
            }
        }
        res.status(500).json({
            message: "Error updating banner",
            error: error.message,
        });
    }
});
exports.updateBanner = updateBanner;
const updateProfilePicture = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        // Upload to Cloudinary
        const result = yield cloudinary_js_1.default.uploader.upload(req.file.path, {
            folder: "avatars",
            resource_type: "auto",
        });
        // Update user's avatar
        const user = yield user_model_js_1.default.findByIdAndUpdate(req.user._id, { avatar: result.secure_url }, { new: true });
        if (!user) {
            // Clean up file if user not found
            yield promises_1.default.unlink(req.file.path);
            return res.status(404).json({ message: "User not found" });
        }
        // Delete the temporary file after successful upload
        yield promises_1.default.unlink(req.file.path);
        res.status(200).json({
            message: "Profile picture updated successfully",
            avatar: result.secure_url,
        });
    }
    catch (error) {
        // If there's an error, try to clean up the temporary file
        if (req.file) {
            try {
                yield promises_1.default.unlink(req.file.path);
            }
            catch (cleanupError) {
                console.error("Error cleaning up temporary file:", cleanupError);
            }
        }
        res.status(500).json({
            message: "Error updating profile picture",
            error: error.message,
        });
    }
});
exports.updateProfilePicture = updateProfilePicture;
const googleLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, name, picture, googleId } = req.body;
        // Check if user exists
        let user = yield user_model_js_1.default.findOne({ email });
        if (!user) {
            // Create new user if doesn't exist
            const username = email.split("@")[0] + Math.random().toString(36).substring(2, 8);
            const [firstname, ...lastnameParts] = name.split(" ");
            const lastname = lastnameParts.join(" ");
            user = yield user_service_js_1.default.createUser({
                fullname: {
                    firstname,
                    lastname,
                },
                email,
                password: Math.random().toString(36).slice(-8), // Random password for Google users
                role: "user",
                username,
                avatar: picture,
                googleId,
                isVerified: true,
            });
        }
        else if (!user.googleId) {
            // Update existing user with Google ID if not already set
            user.googleId = googleId;
            if (!user.avatar) {
                user.avatar = picture;
            }
            yield user.save();
        }
        const token = user.generateAuthToken();
        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        res.status(200).json({ token, user });
    }
    catch (error) {
        console.error("Google login error:", error);
        res
            .status(500)
            .json({ message: "Error during Google login", error: error.message });
    }
});
exports.googleLogin = googleLogin;
const getUserProfileByUsername = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username } = req.params;
    const user = yield user_model_js_1.default.findOne({ username }).select("-googleId -password -role -isVerified -createdAt -updatedAt -__v -otp");
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
});
exports.getUserProfileByUsername = getUserProfileByUsername;
const updateSocketId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { socketId, userId } = req.body;
    const user = yield user_model_js_2.default.findById(userId);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    user.socketId = socketId;
    yield user.save();
    res.status(200).json({ message: 'Socket ID updated successfully' });
});
exports.updateSocketId = updateSocketId;
const getUserBySocketId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { socketId } = req.params;
    console.log(socketId);
    const user = yield user_model_js_1.default.findOne({ socketId });
    if (!user) {
        console.log('User not found');
        return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
});
exports.getUserBySocketId = getUserBySocketId;
// Connection request endpoints
const sendConnectionRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { targetUserId } = req.body;
        const senderId = req.user._id;
        if (senderId.equals(targetUserId)) {
            return res.status(400).json({ message: "Cannot send connection request to yourself" });
        }
        // Check if users exist
        const [sender, targetUser] = yield Promise.all([
            user_model_js_1.default.findById(senderId),
            user_model_js_1.default.findById(targetUserId)
        ]);
        if (!sender || !targetUser) {
            return res.status(404).json({ message: "User not found" });
        }
        // Check if connection already exists
        const existingConnection = sender.connections.find((conn) => conn.user.equals(targetUserId));
        if (existingConnection) {
            if (existingConnection.status === 'connected') {
                return res.status(400).json({ message: "Already connected" });
            }
            else {
                return res.status(400).json({ message: "Connection request already sent" });
            }
        }
        // Check if target user have already sent a connection request to sender
        const targetUserConnectionRequest = targetUser.connections.find((conn) => conn.user.equals(senderId) && conn.status === 'pending');
        if (targetUserConnectionRequest) {
            console.log('aaa');
            targetUserConnectionRequest.status = 'connected';
            sender.connections.push({
                user: targetUserId,
                status: 'connected'
            });
            targetUser.notifications.push({
                type: 'connection_accepted',
                message: `${sender.fullname.firstname} ${sender.fullname.lastname} accepted your connection request`,
                isRead: false,
                createdAt: new Date(),
                senderId: senderId
            });
            const connectionRequest = sender.notifications.find((notification) => notification.type === 'connection_request' && notification.senderId.equals(targetUserId));
            if (connectionRequest) {
                connectionRequest.isRead = true;
                yield sender.save();
            }
            yield Promise.all([sender.save(), targetUser.save()]);
            return res.status(200).json({ status: 'connected', message: 'Connected successfully' });
        }
        // Add connection request to sender's connections
        sender.connections.push({
            user: targetUserId,
            status: 'pending'
        });
        // Add notification to target user
        targetUser.notifications.push({
            type: 'connection_request',
            message: `${sender.fullname.firstname} ${sender.fullname.lastname} sent you a connection request`,
            isRead: false,
            createdAt: new Date(),
            senderId: senderId
        });
        yield Promise.all([sender.save(), targetUser.save()]);
        // Emit socket event for real-time notification
        // Note: You would need to import and use the socket instance here
        // For now, we'll handle this in the frontend by polling or making API calls
        res.status(200).json({ status: 'pending', message: "Connection request sent successfully" });
    }
    catch (error) {
        console.error('Error sending connection request:', error);
        res.status(500).json({ status: 'error', message: "Internal server error" });
    }
});
exports.sendConnectionRequest = sendConnectionRequest;
const respondToConnectionRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { senderId, action } = req.body; // action: 'accept' or 'decline'
        const receiverId = req.user._id;
        if (!['accept', 'decline'].includes(action)) {
            return res.status(400).json({ message: "Invalid action. Must be 'accept' or 'decline'" });
        }
        // Get both users
        const [receiver, sender] = yield Promise.all([
            user_model_js_1.default.findById(receiverId),
            user_model_js_1.default.findById(senderId)
        ]);
        if (!receiver || !sender) {
            return res.status(404).json({ message: "User not found" });
        }
        console.log(sender.connections);
        // Find the connection request in sender's connections
        const senderConnection = sender.connections.find((conn) => conn.user.equals(receiverId) && conn.status === 'pending');
        if (!senderConnection) {
            return res.status(404).json({ message: "Connection request not found" });
        }
        if (action === 'accept') {
            // Update sender's connection status
            senderConnection.status = 'connected';
            // Add connection to receiver's connections
            receiver.connections.push({
                user: senderId,
                status: 'connected'
            });
            // Add notification to sender
            sender.notifications.push({
                type: 'connection_accepted',
                message: `${receiver.fullname.firstname} ${receiver.fullname.lastname} accepted your connection request`,
                isRead: false,
                createdAt: new Date(),
                senderId: receiverId
            });
            yield Promise.all([sender.save(), receiver.save()]);
            res.status(200).json({ message: "Connection request accepted" });
        }
        else {
            // Remove connection request from sender
            sender.connections = sender.connections.filter((conn) => !(conn.user.toString() === receiverId && conn.status === 'pending'));
            // Add notification to sender
            sender.notifications.push({
                type: 'connection_declined',
                message: `${receiver.fullname.firstname} ${receiver.fullname.lastname} declined your connection request`,
                isRead: false,
                createdAt: new Date(),
                senderId: receiverId
            });
            yield Promise.all([sender.save(), receiver.save()]);
            res.status(200).json({ message: "Connection request declined" });
        }
    }
    catch (error) {
        console.error('Error responding to connection request:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.respondToConnectionRequest = respondToConnectionRequest;
const getConnectionStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { targetUserId } = req.params;
        const userId = req.user._id;
        const user = yield user_model_js_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const connection = user.connections.find((conn) => conn.user.toString() === targetUserId);
        if (!connection) {
            return res.status(200).json({ status: 'not_connected' });
        }
        res.status(200).json({ status: connection.status });
    }
    catch (error) {
        console.error('Error getting connection status:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getConnectionStatus = getConnectionStatus;
// Notification endpoints
const getNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user._id;
        const user = yield user_model_js_1.default.findById(userId).populate('notifications.senderId', 'fullname avatar username');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Sort notifications by creation date (newest first)
        const notifications = user.notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        res.status(200).json({ notifications });
    }
    catch (error) {
        console.error('Error getting notifications:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getNotifications = getNotifications;
const markNotificationAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { notificationId } = req.params;
        const userId = req.user._id;
        const user = yield user_model_js_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const notification = user.notifications.id(notificationId);
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }
        notification.isRead = true;
        yield user.save();
        res.status(200).json({ message: "Notification marked as read" });
    }
    catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.markNotificationAsRead = markNotificationAsRead;
const markAllNotificationsAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user._id;
        const user = yield user_model_js_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        user.notifications.forEach((notification) => {
            notification.isRead = true;
        });
        yield user.save();
        res.status(200).json({ message: "All notifications marked as read" });
    }
    catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
const getUnreadNotificationCount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user._id;
        const user = yield user_model_js_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const unreadCount = user.notifications.filter((notification) => !notification.isRead).length;
        res.status(200).json({ unreadCount });
    }
    catch (error) {
        console.error('Error getting unread notification count:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getUnreadNotificationCount = getUnreadNotificationCount;
const getConnectionsCount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { userId } = req.params;
        const requesterId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const user = yield user_model_js_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const connectionsCount = user.connections.filter((conn) => conn.status === 'connected').length;
        res.status(200).json({ connectionsCount });
    }
    catch (error) {
        console.error('Error getting connections count:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getConnectionsCount = getConnectionsCount;
const getConnections = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const requesterId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const user = yield user_model_js_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Get connected users
        const connectedConnections = user.connections.filter((conn) => conn.status === 'connected');
        // Calculate pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Get user IDs of connected users
        const connectedUserIds = connectedConnections.map((conn) => conn.user);
        // Fetch connected users with pagination
        const connectedUsers = yield user_model_js_1.default.find({
            _id: { $in: connectedUserIds }
        })
            .select('fullname avatar username email location')
            .skip(skip)
            .limit(limitNum);
        // Get total count for pagination
        const totalConnections = connectedConnections.length;
        const totalPages = Math.ceil(totalConnections / limitNum);
        res.status(200).json({
            connections: connectedUsers,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalConnections,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            }
        });
    }
    catch (error) {
        console.error('Error getting connections:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getConnections = getConnections;
const removeConnection = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { targetUserId } = req.body;
        const userId = req.user._id;
        if (userId === targetUserId) {
            return res.status(400).json({ message: "Cannot remove connection with yourself" });
        }
        // Check if users exist
        const [user, targetUser] = yield Promise.all([
            user_model_js_1.default.findById(userId),
            user_model_js_1.default.findById(targetUserId)
        ]);
        if (!user || !targetUser) {
            return res.status(404).json({ message: "User not found" });
        }
        // Remove connection from both users
        user.connections = user.connections.filter((conn) => conn.user.toString() !== targetUserId);
        targetUser.connections = targetUser.connections.filter((conn) => conn.user.toString() !== userId);
        yield Promise.all([user.save(), targetUser.save()]);
        res.status(200).json({ message: "Connection removed successfully" });
    }
    catch (error) {
        console.error('Error removing connection:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.removeConnection = removeConnection;
// Update user points
const updateUserPoints = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, pointsChange, reason } = req.body;
        if (!userId || pointsChange === undefined) {
            return res.status(400).json({ message: "User ID and points change are required" });
        }
        const user = yield user_model_js_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Calculate new points, ensuring it doesn't go below 0
        const newPoints = Math.max(0, user.points + pointsChange);
        user.points = newPoints;
        // Add notification about points change
        const notificationMessage = pointsChange > 0
            ? `You earned ${pointsChange} points! ${reason || ''}`
            : `You lost ${Math.abs(pointsChange)} points. ${reason || ''}`;
        user.notifications.push({
            type: 'points_update',
            message: notificationMessage,
            isRead: false,
            createdAt: new Date()
        });
        yield user.save();
        res.status(200).json({
            message: "Points updated successfully",
            newPoints: user.points,
            pointsChange
        });
    }
    catch (error) {
        console.error('Error updating user points:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.updateUserPoints = updateUserPoints;
// Get user points
const getUserPoints = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const user = yield user_model_js_1.default.findById(userId).select('points');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ points: user.points });
    }
    catch (error) {
        console.error('Error fetching user points:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getUserPoints = getUserPoints;
// Get leaderboard data
const getLeaderboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const currentUserId = req.user._id;
        // Get all users with points > 0, sorted by points (descending) and createdAt (ascending for tie-breaking)
        const users = yield user_model_js_1.default.find({ points: { $gt: 0 } })
            .select('fullname username avatar points createdAt')
            .sort({ points: -1, createdAt: 1 })
            .limit(100); // Limit to top 100 users
        // Calculate ranks and find current user's rank
        let currentUserRank = null;
        const leaderboardData = users.map((user, index) => {
            const rank = index + 1;
            // Check if this is the current user
            if (user._id.toString() === currentUserId.toString()) {
                currentUserRank = rank;
            }
            return {
                rank,
                userId: user._id,
                fullname: user.fullname,
                username: user.username,
                avatar: user.avatar,
                points: user.points,
                createdAt: user.createdAt
            };
        });
        res.status(200).json({
            leaderboard: leaderboardData,
            currentUserRank,
            totalUsers: users.length
        });
    }
    catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getLeaderboard = getLeaderboard;
