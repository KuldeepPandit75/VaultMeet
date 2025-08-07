import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  projectName: string;
  developer: string;
  description: string;
  techStack: string[];
  githubUrl: string;
  demoUrl?: string;
  category: string;
  isHosted: boolean;
  submittedBy: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  rank?: number;
  stars?: number;
  forks?: number;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>({
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
      validator: function(v: string) {
        return /^https:\/\/github\.com\/[^\/]+\/[^\/]+/.test(v);
      },
      message: 'Please provide a valid GitHub repository URL'
    }
  },
  demoUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Optional field
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
    type: Schema.Types.ObjectId,
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
projectSchema.pre('save', function(next) {
  if (this.isHosted && !this.demoUrl) {
    return next(new Error('Demo URL is required when project is hosted'));
  }
  next();
});

const Project = mongoose.model<IProject>('Project', projectSchema);

export default Project; 