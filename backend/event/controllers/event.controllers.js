import { Event, EventParticipant } from '../models/event.model.js';
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
      banner
    } = req.body;

    // Validate required fields
    if (!company?.name || !company?.website || !company?.industry) {
      return res.status(400).json({
        success: false,
        message: 'Company information is required'
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

    // Create event object
    const eventData = {
      company: {
        name: company.name,
        website: company.website,
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
      banner,
      type,
      description,
      mode,
      startDate: start,
      endDate: end,
      duration,
      targetAudience,
      maxParticipants: parseInt(maxParticipants),
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
        details: prizes?.details || '',
        sponsorshipDetails: prizes?.sponsorshipDetails || ''
      },
      promotion: {
        needsPromotion: promotion?.needsPromotion || false,
        marketingMaterials: promotion?.marketingMaterials || []
      },
      additionalNotes: additionalNotes || '',
      status: 'draft',
      stats: {
        registeredParticipants: 0,
        approvedParticipants: 0
      },
      createdBy: req.user._id // Assuming you have user info in req.user from auth middleware
    };

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
