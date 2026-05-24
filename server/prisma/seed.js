import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with default CapstoneGuard AI accounts...');

  // 1. Password hash
  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('admin123', salt);
  const supervisorHash = await bcrypt.hash('super123', salt);
  const student1Hash = await bcrypt.hash('student123', salt);
  const student2Hash = await bcrypt.hash('student123', salt);

  // 2. Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@capstoneguard.ai' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@capstoneguard.ai',
      passwordHash: adminHash,
      role: 'admin',
    },
  });
  console.log(`- Created Admin: ${admin.email}`);

  // 3. Create Supervisor
  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@university.edu' },
    update: {},
    create: {
      name: 'Dr. Jane Smith',
      email: 'supervisor@university.edu',
      passwordHash: supervisorHash,
      role: 'supervisor',
    },
  });
  console.log(`- Created Supervisor: ${supervisor.email}`);

  // 4. Create Students
  const student1 = await prisma.user.upsert({
    where: { email: 'sepo@student.com' },
    update: {},
    create: {
      name: 'Sepo Konayuma',
      email: 'sepo@student.com',
      passwordHash: student1Hash,
      role: 'student',
    },
  });
  console.log(`- Created Student 1 (Group Leader): ${student1.email}`);

  const student2 = await prisma.user.upsert({
    where: { email: 'naomi@student.com' },
    update: {},
    create: {
      name: 'Naomi Banda',
      email: 'naomi@student.com',
      passwordHash: student2Hash,
      role: 'student',
    },
  });
  console.log(`- Created Student 2 (Developer): ${student2.email}`);

  // 5. Create Project Workspace
  const project = await prisma.project.create({
    data: {
      title: 'Decentralized Crop Insurance Platform',
      description: 'An automated, smart-contract based agriculture insurance system utilizing weather APIs to pay farmers on extreme climate occurrences.',
      category: 'Blockchain & Agriculture',
      department: 'Computer Science',
      academicYear: '2025/2026',
      status: 'active',
      createdBy: student1.id,
      supervisorId: supervisor.id,
      members: {
        createMany: {
          data: [
            { userId: student1.id, isLeader: true, projectRole: 'project_manager' },
            { userId: student2.id, isLeader: false, projectRole: 'backend_dev' },
          ],
        },
      },
    },
  });
  console.log(`- Created Project Workspace: "${project.title}"`);

  // 6. Create Vague Requirements to showcase AI improvement
  const req1 = await prisma.requirement.create({
    data: {
      projectId: project.id,
      type: 'functional',
      title: 'User Login',
      description: 'The system must allow users to log in securely and easily.',
      priority: 'high',
      status: 'approved',
    },
  });

  const req2 = await prisma.requirement.create({
    data: {
      projectId: project.id,
      type: 'non_functional',
      title: 'System Performance',
      description: 'The platform must load really fast under stress.',
      priority: 'high',
      status: 'draft',
    },
  });
  console.log(`- Created 2 mock requirements`);

  // 7. Create some tasks to showcase contribution scoring
  await prisma.task.createMany({
    data: [
      {
        projectId: project.id,
        assignedTo: student1.id,
        title: 'Draft Project Proposal Document',
        description: 'Complete proposal report draft and submit for supervisor approval.',
        priority: 'high',
        status: 'completed',
        completedAt: new Date(),
        requirementId: req1.id,
      },
      {
        projectId: project.id,
        assignedTo: student2.id,
        title: 'Setup PostgreSQL Database Schema',
        description: 'Configure Prisma models and build initialization migration scripts.',
        priority: 'medium',
        status: 'completed',
        completedAt: new Date(),
        requirementId: req2.id,
      },
      {
        projectId: project.id,
        assignedTo: student2.id,
        title: 'Integrate weather API oracle service',
        description: 'Implement backend service fetching daily humidity levels.',
        priority: 'high',
        status: 'in_progress',
        requirementId: req2.id,
      },
    ],
  });
  console.log('- Created 3 project tasks');

  // 8. Create mock progress logs
  await prisma.progressLog.create({
    data: {
      projectId: project.id,
      userId: student1.id,
      logText: 'Week 1: Gathered initial specifications from the client, set up git repository and drafted initial proposal document.',
      weekNumber: 1,
    },
  });
  
  await prisma.progressLog.create({
    data: {
      projectId: project.id,
      userId: student2.id,
      logText: 'Week 1: Configured SQLite local database and mapped schema tables for users and insurance details.',
      weekNumber: 1,
    },
  });
  console.log('- Created progress logs');

  console.log('\nSeed completed successfully! Enjoy developing CapstoneGuard AI.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
