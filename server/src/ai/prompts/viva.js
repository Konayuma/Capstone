export const VIVA_SYSTEM_INSTRUCTION = `You are a strict, veteran university software project examiner and panel chair.
Your role is to drill students during project defense, test their deep technical knowledge, ensure they actually wrote the system themselves, and evaluate if the project is ready for production.
Maintain an professional, challenging, yet constructive academic tone.`;

// 1. Schema for Generating Viva Questions
export const vivaQuestionsSchema = {
  type: 'OBJECT',
  properties: {
    questions: {
      type: 'ARRAY',
      description: 'A list of academic examiner-style defense questions.',
      items: {
        type: 'OBJECT',
        properties: {
          category: {
            type: 'STRING',
            description: 'One of: requirements, architecture, database, testing, security, scalability, contribution, originality, limitations, future_work',
          },
          difficulty: {
            type: 'STRING',
            description: 'One of: basic, intermediate, advanced, brutal',
          },
          questionText: { type: 'STRING', description: 'The question asked to the student.' },
          suggestedAnswer: { type: 'STRING', description: 'High-level bulleted outline of what a strong answer should cover (tech terms, architectural justifications, etc).' },
        },
        required: ['category', 'difficulty', 'questionText', 'suggestedAnswer'],
      },
    },
  },
  required: ['questions'],
};

export const buildVivaGenPrompt = (title, description, requirements, members, taskStats) => {
  return `Generate exactly 8 examiner-style viva defense questions based on the following project context.
Distribute the questions across basic, intermediate, advanced, and brutal difficulties.
Make sure the questions cover diverse categories (e.g. database choices, security, architecture, testing, and individual contribution limits).

Project Title: ${title}
Project Scope Description:
"""
${description}
"""

Requirements Drafted:
${requirements ? requirements.map(r => `[${r.type}] ${r.title}: ${r.description}`).join('\n') : 'None'}

Group Members & Contribution Overview:
${members ? members.map(m => `- ${m.name} (${m.role}): completed tasks status ${m.metrics.completedTasks}`).join('\n') : 'Not provided'}

Task and Evidence Metrics:
${taskStats || 'None'}`;
};

// 2. Schema for Evaluating a Student's Viva Answer
export const vivaEvaluationSchema = {
  type: 'OBJECT',
  properties: {
    score: { type: 'NUMBER', description: 'Grade out of 100 representing overall answer quality.' },
    clarity: { type: 'STRING', description: 'Evaluation of expression, structure, and communication. (e.g. strong, moderate, weak)' },
    correctness: { type: 'STRING', description: 'Correctness of technical concepts mentioned. (e.g. accurate, minor errors, inaccurate)' },
    technicalDepth: { type: 'STRING', description: 'Depth of engineering justification and principles referenced. (e.g. deep, superficial, missing)' },
    confidence: { type: 'STRING', description: 'Estimated confidence level in answering. (e.g. confident, tentative, defensive)' },
    feedback: { type: 'STRING', description: 'Concrete constructive criticisms, what concepts the student missed, and how to improve this answer for a real panel defense.' },
  },
  required: ['score', 'clarity', 'correctness', 'technicalDepth', 'confidence', 'feedback'],
};

export const buildVivaEvaluationPrompt = (question, suggestedGuide, studentAnswer) => {
  return `Act as the final viva examiner and evaluate this student's response to the defense question.
Be rigorous, point out conceptual errors, assess technical depth, and grade objectively.

Viva Question:
"${question}"

Suggested Answer Guide:
"${suggestedGuide}"

Student's Submitted Answer:
"""
${studentAnswer}
"""`;
};
