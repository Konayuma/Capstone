import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with Capstone Studio demo data...');

  const salt = await bcrypt.genSalt(10);
  const demoHash = await bcrypt.hash('demo123456', salt);

  // 1. Create demo users
  const demoStudent = await prisma.user.upsert({
    where: { email: 'demo@capstonestudio.ai' },
    update: {},
    create: {
      name: 'Demo Student',
      email: 'demo@capstonestudio.ai',
      passwordHash: demoHash,
      role: 'student',
    },
  });
  console.log(`- Created Demo Student: ${demoStudent.email}`);

  const teamMember1 = await prisma.user.upsert({
    where: { email: 'alice@capstonestudio.ai' },
    update: {},
    create: {
      name: 'Alice Mwale',
      email: 'alice@capstonestudio.ai',
      passwordHash: demoHash,
      role: 'student',
    },
  });
  console.log(`- Created Team Member: ${teamMember1.email}`);

  const teamMember2 = await prisma.user.upsert({
    where: { email: 'brian@capstonestudio.ai' },
    update: {},
    create: {
      name: 'Brian Zulu',
      email: 'brian@capstonestudio.ai',
      passwordHash: demoHash,
      role: 'student',
    },
  });
  console.log(`- Created Team Member: ${teamMember2.email}`);

  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@capstonestudio.ai' },
    update: {},
    create: {
      name: 'Dr. Catherine Phiri',
      email: 'supervisor@capstonestudio.ai',
      passwordHash: demoHash,
      role: 'supervisor',
    },
  });
  console.log(`- Created Supervisor: ${supervisor.email}`);

  // 2. Create demo project
  const project = await prisma.project.create({
    data: {
      title: 'Capstone Studio',
      description: 'An AI-powered capstone project supervision platform that helps student teams convert vague project ideas into structured requirements, track team contributions, practice viva defense questions, and assess readiness for final presentations.',
      category: 'EdTech & AI',
      department: 'Computer Science',
      academicYear: '2025/2026',
      status: 'active',
      createdBy: demoStudent.id,
      supervisorId: supervisor.id,
      members: {
        createMany: {
          data: [
            { userId: demoStudent.id, isLeader: true, projectRole: 'project_manager' },
            { userId: teamMember1.id, isLeader: false, projectRole: 'frontend_dev' },
            { userId: teamMember2.id, isLeader: false, projectRole: 'backend_dev' },
            { userId: supervisor.id, isLeader: false, projectRole: 'supervisor' },
          ],
        },
      },
    },
  });
  console.log(`- Created Project: "${project.title}"`);

  // 3. Create requirements with acceptance criteria and test cases
  const req1 = await prisma.requirement.create({
    data: {
      projectId: project.id,
      type: 'functional',
      title: 'User Authentication & Role Management',
      description: 'The system shall authenticate users via email and password using bcrypt hashing. JWT tokens with 7-day expiry shall enforce role-based access for students, supervisors, and admins.',
      priority: 'high',
      status: 'approved',
    },
  });

  const req2 = await prisma.requirement.create({
    data: {
      projectId: project.id,
      type: 'functional',
      title: 'AI-Powered Requirements Generation',
      description: 'Users shall input a vague project description and receive structured functional and non-functional requirements with ambiguity warnings for vague terms like "fast", "secure", "user-friendly".',
      priority: 'high',
      status: 'approved',
    },
  });

  const req3 = await prisma.requirement.create({
    data: {
      projectId: project.id,
      type: 'functional',
      title: 'Task Assignment with Evidence Tracking',
      description: 'Team leaders assign tasks with priority levels and deadlines. Members upload screenshots or code as evidence upon completion.',
      priority: 'medium',
      status: 'approved',
    },
  });

  const req4 = await prisma.requirement.create({
    data: {
      projectId: project.id,
      type: 'functional',
      title: 'Peer Review & Contribution Scoring',
      description: 'Members submit peer reviews across 5 dimensions. Weighted algorithm computes contribution scores and detects imbalances.',
      priority: 'medium',
      status: 'draft',
    },
  });

  const req5 = await prisma.requirement.create({
    data: {
      projectId: project.id,
      type: 'non_functional',
      title: 'Page Load Performance',
      description: '[Category: performance] The application shall load initial page content within 2 seconds (FCP) on a simulated 4G network for 90% of page requests.',
      priority: 'high',
      status: 'approved',
    },
  });

  const req6 = await prisma.requirement.create({
    data: {
      projectId: project.id,
      type: 'non_functional',
      title: 'Concurrent User Support',
      description: '[Category: performance] The platform shall support 50 concurrent users without degrading response time beyond 3 seconds for API requests.',
      priority: 'medium',
      status: 'approved',
    },
  });

  // Acceptance criteria
  await prisma.acceptanceCriteria.createMany({
    data: [
      { requirementId: req1.id, criteriaText: 'Given a registered user, when they enter their email and correct password, then the system shall redirect them to the dashboard within 2 seconds.' },
      { requirementId: req1.id, criteriaText: 'Given a registered user, when they enter an incorrect password, then the system shall display "Invalid email or password".' },
      { requirementId: req2.id, criteriaText: 'Given a user on the requirements page, when they enter a vague project description and click "Generate", then the system shall display structured functional requirements within 10 seconds.' },
      { requirementId: req2.id, criteriaText: 'Given generated requirements, when the AI detects ambiguous terms, then the system shall display an ambiguity warnings section with suggested replacements.' },
      { requirementId: req5.id, criteriaText: 'Given a Lighthouse audit on a simulated 4G connection, when the homepage loads, then FCP shall be under 2 seconds and LCP under 3 seconds.' },
    ],
  });

  // Test cases
  await prisma.testCase.createMany({
    data: [
      { requirementId: req1.id, testTitle: 'Successful login with valid credentials', testSteps: '1. Navigate to /login\n2. Enter demo@capstonestudio.ai\n3. Enter demo123456\n4. Click Sign In', expectedResult: 'User redirected to /dashboard. Token stored in localStorage.', status: 'passed' },
      { requirementId: req1.id, testTitle: 'Login failure with invalid password', testSteps: '1. Navigate to /login\n2. Enter valid email\n3. Enter wrong password\n4. Click Sign In', expectedResult: 'Error toast: "Invalid credentials".', status: 'passed' },
      { requirementId: req2.id, testTitle: 'Generate requirements from vague input', testSteps: '1. Navigate to project requirements\n2. Click "Generate with AI"\n3. Enter "Build a student management system"\n4. Submit', expectedResult: '6+ functional and 4+ non-functional requirements displayed with ambiguity warnings.', status: 'passed' },
      { requirementId: req5.id, testTitle: 'Performance baseline audit', testSteps: '1. Run Lighthouse from Chrome DevTools\n2. Set network to "Fast 4G"\n3. Run report', expectedResult: 'Performance score above 80. FCP under 2s.', status: 'pending' },
    ],
  });

  console.log('- Created 6 requirements with criteria and test cases');

  // 4. Create tasks
  await prisma.task.createMany({
    data: [
      { projectId: project.id, assignedTo: demoStudent.id, title: 'Design database schema for users & projects', description: 'Create Prisma schema with User, Project, Requirement, Task, and PeerReview models.', priority: 'high', status: 'completed', completedAt: new Date(Date.now() - 14 * 86400000), requirementId: req1.id },
      { projectId: project.id, assignedTo: teamMember1.id, title: 'Build landing page and auth UI', description: 'Implement the landing page, login, and registration forms with form validation.', priority: 'high', status: 'completed', completedAt: new Date(Date.now() - 10 * 86400000), requirementId: req1.id },
      { projectId: project.id, assignedTo: teamMember2.id, title: 'Implement JWT authentication middleware', description: 'Create Express middleware for JWT verification, role-based auth, and project access control.', priority: 'high', status: 'completed', completedAt: new Date(Date.now() - 8 * 86400000), requirementId: req1.id },
      { projectId: project.id, assignedTo: demoStudent.id, title: 'AI requirements generation module', description: 'Integrate NVIDIA AI API to convert vague descriptions into structured requirements with ambiguity detection.', priority: 'high', status: 'completed', completedAt: new Date(Date.now() - 5 * 86400000), requirementId: req2.id },
      { projectId: project.id, assignedTo: teamMember1.id, title: 'Build requirements workspace UI', description: 'Create the requirements page with AI generation button, requirement cards, bulk operations, and status management.', priority: 'medium', status: 'completed', completedAt: new Date(Date.now() - 3 * 86400000), requirementId: req2.id },
      { projectId: project.id, assignedTo: teamMember2.id, title: 'Implement contribution scoring algorithm', description: 'Build weighted scoring: tasks (30%), evidence (20%), logs (15%), peer reviews (15%), deadlines (10%), supervisor (10%). Include anomaly detection.', priority: 'medium', status: 'in_progress', requirementId: req4.id },
      { projectId: project.id, assignedTo: teamMember1.id, title: 'Build viva practice UI', description: 'Create the viva practice page with question sidebar, answer submission, and AI feedback display.', priority: 'medium', status: 'in_progress', requirementId: req3.id },
      { projectId: project.id, assignedTo: teamMember2.id, title: 'Performance optimization for page loads', description: 'Implement code splitting, lazy loading, and optimize API response times to meet FCP targets.', priority: 'low', status: 'todo', requirementId: req5.id },
      { projectId: project.id, assignedTo: demoStudent.id, title: 'Write project documentation', description: 'Complete README, API docs, and deployment guide.', priority: 'medium', status: 'review', requirementId: req6.id },
      { projectId: project.id, assignedTo: teamMember2.id, title: 'Set up CI/CD pipeline', description: 'Configure GitHub Actions for automated testing and deployment.', priority: 'low', status: 'todo', requirementId: req6.id },
    ],
  });
  console.log('- Created 10 tasks');

  // 5. Create task evidence
  const task1 = await prisma.task.findFirst({ where: { title: 'Design database schema for users & projects' } });
  const task3 = await prisma.task.findFirst({ where: { title: 'Implement JWT authentication middleware' } });
  const task4 = await prisma.task.findFirst({ where: { title: 'AI requirements generation module' } });

  if (task1) {
    await prisma.taskEvidence.create({
      data: { taskId: task1.id, note: 'schema.prisma file with all 14 models including User, Project, Requirement, Task, PeerReview, VivaQuestion, etc.' },
    });
  }
  if (task3) {
    await prisma.taskEvidence.create({
      data: { taskId: task3.id, note: 'auth.js middleware — JWT verification, authorize.js — role checks, projectAccess.js — membership checks.' },
    });
  }
  if (task4) {
    await prisma.taskEvidence.create({
      data: { taskId: task4.id, note: 'nvidia.js — OpenAI client with retry logic and streaming. Prompts for requirements and viva generation.' },
    });
  }
  console.log('- Created task evidence entries');

  // 6. Progress logs
  await prisma.progressLog.createMany({
    data: [
      { projectId: project.id, userId: demoStudent.id, logText: 'Week 1: Set up project repository, initialized Prisma schema with User and Project models, and configured Express server with middleware stack.', weekNumber: 1 },
      { projectId: project.id, userId: teamMember1.id, logText: 'Week 1: Created React app with Vite, set up routing with React Router, designed landing page and auth pages.', weekNumber: 1 },
      { projectId: project.id, userId: teamMember2.id, logText: 'Week 1: Installed and configured Express, set up Prisma ORM with PostgreSQL connection, created auth routes.', weekNumber: 1 },
      { projectId: project.id, userId: demoStudent.id, logText: 'Week 2: Completed the entire requirements module — AI generation service, CRUD operations, and traceability matrix.', weekNumber: 2 },
      { projectId: project.id, userId: teamMember1.id, logText: 'Week 2: Built the requirements workspace UI with generation, editing, bulk operations, and status management.', weekNumber: 2 },
      { projectId: project.id, userId: teamMember2.id, logText: 'Week 2: Implemented task management API with full CRUD, status transitions, and evidence upload support.', weekNumber: 2 },
      { projectId: project.id, userId: demoStudent.id, logText: 'Week 3: Implemented viva practice module — question generation via AI, answer evaluation with scoring, readiness score calculation.', weekNumber: 3 },
      { projectId: project.id, userId: teamMember1.id, logText: 'Week 3: Built the contribution tracking section with charts, peer review forms, and imbalance warning cards.', weekNumber: 3 },
    ],
  });
  console.log('- Created 8 progress logs');

  // 7. Peer reviews
  await prisma.peerReview.createMany({
    data: [
      { projectId: project.id, reviewerId: teamMember1.id, reviewedUserId: demoStudent.id, reliability: 5, technicalContribution: 5, communication: 4, meetingAttendance: 5, documentationContribution: 4, overallRating: 5, comment: 'Great leadership and technical direction. Always available for questions.' },
      { projectId: project.id, reviewerId: teamMember2.id, reviewedUserId: demoStudent.id, reliability: 4, technicalContribution: 5, communication: 4, meetingAttendance: 5, documentationContribution: 5, overallRating: 5, comment: 'Strong architectural decisions and thorough documentation.' },
      { projectId: project.id, reviewerId: demoStudent.id, reviewedUserId: teamMember1.id, reliability: 5, technicalContribution: 4, communication: 5, meetingAttendance: 4, documentationContribution: 5, overallRating: 5, comment: 'Excellent frontend work and great communication with the team.' },
      { projectId: project.id, reviewerId: teamMember2.id, reviewedUserId: teamMember1.id, reliability: 4, technicalContribution: 4, communication: 5, meetingAttendance: 4, documentationContribution: 4, overallRating: 4, comment: 'Clean UI implementation and responsive design.' },
      { projectId: project.id, reviewerId: demoStudent.id, reviewedUserId: teamMember2.id, reliability: 4, technicalContribution: 5, communication: 3, meetingAttendance: 4, documentationContribution: 4, overallRating: 4, comment: 'Strong backend skills but could improve async communication.' },
      { projectId: project.id, reviewerId: teamMember1.id, reviewedUserId: teamMember2.id, reliability: 4, technicalContribution: 5, communication: 3, meetingAttendance: 5, documentationContribution: 3, overallRating: 4, comment: 'Solid backend implementation. Please document API endpoints more thoroughly.' },
    ],
  });
  console.log('- Created 6 peer reviews');

  // 8. Viva questions with answers
  const viva1 = await prisma.vivaQuestion.create({
    data: {
      projectId: project.id,
      category: 'requirements',
      difficulty: 'basic',
      questionText: 'Can you walk us through the process your team used to gather and refine the requirements for this project? Which requirements changed the most from your initial proposal, and why?',
      suggestedAnswer: 'The team conducted stakeholder interviews and used the platform\'s AI-assisted requirements tool to refine vague ideas into testable specifications. The authentication module saw the most changes because initial assumptions about role hierarchy were too simplistic.',
    },
  });

  const viva2 = await prisma.vivaQuestion.create({
    data: {
      projectId: project.id,
      category: 'architecture',
      difficulty: 'intermediate',
      questionText: 'Your architecture uses React on the frontend and Express on the backend. Walk us through a complete data flow — from the user clicking a button to data being persisted and back.',
      suggestedAnswer: 'React component dispatches Axios call to Express API → Express controller validates with Zod → Prisma ORM translates to PostgreSQL query → response flows back through the same chain.',
    },
  });

  const viva3 = await prisma.vivaQuestion.create({
    data: {
      projectId: project.id,
      category: 'database',
      difficulty: 'advanced',
      questionText: 'The schema uses composite unique constraints on peer reviews and team members. Explain why you chose these constraints and how they prevent data corruption.',
      suggestedAnswer: 'The composite unique on projectId+reviewerId+reviewedUserId ensures one review per reviewer per team member, preventing duplicate submissions that could unfairly weight contribution scores.',
    },
  });

  const viva4 = await prisma.vivaQuestion.create({
    data: {
      projectId: project.id,
      category: 'testing',
      difficulty: 'basic',
      questionText: 'How did you test the contribution scoring algorithm? What test cases did you write to verify that the weighted calculations are correct?',
      suggestedAnswer: 'We used unit tests with known inputs: tasks (30%), evidence (20%), logs (15%), peer reviews (15%), deadlines (10%), supervisor (10%). Test cases included edge cases like zero tasks and max peer review scores.',
    },
  });

  const viva5 = await prisma.vivaQuestion.create({
    data: {
      projectId: project.id,
      category: 'security',
      difficulty: 'intermediate',
      questionText: 'What security measures does your system have in place to protect student data and prevent unauthorized access to project workspaces?',
      suggestedAnswer: 'Three tiers: JWT authentication, role-based authorization middleware, and project access middleware. Additional measures: bcrypt hashing, Helmet HTTP headers, CORS whitelisting, rate limiting.',
    },
  });

  const viva6 = await prisma.vivaQuestion.create({
    data: {
      projectId: project.id,
      category: 'contribution',
      difficulty: 'brutal',
      questionText: 'Your contribution algorithm gives a default supervisor score of 85 if no supervisor feedback exists. Defend this design decision. How does this not artificially inflate contributions of unsupervised students?',
      suggestedAnswer: 'The 85-point default is a conservative baseline assuming average performance. It prevents penalizing students whose supervisors are not using the platform. The score can only decrease if imbalance warnings are detected.',
    },
  });

  // Answers for some questions
  await prisma.vivaAnswer.create({
    data: {
      questionId: viva1.id,
      userId: demoStudent.id,
      answerText: 'We started by identifying the core problem: supervisors struggle to track student contributions and students struggle to prepare for viva defense. We interviewed 3 supervisors and 10 students to understand pain points. The requirements changed significantly when we realized that peer review data needed to be structured (5 dimensions with ratings) rather than free-text comments, because the contribution scoring algorithm needed quantifiable inputs.',
      aiScore: 85,
      aiFeedback: 'Clarity: strong. Correctness: accurate. Depth: deep. Confidence: confident.\nFeedback: Excellent answer that demonstrates genuine engagement with the requirements process. You clearly differentiated between initial assumptions and the refined understanding after stakeholder interviews. The mention of the 5-dimension peer review structure shows you thought deeply about the data model implications.',
    },
  });

  await prisma.vivaAnswer.create({
    data: {
      questionId: viva2.id,
      userId: demoStudent.id,
      answerText: 'When a user clicks a button (like "Generate Requirements"), the React component dispatches an Axios POST request to the Express API. The request passes through the Vite proxy to localhost:5000. Express middleware authenticates the JWT, then the controller validates the request body with Zod. The service layer calls the NVIDIA AI API, processes the response, saves requirements to PostgreSQL via Prisma, and returns the result back through the chain to the React component which re-renders with the new data.',
      aiScore: 78,
      aiFeedback: 'Clarity: strong. Correctness: accurate. Depth: superficial. Confidence: confident.\nFeedback: Your answer demonstrates a solid grasp of the standard architecture pattern, but you fall short of explaining why React and Express were chosen over alternatives. The examiner would expect you to justify technology choices (e.g., React for component reusability vs. Vue or Svelte, Express for middleware ecosystem vs. Fastify or Hono).',
    },
  });

  console.log('- Created 6 viva questions with 2 sample answers');

  // 9. Readiness score
  await prisma.readinessScore.create({
    data: {
      projectId: project.id,
      requirementsScore: 78,
      contributionScore: 75,
      documentationScore: 65,
      testingScore: 60,
      vivaScore: 72,
      overallScore: 70,
    },
  });
  console.log('- Created readiness score (70% — Moderate Readiness)');

  // 10. Supervisor comments
  await prisma.supervisorComment.createMany({
    data: [
      { projectId: project.id, userId: supervisor.id, targetType: 'requirement', targetId: req2.id, commentText: 'The AI requirements generation looks solid. Make sure the ambiguity detection covers domain-specific jargon, not just generic vague terms.' },
      { projectId: project.id, userId: supervisor.id, targetType: 'requirement', targetId: req4.id, commentText: 'The peer review dimensions are appropriate. Consider adding a "conflict resolution" mechanism for when team members disagree on ratings.' },
      { projectId: project.id, userId: supervisor.id, targetType: 'contribution', commentText: 'Good progress overall. The contribution distribution looks fair. Brian should focus on completing the CI/CD pipeline this week.' },
    ],
  });
  console.log('- Created 3 supervisor comments');

  // 11. Sample file records
  await prisma.file.createMany({
    data: [
      { projectId: project.id, uploadedBy: demoStudent.id, fileName: 'Capstone_Studio_Proposal.pdf', filePath: '/uploads/demo/proposal.pdf', fileType: 'proposal', mimeType: 'application/pdf', size: 2450000 },
      { projectId: project.id, uploadedBy: teamMember1.id, fileName: 'System_Architecture_Diagram.png', filePath: '/uploads/demo/architecture.png', fileType: 'diagram', mimeType: 'image/png', size: 890000 },
      { projectId: project.id, uploadedBy: teamMember2.id, fileName: 'Database_Schema_ERD.png', filePath: '/uploads/demo/erd.png', fileType: 'diagram', mimeType: 'image/png', size: 520000 },
      { projectId: project.id, uploadedBy: demoStudent.id, fileName: 'Sprint_1_Review_Slides.pptx', filePath: '/uploads/demo/slides.pptx', fileType: 'slides', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', size: 3100000 },
    ],
  });
  console.log('- Created 4 sample file records');

  // 12. Team invite
  await prisma.teamInvite.create({
    data: {
      projectId: project.id,
      code: 'DEMO2025',
      createdBy: demoStudent.id,
      expiresAt: new Date(Date.now() + 30 * 86400000),
    },
  });
  console.log('- Created team invite code: DEMO2025');

  console.log('\nDemo seed completed successfully!');
  console.log('Login credentials:');
  console.log('  Email: demo@capstonestudio.ai');
  console.log('  Password: demo123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
