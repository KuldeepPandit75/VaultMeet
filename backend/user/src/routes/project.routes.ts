import express from 'express';
import  authMiddleware  from '../middlewares/auth.middleware';
import {
  submitProject,
  getUserProjects,
  getProjectById,
  deleteProject,
  getAllProjects,
  updateProjectStatus,
  getApprovedProjects,
  getTopRankedProjects
} from '../controllers/project.controller';

const router = express.Router();

// Public routes
router.get('/approved', getApprovedProjects);
router.get('/top-ranked', getTopRankedProjects);

// Protected routes (require authentication)
router.get('/:projectId', authMiddleware, getProjectById);
router.post('/submit', authMiddleware, submitProject);
router.get('/user/projects', authMiddleware, getUserProjects);

// Admin routest
router.get('/admin/all', authMiddleware, getAllProjects);
router.patch('/admin/:projectId', authMiddleware, updateProjectStatus);
router.delete('/:projectId', authMiddleware, deleteProject);

export default router; 