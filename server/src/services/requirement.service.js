import prisma from '../config/db.js';
import { generateStructuredContent } from '../ai/gemini.js';
import {
  REQUIREMENTS_SYSTEM_INSTRUCTION,
  requirementsGenSchema,
  buildRequirementsGenPrompt,
  acceptanceCriteriaSchema,
  buildAcceptanceCriteriaPrompt,
  testCasesSchema,
  buildTestCasesPrompt,
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
        ...(title && { title }),
        ...(description && { description }),
        ...(priority && { priority }),
        ...(status && { status }),
      },
    });
  },

  async delete(id) {
    return prisma.requirement.delete({ where: { id } });
  },

  // 1. Convert raw description to complete requirements using Gemini
  async generateAIRequirements(projectId, rawDescription) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw Object.assign(new Error('Project not found'), { status: 404 });
    }

    const prompt = buildRequirementsGenPrompt(project.title, rawDescription, project.category);
    
    // Call Gemini
    const aiResult = await generateStructuredContent(
      prompt,
      requirementsGenSchema,
      REQUIREMENTS_SYSTEM_INSTRUCTION
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

    // Return the response containing saved items and raw ambiguity warnings
    return {
      requirements: savedRequirements,
      ambiguityWarnings: aiResult.ambiguityWarnings,
    };
  },

  // 2. Generate acceptance criteria for a single requirement
  async generateAcceptanceCriteria(requirementId) {
    const req = await prisma.requirement.findUnique({
      where: { id: requirementId },
    });

    if (!req) {
      throw Object.assign(new Error('Requirement not found'), { status: 404 });
    }

    const prompt = buildAcceptanceCriteriaPrompt(req.title, req.description);
    
    // Call Gemini
    const aiResult = await generateStructuredContent(
      prompt,
      acceptanceCriteriaSchema,
      REQUIREMENTS_SYSTEM_INSTRUCTION
    );

    // Remove existing criteria first to refresh
    await prisma.acceptanceCriteria.deleteMany({
      where: { requirementId },
    });

    // Save new criteria
    const savedCriteria = [];
    for (const text of aiResult.criteria) {
      const saved = await prisma.acceptanceCriteria.create({
        data: {
          requirementId,
          criteriaText: text,
        },
      });
      savedCriteria.push(saved);
    }

    return savedCriteria;
  },

  // 3. Generate test cases for a single requirement
  async generateTestCases(requirementId) {
    const req = await prisma.requirement.findUnique({
      where: { id: requirementId },
      include: { acceptanceCriteria: true },
    });

    if (!req) {
      throw Object.assign(new Error('Requirement not found'), { status: 404 });
    }

    const criteriaTexts = req.acceptanceCriteria.map(c => c.criteriaText);
    const prompt = buildTestCasesPrompt(req.title, req.description, criteriaTexts);

    // Call Gemini
    const aiResult = await generateStructuredContent(
      prompt,
      testCasesSchema,
      REQUIREMENTS_SYSTEM_INSTRUCTION
    );

    // Delete existing test cases first to refresh
    await prisma.testCase.deleteMany({
      where: { requirementId },
    });

    // Save new test cases
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

  // 4. Retrieve complete Traceability Matrix for the project
  async getTraceabilityMatrix(projectId) {
    return prisma.requirement.findMany({
      where: { projectId },
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        acceptanceCriteria: {
          select: {
            id: true,
            criteriaText: true,
          },
        },
        testCases: {
          select: {
            id: true,
            testTitle: true,
            status: true,
          },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            assignedTo: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });
  },
};

export default requirementService;
