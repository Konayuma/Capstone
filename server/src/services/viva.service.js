import prisma from '../config/db.js';
import { generateStructuredContent } from '../ai/nvidia.js';
import contributionService from './contribution.service.js';
import {
  VIVA_SYSTEM_INSTRUCTION,
  vivaQuestionsSchema,
  buildVivaGenPrompt,
  vivaEvaluationSchema,
  buildVivaEvaluationPrompt,
} from '../ai/prompts/viva.js';

export const vivaService = {
  // 1. Generate new examiner questions using NVIDIA AI based on project content
  async generateVivaQuestions(projectId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        requirements: true,
      },
    });

    if (!project) {
      throw Object.assign(new Error('Project not found'), { status: 404 });
    }

    // Get contribution metrics to fuel the prompt
    const contrib = await contributionService.calculateContributionScores(projectId);
    
    // Get task stats
    const totalTasks = await prisma.task.count({ where: { projectId } });
    const completedTasks = await prisma.task.count({ where: { projectId, status: 'completed' } });
    const taskStats = `Total tasks in system: ${totalTasks}, completed: ${completedTasks}. Warnings: ${contrib.warnings.length}`;

    const prompt = buildVivaGenPrompt(
      project.title,
      project.description,
      project.requirements,
      contrib.members,
      taskStats
    );

    // Call NVIDIA AI
    const aiResult = await generateStructuredContent(
      prompt,
      vivaQuestionsSchema,
      VIVA_SYSTEM_INSTRUCTION
    );

    // Clear old questions
    await prisma.vivaQuestion.deleteMany({
      where: { projectId },
    });

    // Save newly generated questions
    const savedQuestions = [];
    for (const q of aiResult.questions) {
      const saved = await prisma.vivaQuestion.create({
        data: {
          projectId,
          category: q.category.toLowerCase(),
          difficulty: q.difficulty.toLowerCase(),
          questionText: q.questionText,
          suggestedAnswer: q.suggestedAnswer,
        },
      });
      savedQuestions.push(saved);
    }

    return savedQuestions;
  },

  async getVivaQuestions(projectId) {
    return prisma.vivaQuestion.findMany({
      where: { projectId },
      include: {
        answers: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { id: 'asc' },
    });
  },

  // 2. Submit and grade a student's answer using NVIDIA AI
  async evaluateVivaAnswer(userId, questionId, answerText, projectId = null) {
    const question = await prisma.vivaQuestion.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw Object.assign(new Error('Viva question not found'), { status: 404 });
    }
    if (projectId && question.projectId !== projectId) {
      throw Object.assign(new Error('Viva question does not belong to this project.'), { status: 403 });
    }

    const prompt = buildVivaEvaluationPrompt(
      question.questionText,
      question.suggestedAnswer || 'General engineering concepts.',
      answerText
    );

    // Call NVIDIA AI to evaluate
    const aiResult = await generateStructuredContent(
      prompt,
      vivaEvaluationSchema,
      VIVA_SYSTEM_INSTRUCTION
    );

    // Format evaluation breakdown into feedback text
    const feedbackSummary = `Clarity: ${aiResult.clarity}. Correctness: ${aiResult.correctness}. Depth: ${aiResult.technicalDepth}. Confidence: ${aiResult.confidence}.\nFeedback: ${aiResult.feedback}`;

    // Save answer and grading
    return prisma.vivaAnswer.create({
      data: {
        questionId,
        userId,
        answerText,
        aiScore: aiResult.score,
        aiFeedback: feedbackSummary,
      },
    });
  },

  // 3. Compute overall Project Defense Readiness Score (FR-044)
  async calculateReadinessScore(projectId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        requirements: { include: { testCases: true } },
        files: true,
        vivaQuestions: { include: { answers: true } },
      },
    });

    if (!project) {
      throw Object.assign(new Error('Project not found'), { status: 404 });
    }

    // A. Requirements Quality Score (20%)
    // Based on requirements count, ratio of approved status, NFR inclusion
    const reqs = project.requirements;
    let reqsScore = 0;
    if (reqs.length > 0) {
      const approvedCount = reqs.filter(r => r.status === 'approved').length;
      const hasNfr = reqs.some(r => r.type === 'non_functional');
      
      const approvedRatio = approvedCount / reqs.length;
      reqsScore = Math.round(
        (approvedRatio * 70) + (hasNfr ? 30 : 0)
      );
    }

    // B. Testing Evidence Score (20%)
    // Based on test cases coverage and passed ratio
    let testingScore = 0;
    const allTestCases = reqs.flatMap(r => r.testCases);
    if (allTestCases.length > 0) {
      const passedTestCases = allTestCases.filter(t => t.status === 'passed').length;
      testingScore = Math.round((passedTestCases / allTestCases.length) * 100);
    }

    // C. Documentation Completeness Score (20%)
    // Proposal, Slides, Report files present
    const uploadedTypes = project.files.map(f => f.fileType.toLowerCase());
    let docScore = 0;
    if (uploadedTypes.includes('proposal')) docScore += 35;
    if (uploadedTypes.includes('report')) docScore += 35;
    if (uploadedTypes.includes('slides')) docScore += 30;

    // D. Architecture Justification Score (15%)
    // Derived from answers in the architecture category, defaults to 70 if not tested
    const archQuestions = project.vivaQuestions.filter(q => q.category === 'architecture');
    const archAnswers = archQuestions.flatMap(q => q.answers);
    let archScore = 70; // default passing grade
    if (archAnswers.length > 0) {
      const sum = archAnswers.reduce((total, a) => total + (a.aiScore || 0), 0);
      archScore = Math.round(sum / archAnswers.length);
    }

    // E. Contribution Fairness Score (15%)
    // Evaluates how even the logs/peer reviews are
    const contrib = await contributionService.calculateContributionScores(projectId);
    let contribScore = 90; // high score if fair
    const imbalanceWarnings = contrib.warnings.filter(w => w.type === 'excessive_load' || w.type === 'low_contribution');
    if (imbalanceWarnings.length > 0) {
      contribScore = Math.max(90 - (imbalanceWarnings.length * 20), 40);
    }

    // F. Viva Practice Performance Score (10%)
    // Average score of all answered questions
    const allAnswers = project.vivaQuestions.flatMap(q => q.answers);
    let vivaPerformanceScore = 0;
    if (allAnswers.length > 0) {
      const sum = allAnswers.reduce((total, a) => total + (a.aiScore || 0), 0);
      vivaPerformanceScore = Math.round(sum / allAnswers.length);
    } else {
      vivaPerformanceScore = 50; // standard baseline
    }

    // Calculate weighted overall score
    const overallScore = Math.round(
      (reqsScore * 0.20) +
      (testingScore * 0.20) +
      (docScore * 0.20) +
      (archScore * 0.15) +
      (contribScore * 0.15) +
      (vivaPerformanceScore * 0.10)
    );

    // Save score to DB
    const savedScore = await prisma.readinessScore.create({
      data: {
        projectId,
        requirementsScore: reqsScore,
        contributionScore: contribScore,
        documentationScore: docScore,
        testingScore,
        vivaScore: vivaPerformanceScore,
        overallScore,
      },
    });

    return savedScore;
  },

  async getLatestReadinessScore(projectId) {
    return prisma.readinessScore.findFirst({
      where: { projectId },
      orderBy: { generatedAt: 'desc' },
    });
  },
};

export default vivaService;
