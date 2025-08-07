import express from 'express';
import { body } from 'express-validator';
import * as userController from '../controllers/user.controller.js';
import * as chatController from '../controllers/chat.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { upload } from '../config/file.upload.js';
import { resetPassword, sendOTP, verifyOTP } from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/register', [
    body('fullname.firstname').notEmpty().withMessage('First name is required').isLength({ min: 3 }).withMessage('First name must be at least 3 characters long'),
    body('fullname.lastname').notEmpty().withMessage('Last name is required').isLength({ min: 3 }).withMessage('Last name must be at least 3 characters long'),
    body('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email address'),
    body('password').notEmpty().withMessage('Password is required').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
], userController.registerUser);

router.post('/login', [
    body('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email address'),
    body('password').notEmpty().withMessage('Password is required'),
], userController.loginUser);

router.get('/me', authMiddleware, userController.getMe);

router.get('/profile/:username', userController.getUserProfileByUsername);

router.post('/logout', authMiddleware, userController.logoutUser);

router.put('/update', authMiddleware, userController.updateUser);

router.get('/check-username/:username', userController.checkUsernameAvailability);

router.get('/get-user-by-socket-id/:socketId', userController.getUserBySocketId);

router.post('/update-socket-id', userController.updateSocketId);

// New routes for image uploads
router.post('/banner', authMiddleware, upload.single('banner'), userController.updateBanner);
router.post('/avatar', authMiddleware, upload.single('avatar'), userController.updateProfilePicture);

// Google login route
router.post('/google-login', userController.googleLogin);

// OTP routes
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);

// Connection request routes
router.post('/connections/send-request', authMiddleware, userController.sendConnectionRequest);
router.post('/connections/respond', authMiddleware, userController.respondToConnectionRequest);
router.get('/connections/status/:targetUserId', authMiddleware, userController.getConnectionStatus);

// Notification routes
router.get('/notifications', authMiddleware, userController.getNotifications);
router.patch('/notifications/:notificationId/read', authMiddleware, userController.markNotificationAsRead);
router.patch('/notifications/read-all', authMiddleware, userController.markAllNotificationsAsRead);
router.get('/notifications/unread-count', authMiddleware, userController.getUnreadNotificationCount);

// Connections routes
router.get('/connections/count/:userId', authMiddleware, userController.getConnectionsCount);
router.get('/connections/:userId', authMiddleware, userController.getConnections);
router.delete('/connections/remove', authMiddleware, userController.removeConnection);

// Chat routes
router.get('/chat/conversations', authMiddleware, chatController.getConversations);
router.get('/chat/messages/:conversationId', authMiddleware, chatController.getMessages);
router.post('/chat/send', authMiddleware, chatController.sendMessage);
router.patch('/chat/read', authMiddleware, chatController.markMessagesAsRead);
router.get('/chat/unread-count', authMiddleware, chatController.getUnreadMessageCount);

// Points routes
router.post('/points/update', authMiddleware, userController.updateUserPoints);
router.get('/points/:userId', authMiddleware, userController.getUserPoints);
router.get('/leaderboard', authMiddleware, userController.getLeaderboard);

// Report routes
router.post('/reports', authMiddleware, [
    body('type').isIn(['bug', 'feature', 'feedback', 'abuse', 'technical']).withMessage('Invalid report type'),
    body('category').isIn(['game', 'whiteboard', 'chat', 'video', 'audio', 'general', 'other']).withMessage('Invalid category'),
    body('title').notEmpty().withMessage('Title is required').isLength({ max: 200 }).withMessage('Title must be less than 200 characters'),
    body('description').notEmpty().withMessage('Description is required').isLength({ max: 2000 }).withMessage('Description must be less than 2000 characters'),
    body('severity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity level'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority level'),
], userController.createReport);

router.get('/reports', authMiddleware, userController.getUserReports);
router.get('/reports/:reportId', authMiddleware, userController.getReportById);
router.patch('/reports/:reportId/status', authMiddleware, [
    body('status').isIn(['open', 'in_progress', 'resolved', 'closed']).withMessage('Invalid status'),
    body('resolution').optional().isLength({ max: 1000 }).withMessage('Resolution must be less than 1000 characters'),
], userController.updateReportStatus);

// Admin routes for reports
router.get('/admin/reports', authMiddleware, userController.getAllReports);

export default router;