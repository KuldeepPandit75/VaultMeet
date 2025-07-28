"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const userController = __importStar(require("../controllers/user.controller.js"));
const auth_middleware_js_1 = __importDefault(require("../middlewares/auth.middleware.js"));
const file_upload_js_1 = require("../config/file.upload.js");
const auth_controller_js_1 = require("../controllers/auth.controller.js");
const router = express_1.default.Router();
router.post('/register', [
    (0, express_validator_1.body)('fullname.firstname').notEmpty().withMessage('First name is required').isLength({ min: 3 }).withMessage('First name must be at least 3 characters long'),
    (0, express_validator_1.body)('fullname.lastname').notEmpty().withMessage('Last name is required').isLength({ min: 3 }).withMessage('Last name must be at least 3 characters long'),
    (0, express_validator_1.body)('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email address'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
], userController.registerUser);
router.post('/login', [
    (0, express_validator_1.body)('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email address'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
], userController.loginUser);
router.get('/me', auth_middleware_js_1.default, userController.getMe);
router.get('/profile/:username', userController.getUserProfileByUsername);
router.post('/logout', auth_middleware_js_1.default, userController.logoutUser);
router.put('/update', auth_middleware_js_1.default, userController.updateUser);
router.get('/check-username/:username', userController.checkUsernameAvailability);
router.get('/get-user-by-socket-id/:socketId', userController.getUserBySocketId);
router.post('/update-socket-id', userController.updateSocketId);
// New routes for image uploads
router.post('/banner', auth_middleware_js_1.default, file_upload_js_1.upload.single('banner'), userController.updateBanner);
router.post('/avatar', auth_middleware_js_1.default, file_upload_js_1.upload.single('avatar'), userController.updateProfilePicture);
// Google login route
router.post('/google-login', userController.googleLogin);
// OTP routes
router.post('/send-otp', auth_controller_js_1.sendOTP);
router.post('/verify-otp', auth_controller_js_1.verifyOTP);
router.post('/reset-password', auth_controller_js_1.resetPassword);
exports.default = router;
