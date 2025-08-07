import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  reporterId: mongoose.Types.ObjectId;
  roomId?: string;
  eventId?: string;
  type: 'bug' | 'feature' | 'feedback' | 'abuse' | 'technical';
  category: 'game' | 'whiteboard' | 'chat' | 'video' | 'audio' | 'general' | 'other';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  attachments?: string[];
  userAgent?: string;
  browserInfo?: string;
  deviceInfo?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
  resolution?: string;
  tags?: string[];
}

const reportSchema = new Schema<IReport>({
  reporterId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  roomId: {
    type: String,
    required: false,
  },
  eventId: {
    type: String,
    required: false,
  },
  type: {
    type: String,
    enum: ['bug', 'feature', 'feedback', 'abuse', 'technical'],
    required: true,
  },
  category: {
    type: String,
    enum: ['game', 'whiteboard', 'chat', 'video', 'audio', 'general', 'other'],
    required: true,
  },
  title: {
    type: String,
    required: true,
    maxlength: 200,
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  attachments: [{
    type: String,
  }],
  userAgent: {
    type: String,
  },
  browserInfo: {
    type: String,
  },
  deviceInfo: {
    type: String,
  },
  resolvedAt: {
    type: Date,
  },
  resolvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  resolution: {
    type: String,
    maxlength: 1000,
  },
  tags: [{
    type: String,
  }],
}, {
  timestamps: true,
});

// Index for better query performance
reportSchema.index({ reporterId: 1, createdAt: -1 });
reportSchema.index({ status: 1, priority: 1 });
reportSchema.index({ type: 1, category: 1 });

const Report = mongoose.model<IReport>('Report', reportSchema);

export default Report; 