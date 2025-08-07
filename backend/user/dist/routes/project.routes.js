"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = __importDefault(require("../middlewares/auth.middleware"));
const project_controller_1 = require("../controllers/project.controller");
const router = express_1.default.Router();
// Public routes
router.get('/approved', project_controller_1.getApprovedProjects);
router.get('/top-ranked', project_controller_1.getTopRankedProjects);
// Protected routes (require authentication)
router.get('/:projectId', auth_middleware_1.default, project_controller_1.getProjectById);
router.post('/submit', auth_middleware_1.default, project_controller_1.submitProject);
router.get('/user/projects', auth_middleware_1.default, project_controller_1.getUserProjects);
// Admin routest
router.get('/admin/all', auth_middleware_1.default, project_controller_1.getAllProjects);
router.patch('/admin/:projectId', auth_middleware_1.default, project_controller_1.updateProjectStatus);
router.delete('/:projectId', auth_middleware_1.default, project_controller_1.deleteProject);
exports.default = router;
