import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { createEvent, getPublishedEvents, uploadCompanyLogo, uploadEventBanner, uploadMarketingMaterials, getEventById, updateEvent, publishEvent, unpublishEvent, deleteEvent, registerForEvent, getRegistrationStatus, createTeam, joinTeam, getTeamDetails, getTeamByInviteCode, getEventParticipants, updateParticipantStatus, bulkUpdateParticipants, getUserCreatedEvents, postNews, getNews } from '../controllers/event.controllers.js';
import { upload } from '../config/file.upload.js';

const router = express.Router();

router.post('/create', authMiddleware, createEvent);
router.get('/published', getPublishedEvents);
router.get('/user/:userId', getUserCreatedEvents);

//temp admin routes - must be before dynamic routes
router.post("/post-news", postNews);
router.get("/get-news", getNews);

router.post('/upload-company-logo', authMiddleware,upload.single('companyLogo'), uploadCompanyLogo);
router.post('/upload-event-banner', authMiddleware, upload.single('eventBanner'), uploadEventBanner);
router.post('/upload-marketing-materials', authMiddleware, upload.array('marketingMaterials'), uploadMarketingMaterials);

router.get('/:eventId', getEventById);
router.put('/:eventId', authMiddleware, updateEvent);
router.patch('/:eventId/publish', authMiddleware, publishEvent);
router.patch('/:eventId/unpublish', authMiddleware, unpublishEvent);
router.delete('/:eventId', authMiddleware, deleteEvent);

// Registration routes
router.post('/:eventId/register', authMiddleware, registerForEvent);
router.get('/:eventId/registration-status', authMiddleware, getRegistrationStatus);

// Participant management routes (for event organizers)
router.get('/:eventId/participants', authMiddleware, getEventParticipants);
router.patch('/:eventId/participants/:participantId/status', authMiddleware, updateParticipantStatus);
router.patch('/:eventId/participants/bulk-status', authMiddleware, bulkUpdateParticipants);

// Team routes
router.post('/:eventId/teams', authMiddleware, createTeam);
router.post('/:eventId/teams/:teamId/join', authMiddleware, joinTeam);
router.get('/:eventId/teams/:teamId', authMiddleware, getTeamDetails);
router.get('/:eventId/teams/by-invite/:inviteCode', getTeamByInviteCode);






export default router;