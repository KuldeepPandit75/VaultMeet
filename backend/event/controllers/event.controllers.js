import { Event, EventParticipant, Registration, Team } from '../models/event.model.js';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs/promises';

// Upload company logo to Cloudinary
export const uploadCompanyLogo = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  console.log(1)
  try {
    const result = await cloudinary.uploader.upload(req.file.path);
    // Clean up the temporary file
    try {
      await fs.unlink(req.file.path);
    } catch (cleanupError) {
      console.error('Error cleaning up company logo:', cleanupError);
    }
    return res.status(200).json({ url: result.secure_url });
  } catch (error) {
    // Clean up file if upload fails
    try {
      await fs.unlink(req.file.path);
    } catch (cleanupError) {
      console.error('Error cleaning up company logo:', cleanupError);
    }
    return res.status(500).json({ message: 'Error uploading company logo', error: error.message });
  }
};

// Upload event banner to Cloudinary
export const uploadEventBanner = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  console.log(2)
  
  try {
    const result = await cloudinary.uploader.upload(req.file.path);
    // Clean up the temporary file
    try {
      await fs.unlink(req.file.path);
    } catch (cleanupError) {
      console.error('Error cleaning up event banner:', cleanupError);
    }
    return res.status(200).json({ url: result.secure_url });
  } catch (error) {
    // Clean up file if upload fails
    try {
      await fs.unlink(req.file.path);
    } catch (cleanupError) {
      console.error('Error cleaning up event banner:', cleanupError);
    }
    return res.status(500).json({ message: 'Error uploading event banner', error: error.message });
  }
};

// Upload marketing materials to Cloudinary
export const uploadMarketingMaterials = async (req, res) => {
  if (!req.files || !Array.isArray(req.files)) {
    return res.status(400).json({ message: 'No files uploaded' });
  }
  console.log(3)
  
  try {
    const uploadPromises = req.files.map(async (file) => {
      const result = await cloudinary.uploader.upload(file.path);
      // Clean up the temporary file
      try {
        await fs.unlink(file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up marketing material:', cleanupError);
      }
      return result.secure_url;
    });
    
    const urls = await Promise.all(uploadPromises);
    return res.status(200).json({ urls });
  } catch (error) {
    // Clean up all files if any upload fails
    if (Array.isArray(req.files)) {
      await Promise.all(req.files.map(file => 
        fs.unlink(file.path).catch(err => 
          console.error('Error cleaning up file:', err)
        )
      ));
    }
    return res.status(500).json({ message: 'Error uploading marketing materials', error: error.message });
  }
};

// Create new event
export const createEvent = async (req, res) => {
  try {
    const {
      company,
      contact,
      name,
      type,
      description,
      mode,
      startDate,
      endDate,
      duration,
      targetAudience,
      maxParticipants,
      venue,
      prizes,
      promotion,
      additionalNotes,
      banner,
      createdByType = 'company', // Default to company if not specified
      facultyCoordinator,
      expectedBudget
    } = req.body;

    // Validate required fields
    if (!company?.name || !company?.industry) {
      return res.status(400).json({
        success: false,
        message: 'Company/College information is required'
      });
    }

    if (!contact?.name || !contact?.email || !contact?.phone) {
      return res.status(400).json({
        success: false,
        message: 'Contact information is required'
      });
    }

    if (!name || !type || !description || !mode || !startDate || !endDate || !duration || !targetAudience || !maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'All event details are required'
      });
    }

    // Validate student-specific fields if createdByType is 'student'
    if (createdByType === 'student') {
      if (!facultyCoordinator?.name || !facultyCoordinator?.email || !facultyCoordinator?.phone) {
        return res.status(400).json({
          success: false,
          message: 'Faculty coordinator information is required for student events'
        });
      }
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start < now) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be in the past'
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Validate maxParticipants is a positive number
    if (isNaN(maxParticipants) || maxParticipants <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Maximum participants must be a positive number'
      });
    }

    // Validate venue for offline/hybrid events
    if (mode !== 'online' && (!venue?.name || !venue?.address || !venue?.city || !venue?.state || !venue?.country)) {
      return res.status(400).json({
        success: false,
        message: 'Venue details are required for offline/hybrid events'
      });
    }

    // Set default website for student events if not provided
    const companyWebsite = company.website || (createdByType === 'student' ? 'https://example.edu' : '');
    if (!companyWebsite) {
      return res.status(400).json({
        success: false,
        message: 'Company/College website is required'
      });
    }

    // Create event object
    const eventData = {
      createdByType,
      company: {
        name: company.name,
        website: companyWebsite,
        industry: company.industry,
        logo: company.logo || ''
      },
      contact: {
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        socialProfiles: contact.socialProfiles || ''
      },
      name,
      banner: banner || '',
      type,
      description,
      mode,
      startDate: start,
      endDate: end,
      duration,
      targetAudience,
      maxParticipants: parseInt(maxParticipants),
      stages: req.body.stages || [],
      venue: mode === 'online' ? undefined : {
        name: venue.name,
        address: venue.address,
        city: venue.city,
        state: venue.state,
        country: venue.country,
        contactPerson: venue.contactPerson || ''
      },
      prizes: {
        hasPrizes: prizes?.hasPrizes || false,
        prizePool: prizes?.prizePool || '',
        prize1: prizes?.prize1 || '',
        prize2: prizes?.prize2 || '',
        prize3: prizes?.prize3 || '',
        details: prizes?.details || ''
      },
      sponsors: req.body.sponsors || [],
      promotion: {
        needsPromotion: promotion?.needsPromotion || false
      },
      additionalNotes: additionalNotes || '',
      status: 'draft',
      stats: {
        registeredParticipants: 0,
        approvedParticipants: 0
      },
      createdBy: req.user._id
    };

    // Add student-specific fields if event is created by a student
    if (createdByType === 'student') {
      eventData.facultyCoordinator = {
        name: facultyCoordinator.name,
        email: facultyCoordinator.email,
        phone: facultyCoordinator.phone
      };
      eventData.expectedBudget = expectedBudget || '';
    }

    // Create event
    const event = await Event.create(eventData);

    // Create event participant entry for the creator as admin
    await EventParticipant.create({
      userId: req.user._id,
      eventId: event._id,
      role: 'admin',
      status: 'approved'
    });

    return res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
    });

  } catch (error) {
    console.error('Error creating event:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating event',
      error: error.message
    });
  }
};

// Get published events with pagination and filtering
export const getPublishedEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { status: 'published' };

    // Add date range filter if provided
    if (req.query.startDate && req.query.endDate) {
      filter.startDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    // Add mode filter if provided
    if (req.query.mode) {
      filter.mode = req.query.mode;
    }

    // Add type filter if provided
    if (req.query.type) {
      filter.type = req.query.type;
    }

    // Get total count for pagination
    const totalEvents = await Event.countDocuments(filter);

    // Fetch events with pagination
    const events = await Event.find(filter)
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(limit)
      .select('company.name company.website company.industry company.logo name type mode startDate endDate prizes.prizePool _id'); // Only select required fields

    return res.status(200).json({
      success: true,
      data: {
        events,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalEvents / limit),
          totalEvents,
          hasNextPage: skip + events.length < totalEvents,
          hasPreviousPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching published events:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching published events',
      error: error.message
    });
  }
};

// Get event by ID with detailed information
export const getEventById = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Validate eventId
    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'Event ID is required'
      });
    }

    // Find event by ID
    const event = await Event.findById(eventId);

    // Check if event exists
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Get participant count
    const participantCount = await EventParticipant.countDocuments({
      eventId: event._id,
      status: 'approved'
    });

    // Add participant count to event data
    const eventData = {
      ...event.toObject(),
      participantCount
    };

    return res.status(200).json({
      success: true,
      data: eventData
    });

  } catch (error) {
    console.error('Error fetching event:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching event',
      error: error.message
    });
  }
};

// Update event by ID
export const updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const updates = req.body;

    // Validate eventId
    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'Event ID is required'
      });
    }

    // Find the event first to check if it exists and user has permission
    const existingEvent = await Event.findById(eventId);
    
    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is the creator of the event (authorization)
    if (!existingEvent.createdBy.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this event'
      });
    }

    // Validate dates if provided
    if (updates.startDate && updates.endDate) {
      const start = new Date(updates.startDate);
      const end = new Date(updates.endDate);
      
      if (end <= start) {
        return res.status(400).json({
          success: false,
          message: 'End date must be after start date'
        });
      }
    }

    // Validate maxParticipants if provided
    if (updates.maxParticipants && (isNaN(updates.maxParticipants) || updates.maxParticipants <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'Maximum participants must be a positive number'
      });
    }

    // Validate venue for offline/hybrid events if mode is being updated
    const newMode = updates.mode || existingEvent.mode;
    if (newMode !== 'online' && updates.venue && (!updates.venue.name || !updates.venue.address || !updates.venue.city || !updates.venue.country)) {
      return res.status(400).json({
        success: false,
        message: 'Complete venue details are required for offline/hybrid events'
      });
    }

    // Prepare update object - only include provided fields
    const updateData = {};
    
    // Handle nested objects properly
    if (updates.company) {
      updateData.company = { ...existingEvent.company.toObject(), ...updates.company };
    }
    
    if (updates.contact) {
      updateData.contact = { ...existingEvent.contact.toObject(), ...updates.contact };
    }
    
    if (updates.venue) {
      updateData.venue = { ...existingEvent.venue?.toObject() || {}, ...updates.venue };
    }
    
    if (updates.prizes) {
      updateData.prizes = { ...existingEvent.prizes.toObject(), ...updates.prizes };
    }
    
    if (updates.promotion) {
      updateData.promotion = { ...existingEvent.promotion.toObject(), ...updates.promotion };
    }
    
    if (updates.stats) {
      updateData.stats = { ...existingEvent.stats.toObject(), ...updates.stats };
    }

    // Handle direct fields
    const directFields = ['name', 'banner', 'type', 'description', 'mode', 'startDate', 'endDate', 
                         'duration', 'targetAudience', 'maxParticipants', 'stages', 'sponsors', 
                         'additionalNotes', 'status'];
    
    directFields.forEach(field => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });

    // Custom validation for prizes if being updated
    if (updates.prizes) {
      const finalPrizes = { ...existingEvent.prizes.toObject(), ...updates.prizes };
      if (finalPrizes.hasPrizes) {
        if (!finalPrizes.prizePool) {
          return res.status(400).json({
            success: false,
            message: 'Prize pool is required when prizes are enabled'
          });
        }
        if (!finalPrizes.prize1 || !finalPrizes.prize2 || !finalPrizes.prize3) {
          return res.status(400).json({
            success: false,
            message: 'All three prize positions are required when prizes are enabled'
          });
        }
        if (!finalPrizes.details) {
          return res.status(400).json({
            success: false,
            message: 'Prize details are required when prizes are enabled'
          });
        }
      }
    }

    // Update the event with validation disabled for conditional fields
    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      updateData,
      { new: true, runValidators: false }
    );

    return res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: updatedEvent
    });

  } catch (error) {
    console.error('Error updating event:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating event',
      error: error.message
    });
  }
};

// Publish event (change status from draft to published)
export const publishEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Validate eventId
    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'Event ID is required'
      });
    }

    // Find the event
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is the creator of the event
    if (!event.createdBy.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to publish this event'
      });
    }

    // Check if event is already published
    if (event.status === 'published') {
      return res.status(400).json({
        success: false,
        message: 'Event is already published'
      });
    }

    // Check if event can be published (basic validation)
    if (!event.name || !event.description || !event.startDate || !event.endDate) {
      return res.status(400).json({
        success: false,
        message: 'Event must have complete information before publishing'
      });
    }

    // Update event status to published
    const publishedEvent = await Event.findByIdAndUpdate(
      eventId,
      { status: 'published' },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Event published successfully',
      data: publishedEvent
    });

  } catch (error) {
    console.error('Error publishing event:', error);
    return res.status(500).json({
      success: false,
      message: 'Error publishing event',
      error: error.message
    });
  }
};

// Unpublish event (change status from published to draft)
export const unpublishEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Validate eventId
    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'Event ID is required'
      });
    }

    // Find the event
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is the creator of the event
    if (!event.createdBy.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to unpublish this event'
      });
    }

    // Check if event is already draft
    if (event.status === 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Event is already in draft status'
      });
    }

    // Update event status to draft
    const unpublishedEvent = await Event.findByIdAndUpdate(
      eventId,
      { status: 'draft' },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Event unpublished successfully',
      data: unpublishedEvent
    });

  } catch (error) {
    console.error('Error unpublishing event:', error);
    return res.status(500).json({
      success: false,
      message: 'Error unpublishing event',
      error: error.message
    });
  }
};

// Delete event (only for draft events)
export const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Validate eventId
    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'Event ID is required'
      });
    }

    // Find the event
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is the creator of the event
    if (!event.createdBy.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this event'
      });
    }

    // Only allow deletion of draft events
    if (event.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft events can be deleted. Unpublish the event first if you want to delete it.'
      });
    }

    // Delete the event
    await Event.findByIdAndDelete(eventId);

    return res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting event:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting event',
      error: error.message
    });
  }
};

// Register for event
export const registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { experience, motivation, skills, previousProjects, expectations, teamPreference } = req.body;

    // Validate required fields
    if (!experience || !motivation || !skills || !expectations || !teamPreference) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if event is published
    if (event.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Event is not open for registration'
      });
    }

    // Check if event has started
    if (new Date() >= new Date(event.startDate)) {
      return res.status(400).json({
        success: false,
        message: 'Registration is closed as the event has already started'
      });
    }

    // Check if user is already registered
    const existingRegistration = await Registration.findOne({
      userId: req.user._id,
      eventId
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event'
      });
    }

    // Check if event is full
    const registrationCount = await Registration.countDocuments({ eventId, status: { $ne: 'rejected' } });
    if (registrationCount >= event.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Event is full'
      });
    }

    // Create registration
    const registration = await Registration.create({
      userId: req.user._id,
      eventId,
      experience,
      motivation,
      skills,
      previousProjects,
      expectations,
      teamPreference
    });

    // Update event stats
    await Event.findByIdAndUpdate(eventId, {
      $inc: { 'stats.registeredParticipants': 1 }
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: registration
    });

  } catch (error) {
    console.error('Error registering for event:', error);
    return res.status(500).json({
      success: false,
      message: 'Error registering for event',
      error: error.message
    });
  }
};

// Get registration status
export const getRegistrationStatus = async (req, res) => {
  try {
    const { eventId } = req.params;

    const registration = await Registration.findOne({
      userId: req.user._id,
      eventId
    }).populate('teamId');

    let team = null;
    if (registration?.teamId) {
      team = await Team.findById(registration.teamId)
        .populate('members.userId', 'fullname email avatar')
        .populate('leaderId', 'fullname email avatar');
    }

    return res.status(200).json({
      success: true,
      data: {
        registration,
        team
      }
    });

  } catch (error) {
    console.error('Error getting registration status:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting registration status',
      error: error.message
    });
  }
};

// Create team
export const createTeam = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Team name is required'
      });
    }

    // Check if user is registered for the event
    const registration = await Registration.findOne({
      userId: req.user._id,
      eventId
    });

    if (!registration) {
      return res.status(400).json({
        success: false,
        message: 'You must be registered for this event to create a team'
      });
    }

    // Check if user already has a team
    if (registration.teamId) {
      return res.status(400).json({
        success: false,
        message: 'You are already part of a team'
      });
    }

    // Generate unique invite code
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create team
    const team = await Team.create({
      name: name.trim(),
      eventId,
      leaderId: req.user._id,
      members: [{
        userId: req.user._id,
        status: 'accepted'
      }],
      inviteCode
    });

    // Update registration with team ID
    await Registration.findByIdAndUpdate(registration._id, {
      teamId: team._id
    });

    const populatedTeam = await Team.findById(team._id)
      .populate('members.userId', 'fullname email avatar')
      .populate('leaderId', 'fullname email avatar');

    return res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: populatedTeam
    });

  } catch (error) {
    console.error('Error creating team:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating team',
      error: error.message
    });
  }
};

// Join team
export const joinTeam = async (req, res) => {
  try {
    const { eventId, teamId } = req.params;
    const { inviteCode } = req.body;

    // Find team by ID and invite code
    const team = await Team.findOne({
      _id: teamId,
      eventId,
      inviteCode
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Invalid team or invite code'
      });
    }

    // Check if user is registered for the event
    const registration = await Registration.findOne({
      userId: req.user._id,
      eventId
    });

    if (!registration) {
      return res.status(400).json({
        success: false,
        message: 'You must be registered for this event to join a team'
      });
    }

    // Check if user already has a team
    if (registration.teamId) {
      return res.status(400).json({
        success: false,
        message: 'You are already part of a team'
      });
    }

    // Check if team is full
    if (team.members.length >= team.maxMembers) {
      return res.status(400).json({
        success: false,
        message: 'Team is full'
      });
    }

    // Check if user is already in the team
    const existingMember = team.members.find(member => 
      member.userId.toString() === req.user._id.toString()
    );

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this team'
      });
    }

    // Add user to team
    team.members.push({
      userId: req.user._id,
      status: 'accepted'
    });

    await team.save();

    // Update registration with team ID
    await Registration.findByIdAndUpdate(registration._id, {
      teamId: team._id
    });

    const populatedTeam = await Team.findById(team._id)
      .populate('members.userId', 'fullname email avatar')
      .populate('leaderId', 'fullname email avatar');

    return res.status(200).json({
      success: true,
      message: 'Successfully joined team',
      data: populatedTeam
    });

  } catch (error) {
    console.error('Error joining team:', error);
    return res.status(500).json({
      success: false,
      message: 'Error joining team',
      error: error.message
    });
  }
};

// Get team details
export const getTeamDetails = async (req, res) => {
  try {
    const { teamId } = req.params;

    const team = await Team.findById(teamId)
      .populate('members.userId', 'fullname email avatar')
      .populate('leaderId', 'fullname email avatar');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is a member of the team
    const isMember = team.members.some(member => 
      member.userId._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this team'
      });
    }

    return res.status(200).json({
      success: true,
      data: team
    });

  } catch (error) {
    console.error('Error getting team details:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting team details',
      error: error.message
    });
  }
};

// Get team by invite code (public endpoint for join page)
export const getTeamByInviteCode = async (req, res) => {
  try {
    const { eventId, inviteCode } = req.params;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Find team by invite code and event ID
    const team = await Team.findOne({
      eventId,
      inviteCode
    })
      .populate('members.userId', 'fullname email avatar')
      .populate('leaderId', 'fullname email avatar');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Invalid invite code or team not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        team,
        event: {
          _id: event._id,
          name: event.name,
          banner: event.banner,
          company: event.company,
          startDate: event.startDate,
          endDate: event.endDate,
          status: event.status
        }
      }
    });

  } catch (error) {
    console.error('Error getting team by invite code:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting team by invite code',
      error: error.message
    });
  }
};

// Get events created by a specific user
export const getUserCreatedEvents = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    // Build filter object
    const filter = { createdBy: userId };
    
    // Add status filter if provided
    if (status) {
      filter.status = status;
    }

    // Get total count for pagination
    const totalEvents = await Event.countDocuments(filter);

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch events with pagination
    const events = await Event.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('company.name company.logo banner name type mode startDate endDate prizes.prizePool status stats _id createdAt');

    return res.status(200).json({
      success: true,
      data: {
        events,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalEvents / parseInt(limit)),
          totalEvents,
          hasNextPage: skip + events.length < totalEvents,
          hasPreviousPage: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user created events:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching user created events',
      error: error.message
    });
  }
};

// Get event participants (for event organizers)
export const getEventParticipants = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 10, status, search } = req.query;

    // Check if event exists and user is the creator
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is the event creator
    if (!event.createdBy.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Only event creators can view participants'
      });
    }

    // Build query
    const query = { eventId };
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.status = status;
    }

    // Get registrations with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let registrations = await Registration.find(query)
      .populate('userId', 'fullname email avatar username')
      .populate('teamId', 'name leaderId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Filter by search if provided
    if (search) {
      const searchLower = search.toLowerCase();
      registrations = registrations.filter(reg => 
        reg.userId.fullname.firstname.toLowerCase().includes(searchLower) ||
        reg.userId.fullname.lastname.toLowerCase().includes(searchLower) ||
        reg.userId.email.toLowerCase().includes(searchLower) ||
        reg.userId.username?.toLowerCase().includes(searchLower)
      );
    }

    const totalRegistrations = await Registration.countDocuments(query);
    const totalPages = Math.ceil(totalRegistrations / parseInt(limit));

    // Get statistics
    const stats = await Registration.aggregate([
      { $match: { eventId: event._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusCounts = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0
    };

    stats.forEach(stat => {
      statusCounts[stat._id] = stat.count;
      statusCounts.total += stat.count;
    });

    return res.status(200).json({
      success: true,
      data: {
        participants: registrations,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalParticipants: totalRegistrations,
          hasNextPage: parseInt(page) < totalPages,
          hasPreviousPage: parseInt(page) > 1
        },
        stats: statusCounts
      }
    });

  } catch (error) {
    console.error('Error getting event participants:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting event participants',
      error: error.message
    });
  }
};

// Update participant status
export const updateParticipantStatus = async (req, res) => {
  try {
    const { eventId, participantId } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (pending, approved, rejected)'
      });
    }

    // Check if event exists and user is the creator
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (!event.createdBy.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Only event creators can manage participants'
      });
    }

    // Update registration status
    const registration = await Registration.findOneAndUpdate(
      { _id: participantId, eventId },
      { status },
      { new: true }
    ).populate('userId', 'fullname email avatar username')
      .populate('teamId', 'name leaderId');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found'
      });
    }

    // Update event stats
    if (status === 'approved') {
      await Event.findByIdAndUpdate(eventId, {
        $inc: { 'stats.approvedParticipants': 1 }
      });
    }

    return res.status(200).json({
      success: true,
      message: `Participant ${status} successfully`,
      data: registration
    });

  } catch (error) {
    console.error('Error updating participant status:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating participant status',
      error: error.message
    });
  }
};

// Bulk update participant status
export const bulkUpdateParticipants = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { participantIds, status } = req.body;

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (pending, approved, rejected)'
      });
    }

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Participant IDs array is required'
      });
    }

    // Check if event exists and user is the creator
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (!event.createdBy.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Only event creators can manage participants'
      });
    }

    // Bulk update registrations
    const result = await Registration.updateMany(
      { 
        _id: { $in: participantIds }, 
        eventId 
      },
      { status }
    );

    // Update event stats if approving
    if (status === 'approved') {
      await Event.findByIdAndUpdate(eventId, {
        $inc: { 'stats.approvedParticipants': result.modifiedCount }
      });
    }

    return res.status(200).json({
      success: true,
      message: `${result.modifiedCount} participants ${status} successfully`,
      data: {
        updatedCount: result.modifiedCount,
        totalRequested: participantIds.length
      }
    });

  } catch (error) {
    console.error('Error bulk updating participants:', error);
    return res.status(500).json({
      success: false,
      message: 'Error bulk updating participants',
      error: error.message
    });
  }
};
