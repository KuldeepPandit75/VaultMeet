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
exports.getUserBySocketId = exports.updateSocketId = exports.getUserProfileByUsername = exports.googleLogin = exports.updateProfilePicture = exports.updateBanner = exports.checkUsernameAvailability = exports.updateUser = exports.logoutUser = exports.getMe = exports.loginUser = exports.registerUser = void 0;
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
    const user = yield user_model_js_1.default.findOne({ socketId });
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
});
exports.getUserBySocketId = getUserBySocketId;
