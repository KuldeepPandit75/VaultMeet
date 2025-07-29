import Message from '../models/message.model.js';
import userModel from '../models/user.model.js';

// Get all conversations for a user
export const getConversations = async (req: any, res: any) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Get all conversations where the user is involved
    const conversations = await Message.aggregate([
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
    const populatedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = conv.lastMessage.senderId.toString() === userId.toString() 
          ? conv.lastMessage.receiverId 
          : conv.lastMessage.senderId;
        
        const otherUser = await userModel.findById(otherUserId)
          .select('fullname avatar username isOnline lastSeen');

        return {
          conversationId: conv._id,
          otherUser,
          lastMessage: conv.lastMessage,
          unreadCount: conv.unreadCount
        };
      })
    );

    res.status(200).json({
      conversations: populatedConversations,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(conversations.length / limitNum),
        hasNextPage: pageNum * limitNum < conversations.length,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get messages for a specific conversation
export const getMessages = async (req: any, res: any) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Verify user is part of this conversation
    const conversationExists = await Message.findOne({
      conversationId,
      $or: [{ senderId: userId }, { receiverId: userId }]
    });

    if (!conversationExists) {
      return res.status(403).json({ message: "Access denied to this conversation" });
    }

    const messages = await Message.find({
      conversationId,
      isDeleted: false
    })
    .populate('senderId', 'fullname avatar username')
    .populate('receiverId', 'fullname avatar username')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

    const totalMessages = await Message.countDocuments({
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
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Send a new message
export const sendMessage = async (req: any, res: any) => {
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
    const receiver = await userModel.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    // Create conversation ID
    const conversationId = [senderId, receiverId].sort().join('_');

    // Create new message
    const newMessage = new Message({
      conversationId,
      senderId,
      receiverId,
      message: message.trim(),
      messageType
    });

    await newMessage.save();

    // Populate sender and receiver details
    await newMessage.populate('senderId', 'fullname avatar username');
    await newMessage.populate('receiverId', 'fullname avatar username');

    res.status(201).json({
      message: "Message sent successfully",
      data: newMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Mark messages as read
export const markMessagesAsRead = async (req: any, res: any) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.body;

    if (!conversationId) {
      return res.status(400).json({ message: "Conversation ID is required" });
    }

    // Mark all unread messages in this conversation as read
    await Message.updateMany(
      {
        conversationId,
        receiverId: userId,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get unread message count
export const getUnreadMessageCount = async (req: any, res: any) => {
  try {
    const userId = req.user._id;

    const unreadCount = await Message.countDocuments({
      receiverId: userId,
      isRead: false,
      isDeleted: false
    });

    res.status(200).json({ unreadCount });
  } catch (error) {
    console.error('Error getting unread message count:', error);
    res.status(500).json({ message: "Internal server error" });
  }
}; 