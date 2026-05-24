import prisma from '../config/db.js';

/**
 * Middleware to check if user has access to a specific project.
 * Admins and the project supervisor always have access.
 * Students/leaders must be a member of the project.
 */
export const requireProjectAccess = async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id || req.params.projectId, 10);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID.' });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    // Admins always have access
    if (req.user.role === 'admin') {
      req.project = project;
      return next();
    }

    // Supervisor of the project has access
    if (project.supervisorId === req.user.id) {
      req.project = project;
      req.userProjectRole = 'supervisor';
      return next();
    }

    // Check if user is a member
    const member = project.members.find(m => m.userId === req.user.id);
    if (!member) {
      return res.status(403).json({ error: 'You do not have access to this project.' });
    }

    req.project = project;
    req.projectMember = member;
    req.userProjectRole = member.isLeader ? 'leader' : 'member';
    next();
  } catch (error) {
    next(error);
  }
};

export default requireProjectAccess;
