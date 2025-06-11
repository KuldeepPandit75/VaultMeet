import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { createEvent, getPublishedEvents, uploadCompanyLogo, uploadEventBanner, uploadMarketingMaterials, getEventById } from '../controllers/event.controllers.js';
import { upload } from '../config/file.upload.js';

const router = express.Router();

router.post('/create', authMiddleware, createEvent);
router.get('/published', getPublishedEvents);
router.get('/:eventId', getEventById);

router.post('/upload-company-logo', authMiddleware,upload.single('companyLogo'), uploadCompanyLogo);
router.post('/upload-event-banner', authMiddleware, upload.single('eventBanner'), uploadEventBanner);
router.post('/upload-marketing-materials', authMiddleware, upload.array('marketingMaterials'), uploadMarketingMaterials);



export default router;