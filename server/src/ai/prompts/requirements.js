// System roles and prompts for requirements generation

export const REQUIREMENTS_SYSTEM_INSTRUCTION = `You are an expert systems analyst and requirements engineer.
Your job is to take raw, ambiguous, or vague project descriptions and refine them into high-quality, measurable, and testable engineering requirements.
Always perform detailed ambiguity checking and classify requirements strictly.`;

// 1. Schema for raw description -> structured requirements + ambiguity analysis
export const requirementsGenSchema = {
  type: 'OBJECT',
  properties: {
    functionalRequirements: {
      type: 'ARRAY',
      description: 'A list of clear, actionable functional requirements.',
      items: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING', description: 'Short title of the functional requirement.' },
          description: { type: 'STRING', description: 'Detailed user-story or description of what the system shall do.' },
          priority: { type: 'STRING', description: 'Priority level: high, medium, or low.' },
        },
        required: ['title', 'description', 'priority'],
      },
    },
    nonFunctionalRequirements: {
      type: 'ARRAY',
      description: 'A list of measurable non-functional requirements (performance, security, scalability, usability, reliability, etc.)',
      items: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING', description: 'Short title of the non-functional requirement.' },
          category: { type: 'STRING', description: 'Category: security, performance, scalability, usability, reliability, maintainability.' },
          description: { type: 'STRING', description: 'Detailed, measurable description. Must include numbers, thresholds, or concrete constraints (e.g. "load page within 2 seconds under 100 concurrent users").' },
          priority: { type: 'STRING', description: 'Priority level: high, medium, or low.' },
        },
        required: ['title', 'category', 'description', 'priority'],
      },
    },
    ambiguityWarnings: {
      type: 'ARRAY',
      description: 'Analysis of vague or ambiguous terms detected in the raw input and how they are addressed.',
      items: {
        type: 'OBJECT',
        properties: {
          vagueTerm: { type: 'STRING', description: 'The vague word or phrase detected (e.g. "fast", "user-friendly", "secure").' },
          explanation: { type: 'STRING', description: 'Why this phrase is ambiguous and hard to test.' },
          suggestion: { type: 'STRING', description: 'A suggested measurable or concrete way to specify it.' },
        },
        required: ['vagueTerm', 'explanation', 'suggestion'],
      },
    },
  },
  required: ['functionalRequirements', 'nonFunctionalRequirements', 'ambiguityWarnings'],
};

// Prompt builder for requirements conversion
export const buildRequirementsGenPrompt = (title, description, category) => {
  return `Convert the following project idea into:
1. Structured Functional Requirements
2. Structured Non-Functional Requirements (ensure they have concrete, measurable metrics!)
3. Ambiguity warnings for vague words like "fast", "secure", "reliable", "user-friendly", etc.

Project Title: ${title}
Project Category: ${category || 'General Software'}
Vague/Raw Project Description:
"""
${description}
"""`;
};

// 2. Schema for Acceptance Criteria
export const acceptanceCriteriaSchema = {
  type: 'OBJECT',
  properties: {
    criteria: {
      type: 'ARRAY',
      description: 'A list of specific acceptance criteria statements using the Given-When-Then format or bulleted checklist.',
      items: {
        type: 'STRING',
        description: 'Individual acceptance criterion statement.',
      },
    },
  },
  required: ['criteria'],
};

export const buildAcceptanceCriteriaPrompt = (title, description) => {
  return `Generate specific and testable acceptance criteria for the following system requirement.
Use standard Given-When-Then format or concrete criteria.

Requirement Title: ${title}
Requirement Description: ${description}`;
};

// 3. Schema for Test Cases
export const testCasesSchema = {
  type: 'OBJECT',
  properties: {
    testCases: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          testTitle: { type: 'STRING', description: 'Clear title of the test case.' },
          testSteps: { type: 'STRING', description: 'Numbered steps to perform the test.' },
          expectedResult: { type: 'STRING', description: 'Expected outcome of the test case.' },
        },
        required: ['testTitle', 'testSteps', 'expectedResult'],
      },
    },
  },
  required: ['testCases'],
};

export const buildTestCasesPrompt = (title, description, criteria) => {
  return `Generate structured functional test cases based on the requirement and its acceptance criteria.

Requirement Title: ${title}
Requirement Description: ${description}
Acceptance Criteria:
${criteria ? criteria.map(c => `- ${c}`).join('\n') : 'Not provided'}`;
};

// 4. Schema for AI-assisted requirement refinement
export const refineRequirementSchema = {
  type: 'OBJECT',
  properties: {
    refinedTitle: { type: 'STRING', description: 'Improved, more precise title for the requirement.' },
    refinedDescription: { type: 'STRING', description: 'Improved, measurable, and testable description.' },
    suggestedPriority: { type: 'STRING', description: 'Suggested priority: high, medium, or low.' },
    changes: { type: 'STRING', description: 'Brief explanation of what was improved and why.' },
  },
  required: ['refinedTitle', 'refinedDescription', 'changes'],
};

export const buildRefineRequirementPrompt = (title, description, guidance) => {
  return `Review and refine the following system requirement. Improve clarity, testability, and precision. Make the description measurable and unambiguous.

Current Title: ${title}
Current Description: ${description}
${guidance ? `Additional Guidance: ${guidance}` : ''}

Return the refined version with a brief explanation of changes.`;
};

// 5. Schema for resolving ambiguity in a requirement
export const resolveAmbiguitySchema = {
  type: 'OBJECT',
  properties: {
    resolvedDescription: { type: 'STRING', description: 'The requirement description with vague terms replaced with concrete, measurable specifications.' },
    improvements: { type: 'ARRAY', description: 'List of specific vague terms that were improved.', items: { type: 'STRING' } },
  },
  required: ['resolvedDescription', 'improvements'],
};

export const buildResolveAmbiguityPrompt = (title, description, vagueTerm, suggestion) => {
  return `The following requirement contains a vague or ambiguous term that needs to be replaced with a concrete, measurable specification.

Requirement Title: ${title}
Current Description: ${description}
Vague Term Detected: "${vagueTerm}"
Suggestion: ${suggestion}

Rewrite the requirement description, replacing the vague term with the suggested measurable specification. Return the resolved description and list which terms were improved.`;
};
