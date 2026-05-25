# CapstoneGuard AI

CapstoneGuard AI is an AI-assisted capstone supervision platform for student teams and supervisors. It helps turn rough project ideas into testable requirements, track task progress and evidence, generate viva practice questions, and keep project documentation in one place.

## Project Structure

- `client/` - React + Vite frontend
- `server/` - Express + Prisma API
- `capstone_requirements_spec.md` - product and requirements reference

## Core Features

- Project workspace creation and management
- AI-generated requirements, acceptance criteria, and test cases
- Team member management and contribution tracking
- Task planning, status updates, and evidence uploads
- Document analysis and readiness summaries
- Viva practice questions and answer feedback
- Role-based access for students, supervisors, and administrators

## Tech Stack

- Frontend: React, Vite, React Router, Axios
- Backend: Express, Prisma, PostgreSQL
- AI: NVIDIA OpenAI-compatible endpoint
- Auth: JWT-based authentication
- File handling: Multer and optional Supabase storage

## Prerequisites

- Node.js 20 or newer
- npm
- PostgreSQL database
- NVIDIA API key if you want AI generation features enabled

## Setup

Install dependencies for both apps:

```bash
cd client && npm install
cd ../server && npm install
```

Create environment files in each app directory.

### Client environment

Create `client/.env` with:

```bash
VITE_API_URL=http://localhost:5000
```

### Server environment

Create `server/.env` with the variables your deployment needs. The main ones used by the app are:

```bash
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/capstone
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
NVIDIA_API_KEY=your-nvidia-api-key
NVIDIA_MODEL=minimaxai/minimax-m2.7
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_BUCKET_NAME=capstone-files
CLIENT_URL=http://localhost:5173
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=20971520
```

## Running Locally

Start the backend:

```bash
cd server
npm run dev
```

Start the frontend in a second terminal:

```bash
cd client
npm run dev
```

The frontend runs on Vite's default port and talks to the API through `VITE_API_URL`.

## Useful Scripts

### Client

- `npm run dev` - start the Vite dev server
- `npm run build` - build the production frontend
- `npm run lint` - run ESLint
- `npm run preview` - preview a production build locally

### Server

- `npm run dev` - start the API with nodemon
- `npm start` - start the API in production mode
- `npm test` - run the Node test suite
- `npm run prisma:generate` - generate Prisma client types
- `npm run prisma:migrate:dev` - create and apply a local migration
- `npm run prisma:migrate:deploy` - apply production migrations
- `npm run prisma:migrate:status` - inspect migration state

## Notes

- The root of the repository does not contain a Node package; install and run the client and server from their respective folders.
- The starter `client/README.md` is still present, but this root README is the best entry point for the whole project.