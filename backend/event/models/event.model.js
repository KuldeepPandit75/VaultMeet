import mongoose from 'mongoose';

// Event Participant Schema
const eventParticipantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  role: {
    type: String,
    enum: ['participant', 'organizer', 'judge', 'admin'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Event Schema
const eventSchema = new mongoose.Schema({
  // Who created this event - company or student
  createdByType: {
    type: String,
    enum: ['company', 'student'],
    default: 'company'
  },

  // Company Information (for company events) / College Information (for student events)
  company: {
    name: {
      type: String,
      required: true
    },
    website: {
      type: String,
      required: true
    },
    industry: {
      type: String,
      required: true,
      enum: ['technology', 'finance', 'healthcare', 'education', 'retail', 'manufacturing', 'other']
    },
    logo: {
      type: String, // URL to stored image
      required: false
    }
  },

  // Contact Information
  contact: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    socialProfiles: {
      type: String
    }
  },

  // Student-specific fields (only for student-created events)
  facultyCoordinator: {
    name: {
      type: String,
      required: function() {
        return this.createdByType === 'student';
      }
    },
    email: {
      type: String,
      required: function() {
        return this.createdByType === 'student';
      }
    },
    phone: {
      type: String,
      required: function() {
        return this.createdByType === 'student';
      }
    }
  },

  // Budget field (mainly for student events)
  expectedBudget: {
    type: String
  },

  // Event Details
  name: {
    type: String,
    required: true
  },
  stages:[{
    stageName:{
        type: String,
        required: true
    },
    stageDescription:{
        type: String,
    },
    stageStartDate:{
        type: Date,
        required: true
    },
    stageEndDate:{
        type: Date,
    },
    onHackMeet:{
        type: Boolean,
        default: false
    }
  }],
  banner: {
    type: String, // URL to stored image
    required: false
  },
  type: {
    type: String,
    required: true,
    enum: ['hackathon', 'workshop', 'webinar', 'tech-talk', 'other']
  },
  description: {
    type: String,
    required: true
  },
  mode: {
    type: String,
    required: true,
    enum: ['online', 'offline', 'hybrid']
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  targetAudience: {
    type: String,
    required: true,
    enum: ['students', 'professionals', 'startups', 'all']
  },
  maxParticipants: {
    type: Number,
    required: true
  },

  // Venue Details (for offline/hybrid events)
  venue: {
    name: {
      type: String,
      required: function() {
        return this.mode === 'offline' || this.mode === 'hybrid';
      }
    },
    address: {
      type: String,
      required: function() {
        return this.mode === 'offline' || this.mode === 'hybrid';
      }
    },
    city: {
      type: String,
      required: function() {
        return this.mode === 'offline' || this.mode === 'hybrid';
      }
    },
    state: {
      type: String,
      required: function() {
        return this.mode === 'offline' || this.mode === 'hybrid';
      }
    },
    country: {
      type: String,
      required: function() {
        return this.mode === 'offline' || this.mode === 'hybrid';
      }
    },
    contactPerson: {
      type: String,
      required: function() {
        return this.mode === 'offline' || this.mode === 'hybrid';
      }
    }
  },

  schedule:{
    type: String,
  },

  // Incentives & Prizes
  prizes: {
    hasPrizes: {
      type: Boolean,
      default: false
    },
    prizePool: {
      type: String,
      required: function() {
        // Handle both document context (this) and update context
        const hasPrizes = this.prizes?.hasPrizes ?? this.hasPrizes ?? false;
        return hasPrizes === true;
      }
    },

    prize1:{
        type: String,
        required: function() {
            const hasPrizes = this.prizes?.hasPrizes ?? this.hasPrizes ?? false;
            return hasPrizes === true;
          },
    },
    prize2:{
        type: String,
        required: function() {
            const hasPrizes = this.prizes?.hasPrizes ?? this.hasPrizes ?? false;
            return hasPrizes === true;
          },
    },
    prize3:{
        type: String,
        required: function() {
            const hasPrizes = this.prizes?.hasPrizes ?? this.hasPrizes ?? false;
            return hasPrizes === true;
          },
    },

    details: {
      type: String,
      required: function() {
        const hasPrizes = this.prizes?.hasPrizes ?? this.hasPrizes ?? false;
        return hasPrizes === true;
      }
    }
  },

  // Promotion & Outreach
  promotion: {
    needsPromotion: {
      type: Boolean,
      default: false
    },
  },

  // Sponsors
  sponsors: [{
    name: {
      type: String,
      required: true
    },
    logo: {
      type: String,
      required: true
    },
    website: {
      type: String,
      required: true
    }
  }],

  // Additional Information
  additionalNotes: {
    type: String
  },

  // Event Status
  status: {
    type: String,
    enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'],
    default: 'draft'
  },

  // Statistics
  stats: {
    registeredParticipants: {
      type: Number,
      default: 0
    },
    approvedParticipants: {
      type: Number,
      default: 0
    }
  },

  // Created By
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Create indexes for better query performance
eventSchema.index({ 'company.name': 1 });
eventSchema.index({ startDate: 1, endDate: 1 });
eventSchema.index({ status: 1 });
eventParticipantSchema.index({ userId: 1, eventId: 1 }, { unique: true });
eventParticipantSchema.index({ eventId: 1, role: 1 });

// Registration Schema
const registrationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  experience: {
    type: String,
    required: true,
    enum: ['beginner', 'intermediate', 'advanced', 'expert']
  },
  motivation: {
    type: String,
    required: true
  },
  skills: {
    type: String,
    required: true
  },
  previousProjects: {
    type: String
  },
  expectations: {
    type: String,
    required: true
  },
  teamPreference: {
    type: String,
    required: true,
    enum: ['individual', 'with_team', 'find_team']
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }
}, { timestamps: true });

// Team Schema
const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  leaderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  inviteCode: {
    type: String,
    unique: true,
    required: true
  },
  maxMembers: {
    type: Number,
    default: 4
  }
}, { timestamps: true });

// Create indexes for better query performance
registrationSchema.index({ userId: 1, eventId: 1 }, { unique: true });
teamSchema.index({ inviteCode: 1 });

// Create models
export const Event = mongoose.model('Event', eventSchema);
export const EventParticipant = mongoose.model('EventParticipant', eventParticipantSchema);
export const Registration = mongoose.model('Registration', registrationSchema);
export const Team = mongoose.model('Team', teamSchema);

