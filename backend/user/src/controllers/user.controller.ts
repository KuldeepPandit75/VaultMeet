import userModel from "../models/user.model.js";
import userService from "../services/user.service.js";
import { validationResult } from "express-validator";
import BlacklistToken from "../models/blacklistToken.model.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs/promises"; // Add fs promises for async file operations
import bcrypt from 'bcrypt';
import User from "../models/user.model.js";

export const registerUser = async (req: any, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { fullname, email, password, role, username } = req.body;

  const existingUser : any = await userModel.findOne({ username });

  if (existingUser) {
    return res.status(400).json({ message: "Username already exists" });
  }

  const existingEmail = await userModel.findOne({ email });
  if (existingEmail) {
    return res.status(400).json({ message: "Email already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

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

  res.cookie("token", token, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
  });

  res.status(201).json({ token, user });
};

export const loginUser = async (req: any, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  const user : any = await userModel.findOne({ email }).select("+password");

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const isMatch = await user.comparePassword(password);

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
};

export const getMe = async (req: any, res: any) => {
  const user = await userModel.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  res.status(200).json({ user });
};

export const logoutUser = async (req: any, res: any) => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  await BlacklistToken.create({ token });

  res.status(200).json({ message: "Logged out successfully" });
};

export const updateUser = async (req: any, res: any) => {
  const errors = validationResult(req);

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

  const updates: Record<string, any> = {};

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
    const user = await userModel.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Username or email already exists",
      });
    }
    res.status(400).json({ message: error.message });
  }
};

export const checkUsernameAvailability = async (req: any, res: any) => {
  const { username } = req.params;

  if (!username) {
    return res.status(400).json({
      message: "Username is required",
    });
  }

  try {
    const existingUser = await userModel.findOne({ username });

    res.status(200).json({
      available: !existingUser,
      message: existingUser
        ? "Username is already taken"
        : "Username is available",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error checking username availability",
    });
  }
};

export const updateBanner = async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "banners",
      resource_type: "auto",
    });

    // Update user's banner
    const user = await userModel.findByIdAndUpdate(
      req.user._id,
      { banner: result.secure_url },
      { new: true }
    );

    if (!user) {
      // Clean up file if user not found
      await fs.unlink(req.file.path);
      return res.status(404).json({ message: "User not found" });
    }

    // Delete the temporary file after successful upload
    await fs.unlink(req.file.path);

    res.status(200).json({
      message: "Banner updated successfully",
      banner: result.secure_url,
    });
  } catch (error: any) {
    // If there's an error, try to clean up the temporary file
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error("Error cleaning up temporary file:", cleanupError);
      }
    }
    res.status(500).json({
      message: "Error updating banner",
      error: error.message,
    });
  }
};

export const updateProfilePicture = async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "avatars",
      resource_type: "auto",
    });

    // Update user's avatar
    const user = await userModel.findByIdAndUpdate(
      req.user._id,
      { avatar: result.secure_url },
      { new: true }
    );

    if (!user) {
      // Clean up file if user not found
      await fs.unlink(req.file.path);
      return res.status(404).json({ message: "User not found" });
    }

    // Delete the temporary file after successful upload
    await fs.unlink(req.file.path);

    res.status(200).json({
      message: "Profile picture updated successfully",
      avatar: result.secure_url,
    });
  } catch (error: any) {
    // If there's an error, try to clean up the temporary file
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error("Error cleaning up temporary file:", cleanupError);
      }
    }
    res.status(500).json({
      message: "Error updating profile picture",
      error: error.message,
    });
  }
};

export const googleLogin = async (req: any, res: any) => {
  try {
    const { email, name, picture, googleId } = req.body;

    // Check if user exists
    let user = await userModel.findOne({ email });

    if (!user) {
      // Create new user if doesn't exist
      const username =
        email.split("@")[0] + Math.random().toString(36).substring(2, 8);
      const [firstname, ...lastnameParts] = name.split(" ");
      const lastname = lastnameParts.join(" ");

      user = await userService.createUser({
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
    } else if (!user.googleId) {
      // Update existing user with Google ID if not already set
      user.googleId = googleId;
      if (!user.avatar) {
        user.avatar = picture;
      }
      await user.save();
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
  } catch (error: any) {
    console.error("Google login error:", error);
    res
      .status(500)
      .json({ message: "Error during Google login", error: error.message });
  }
};

export const getUserProfileByUsername = async (req: any, res: any) => {
  const { username } = req.params;
  const user = await userModel.findOne({ username }).select("-googleId -password -role -isVerified -createdAt -updatedAt -__v -otp");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  res.status(200).json({ user });
};

export const updateSocketId = async (req: any, res: any) => {
  const {socketId,userId} = req.body;

  const user = await User.findById(userId);

  if(!user){
      return res.status(404).json({message:'User not found'});
  }

  user.socketId = socketId;
  await user.save();

  res.status(200).json({message:'Socket ID updated successfully'});
};

export const getUserBySocketId = async (req: any, res: any) => {
  const { socketId } = req.params;
  const user = await userModel.findOne({ socketId });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  res.status(200).json({ user });
};