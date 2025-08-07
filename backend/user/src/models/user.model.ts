import mongoose, { Document } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export interface IUser extends Document {
  fullname: {
    firstname: string;
    lastname: string;
  };
  email: string;
  password: string;
  role: "admin" | "user";
  socketId: string;
  username: string;
  banner: string;
  avatar: string;
  bio: string;
  location: string;
  college: string;
  skills: string;
  interests: string;
  social: {
    github: string;
    linkedin: string;
    x: string;
  };
  otp: {
    value: string;
    expiration: Date;
    tries: number;
    attempts: number;
  };
  website: string;
  connections: {
    user: mongoose.Types.ObjectId;
    status: "pending" | "connected";
  }[];
  hackathonsJoined: {
    hackathonId: mongoose.Types.ObjectId;
    teamId: mongoose.Types.ObjectId;
    status: "pending" | "confirmed";
  }[];
  bookmarks: mongoose.Types.ObjectId[];
  notifications: {
    type: string;
    message: string;
    isRead: boolean;
    createdAt: Date;
    senderId?: mongoose.Types.ObjectId;
  }[];
  createdAt: Date;
  isVerified: boolean;
  featuredProject: {
    title: string;
    description: string;
    link: string;
    techUsed: string;
  };
  achievements: string;
  points: number;
  googleId?: string;
  generateAuthToken(): string;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema({
  fullname: {
    firstname: {
      type: String,
      required: true,
      minlength: [3, "First name must be at least 3 characters long"],
    },
    lastname: {
      type: String,
    },
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: [8, "Password must be at least 8 characters long"],
    select: false,
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },
  otp: {
    value: {
      type: String,
    },
    expiration: {
      type: Date,
    },
    tries: {
      type: Number,
      min: 0,
    },
    attempts: {
      type: Number,
      min: 0,
    },
  },
  socketId: {
    type: String,
  },
  username: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    required: true
  },

  banner:{
    type: String,
    default: ""
  },

  avatar: {
    type: String, // URL to profile picture
    default: "",
  },

  bio: {
    type: String,
    maxlength: 300,
    default: "",
  },

  location: {
    type: String,
    default: "",
  },

  college: {
    type: String,
    default: "",
  },

  skills: {
    type: String,
    default: "",
  },

  interests: {
    type: String,
    default: "",
  },

  social: {
    github: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    x: { type: String, default: "" },
  },

  website: { type: String, default: "" },

  connections: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      status: {
        type: String,
        enum: ["pending", "connected"],
        default: "pending",
      },
    },
  ],

  hackathonsJoined: [
    {
      hackathonId: { type: mongoose.Schema.Types.ObjectId, ref: "Hackathon" },
      teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
      status: {
        type: String,
        enum: ["pending", "confirmed"],
        default: "confirmed",
      },
    },
  ],

  bookmarks: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hackathon",
    },
  ],

  notifications: [
    {
      type: {
        type: String, // e.g., 'connection_request', 'team_invite'
      },
      message: String,
      isRead: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now },
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },

  isVerified: {
    type: Boolean,
    default: false,
  },

  featuredProject: {
    title: {type: String, default: ""},
    description: {type: String, default: ""},
    link: {type: String, default: ""},
    techUsed: {type: String, default: ""},
  },

  achievements: {
    type: String,
    default: "",
  },

  points: {
    type: Number,
    default: 0,
    min: 0,
  },

  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
});

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
  });
  return token;
};

userSchema.methods.comparePassword = async function (password:string) {
  return await bcrypt.compare(password, this.password);
};

userSchema.statics.hashPassword = async function (password:string) {
  return await bcrypt.hash(password, 10);
};

const User = mongoose.model<IUser>("User", userSchema);

export default User;
