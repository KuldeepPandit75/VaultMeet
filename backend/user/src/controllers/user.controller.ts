const userModel = require("../models/user.model");
const userService = require("../services/user.service");
const { validationResult } = require("express-validator");
const BlacklistToken = require("../models/blacklistToken.model");
const cloudinary = require('../config/cloudinary');
const fs = require('fs').promises;  // Add fs promises for async file operations

module.exports.registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { fullname, email, password, role, username } = req.body;

  const existingUser = await userModel.findOne({ username });

  if (existingUser) {
    return res.status(400).json({ message: "Username already exists" });
  }

  const existingEmail = await userModel.findOne({ email });
  if (existingEmail) {
    return res.status(400).json({ message: "Email already exists" });
  }

  const hashedPassword = await userModel.hashPassword(password);

  const user = await userService.createUser({
    fullname:{
        firstname:fullname.firstname,
        lastname:fullname.lastname,
    },
    email,
    password: hashedPassword,
    role,
    username,
  });

  const token= user.generateAuthToken();

  res.cookie('token',token);
  
  res.status(201).json({token, user});
};

module.exports.loginUser=async(req,res)=>{
    const errors=validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()});
    }

    const {email,password}=req.body;

    const user=await userModel.findOne({email}).select('+password');

    if(!user){
        return res.status(401).json({message:"Invalid email or password"});
    }

    const isMatch=await user.comparePassword(password);

    if(!isMatch){
        return res.status(401).json({message:"Invalid email or password"});
    }

    const token=user.generateAuthToken();

    res.cookie('token',token);

    res.status(200).json({token,user});
}

module.exports.getUserProfile=async(req,res)=>{
    const user=await userModel.findById(req.user._id);
    if(!user){
        return res.status(404).json({message:"User not found"});
    }
    res.status(200).json({user});
}

module.exports.logoutUser=async(req,res)=>{
    res.cookie('token', '', {
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'strict' 
    });

    const token=req.cookies.token || req.headers.authorization?.split(" ")[1];

    await BlacklistToken.create({token});

    res.status(200).json({message:"Logged out successfully"});
}

module.exports.updateUser = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
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

    const updates: Record<string, any> = {};
    
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
                message: "Username or email already exists" 
            });
        }
        res.status(400).json({ message: error.message });
    }
};

module.exports.checkUsernameAvailability = async (req, res) => {
    const { username } = req.params;

    if (!username) {
        return res.status(400).json({ 
            message: "Username is required" 
        });
    }

    try {
        const existingUser = await userModel.findOne({ username });
        
        res.status(200).json({
            available: !existingUser,
            message: existingUser 
                ? "Username is already taken" 
                : "Username is available"
        });
    } catch (error) {
        res.status(500).json({ 
            message: "Error checking username availability" 
        });
    }
};

module.exports.updateBanner = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "banners",
            resource_type: "auto"
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
            banner: result.secure_url 
        });
    } catch (error: any) {
        // If there's an error, try to clean up the temporary file
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            } catch (cleanupError) {
                console.error('Error cleaning up temporary file:', cleanupError);
            }
        }
        res.status(500).json({ 
            message: "Error updating banner",
            error: error.message 
        });
    }
};

module.exports.updateProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "avatars",
            resource_type: "auto"
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
            avatar: result.secure_url 
        });
    } catch (error: any) {
        // If there's an error, try to clean up the temporary file
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            } catch (cleanupError) {
                console.error('Error cleaning up temporary file:', cleanupError);
            }
        }
        res.status(500).json({ 
            message: "Error updating profile picture",
            error: error.message 
        });
    }
};

