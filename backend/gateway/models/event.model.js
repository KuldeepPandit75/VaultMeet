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
  // Company Information
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
      required: true
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
    onVaultMeet:{
        type: Boolean,
        default: false
    }
  }],
  banner: {
    type: String, // URL to stored image
    required: true
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
        return this.prizes.hasPrizes === true;
      }
    },

    prize1:{
        type: String,
        required: function() {
            return this.prizes.hasPrizes === true;
          },
    },
    prize2:{
        type: String,
        required: function() {
            return this.prizes.hasPrizes === true;
          },
    },
    prize3:{
        type: String,
        required: function() {
            return this.prizes.hasPrizes === true;
          },
    },

    details: {
      type: String,
      required: function() {
        return this.prizes.hasPrizes === true;
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
  }
}, { timestamps: true });

// Create indexes for better query performance
eventSchema.index({ 'company.name': 1 });
eventSchema.index({ startDate: 1, endDate: 1 });
eventSchema.index({ status: 1 });
eventParticipantSchema.index({ userId: 1, eventId: 1 }, { unique: true });
eventParticipantSchema.index({ eventId: 1, role: 1 });

// Create models
export const Event = mongoose.model('Event', eventSchema);
export const EventParticipant = mongoose.model('EventParticipant', eventParticipantSchema);

