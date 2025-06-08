import { UserModel } from "../models/user.model.js";
import { UserService } from "../services/user.service.js";
import { validationResult } from "express-validator";
import { BlacklistTokenModel } from "../models/blacklistToken.model.js";
import { cloudinary } from '../config/cloudinary.js';
import { promises as fs } from 'fs';
const userService = new UserService();
export const registerUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { fullname, email, password, role, username } = req.body;
    const existingUser = await UserModel.findOne({ username });
    if (existingUser) {
        res.status(400).json({ message: "Username already exists" });
        return;
    }
    const existingEmail = await UserModel.findOne({ email });
    if (existingEmail) {
        res.status(400).json({ message: "Email already exists" });
        return;
    }
    const hashedPassword = await UserModel.hashPassword(password);
    const user = await userService.createUser({
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
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none'
    });
    res.status(201).json({ token, user });
};
export const loginUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email }).select('+password');
    if (!user) {
        res.status(401).json({ message: "Invalid email or password" });
        return;
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        res.status(401).json({ message: "Invalid email or password" });
        return;
    }
    const token = user.generateAuthToken();
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none'
    });
    res.status(200).json({ token, user });
};
export const getUserProfile = async (req, res) => {
    const user = await UserModel.findById(req.user._id);
    if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
    }
    res.status(200).json({ user });
};
export const logoutUser = async (req, res) => {
    res.cookie('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    await BlacklistTokenModel.create({ token });
    res.status(200).json({ message: "Logged out successfully" });
};
export const updateUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const allowedUpdates = [
        'fullname',
        'username',
        'avatar',
        'bio',
        'location',
        'college',
        'skills',
        'interests',
        'social',
        'featuredProject',
        'achievements'
    ];
    const updates = {};
    Object.keys(req.body).forEach(key => {
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
            techUsed: req.body.featuredProjects.techUsed
        };
    }
    try {
        const user = await UserModel.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.status(200).json({ user });
    }
    catch (error) {
        if (error.code === 11000) {
            res.status(400).json({
                message: "Username or email already exists"
            });
            return;
        }
        res.status(400).json({ message: error.message });
    }
};
export const checkUsernameAvailability = async (req, res) => {
    const { username } = req.params;
    if (!username) {
        res.status(400).json({
            message: "Username is required"
        });
        return;
    }
    try {
        const existingUser = await UserModel.findOne({ username });
        res.status(200).json({
            available: !existingUser,
            message: existingUser
                ? "Username is already taken"
                : "Username is available"
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Error checking username availability"
        });
    }
};
export const updateBanner = async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ message: "No file uploaded" });
            return;
        }
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "banners",
            resource_type: "auto"
        });
        // Update user's banner
        const user = await UserModel.findByIdAndUpdate(req.user._id, { banner: result.secure_url }, { new: true });
        if (!user) {
            // Clean up file if user not found
            await fs.unlink(req.file.path);
            res.status(404).json({ message: "User not found" });
            return;
        }
        // Delete the temporary file after successful upload
        await fs.unlink(req.file.path);
        res.status(200).json({
            message: "Banner updated successfully",
            banner: result.secure_url
        });
    }
    catch (error) {
        // If there's an error, try to clean up the temporary file
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            }
            catch (cleanupError) {
                console.error('Error cleaning up temporary file:', cleanupError);
            }
        }
        res.status(500).json({
            message: "Error updating banner",
            error: error.message
        });
    }
};
export const updateProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ message: "No file uploaded" });
            return;
        }
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "avatars",
            resource_type: "auto"
        });
        // Update user's avatar
        const user = await UserModel.findByIdAndUpdate(req.user._id, { avatar: result.secure_url }, { new: true });
        if (!user) {
            // Clean up file if user not found
            await fs.unlink(req.file.path);
            res.status(404).json({ message: "User not found" });
            return;
        }
        // Delete the temporary file after successful upload
        await fs.unlink(req.file.path);
        res.status(200).json({
            message: "Profile picture updated successfully",
            avatar: result.secure_url
        });
    }
    catch (error) {
        // If there's an error, try to clean up the temporary file
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            }
            catch (cleanupError) {
                console.error('Error cleaning up temporary file:', cleanupError);
            }
        }
        res.status(500).json({
            message: "Error updating profile picture",
            error: error.message
        });
    }
};
export const googleLogin = async (req, res) => {
    try {
        const { email, name, picture, googleId } = req.body;
        // Check if user exists
        let user = await UserModel.findOne({ email });
        if (!user) {
            // Create new user if doesn't exist
            user = await userService.createUser({
                fullname: {
                    firstname: name.split(' ')[0],
                    lastname: name.split(' ').slice(1).join(' ')
                },
                email,
                password: Math.random().toString(36).slice(-8), // Random password
                username: email.split('@')[0] + Math.random().toString(36).slice(-4),
                avatar: picture,
                googleId
            });
        }
        if (!user) {
            res.status(500).json({ message: 'User creation failed' });
            return;
        }
        const token = user.generateAuthToken();
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'none'
        });
        res.status(200).json({ token, user });
    }
    catch (error) {
        res.status(500).json({
            message: "Error during Google login",
            error: error.message
        });
    }
};
