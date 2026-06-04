import prisma from '../config/db.js';
import { generateStructuredContent } from '../ai/nvidia.js';
import {
  REQUIREMENTS_SYSTEM_INSTRUCTION,
  requirementsGenSchema,
  buildRequirementsGenPrompt,
  acceptanceCriteriaSchema,
  buildAcceptanceCriteriaPrompt,
  testCasesSchema,
  buildTestCasesPrompt,
  refineRequirementSchema,
  buildRefineRequirementPrompt,
  resolveAmbiguitySchema,
  buildResolveAmbiguityPrompt,
} from '../ai/prompts/requirements.js';

export const requirementService = {
  async getByProjectId(projectId) {
    return prisma.requirement.findMany({
      where: { projectId },
      include: {
        acceptanceCriteria: true,
        testCases: true,
        tasks: {
          select: { id: true, title: true, status: true },
        },
      },
      orderBy: { id: 'asc' },
    });
  },

  async getById(id) {
    return prisma.requirement.findUnique({
      where: { id },
      include: {
        acceptanceCriteria: true,
        testCases: true,
      },
    });
  },

  async create(projectId, { type, title, description, priority }) {
    return prisma.requirement.create({
      data: {
        projectId,
        type,
        title,
        description,
        priority: priority || 'medium',
        status: 'draft',
      },
    });
  },

  async update(id, { title, description, priority, status }) {
    return prisma.requirement.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(priority && { priority }),
        ...(status && { status }),
      },
    });
  },

  async delete(id) {
    return prisma.requirement.delete({ where: { id } });
  },

  async deleteMany(ids) {
    return prisma.requirement.deleteMany({
      where: { id: { in: ids } },
    });
  },

  // 1. Convert raw description to complete requirements using NVIDIA AI
  async generateAIRequirements(projectId, rawDescription, demoMode = false) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw Object.assign(new Error('Project not found'), { status: 404 });
    }

    const prompt = buildRequirementsGenPrompt(project.title, rawDescription, project.category);
    
    // Call NVIDIA AI
    const aiResult = await generateStructuredContent(
      prompt,
      requirementsGenSchema,
      REQUIREMENTS_SYSTEM_INSTRUCTION,
      { demoMode }
    );

    // Save generated functional & non-functional requirements to DB
    const savedRequirements = [];

    // Save Functional Requirements
    for (const fr of aiResult.functionalRequirements) {
      const saved = await prisma.requirement.create({
        data: {
          projectId,
          type: 'functional',
          title: fr.title,
          description: fr.description,
          priority: fr.priority.toLowerCase(),
          status: 'draft',
        },
      });
      savedRequirements.push(saved);
    }

    // Save Non-Functional Requirements
    for (const nfr of aiResult.nonFunctionalRequirements) {
      const saved = await prisma.requirement.create({
        data: {
          projectId,
          type: 'non_functional',
          title: nfr.title,
          description: `[Category: ${nfr.category}] ${nfr.description}`,
          priority: nfr.priority.toLowerCase(),
          status: 'draft',
        },
      });
      savedRequirements.push(saved);
    }

    return {
      requirements: savedRequirements,
      ambiguityWarnings: aiResult.ambiguityWarnings,
    };
  },

  // 2. Generate acceptance criteria for a single requirement
  async generateAcceptanceCriteria(requirementId, demoMode = false) {
    const req = await prisma.requirement.findUnique({
      where: { id: requirementId },
    });

    if (!req) {
      throw Object.assign(new Error('Requirement not found'), { status: 404 });
    }

    const prompt = buildAcceptanceCriteriaPrompt(req.title, req.description);
    
    const aiResult = await generateStructuredContent(
      prompt,
      acceptanceCriteriaSchema,
      REQUIREMENTS_SYSTEM_INSTRUCTION,
      { demoMode }
    );

    await prisma.acceptanceCriteria.deleteMany({
      where: { requirementId },
    });

    const savedCriteria = [];
    for (const text of aiResult.criteria) {
      const saved = await prisma.acceptanceCriteria.create({
        data: { requirementId, criteriaText: text },
      });
      savedCriteria.push(saved);
    }

    return savedCriteria;
  },

  // 3. Generate test cases for a single requirement
  async generateTestCases(requirementId, demoMode = false) {
    const req = await prisma.requirement.findUnique({
      where: { id: requirementId },
      include: { acceptanceCriteria: true },
    });

    if (!req) {
      throw Object.assign(new Error('Requirement not found'), { status: 404 });
    }

    const criteriaTexts = req.acceptanceCriteria.map(c => c.criteriaText);
    const prompt = buildTestCasesPrompt(req.title, req.description, criteriaTexts);

    const aiResult = await generateStructuredContent(
      prompt,
      testCasesSchema,
      REQUIREMENTS_SYSTEM_INSTRUCTION,
      { demoMode }
    );

    await prisma.testCase.deleteMany({
      where: { requirementId },
    });

    const savedTestCases = [];
    for (const tc of aiResult.testCases) {
      const saved = await prisma.testCase.create({
        data: {
          requirementId,
          testTitle: tc.testTitle,
          testSteps: tc.testSteps,
          expectedResult: tc.expectedResult,
          status: 'pending',
        },
      });
      savedTestCases.push(saved);
    }

    return savedTestCases;
  },

  // 4. Retrieve complete Traceability Matrix for the project (enriched)
  async getTraceabilityMatrix(projectId) {
    const requirements = await prisma.requirement.findMany({
      where: { projectId },
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        acceptanceCriteria: {
          select: { id: true, criteriaText: true },
        },
        testCases: {
          select: { id: true, testTitle: true, status: true },
        },
        tasks: {
          select: { id: true, title: true, status: true, assignedTo: true },
        },
      },
      orderBy: { id: 'asc' },
    });

    // Enrich with computed stats
    return requirements.map((req) => {
      const criteriaCount = req.acceptanceCriteria.length;
      const testCount = req.testCases.length;
      const passedTests = req.testCases.filter((t) => t.status === 'passed').length;
      const taskCount = req.tasks.length;
      const completedTasks = req.tasks.filter((t) => t.status === 'completed').length;

      return {
        ...req,
        _stats: {
          criteriaCount,
          testCount,
          passedTests,
          testPassRate: testCount > 0 ? Math.round((passedTests / testCount) * 100) : 0,
          testCoverage: criteriaCount > 0 ? Math.round((testCount / criteriaCount) * 100) : 0,
          taskCount,
          completedTasks,
          taskCompletionRate: taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0,
        },
      };
    });
  },

  // 5. AI-assisted refinement for a single requirement
  async refineWithAI(requirementId, guidance, demoMode = false) {
    const req = await prisma.requirement.findUnique({
      where: { id: requirementId },
    });

    if (!req) {
      throw Object.assign(new Error('Requirement not found'), { status: 404 });
    }

    const prompt = buildRefineRequirementPrompt(req.title, req.description, guidance);
    const aiResult = await generateStructuredContent(
      prompt,
      refineRequirementSchema,
      REQUIREMENTS_SYSTEM_INSTRUCTION,
      { demoMode }
    );

    return {
      current: { title: req.title, description: req.description, priority: req.priority },
      suggested: {
        title: aiResult.refinedTitle,
        description: aiResult.refinedDescription,
        priority: aiResult.suggestedPriority?.toLowerCase() || req.priority,
      },
      changes: aiResult.changes,
    };
  },

  // 6. Apply AI refinement suggestion to a requirement
  async applyRefinement(requirementId, { title, description, priority }) {
    return prisma.requirement.update({
      where: { id: requirementId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(priority && { priority }),
      },
    });
  },

  // 7. Resolve ambiguity in a single requirement using AI
  async resolveAmbiguity(requirementId, vagueTerm, suggestion, demoMode = false) {
    const req = await prisma.requirement.findUnique({
      where: { id: requirementId },
    });

    if (!req) {
      throw Object.assign(new Error('Requirement not found'), { status: 404 });
    }

    const prompt = buildResolveAmbiguityPrompt(req.title, req.description, vagueTerm, suggestion);
    const aiResult = await generateStructuredContent(
      prompt,
      resolveAmbiguitySchema,
      REQUIREMENTS_SYSTEM_INSTRUCTION,
      { demoMode }
    );

    // Update the requirement with resolved description
    const updated = await prisma.requirement.update({
      where: { id: requirementId },
      data: { description: aiResult.resolvedDescription },
    });

    return {
      requirement: updated,
      improvements: aiResult.improvements,
    };
  },

  // 8. Bulk operations on requirements
  async bulkOperation(projectId, { action, requirementIds }) {
    switch (action) {
      case 'approve':
        return prisma.requirement.updateMany({
          where: { id: { in: requirementIds }, projectId },
          data: { status: 'approved' },
        });

      case 'reject':
        return prisma.requirement.updateMany({
          where: { id: { in: requirementIds }, projectId },
          data: { status: 'rejected' },
        });

      case 'draft':
        return prisma.requirement.updateMany({
          where: { id: { in: requirementIds }, projectId },
          data: { status: 'draft' },
        });

      case 'delete':
        await prisma.acceptanceCriteria.deleteMany({
          where: { requirementId: { in: requirementIds } },
        });
        await prisma.testCase.deleteMany({
          where: { requirementId: { in: requirementIds } },
        });
        return prisma.requirement.deleteMany({
          where: { id: { in: requirementIds }, projectId },
        });

      case 'generate_criteria':
        for (const rid of requirementIds) {
          await requirementService.generateAcceptanceCriteria(rid);
        }
        return { processed: requirementIds.length };

      case 'generate_tests':
        for (const rid of requirementIds) {
          await requirementService.generateTestCases(rid);
        }
        return { processed: requirementIds.length };

      default:
        throw Object.assign(new Error(`Unknown bulk action: ${action}`), { status: 400 });
    }
  },

  // 9. Workspace summary for dashboard enrichment
  async getWorkspaceSummary(projectId) {
    const [requirements, tasks, files, readiness] = await Promise.all([
      prisma.requirement.findMany({ where: { projectId }, select: { id: true, status: true, type: true, priority: true } }),
      prisma.task.findMany({ where: { projectId }, select: { id: true, status: true, deadline: true } }),
      prisma.file.findMany({ where: { projectId }, select: { id: true, uploadedAt: true } }),
      prisma.readinessScore.findFirst({ where: { projectId }, orderBy: { generatedAt: 'desc' } }),
    ]);

    const approvedCount = requirements.filter((r) => r.status === 'approved').length;
    const functionalCount = requirements.filter((r) => r.type === 'functional').length;
    const nonFunctionalCount = requirements.filter((r) => r.type === 'non_functional').length;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;

    return {
      totalRequirements: requirements.length,
      approvedRequirements: approvedCount,
      approvalRate: requirements.length > 0 ? Math.round((approvedCount / requirements.length) * 100) : 0,
      functionalCount,
      nonFunctionalCount,
      totalTasks,
      completedTasks,
      taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      totalFiles: files.length,
      readinessScore: readiness?.overallScore || null,
      recentUploads: files.slice(-5).reverse(),
    };
  },
};

export default requirementService;
