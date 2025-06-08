import express from 'express';
import { body } from 'express-validator';
import * as userController from '../controllers/user.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import multer from 'multer';
import path from 'path';
const router = express.Router();
router.post('/register', [
    body('fullname.firstname').notEmpty().withMessage('First name is required').isLength({ min: 3 }).withMessage('First name must be at least 3 characters long'),
    body('fullname.lastname').notEmpty().withMessage('Last name is required').isLength({ min: 3 }).withMessage('Last name must be at least 3 characters long'),
    body('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email address'),
    body('password').notEmpty().withMessage('Password is required').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
], userController.registerUser);
router.post('/login', [
    body('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email address'),
    body('password').notEmpty().withMessage('Password is required').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
], userController.loginUser);
router.get('/profile', authMiddleware, (async (req, res) => {
    await userController.getUserProfile(req, res);
}));
router.post('/logout', authMiddleware, (async (req, res) => {
    await userController.logoutUser(req, res);
}));
router.put('/update', authMiddleware, (async (req, res) => {
    await userController.updateUser(req, res);
}));
router.get('/check-username/:username', (async (req, res) => {
    await userController.checkUsernameAvailability(req, res);
}));
// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});
// New routes for image uploads
router.put('/banner', authMiddleware, upload.single('banner'), (async (req, res) => {
    await userController.updateBanner(req, res);
}));
router.put('/avatar', authMiddleware, upload.single('avatar'), (async (req, res) => {
    await userController.updateProfilePicture(req, res);
}));
// Google login route
router.post('/google-login', (async (req, res) => {
    await userController.googleLogin(req, res);
}));
export default router;
