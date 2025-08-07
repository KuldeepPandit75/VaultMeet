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
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const projectSchema = new mongoose_1.Schema({
    projectName: {
        type: String,
        required: [true, 'Project name is required'],
        trim: true,
        maxlength: [100, 'Project name cannot exceed 100 characters']
    },
    developer: {
        type: String,
        required: [true, 'Developer username is required'],
        trim: true,
        maxlength: [50, 'Developer username cannot exceed 50 characters']
    },
    description: {
        type: String,
        required: [true, 'Project description is required'],
        trim: true,
        maxlength: [1000, 'Project description cannot exceed 1000 characters']
    },
    techStack: [{
            type: String,
            trim: true,
            maxlength: [30, 'Tech stack item cannot exceed 30 characters']
        }],
    githubUrl: {
        type: String,
        required: [true, 'GitHub URL is required'],
        trim: true,
        validate: {
            validator: function (v) {
                return /^https:\/\/github\.com\/[^\/]+\/[^\/]+/.test(v);
            },
            message: 'Please provide a valid GitHub repository URL'
        }
    },
    demoUrl: {
        type: String,
        trim: true,
        validate: {
            validator: function (v) {
                if (!v)
                    return true; // Optional field
                return /^https?:\/\/.+/.test(v);
            },
            message: 'Please provide a valid URL for the demo'
        }
    },
    category: {
        type: String,
        required: [true, 'Project category is required'],
        enum: {
            values: [
                'Full-Stack Platform',
                'AI/ML Tool',
                'Mobile App',
                'Web Application',
                'API/Backend',
                'Game Development',
                'Data Science',
                'DevOps Tool',
                'Browser Extension',
                'Other'
            ],
            message: 'Please select a valid category'
        }
    },
    isHosted: {
        type: Boolean,
        default: false
    },
    submittedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    rank: {
        type: Number,
        min: [1, 'Rank must be between 1 and 3'],
        max: [3, 'Rank must be between 1 and 3'],
        sparse: true,
        unique: true
    },
    stars: {
        type: Number,
        default: 0,
        min: [0, 'Stars cannot be negative']
    },
    forks: {
        type: Number,
        default: 0,
        min: [0, 'Forks cannot be negative']
    }
}, {
    timestamps: true
});
// Index for efficient querying
projectSchema.index({ status: 1, createdAt: -1 });
projectSchema.index({ submittedBy: 1 });
projectSchema.index({ category: 1 });
projectSchema.index({ rank: 1 });
projectSchema.index({ status: 1, rank: 1 });
// Pre-save middleware to validate demo URL when isHosted is true
projectSchema.pre('save', function (next) {
    if (this.isHosted && !this.demoUrl) {
        return next(new Error('Demo URL is required when project is hosted'));
    }
    next();
});
const Project = mongoose_1.default.model('Project', projectSchema);
exports.default = Project;
