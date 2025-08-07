"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTopRankedProjects = exports.getApprovedProjects = exports.updateProjectStatus = exports.getAllProjects = exports.deleteProject = exports.getProjectById = exports.getUserProjects = exports.submitProject = void 0;
const project_model_1 = __importDefault(require("../models/project.model"));
const express_validator_1 = require("express-validator");
// Submit a new project
const submitProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        console.log(errors.array());
        res.status(400).json({ message: "validation error" });
        return;
    }
    try {
        const { projectName, developer, description, techStack, githubUrl, demoUrl, category, isHosted } = req.body;
        // Validate required fields
        if (!projectName || !developer || !description || !githubUrl || !category) {
            res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
            return;
        }
        // Validate that demo URL is provided when project is hosted
        if (isHosted && !demoUrl) {
            res.status(400).json({
                success: false,
                message: 'Demo URL is required when project is hosted'
            });
            return;
        }
        // Create new project
        const project = new project_model_1.default({
            projectName,
            developer,
            description,
            techStack: techStack || [],
            githubUrl,
            demoUrl: isHosted ? demoUrl : undefined,
            category,
            isHosted: isHosted || false,
            submittedBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id
        });
        yield project.save();
        res.status(201).json({
            success: true,
            message: 'Project submitted successfully',
            data: {
                projectId: project._id,
                status: project.status
            }
        });
    }
    catch (error) {
        console.error('Error submitting project:', error.errors[0].properties);
        if (error.name === 'ValidationError') {
            res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: Object.values(error.errors).map((err) => err.message)
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.submitProject = submitProject;
// Get user's submitted projects
const getUserProjects = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const projects = yield project_model_1.default.find({ submittedBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id })
            .sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: projects
        });
    }
    catch (error) {
        console.error('Error fetching user projects:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.getUserProjects = getUserProjects;
// Get project by ID
const getProjectById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projectId } = req.params;
        const project = yield project_model_1.default.findById(projectId);
        if (!project) {
            res.status(404).json({
                success: false,
                message: 'Project not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: project
        });
    }
    catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.getProjectById = getProjectById;
// Delete project (admin or project owner)
const deleteProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { projectId } = req.params;
        const project = yield project_model_1.default.findById(projectId);
        if (!project) {
            res.status(404).json({
                success: false,
                message: 'Project not found'
            });
            return;
        }
        // Check if user is admin or project owner
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'admin' && project.submittedBy.toString() !== ((_c = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id) === null || _c === void 0 ? void 0 : _c.toString())) {
            res.status(403).json({
                success: false,
                message: 'Access denied. You can only delete your own projects.'
            });
            return;
        }
        yield project_model_1.default.findByIdAndDelete(projectId);
        res.status(200).json({
            success: true,
            message: 'Project deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.deleteProject = deleteProject;
// Get all projects (admin only)
const getAllProjects = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Check if user is admin
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
            res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
            return;
        }
        const { status, page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        let query = {};
        if (status && status !== 'all') {
            query.status = status;
        }
        const projects = yield project_model_1.default.find(query)
            .populate('submittedBy', 'username fullname')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
        const total = yield project_model_1.default.countDocuments(query);
        res.status(200).json({
            success: true,
            data: projects,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(total / Number(limit)),
                totalItems: total,
                itemsPerPage: Number(limit)
            }
        });
    }
    catch (error) {
        console.error('Error fetching all projects:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.getAllProjects = getAllProjects;
// Update project status and ranking (admin only)
const updateProjectStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Check if user is admin
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
            res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
            return;
        }
        const { projectId } = req.params;
        const { status, rank } = req.body;
        const project = yield project_model_1.default.findById(projectId);
        if (!project) {
            res.status(404).json({
                success: false,
                message: 'Project not found'
            });
            return;
        }
        // If setting a rank, first clear any existing project with that rank
        if (rank && rank >= 1 && rank <= 3) {
            yield project_model_1.default.updateOne({ rank: rank }, { $unset: { rank: 1 } });
            project.rank = rank;
            // Auto-approve projects with rankings
            project.status = 'approved';
        }
        else if (rank === undefined || rank === null) {
            // Remove rank if explicitly set to undefined/null
            project.rank = undefined;
        }
        // Update status if provided
        if (status && ['pending', 'approved', 'rejected'].includes(status)) {
            project.status = status;
        }
        yield project.save();
        res.status(200).json({
            success: true,
            message: 'Project updated successfully',
            data: project
        });
    }
    catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.updateProjectStatus = updateProjectStatus;
// Get approved projects (for Top Developers modal)
const getApprovedProjects = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get only approved projects, sorted by rank (ranked projects first), then by creation date
        const projects = yield project_model_1.default.find({ status: 'approved' })
            .populate('submittedBy', 'username fullname')
            .sort({ rank: 1, createdAt: -1 })
            .limit(20); // Limit to top 20 projects
        res.status(200).json({
            success: true,
            data: projects
        });
    }
    catch (error) {
        console.error('Error fetching approved projects:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.getApprovedProjects = getApprovedProjects;
// Get top ranked projects (ranks 1-3 only)
const getTopRankedProjects = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const topProjects = yield project_model_1.default.find({
            status: 'approved',
            rank: { $in: [1, 2, 3] }
        })
            .populate('submittedBy', 'username fullname')
            .sort({ rank: 1 });
        res.status(200).json({
            success: true,
            data: topProjects
        });
    }
    catch (error) {
        console.error('Error fetching top ranked projects:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.getTopRankedProjects = getTopRankedProjects;
