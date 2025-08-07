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
    return res.status(400).json({ message: "Invalid email or password",errors: errors.array() });
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
  console.log(socketId)
  const user = await userModel.findOne({ socketId });
  if (!user) {
    console.log('User not found')
    return res.status(404).json({ message: "User not found" });
  }
  res.status(200).json({ user });
};

// Connection request endpoints
export const sendConnectionRequest = async (req: any, res: any) => {
  try {
    const { targetUserId } = req.body;
    const senderId = req.user._id;

    if (senderId.equals(targetUserId)) {
      return res.status(400).json({ message: "Cannot send connection request to yourself" });
    }

    // Check if users exist
    const [sender, targetUser] = await Promise.all([
      userModel.findById(senderId),
      userModel.findById(targetUserId)
    ]);

    if (!sender || !targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if connection already exists
    const existingConnection = sender.connections.find(
      (conn: any) => conn.user.equals(targetUserId)
    );

    
    if (existingConnection) {
      if (existingConnection.status === 'connected') {
        return res.status(400).json({ message: "Already connected" });
      } else {
        return res.status(400).json({ message: "Connection request already sent" });
      }
    }
    // Check if target user have already sent a connection request to sender
    const targetUserConnectionRequest = targetUser.connections.find(
      (conn: any) => conn.user.equals(senderId) && conn.status === 'pending'
    );

    if(targetUserConnectionRequest){
      console.log('aaa')
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

      const connectionRequest = sender.notifications.find((notification: any) => notification.type === 'connection_request' && notification.senderId.equals(targetUserId));

      if(connectionRequest){
        connectionRequest.isRead = true;
        await sender.save();
      }

      await Promise.all([sender.save(), targetUser.save()]);
      return res.status(200).json({status:'connected',message:'Connected successfully'});
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

    await Promise.all([sender.save(), targetUser.save()]);

    // Emit socket event for real-time notification
    // Note: You would need to import and use the socket instance here
    // For now, we'll handle this in the frontend by polling or making API calls

    res.status(200).json({status:'pending',message: "Connection request sent successfully" });
  } catch (error) {
    console.error('Error sending connection request:', error);
    res.status(500).json({status:'error',message: "Internal server error" });
  }
};

export const respondToConnectionRequest = async (req: any, res: any) => {
  try {
    const { senderId, action } = req.body; // action: 'accept' or 'decline'
    const receiverId = req.user._id;

    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({ message: "Invalid action. Must be 'accept' or 'decline'" });
    }

    // Get both users
    const [receiver, sender] = await Promise.all([
      userModel.findById(receiverId),
      userModel.findById(senderId)
    ]);

    if (!receiver || !sender) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log(sender.connections)

    // Find the connection request in sender's connections
    const senderConnection = sender.connections.find(
      (conn: any) => conn.user.equals(receiverId) && conn.status === 'pending'
    );

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

      await Promise.all([sender.save(), receiver.save()]);
      res.status(200).json({ message: "Connection request accepted" });
    } else {
      // Remove connection request from sender
      sender.connections = sender.connections.filter(
        (conn: any) => !(conn.user.toString() === receiverId && conn.status === 'pending')
      );

      // Add notification to sender
      sender.notifications.push({
        type: 'connection_declined',
        message: `${receiver.fullname.firstname} ${receiver.fullname.lastname} declined your connection request`,
        isRead: false,
        createdAt: new Date(),
        senderId: receiverId
      });

      await Promise.all([sender.save(), receiver.save()]);
      res.status(200).json({ message: "Connection request declined" });
    }
  } catch (error) {
    console.error('Error responding to connection request:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getConnectionStatus = async (req: any, res: any) => {
  try {
    const { targetUserId } = req.params;
    const userId = req.user._id;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const connection = user.connections.find(
      (conn: any) => conn.user.toString() === targetUserId
    );

    if (!connection) {
      return res.status(200).json({ status: 'not_connected' });
    }

    res.status(200).json({ status: connection.status });
  } catch (error) {
    console.error('Error getting connection status:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Notification endpoints
export const getNotifications = async (req: any, res: any) => {
  try {
    const userId = req.user._id;
    const user = await userModel.findById(userId).populate('notifications.senderId', 'fullname avatar username');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Sort notifications by creation date (newest first)
    const notifications = user.notifications.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.status(200).json({ notifications });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const markNotificationAsRead = async (req: any, res: any) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const notification = (user.notifications as any).id(notificationId);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notification.isRead = true;
    await user.save();

    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const markAllNotificationsAsRead = async (req: any, res: any) => {
  try {
    const userId = req.user._id;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.notifications.forEach((notification: any) => {
      notification.isRead = true;
    });

    await user.save();

    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUnreadNotificationCount = async (req: any, res: any) => {
  try {
    const userId = req.user._id;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const unreadCount = user.notifications.filter((notification: any) => !notification.isRead).length;

    res.status(200).json({ unreadCount });
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getConnectionsCount = async (req: any, res: any) => {
  try {
    const { userId } = req.params;
    const requesterId = req.user?._id;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const connectionsCount = user.connections.filter((conn: any) => conn.status === 'connected').length;

    res.status(200).json({ connectionsCount });
  } catch (error) {
    console.error('Error getting connections count:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getConnections = async (req: any, res: any) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const requesterId = req.user?._id;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get connected users
    const connectedConnections = user.connections.filter((conn: any) => conn.status === 'connected');
    
    // Calculate pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    // Get user IDs of connected users
    const connectedUserIds = connectedConnections.map((conn: any) => conn.user);
    
    // Fetch connected users with pagination
    const connectedUsers = await userModel.find({
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
  } catch (error) {
    console.error('Error getting connections:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const removeConnection = async (req: any, res: any) => {
  try {
    const { targetUserId } = req.body;
    const userId = req.user._id;

    if (userId === targetUserId) {
      return res.status(400).json({ message: "Cannot remove connection with yourself" });
    }

    // Check if users exist
    const [user, targetUser] = await Promise.all([
      userModel.findById(userId),
      userModel.findById(targetUserId)
    ]);

    if (!user || !targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove connection from both users
    user.connections = user.connections.filter((conn: any) => conn.user.toString() !== targetUserId);
    targetUser.connections = targetUser.connections.filter((conn: any) => conn.user.toString() !== userId);

    await Promise.all([user.save(), targetUser.save()]);

    res.status(200).json({ message: "Connection removed successfully" });
  } catch (error) {
    console.error('Error removing connection:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update user points
export const updateUserPoints = async (req: any, res: any) => {
  try {
    const { userId, pointsChange, reason } = req.body;

    if (!userId || pointsChange === undefined) {
      return res.status(400).json({ message: "User ID and points change are required" });
    }

    const user = await userModel.findById(userId);
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

    await user.save();

    res.status(200).json({ 
      message: "Points updated successfully",
      newPoints: user.points,
      pointsChange
    });
  } catch (error) {
    console.error('Error updating user points:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get user points
export const getUserPoints = async (req: any, res: any) => {
  try {
    const { userId } = req.params;

    const user = await userModel.findById(userId).select('points');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ points: user.points });
  } catch (error) {
    console.error('Error fetching user points:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get leaderboard data
export const getLeaderboard = async (req: any, res: any) => {
  try {
    const currentUserId = req.user._id;

    // Get all users with points > 0, sorted by points (descending) and createdAt (ascending for tie-breaking)
    const users = await userModel.find({ points: { $gt: 0 } })
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
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};