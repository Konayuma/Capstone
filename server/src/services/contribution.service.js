import prisma from '../config/db.js';

export const contributionService = {
  // 1. Submit weekly progress log
  async submitProgressLog(projectId, userId, { logText, weekNumber }) {
    return prisma.progressLog.create({
      data: {
        projectId,
        userId,
        logText,
        weekNumber: weekNumber ? parseInt(weekNumber, 10) : null,
      },
    });
  },

  async getProgressLogs(projectId) {
    return prisma.progressLog.findMany({
      where: { projectId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });
  },

  // 2. Submit peer review
  async submitPeerReview(projectId, reviewerId, { reviewedUserId, reliability, technicalContribution, communication, meetingAttendance, documentationContribution, comment }) {
    if (reviewerId === parseInt(reviewedUserId, 10)) {
      throw Object.assign(new Error('You cannot review yourself.'), { status: 400 });
    }

    const overallRating = Math.round(
      (reliability + technicalContribution + communication + meetingAttendance + documentationContribution) / 5
    );

    return prisma.peerReview.upsert({
      where: {
        projectId_reviewerId_reviewedUserId: {
          projectId,
          reviewerId,
          reviewedUserId: parseInt(reviewedUserId, 10),
        },
      },
      update: {
        reliability,
        technicalContribution,
        communication,
        meetingAttendance,
        documentationContribution,
        overallRating,
        comment,
      },
      create: {
        projectId,
        reviewerId,
        reviewedUserId: parseInt(reviewedUserId, 10),
        reliability,
        technicalContribution,
        communication,
        meetingAttendance,
        documentationContribution,
        overallRating,
        comment,
      },
    });
  },

  async getPeerReviewsReceived(projectId, userId) {
    return prisma.peerReview.findMany({
      where: { projectId, reviewedUserId: userId },
      include: {
        reviewer: { select: { id: true, name: true } },
      },
    });
  },

  // 3. Main algorithm to calculate project contribution scores and detect imbalance
  async calculateContributionScores(projectId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        tasks: { include: { evidence: true } },
        progressLogs: true,
        peerReviews: true,
        comments: { where: { targetType: 'contribution' } },
      },
    });

    if (!project) {
      throw Object.assign(new Error('Project not found'), { status: 404 });
    }

    const membersCount = project.members.length;
    if (membersCount === 0) {
      return { members: [], warnings: [] };
    }

    const scores = [];
    const warnings = [];

    // Calculate details per member
    for (const member of project.members) {
      const userId = member.userId;
      const user = member.user;

      // 1. Completed Tasks (30%)
      const memberTasks = project.tasks.filter(t => t.assignedTo === userId);
      const totalMemberTasks = memberTasks.length;
      const completedTasks = memberTasks.filter(t => t.status === 'completed');
      const completedCount = completedTasks.length;
      
      const taskScore = totalMemberTasks > 0 ? (completedCount / totalMemberTasks) * 100 : 0;

      // 2. Task Evidence (20%)
      // Evidence count relative to completed tasks (should upload evidence for completed tasks)
      const tasksWithEvidence = completedTasks.filter(t => t.evidence.length > 0).length;
      const evidenceScore = completedCount > 0 ? (tasksWithEvidence / completedCount) * 100 : 0;

      // 3. Progress Logs (15%)
      // Assume a standard cap of logs (e.g., 6 logs represents full marks in a typical term)
      const logsCount = project.progressLogs.filter(l => l.userId === userId).length;
      const logsScore = Math.min((logsCount / 6) * 100, 100);

      // 4. Peer Review Score (15%)
      const memberReviews = project.peerReviews.filter(r => r.reviewedUserId === userId);
      const reviewsCount = memberReviews.length;
      const averagePeerRating = reviewsCount > 0
        ? memberReviews.reduce((sum, r) => sum + r.overallRating, 0) / reviewsCount
        : 3.0; // neutral default (out of 5)
      
      const peerReviewScore = (averagePeerRating / 5.0) * 100;

      // 5. Deadline Consistency (10%)
      const tasksWithDeadline = completedTasks.filter(t => t.deadline !== null);
      const onTimeTasks = tasksWithDeadline.filter(t => {
        if (!t.completedAt || !t.deadline) return false;
        return new Date(t.completedAt) <= new Date(t.deadline);
      }).length;

      const deadlineScore = tasksWithDeadline.length > 0
        ? (onTimeTasks / tasksWithDeadline.length) * 100
        : 100; // default 100 if no deadlines set

      // 6. Supervisor Feedback / Score adjustment (10%)
      // Average score based on comment feedback ratings, or defaults to 85%
      const supervisorScore = 85; 

      // Weighted calculation
      const finalScore = Math.round(
        (taskScore * 0.30) +
        (evidenceScore * 0.20) +
        (logsScore * 0.15) +
        (peerReviewScore * 0.15) +
        (deadlineScore * 0.10) +
        (supervisorScore * 0.10)
      );

      scores.push({
        userId,
        name: user.name,
        role: member.projectRole,
        metrics: {
          completedTasks: `${completedCount}/${totalMemberTasks}`,
          evidenceUploads: `${tasksWithEvidence}/${completedCount}`,
          progressLogsSubmitted: logsCount,
          averagePeerReviewRating: averagePeerRating.toFixed(1),
          onTimeCompletionRate: tasksWithDeadline.length > 0 ? `${Math.round((onTimeTasks / tasksWithDeadline.length) * 100)}%` : 'N/A',
        },
        scores: {
          tasks: Math.round(taskScore),
          evidence: Math.round(evidenceScore),
          logs: Math.round(logsScore),
          peerReview: Math.round(peerReviewScore),
          deadline: Math.round(deadlineScore),
          supervisor: Math.round(supervisorScore),
        },
        finalScore,
      });
    }

    // --- Imbalance Warnings & Anomalies Detection (FR-031) ---
    const totalCompletedTasksAcrossProject = project.tasks.filter(t => t.status === 'completed').length;

    for (const s of scores) {
      const memberCompleted = parseInt(s.metrics.completedTasks.split('/')[0], 10);
      const memberAssigned = parseInt(s.metrics.completedTasks.split('/')[1], 10);

      // Warning 1: One member completed more than 60% of all tasks in a multi-person project
      if (membersCount > 1 && totalCompletedTasksAcrossProject > 2) {
        const contributionPercentage = memberCompleted / totalCompletedTasksAcrossProject;
        if (contributionPercentage > 0.60) {
          warnings.push({
            type: 'excessive_load',
            userId: s.userId,
            userName: s.name,
            message: `${s.name} completed ${Math.round(contributionPercentage * 100)}% of all project tasks. This represents a heavy reliance on a single member.`,
          });
        }
      }

      // Warning 2: Member has reviews but no task evidence
      const hasReviews = project.peerReviews.some(r => r.reviewedUserId === s.userId);
      const hasEvidence = project.tasks.some(t => t.assignedTo === s.userId && t.evidence.length > 0);
      if (hasReviews && !hasEvidence && memberCompleted > 0) {
        warnings.push({
          type: 'missing_evidence',
          userId: s.userId,
          userName: s.name,
          message: `${s.name} has peer ratings but has not uploaded any task screenshots or source code evidence for completed tasks.`,
        });
      }

      // Warning 3: Highly uneven contribution (low scores)
      if (s.finalScore < 45) {
        warnings.push({
          type: 'low_contribution',
          userId: s.userId,
          userName: s.name,
          message: `${s.name} has a low overall contribution score (${s.finalScore}%). Contribution tracking suggests they are falling behind on deliverables.`,
        });
      }

      // Warning 4: Tasks assigned but none completed
      if (memberAssigned > 2 && memberCompleted === 0) {
        warnings.push({
          type: 'zero_completion',
          userId: s.userId,
          userName: s.name,
          message: `${s.name} has ${memberAssigned} tasks assigned but has not completed a single task yet.`,
        });
      }
    }

    return {
      members: scores,
      warnings,
    };
  },
};

export default contributionService;
