# Software Requirements Specification

## Project: **CapstoneGuard AI**

## 1. Project Overview

**CapstoneGuard AI** is an AI-powered capstone project supervision and defense readiness platform. The system helps students and supervisors improve project quality by converting vague requirements into testable specifications, tracking group member contributions, and generating examiner-style viva questions based on uploaded project documents.

The system will be built using:

| Layer                | Technology                             |
| -------------------- | -------------------------------------- |
| Frontend             | React                                  |
| Backend              | Express.js                             |
| Database             | PostgreSQL via Prisma ORM              |
| AI Integration       | NVIDIA OpenAI-compatible AI endpoint   |
| File Handling        | Multer with local or Supabase storage  |
| Authentication       | JWT-based authentication               |
| Deployment           | Render, Railway, VPS, or similar       |

---

# 2. Problem Statement

Many student software projects suffer from unclear requirements, weak documentation, poor contribution tracking, and poor viva preparation. Students often describe systems using vague statements such as “the system should be user-friendly” or “the system should be fast,” without converting them into measurable and testable requirements.

In group projects, supervisors may struggle to determine whether each member contributed fairly. Additionally, students may fail during project defense because they cannot justify their technical decisions, architecture, testing approach, or system limitations.

CapstoneGuard AI addresses these issues by providing an intelligent platform for requirements refinement, contribution monitoring, and defense preparation.

---

# 3. Project Objectives

## 3.1 General Objective

To develop an AI-powered capstone project supervision platform that improves requirements quality, contribution fairness, and viva defense readiness for student software projects.

## 3.2 Specific Objectives

1. To allow students to create and manage capstone project workspaces.
2. To convert vague project descriptions into structured functional and non-functional requirements.
3. To generate acceptance criteria and test cases from project requirements.
4. To allow group members to create, assign, update, and complete project tasks.
5. To track individual contribution using tasks, uploads, progress logs, and peer reviews.
6. To allow students to upload project proposals, reports, slides, and source code files.
7. To use an NVIDIA OpenAI-compatible AI endpoint to generate examiner-style viva questions.
8. To generate a defense readiness score based on requirements, documentation, testing evidence, and contribution records.
9. To provide supervisors with a dashboard for monitoring project progress and group contribution.
10. To generate downloadable project analysis and viva preparation reports.

---

# 4. System Scope

## 4.1 In Scope

The system shall include:

* User registration and login
* Role-based access control
* Project workspace creation
* Group member management
* AI-powered requirements generation
* Functional and non-functional requirements classification
* Acceptance criteria generation
* Test case generation
* Task assignment and contribution tracking
* Progress logging
* Peer review submission
* File upload for project documents
* AI-based viva question generation
* Defense readiness scoring
* Supervisor dashboard
* Project report generation

## 4.2 Out of Scope

The initial version shall not include:

* Full plagiarism detection
* Real-time collaborative document editing
* Direct GitHub commit analysis
* Automatic code execution
* Full oral viva speech recognition
* Advanced plagiarism or similarity scoring
* Automatic final grading by the system

These can be added in future versions.

---

# 5. User Roles

## 5.1 Student

A student can:

* Register and log in
* Create or join a project group
* Add project information
* Add or update requirements
* Generate AI-assisted requirements
* Create and complete tasks
* Upload project files
* Submit progress logs
* Submit peer reviews
* Generate viva questions
* View defense readiness feedback

## 5.2 Group Leader

A group leader can:

* Manage project group members
* Assign tasks
* Approve or review submitted progress logs
* View contribution summaries
* Generate group reports
* Request AI project analysis

## 5.3 Supervisor

A supervisor can:

* View assigned project groups
* Monitor project progress
* Review requirements
* View contribution reports
* View uploaded documents
* Generate viva questions for a group
* View defense readiness scores
* Add comments or recommendations

## 5.4 Administrator

An administrator can:

* Manage users
* Manage supervisors
* Manage all projects
* View platform usage statistics
* Resolve project membership issues
* Configure system-level settings

---

# 6. Functional Requirements

## 6.1 Authentication and User Management

### FR-001: User Registration

The system shall allow users to create an account using their name, email, password, and role.

### FR-002: User Login

The system shall allow registered users to log in using email and password.

### FR-003: Password Encryption

The system shall securely hash user passwords before storing them in the database.

### FR-004: Role-Based Access Control

The system shall restrict access to features based on user role.

### FR-005: User Profile Management

The system shall allow users to update basic profile information such as name, password, and profile image.

---

## 6.2 Project Workspace Management

### FR-006: Create Project Workspace

The system shall allow students or group leaders to create a project workspace.

Required fields:

* Project title
* Project description
* Department or course
* Project category
* Academic year
* Supervisor, if assigned

### FR-007: Edit Project Details

The system shall allow authorized users to update project title, description, objectives, and status.

### FR-008: Delete Project Workspace

The system shall allow only the project owner, supervisor, or administrator to delete a project workspace.

### FR-009: View Project Dashboard

The system shall provide a dashboard showing:

* Project overview
* Group members
* Requirements summary
* Task progress
* Contribution score
* Uploaded files
* Viva readiness score

---

## 6.3 Group Member Management

### FR-010: Add Group Members

The system shall allow a group leader or project manager to invite or add members to a project workspace by searching for existing users, adding a user directly, or generating an invite code that another authenticated user can enter from the dashboard.

### FR-011: Remove Group Members

The system shall allow authorized users to remove a group member from a project.

### FR-012: Assign Member Roles

The system shall allow the group leader to assign internal project roles such as:

* Frontend developer
* Backend developer
* Documentation lead
* Researcher
* Tester
* UI/UX designer
* Project manager

### FR-013: View Member Contribution

The system shall display each member’s contribution metrics.

---

## 6.4 Requirements Engineering Module

### FR-014: Enter Raw Project Requirements

The system shall allow users to enter vague or raw project requirements.

Example:

> The system should be fast and easy to use.

### FR-015: Generate Functional Requirements Using AI

The system shall use the configured NVIDIA OpenAI-compatible AI API to convert raw project descriptions into functional requirements.

### FR-016: Generate Non-Functional Requirements Using AI

The system shall generate measurable non-functional requirements such as performance, security, usability, scalability, and reliability requirements.

### FR-017: Detect Ambiguous Requirements

The system shall identify vague words or phrases such as:

* fast
* secure
* reliable
* user-friendly
* many users
* efficient
* easy to use

### FR-018: Suggest Improved Requirements

The system shall suggest improved measurable versions of ambiguous requirements.

Example:

| Vague Requirement         | Improved Requirement                                                 |
| ------------------------- | -------------------------------------------------------------------- |
| The system should be fast | The dashboard shall load within 3 seconds under 100 concurrent users |

### FR-019: Generate Acceptance Criteria

The system shall generate acceptance criteria for each functional requirement.

### FR-020: Generate Test Cases

The system shall generate test cases from functional and non-functional requirements.

### FR-021: Requirements Approval

The system shall allow a supervisor to approve, reject, or comment on generated requirements.

### FR-022: Requirements Traceability Matrix

The system shall generate a requirements traceability matrix linking:

* requirement ID
* requirement description
* acceptance criteria
* test cases
* implementation status

---

## 6.5 Task and Contribution Tracking Module

### FR-023: Create Tasks

The system shall allow group members to create project tasks.

Task fields shall include:

* task title
* task description
* assigned member
* priority
* status
* deadline
* related requirement
* evidence upload

### FR-024: Update Task Status

The system shall allow assigned members to update task status.

Task statuses shall include:

* To Do
* In Progress
* Under Review
* Completed
* Rejected

### FR-025: Submit Task Evidence

The system shall allow members to upload evidence for completed tasks.

Evidence may include:

* screenshots
* documents
* code files
* links
* short progress notes

### FR-026: Track Completed Tasks

The system shall record completed tasks per member.

### FR-027: Track Deadline Compliance

The system shall track whether tasks were completed before or after the deadline.

### FR-028: Submit Progress Logs

The system shall allow users to submit weekly progress logs.

### FR-029: Submit Peer Reviews

The system shall allow group members to rate each other’s contribution.

Peer review fields may include:

* reliability
* technical contribution
* communication
* meeting attendance
* documentation contribution
* overall contribution rating

### FR-030: Generate Contribution Score

The system shall calculate a contribution score for each member.

Suggested scoring model:

| Metric                | Weight |
| --------------------- | -----: |
| Completed tasks       |    30% |
| Task evidence uploads |    20% |
| Progress logs         |    15% |
| Peer reviews          |    15% |
| Deadline consistency  |    10% |
| Supervisor feedback   |    10% |

### FR-031: Detect Contribution Imbalance

The system shall flag cases where contribution is highly uneven.

Example warnings:

* One member completed more than 60% of all tasks.
* A member has peer reviews but no task evidence.
* A member has many assigned tasks but few completed tasks.
* A member submits logs but has no measurable output.

---

## 6.6 File Upload and Document Management

### FR-032: Upload Project Documents

The system shall allow users to upload:

* project proposal
* project report
* presentation slides
* source code ZIP
* screenshots
* testing evidence
* diagrams

### FR-033: Store File Metadata

The system shall store metadata for each uploaded file, including:

* file name
* file type
* upload date
* uploaded by
* related project
* file size

### FR-034: Download Uploaded Files

The system shall allow authorized users to download uploaded files.

### FR-035: Delete Uploaded Files

The system shall allow authorized users to delete uploaded files.

### FR-036: Analyze Uploaded Files Using AI

The system shall use uploaded document metadata, project context, requirements, and supported extracted content where available to analyze project quality through the configured AI API.

---

## 6.7 VivaBoss AI Examiner Module

### FR-037: Generate Viva Questions

The system shall use the configured AI API to generate viva questions based on:

* project title
* problem statement
* requirements
* uploaded report
* uploaded slides
* task history
* contribution records

### FR-038: Categorize Viva Questions

The system shall categorize questions into:

* requirements
* architecture
* database design
* testing
* security
* scalability
* contribution
* originality
* limitations
* future work

### FR-039: Generate Difficulty Levels

The system shall classify generated questions as:

* basic
* intermediate
* advanced
* brutal examiner level

### FR-040: Viva Practice Mode

The system shall allow students to practice answering viva questions.

### FR-041: Save Viva Answers

The system shall allow students to save answers for future review.

### FR-042: Score Viva Answers

The system shall use the configured AI API to evaluate answers based on clarity, correctness, technical depth, and confidence.

### FR-043: Generate Suggested Answers

The system shall provide suggested answer outlines for generated viva questions.

### FR-044: Generate Defense Readiness Score

The system shall calculate a defense readiness score based on:

* requirements quality
* test coverage
* contribution balance
* documentation completeness
* architecture explanation
* viva answer quality
* uploaded evidence

---

## 6.8 Supervisor Dashboard

### FR-045: View Assigned Projects

The system shall allow supervisors to view all assigned student projects.

### FR-046: View Project Progress

The system shall display progress summaries for each project.

### FR-047: View Requirements Quality

The system shall allow supervisors to review generated requirements, ambiguity warnings, and test cases.

### FR-048: View Contribution Reports

The system shall allow supervisors to view individual and group contribution reports.

### FR-049: Add Supervisor Comments

The system shall allow supervisors to add comments on:

* requirements
* tasks
* documents
* contribution reports
* viva readiness

### FR-050: Generate Supervisor Review Report

The system shall generate a supervisor-facing report summarizing project quality and risk areas.

---

## 6.9 Report Generation

### FR-051: Generate Requirements Report

The system shall generate a report containing:

* functional requirements
* non-functional requirements
* acceptance criteria
* test cases
* ambiguity warnings

### FR-052: Generate Contribution Report

The system shall generate a contribution report showing each member’s activity.

### FR-053: Generate Viva Preparation Report

The system shall generate a viva preparation report containing:

* viva questions
* suggested answers
* weak areas
* readiness score

### FR-054: Export Reports

The system shall allow users to export reports as PDF.

---

# 7. Non-Functional Requirements

## 7.1 Performance Requirements

### NFR-001

The dashboard shall load within 3 seconds under normal usage conditions.

### NFR-002

The system shall support at least 100 concurrent users in production.

### NFR-003

AI-generated responses shall be returned within 15 seconds under normal network conditions.

### NFR-004

The system shall support file uploads of at least 20 MB per file.

---

## 7.2 Security Requirements

### NFR-005

The system shall hash passwords using a secure hashing algorithm such as bcrypt.

### NFR-006

The system shall use JWT tokens for authenticated sessions.

### NFR-007

The system shall restrict project access to authorized users only.

### NFR-008

The system shall validate uploaded file types.

### NFR-009

The system shall prevent SQL injection through parameterized queries or ORM query methods.

### NFR-010

The system shall store AI provider API keys only in environment variables.

---

## 7.3 Usability Requirements

### NFR-011

The system shall provide a clean and responsive user interface.

### NFR-012

The system shall be usable on desktop, tablet, and mobile browsers.

### NFR-013

The system shall provide clear error messages for failed actions.

### NFR-014

The system shall use visual indicators for project progress, contribution balance, and defense readiness.

---

## 7.4 Reliability Requirements

### NFR-015

The system shall preserve user data during page refreshes.

### NFR-016

The system shall maintain database backups in production.

### NFR-017

The system shall log backend errors for troubleshooting.

### NFR-018

The system shall gracefully handle AI API failures by showing fallback error messages.

---

## 7.5 Maintainability Requirements

### NFR-019

The backend code shall follow modular Express.js architecture.

### NFR-020

The frontend shall use reusable React components.

### NFR-021

The system shall separate AI logic from core business logic.

### NFR-022

The system shall use environment-specific configuration for development and production.

---

# 8. System Architecture

## 8.1 Proposed Architecture

The system shall use a client-server architecture.

```text
React Frontend
     |
     | HTTP/REST API
     |
Express.js Backend
     |
     |---------------- NVIDIA OpenAI-compatible AI API
     |
     |---------------- File Storage
     |
     |---------------- PostgreSQL Database
```

## 8.2 Frontend Layer

The React frontend shall handle:

* user interface
* dashboard views
* forms
* authentication screens
* file upload screens
* AI results display
* charts and progress indicators
* viva practice interface

Suggested frontend libraries:

* React Router
* Axios
* React Hook Form
* Tailwind CSS or CSS modules
* Recharts
* React Toastify

---

## 8.3 Backend Layer

The Express.js backend shall handle:

* authentication
* authorization
* project management
* task management
* file uploads
* database operations
* AI API requests
* report generation
* contribution score calculation

Suggested backend libraries:

* Express
* bcrypt
* jsonwebtoken
* multer
* cors
* dotenv
* zod or joi
* pdfkit or puppeteer for PDF generation

---

## 8.4 Database Layer

Development and production shall use PostgreSQL for relational integrity, consistent migrations, and deployment parity.

Prisma ORM shall be used for schema definition, migrations, and type-safe database access.

---

# 9. Suggested Database Entities

## 9.1 Users Table

| Field         | Type           | Description                |
| ------------- | -------------- | -------------------------- |
| id            | UUID / Integer | Unique user ID             |
| name          | String         | Full name                  |
| email         | String         | Unique email               |
| password_hash | String         | Hashed password            |
| role          | String         | student, supervisor, admin |
| profile_image | String         | Optional profile image URL |
| created_at    | DateTime       | Account creation date      |

---

## 9.2 Projects Table

| Field         | Type           | Description                 |
| ------------- | -------------- | --------------------------- |
| id            | UUID / Integer | Unique project ID           |
| title         | String         | Project title               |
| description   | Text           | Project description         |
| category      | String         | Project category            |
| department    | String         | Department or course        |
| academic_year | String         | Academic year               |
| status        | String         | active, completed, archived |
| supervisor_id | Foreign Key    | Assigned supervisor         |
| created_by    | Foreign Key    | Project creator             |
| created_at    | DateTime       | Creation date               |

---

## 9.3 Project Members Table

| Field        | Type           | Description           |
| ------------ | -------------- | --------------------- |
| id           | UUID / Integer | Unique record ID      |
| project_id   | Foreign Key    | Related project       |
| user_id      | Foreign Key    | Related user          |
| project_role | String         | Internal project role |
| is_leader    | Boolean        | Project manager flag  |
| joined_at    | DateTime       | Join date             |

---

## 9.4 Requirements Table

| Field       | Type           | Description                  |
| ----------- | -------------- | ---------------------------- |
| id          | UUID / Integer | Unique requirement ID        |
| project_id  | Foreign Key    | Related project              |
| type        | String         | functional or non-functional |
| title       | String         | Requirement title            |
| description | Text           | Requirement description      |
| priority    | String         | low, medium, high            |
| status      | String         | draft, approved, rejected    |
| created_at  | DateTime       | Creation date                |

---

## 9.5 Acceptance Criteria Table

| Field          | Type           | Description          |
| -------------- | -------------- | -------------------- |
| id             | UUID / Integer | Unique criterion ID  |
| requirement_id | Foreign Key    | Related requirement  |
| criteria_text  | Text           | Acceptance criterion |
| created_at     | DateTime       | Creation date        |

---

## 9.6 Test Cases Table

| Field           | Type           | Description             |
| --------------- | -------------- | ----------------------- |
| id              | UUID / Integer | Unique test case ID     |
| requirement_id  | Foreign Key    | Related requirement     |
| test_title      | String         | Test case title         |
| test_steps      | Text           | Steps to perform        |
| expected_result | Text           | Expected result         |
| status          | String         | pending, passed, failed |

---

## 9.7 Tasks Table

| Field        | Type           | Description                          |
| ------------ | -------------- | ------------------------------------ |
| id           | UUID / Integer | Unique task ID                       |
| project_id   | Foreign Key    | Related project                      |
| assigned_to  | Foreign Key    | Assigned user                        |
| title        | String         | Task title                           |
| description  | Text           | Task details                         |
| priority     | String         | low, medium, high                    |
| status       | String         | todo, in_progress, review, completed |
| deadline     | DateTime       | Due date                             |
| completed_at | DateTime       | Completion date                      |
| requirement_id | Foreign Key  | Related requirement, optional        |

---

## 9.8 Progress Logs Table

| Field        | Type           | Description               |
| ------------ | -------------- | ------------------------- |
| id           | UUID / Integer | Unique log ID             |
| project_id   | Foreign Key    | Related project           |
| user_id      | Foreign Key    | Student who submitted log |
| log_text     | Text           | Progress update           |
| submitted_at | DateTime       | Submission date           |

---

## 9.9 Peer Reviews Table

| Field                      | Type           | Description                  |
| -------------------------- | -------------- | ---------------------------- |
| id                         | UUID / Integer | Unique review ID             |
| project_id                 | Foreign Key    | Related project              |
| reviewer_id                | Foreign Key    | Reviewer                     |
| reviewed_user_id           | Foreign Key    | Reviewed member              |
| reliability                | Integer        | Reliability rating out of 5  |
| technical_contribution     | Integer        | Technical rating out of 5    |
| communication              | Integer        | Communication rating out of 5 |
| meeting_attendance         | Integer        | Attendance rating out of 5   |
| documentation_contribution | Integer        | Documentation rating out of 5 |
| overall_rating             | Integer        | Calculated overall rating    |
| comment                    | Text           | Review comment               |
| created_at                 | DateTime       | Review date                  |

---

## 9.10 Files Table

| Field       | Type           | Description                              |
| ----------- | -------------- | ---------------------------------------- |
| id          | UUID / Integer | Unique file ID                           |
| project_id  | Foreign Key    | Related project                          |
| uploaded_by | Foreign Key    | User who uploaded file                   |
| file_name   | String         | Original file name                       |
| file_path   | String         | Storage path                             |
| file_type   | String         | proposal, report, slides, code, evidence, screenshot, diagram |
| mime_type   | String         | File MIME type                           |
| size        | Integer        | File size                                |
| uploaded_at | DateTime       | Upload date                              |

---

## 9.11 Viva Questions Table

| Field            | Type           | Description                           |
| ---------------- | -------------- | ------------------------------------- |
| id               | UUID / Integer | Unique question ID                    |
| project_id       | Foreign Key    | Related project                       |
| category         | String         | Question category                     |
| difficulty       | String         | basic, intermediate, advanced, brutal |
| question_text    | Text           | Viva question                         |
| suggested_answer | Text           | AI-generated answer guide             |
| created_at       | DateTime       | Generation date                       |

---

## 9.12 Readiness Scores Table

| Field               | Type           | Description                 |
| ------------------- | -------------- | --------------------------- |
| id                  | UUID / Integer | Unique score ID             |
| project_id          | Foreign Key    | Related project             |
| requirements_score  | Integer        | Requirements quality score  |
| contribution_score  | Integer        | Contribution fairness score |
| documentation_score | Integer        | Documentation quality score |
| testing_score       | Integer        | Testing evidence score      |
| viva_score          | Integer        | Viva readiness score        |
| overall_score       | Integer        | Overall score               |
| generated_at        | DateTime       | Score generation date       |

---

## 9.13 Team Invites Table

| Field      | Type           | Description                 |
| ---------- | -------------- | --------------------------- |
| id         | UUID / Integer | Unique invite ID            |
| project_id | Foreign Key    | Related project             |
| code       | String         | Unique invite code          |
| created_by | Foreign Key    | User who generated the code |
| expires_at | DateTime       | Expiry date                 |
| used_at    | DateTime       | Last usage date, optional   |
| used_by    | Integer        | Last user who used code     |
| created_at | DateTime       | Creation date               |

---

## 9.14 Task Evidence Table

| Field      | Type           | Description              |
| ---------- | -------------- | ------------------------ |
| id         | UUID / Integer | Unique evidence ID       |
| task_id    | Foreign Key    | Related task             |
| file_id    | Foreign Key    | Optional uploaded file   |
| note       | Text           | Evidence note            |
| created_at | DateTime       | Submission date          |

---

## 9.15 Supervisor Comments Table

| Field        | Type           | Description                                      |
| ------------ | -------------- | ------------------------------------------------ |
| id           | UUID / Integer | Unique comment ID                                |
| project_id   | Foreign Key    | Related project                                  |
| user_id      | Foreign Key    | Supervisor or admin who commented                |
| target_type  | String         | requirement, task, document, contribution, viva  |
| target_id    | Integer        | Optional target record ID                        |
| comment_text | Text           | Comment body                                     |
| created_at   | DateTime       | Creation date                                    |

---

# 10. API Requirements

## 10.1 Authentication APIs

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
PUT  /api/auth/profile
POST /api/auth/logout
```

## 10.2 User APIs

```text
GET /api/users/search?q={query}
GET /api/users/:userId
```

## 10.3 Project APIs

```text
POST   /api/projects
GET    /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id
```

## 10.4 Member and Invite APIs

```text
POST   /api/projects/join/:code
POST   /api/projects/:id/members
GET    /api/projects/:id/members
PUT    /api/projects/:id/members/:userId
DELETE /api/projects/:id/members/:userId
POST   /api/projects/:id/invites
GET    /api/projects/:id/invites
```

## 10.5 Requirements APIs

```text
GET    /api/projects/:id/requirements
POST   /api/projects/:id/requirements
POST   /api/projects/:id/requirements/generate
GET    /api/projects/:id/requirements/traceability
GET    /api/projects/requirements/:requirementId
PUT    /api/projects/requirements/:requirementId
PUT    /api/projects/requirements/:requirementId/review
DELETE /api/projects/requirements/:requirementId
POST   /api/projects/requirements/:requirementId/acceptance-criteria/generate
POST   /api/projects/requirements/:requirementId/test-cases/generate
```

## 10.6 Task APIs

```text
GET    /api/projects/:id/tasks
POST   /api/projects/:id/tasks
GET    /api/projects/tasks/:taskId
PUT    /api/projects/tasks/:taskId
DELETE /api/projects/tasks/:taskId
POST   /api/projects/tasks/:taskId/evidence
```

## 10.7 Contribution APIs

```text
POST /api/projects/:id/progress-logs
GET  /api/projects/:id/progress-logs
POST /api/projects/:id/peer-reviews
GET  /api/projects/:id/contribution-report
```

## 10.8 File APIs

```text
POST   /api/projects/:id/files/upload
GET    /api/projects/:id/files
POST   /api/projects/:id/files/analyze
GET    /api/projects/files/:fileId/download
DELETE /api/projects/files/:fileId
```

## 10.9 Viva APIs

```text
POST /api/projects/:id/viva/generate
GET  /api/projects/:id/viva/questions
POST /api/projects/:id/viva/questions/:questionId/answer
POST /api/projects/viva/questions/:questionId/answer
POST /api/projects/:id/readiness-score/generate
GET  /api/projects/:id/readiness-score
```

## 10.10 Supervisor APIs

```text
GET    /api/supervisor/assigned/projects
GET    /api/supervisor/assigned/overview
POST   /api/projects/:id/comments
GET    /api/projects/:id/comments
DELETE /api/projects/comments/:commentId
```

## 10.11 Report APIs

```text
GET /api/projects/:id/reports/requirements
GET /api/projects/:id/reports/contribution
GET /api/projects/:id/reports/viva
GET /api/projects/:id/reports/full
```

## 10.12 Admin APIs

```text
GET    /api/admin/stats
GET    /api/admin/users
PUT    /api/admin/users/:userId/role
DELETE /api/admin/users/:userId
```

---

# 11. AI Requirements

## 11.1 NVIDIA OpenAI-Compatible API Usage

The system shall use the NVIDIA OpenAI-compatible chat completions API for:

1. Requirements generation
2. Ambiguity detection
3. Acceptance criteria generation
4. Test case generation
5. Viva question generation
6. Viva answer evaluation
7. Defense readiness feedback
8. Project risk analysis

## 11.2 AI Prompt Requirements

The backend shall structure prompts using clear task-specific templates.

Example prompt for requirements:

```text
You are a software requirements analyst.
Convert the following vague project idea into:
1. Functional requirements
2. Non-functional requirements
3. Acceptance criteria
4. Test cases
5. Ambiguity warnings

Project idea:
{project_description}
```

Example prompt for viva:

```text
You are a strict final-year software project examiner.
Generate viva questions based on the following project details.
Categorize questions into requirements, architecture, database, testing, security, scalability, contribution, originality, and limitations.

Project title:
{title}

Project description:
{description}

Requirements:
{requirements}

Uploaded document summary:
{document_summary}
```

## 11.3 AI Output Format

The system should request structured JSON output from the AI provider where possible.

Example:

```json
{
  "functional_requirements": [],
  "non_functional_requirements": [],
  "acceptance_criteria": [],
  "test_cases": [],
  "ambiguity_warnings": []
}
```

## 11.4 AI Failure Handling

If the AI API fails, the system shall:

* show a friendly error message
* allow the user to retry
* preserve the user’s input
* log the error on the backend
* avoid crashing the application

---

# 12. Contribution Scoring Formula

The system shall calculate a member’s contribution score using weighted metrics.

Suggested formula:

```text
Contribution Score =
(Completed Tasks × 0.30) +
(Task Evidence × 0.20) +
(Progress Logs × 0.15) +
(Peer Review Score × 0.15) +
(Deadline Score × 0.10) +
(Supervisor Feedback × 0.10)
```

The score shall be normalized to a percentage.

Example:

| Member | Completed Tasks | Evidence | Logs | Peer Review | Deadline | Final Score |
| ------ | --------------: | -------: | ---: | ----------: | -------: | ----------: |
| Sepo   |              90 |       85 |   80 |          88 |       90 |         87% |
| Naomi  |              85 |       80 |   90 |          86 |       85 |         85% |

---

# 13. Defense Readiness Score

The system shall calculate an overall project readiness score.

Suggested formula:

```text
Defense Readiness Score =
(Requirements Quality × 0.20) +
(Testing Evidence × 0.20) +
(Documentation Completeness × 0.20) +
(Architecture Justification × 0.15) +
(Contribution Fairness × 0.15) +
(Viva Practice Performance × 0.10)
```

Readiness levels:

| Score Range | Level                    |
| ----------- | ------------------------ |
| 80–100      | Strong defense readiness |
| 60–79       | Moderate readiness       |
| 40–59       | Weak readiness           |
| 0–39        | High risk                |

---

# 14. User Interface Requirements

## 14.1 Main Pages

The frontend shall include:

1. Landing page
2. Login page
3. Register page
4. Student dashboard
5. Supervisor dashboard
6. Project workspace page
7. Requirements module page
8. Task board page
9. Contribution report page
10. File upload page
11. Viva simulator page
12. Defense readiness page
13. Reports page
14. Admin dashboard

## 14.2 Dashboard Widgets

The project dashboard shall display:

* project completion percentage
* number of requirements
* number of approved requirements
* completed tasks
* pending tasks
* member contribution chart
* defense readiness score
* recent uploads
* AI recommendations

---

# 15. Validation and Testing Requirements

The system shall be tested using:

## 15.1 Unit Testing

Test individual backend services such as:

* authentication service
* contribution score calculator
* readiness score calculator
* requirements parser
* AI response formatter

## 15.2 Integration Testing

Test interactions between:

* React frontend and Express API
* Express API and database
* Express API and the NVIDIA OpenAI-compatible AI API
* file upload system and database

## 15.3 Acceptance Testing

Example acceptance test:

| Test ID | Requirement              | Test Scenario                              | Expected Result                                             |
| ------- | ------------------------ | ------------------------------------------ | ----------------------------------------------------------- |
| AT-001  | Generate requirements    | User enters vague project idea             | System generates functional and non-functional requirements |
| AT-002  | Track contribution       | Member completes task                      | Contribution score updates                                  |
| AT-003  | Generate viva questions  | User uploads report and clicks generate    | System displays categorized viva questions                  |
| AT-004  | Generate readiness score | Project has requirements, tasks, and files | System displays readiness score                             |

---

# 16. Constraints

The system shall operate under the following constraints:

1. The system requires internet access for AI API features.
2. AI-generated content must be reviewed by students or supervisors before use.
3. PostgreSQL shall be used for development and production deployment.
4. Prisma migrations shall be used to keep database structure consistent across environments.
5. File upload size may be limited depending on server configuration.
6. The system shall not be treated as a final examiner or automatic grading authority.
7. AI-generated scoring shall be advisory, not final.

---

# 17. Assumptions

1. Users have basic internet access.
2. Students can upload their project documents in supported formats.
3. Supervisors will review AI-generated outputs before making decisions.
4. Group contribution data will be based on tasks, logs, uploads, and peer reviews.
5. The configured NVIDIA AI API will be available for AI processing.
6. Production deployment will provide PostgreSQL database access.

---

# 18. Risks and Mitigation

| Risk                                  | Impact                    | Mitigation                              |
| ------------------------------------- | ------------------------- | --------------------------------------- |
| AI generates inaccurate requirements  | Poor project quality      | Require supervisor approval             |
| Students manipulate contribution data | Unfair scores             | Use multiple evidence sources           |
| AI API downtime                       | AI features unavailable   | Add retry and fallback messages         |
| File upload abuse                     | Security risk             | Validate file type and size             |
| Weak peer review honesty              | Biased contribution score | Combine peer reviews with task evidence |
| Database migration issues             | Deployment failure        | Use Prisma migrations                   |
| Overreliance on AI scores             | Misjudgment               | Clearly label AI results as advisory    |

---

# 19. Future Enhancements

Future versions may include:

1. GitHub commit analysis
2. Automatic code-report consistency checking
3. Speech-based oral viva practice
4. Plagiarism detection
5. AI-generated project proposal templates
6. Supervisor feedback analytics
7. Institution-wide project archive
8. Similar project detection
9. AI-based rubric grading assistant
10. Mobile app version
11. Calendar and deadline reminders
12. Integration with Google Drive
13. Integration with learning management systems

---

# 20. Summary

CapstoneGuard AI is a comprehensive AI-powered platform for improving the quality of student software projects. It combines requirements engineering, group contribution tracking, viva preparation, project supervision, and AI-assisted analysis into a single system.

The chosen stack of **React, Express.js, PostgreSQL with Prisma, and NVIDIA OpenAI-compatible AI integration** is suitable because it supports fast development, modular architecture, scalable deployment, and intelligent document-based analysis.

The system’s strongest value is that it does not simply manage projects. It helps students make their projects **testable, traceable, fairly contributed, and defensible**.
