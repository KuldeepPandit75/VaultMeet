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
exports.getUnreadMessageCount = exports.markMessagesAsRead = exports.sendMessage = exports.getMessages = exports.getConversations = void 0;
const message_model_js_1 = __importDefault(require("../models/message.model.js"));
const user_model_js_1 = __importDefault(require("../models/user.model.js"));
// Get all conversations for a user
const getConversations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 20 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Get all conversations where the user is involved
        const conversations = yield message_model_js_1.default.aggregate([
            {
                $match: {
                    $or: [
                        { senderId: userId },
                        { receiverId: userId }
                    ],
                    isDeleted: false
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: '$conversationId',
                    lastMessage: { $first: '$$ROOT' },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ['$receiverId', userId] },
                                        { $eq: ['$isRead', false] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $sort: { 'lastMessage.createdAt': -1 }
            },
            {
                $skip: skip
            },
            {
                $limit: limitNum
            }
        ]);
        // Populate user details for each conversation
        const populatedConversations = yield Promise.all(conversations.map((conv) => __awaiter(void 0, void 0, void 0, function* () {
            const otherUserId = conv.lastMessage.senderId.toString() === userId.toString()
                ? conv.lastMessage.receiverId
                : conv.lastMessage.senderId;
            const otherUser = yield user_model_js_1.default.findById(otherUserId)
                .select('fullname avatar username isOnline lastSeen');
            return {
                conversationId: conv._id,
                otherUser,
                lastMessage: conv.lastMessage,
                unreadCount: conv.unreadCount
            };
        })));
        res.status(200).json({
            conversations: populatedConversations,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(conversations.length / limitNum),
                hasNextPage: pageNum * limitNum < conversations.length,
                hasPrevPage: pageNum > 1
            }
        });
    }
    catch (error) {
        console.error('Error getting conversations:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getConversations = getConversations;
// Get messages for a specific conversation
const getMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user._id;
        const { conversationId } = req.params;
        const { page = 1, limit = 50 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Verify user is part of this conversation
        const conversationExists = yield message_model_js_1.default.findOne({
            conversationId,
            $or: [{ senderId: userId }, { receiverId: userId }]
        });
        if (!conversationExists) {
            return res.status(403).json({ message: "Access denied to this conversation" });
        }
        const messages = yield message_model_js_1.default.find({
            conversationId,
            isDeleted: false
        })
            .populate('senderId', 'fullname avatar username')
            .populate('receiverId', 'fullname avatar username')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);
        const totalMessages = yield message_model_js_1.default.countDocuments({
            conversationId,
            isDeleted: false
        });
        res.status(200).json({
            messages: messages.reverse(), // Return in chronological order
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalMessages / limitNum),
                totalMessages,
                hasNextPage: pageNum * limitNum < totalMessages,
                hasPrevPage: pageNum > 1
            }
        });
    }
    catch (error) {
        console.error('Error getting messages:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getMessages = getMessages;
// Send a new message
const sendMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const senderId = req.user._id;
        const { receiverId, message, messageType = 'text' } = req.body;
        if (!receiverId || !message) {
            return res.status(400).json({ message: "Receiver ID and message are required" });
        }
        if (senderId === receiverId) {
            return res.status(400).json({ message: "Cannot send message to yourself" });
        }
        // Check if receiver exists
        const receiver = yield user_model_js_1.default.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ message: "Receiver not found" });
        }
        // Create conversation ID
        const conversationId = [senderId, receiverId].sort().join('_');
        // Create new message
        const newMessage = new message_model_js_1.default({
            conversationId,
            senderId,
            receiverId,
            message: message.trim(),
            messageType
        });
        yield newMessage.save();
        // Populate sender and receiver details
        yield newMessage.populate('senderId', 'fullname avatar username');
        yield newMessage.populate('receiverId', 'fullname avatar username');
        res.status(201).json({
            message: "Message sent successfully",
            data: newMessage
        });
    }
    catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.sendMessage = sendMessage;
// Mark messages as read
const markMessagesAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user._id;
        const { conversationId } = req.body;
        if (!conversationId) {
            return res.status(400).json({ message: "Conversation ID is required" });
        }
        // Mark all unread messages in this conversation as read
        yield message_model_js_1.default.updateMany({
            conversationId,
            receiverId: userId,
            isRead: false
        }, {
            isRead: true,
            readAt: new Date()
        });
        res.status(200).json({ message: "Messages marked as read" });
    }
    catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.markMessagesAsRead = markMessagesAsRead;
// Get unread message count
const getUnreadMessageCount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user._id;
        const unreadCount = yield message_model_js_1.default.countDocuments({
            receiverId: userId,
            isRead: false,
            isDeleted: false
        });
        res.status(200).json({ unreadCount });
    }
    catch (error) {
        console.error('Error getting unread message count:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getUnreadMessageCount = getUnreadMessageCount;
