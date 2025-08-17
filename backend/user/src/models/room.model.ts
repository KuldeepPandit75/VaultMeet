import mongoose from "mongoose";

interface IRoom {
  roomId: string;
  participants: {
    status: string;
    id: string;
  }[];
  adminId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  lastActive: Date;
}

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
  },
  participants: [
    {
      status: {
        type: String,
        enum: ["pending", "allowed", "banned","admin"],
        required: true,
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    },
  ],
  adminId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
});

const Room = mongoose.model<IRoom>("Room", roomSchema);

export default Room;
