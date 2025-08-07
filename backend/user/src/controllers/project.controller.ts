import { Request, Response } from 'express';
import Project from '../models/project.model';
import {IUser} from '../models/user.model';
import { validationResult } from "express-validator";


interface AuthRequest extends Request {
  user?: IUser;
}

// Submit a new project
export const submitProject = async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    res.status(400).json({ message: "validation error" });
    return;
  }
  try {
    const {
      projectName,
      developer,
      description,
      techStack,
      githubUrl,
      demoUrl,
      category,
      isHosted
    } = req.body;

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
    const project = new Project({
      projectName,
      developer,
      description,
      techStack: techStack || [],
      githubUrl,
      demoUrl: isHosted ? demoUrl : undefined,
      category,
      isHosted: isHosted || false,
      submittedBy: req.user?._id
    });

    await project.save();

    res.status(201).json({
      success: true,
      message: 'Project submitted successfully',
      data: {
        projectId: project._id,
        status: project.status
      }
    });

  } catch (error: any) {
    console.error('Error submitting project:', error.errors[0].properties);
    
    if (error.name === 'ValidationError') {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map((err: any) => err.message)
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get user's submitted projects
export const getUserProjects = async (req: AuthRequest, res: Response) => {
  try {
    const projects = await Project.find({ submittedBy: req.user?._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: projects
    });

  } catch (error) {
    console.error('Error fetching user projects:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get project by ID
export const getProjectById = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

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

  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete project (admin or project owner)
export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found'
      });
      return;
    }

    // Check if user is admin or project owner
    if (req.user?.role !== 'admin' && project.submittedBy.toString() !== req.user?._id?.toString()) {
      res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own projects.'
      });
      return;
    }

    await Project.findByIdAndDelete(projectId);

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}; 

// Get all projects (admin only)
export const getAllProjects = async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
      return;
    }

    const { status, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let query: any = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const projects = await Project.find(query)
      .populate('submittedBy', 'username fullname')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Project.countDocuments(query);

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

  } catch (error) {
    console.error('Error fetching all projects:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update project status and ranking (admin only)
export const updateProjectStatus = async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
      return;
    }

    const { projectId } = req.params;
    const { status, rank } = req.body;

    const project = await Project.findById(projectId);

    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found'
      });
      return;
    }

    // If setting a rank, first clear any existing project with that rank
    if (rank && rank >= 1 && rank <= 3) {
      await Project.updateOne({ rank: rank }, { $unset: { rank: 1 } });
      project.rank = rank;
      // Auto-approve projects with rankings
      project.status = 'approved';
    } else if (rank === undefined || rank === null) {
      // Remove rank if explicitly set to undefined/null
      project.rank = undefined;
    }

    // Update status if provided
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      project.status = status;
    }

    await project.save();

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: project
    });

  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get approved projects (for Top Developers modal)
export const getApprovedProjects = async (req: Request, res: Response) => {
  try {
    // Get only approved projects, sorted by rank (ranked projects first), then by creation date
    const projects = await Project.find({ status: 'approved' })
      .populate('submittedBy', 'username fullname')
      .sort({ rank: 1, createdAt: -1 })
      .limit(20); // Limit to top 20 projects

    res.status(200).json({
      success: true,
      data: projects
    });

  } catch (error) {
    console.error('Error fetching approved projects:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get top ranked projects (ranks 1-3 only)
export const getTopRankedProjects = async (req: Request, res: Response) => {
  try {
    const topProjects = await Project.find({ 
      status: 'approved',
      rank: { $in: [1, 2, 3] }
    })
      .populate('submittedBy', 'username fullname')
      .sort({ rank: 1 });

    res.status(200).json({
      success: true,
      data: topProjects
    });

  } catch (error) {
    console.error('Error fetching top ranked projects:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}; 