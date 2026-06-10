import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const DemoContext = createContext(null);

const DEMO_SCRIPT = [
  {
    id: 'welcome',
    route: '/',
    target: '.landing-hero',
    title: 'Welcome to Capstone Studio',
    description: 'This demo walks through the full platform — from AI-powered requirements generation to viva defense practice. Controls at the bottom let you pause, resume, skip, or restart at any time.',
    duration: 6000,
    pauseAfter: false,
  },
  {
    id: 'features',
    route: '/',
    target: '.landing-feature-grid',
    title: 'Core Modules',
    description: 'Capstone Studio converts vague ideas into testable requirements, tracks team contribution with evidence, and prepares teams for viva defense with AI-generated practice questions.',
    duration: 5000,
    pauseAfter: false,
  },
  {
    id: 'auto-login',
    route: '/login',
    target: '.auth-card',
    title: 'Auto-login to Demo Account',
    description: 'Logging into the demo account to explore the workspace. The account comes pre-loaded with a full project, team members, requirements, and viva questions.',
    duration: 3000,
    pauseAfter: false,
    action: 'DEMO_LOGIN',
  },
  {
    id: 'dashboard',
    route: '/dashboard',
    target: '.board-header',
    title: 'Project Dashboard',
    description: 'The dashboard shows your active projects. The Capstone Studio demo project is pre-loaded with requirements, tasks, team members, and readiness data.',
    duration: 4000,
    pauseAfter: false,
  },
  {
    id: 'requirements',
    route: '/projects/:id/requirements',
    target: '.workspace-header',
    title: 'AI Requirements Engine',
    description: 'This is the requirements workspace. The AI generated 6 functional and 4 non-functional requirements from a vague project description. Ambiguity warnings detect vague terms like "fast" and "secure".',
    duration: 5000,
    pauseAfter: false,
  },
  {
    id: 'requirements-generate',
    route: '/projects/:id/requirements',
    target: '.requirements-ai-panel',
    title: 'Generate with AI',
    description: 'Click "Generate with AI" to convert any vague idea into structured requirements. The AI detects ambiguous terms and suggests concrete, measurable alternatives.',
    duration: 4000,
    pauseAfter: false,
  },
  {
    id: 'traceability',
    route: '/projects/:id/traceability',
    target: '.traceability-matrix',
    title: 'Traceability Matrix',
    description: 'Every requirement is linked to its acceptance criteria, test cases, and associated tasks. This ensures full coverage and makes it easy to identify gaps.',
    duration: 4000,
    pauseAfter: false,
  },
  {
    id: 'tasks',
    route: '/projects/:id/tasks',
    target: '.task-board-panel',
    title: 'Task Board',
    description: 'Tasks are organized with priority, deadlines, and evidence uploads. Team members upload screenshots and code as proof of completion for supervisor review.',
    duration: 4000,
    pauseAfter: false,
  },
  {
    id: 'team',
    route: '/projects/:id/team',
    target: '.team-layout',
    title: 'Team Management',
    description: 'Invite team members via unique codes, assign roles like frontend_dev or project_manager, and designate a team leader. The demo team has 3 members and a supervisor.',
    duration: 4000,
    pauseAfter: false,
  },
  {
    id: 'contribution',
    route: '/projects/:id/contribution',
    target: '.contribution-report',
    title: 'Contribution Analytics',
    description: 'A weighted algorithm calculates each member\'s contribution: tasks (30%), evidence (20%), logs (15%), peer reviews (15%), deadlines (10%), supervisor (10%). Imbalance warnings flag potential issues.',
    duration: 5000,
    pauseAfter: false,
  },
  {
    id: 'readiness',
    route: '/projects/:id/readiness',
    target: '.readiness-score',
    title: 'Defense Readiness',
    description: 'The readiness score combines requirements quality, testing evidence, documentation, architecture justification, contribution fairness, and viva performance into a single 0-100 score.',
    duration: 4000,
    pauseAfter: false,
  },
  {
    id: 'documents',
    route: '/projects/:id/documents',
    target: '.documents-layout',
    title: 'Document Management',
    description: 'Upload proposals, reports, slides, diagrams, and code. The AI can analyze all uploaded documents to identify quality gaps and viva defense risks.',
    duration: 4000,
    pauseAfter: false,
  },
  {
    id: 'viva',
    route: '/projects/:id/viva',
    target: '.viva-layout',
    title: 'Viva Practice Simulator',
    description: 'AI generates 8 examiner-style questions across 10 categories with 4 difficulty levels. Submit practice answers and get scored on clarity, correctness, depth, and confidence.',
    duration: 5000,
    pauseAfter: false,
  },
  {
    id: 'viva-answer',
    route: '/projects/:id/viva',
    target: '.viva-question-panel',
    title: 'AI Scoring',
    description: 'Each answer receives a score out of 100 plus detailed feedback — just like a real viva panel. Practice until you reach the "Strong" readiness level (80+).',
    duration: 4000,
    pauseAfter: false,
  },
  {
    id: 'notes',
    route: '/projects/:id/notes',
    target: '.supervisor-notes',
    title: 'Supervisor Feedback',
    description: 'Supervisors leave comments on requirements, tasks, documents, contribution reports, and viva answers. All feedback stays connected to the relevant item.',
    duration: 3500,
    pauseAfter: false,
  },
  {
    id: 'summary',
    route: '/',
    target: '.landing-hero',
    title: 'Demo Complete',
    description: 'Capstone Studio helps student teams and supervisors turn projects from loose ideas into defense-ready results. Thank you for watching!',
    duration: 5000,
    pauseAfter: true,
  },
];

const DEMO_EMAIL = 'demo@capstonestudio.ai';
const DEMO_PASSWORD = 'demo123456';
const DEMO_STATE_KEY = 'capstone.demoState';
const TARGET_TIMEOUT = 15000;

const waitForElement = (selector) =>
  new Promise((resolve) => {
    if (document.querySelector(selector)) return resolve();
    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => { observer.disconnect(); resolve(); }, TARGET_TIMEOUT);
  });

export const DemoProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [playState, setPlayState] = useState('idle');
  const [speed, setSpeed] = useState(1);
  const [demoProjectId, setDemoProjectId] = useState(null);
  const timerRef = useRef(null);
  const isPausedRef = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem(DEMO_STATE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setIsActive(parsed.isActive);
        setCurrentStep(parsed.currentStep);
        setPlayState(parsed.playState);
        setSpeed(parsed.speed);
        setDemoProjectId(parsed.demoProjectId);
        localStorage.removeItem(DEMO_STATE_KEY);
      } catch (e) {
        console.error('Failed to restore demo state:', e);
      }
    }
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const advanceStep = useCallback(() => {
    setCurrentStep((prev) => {
      const next = prev + 1;
      if (next >= DEMO_SCRIPT.length) {
        setPlayState('idle');
        return prev;
      }
      return next;
    });
  }, []);

  const executeStep = useCallback(async (stepIndex) => {
    const step = DEMO_SCRIPT[stepIndex];
    if (!step) return;

    const stepDuration = (step.duration || 4000) / speed;

    const doNavigate = (targetRoute) => {
      if (step.action === 'DEMO_LOGIN') {
        return;
      }
      let route = targetRoute;
      if (route.includes(':id') && demoProjectId) {
        route = route.replace(':id', String(demoProjectId));
      }
      if (location.pathname !== route) {
        navigate(route);
      }
    };

    doNavigate(step.route);

    if (step.action !== 'DEMO_LOGIN' && step.target) {
      await waitForElement(step.target);
    }

    if (step.action === 'DEMO_LOGIN') {
      try {
        const res = await axios.post('/demo/login');
        const { token, user, demoProject } = res.data;
        if (token && user) {
          localStorage.setItem('token', token);
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          if (demoProject) {
            setDemoProjectId(demoProject.id);
          }
          const nextStep = stepIndex + 1;
          localStorage.setItem(DEMO_STATE_KEY, JSON.stringify({
            isActive: true,
            currentStep: nextStep,
            playState: 'playing',
            speed,
            demoProjectId: demoProject?.id || null,
          }));
          window.location.href = '/dashboard';
          return;
        }
      } catch (err) {
        console.error('Demo login failed:', err);
      }
    }

    if (!isPausedRef.current) {
      clearTimer();
      timerRef.current = setTimeout(() => {
        if (!isPausedRef.current) {
          advanceStep();
        }
      }, stepDuration);
    }
  }, [speed, demoProjectId, navigate, location.pathname, clearTimer, advanceStep]);

  useEffect(() => {
    if (playState === 'playing' && currentStep < DEMO_SCRIPT.length) {
      executeStep(currentStep);
    }
    return clearTimer;
  }, [playState, currentStep, executeStep, clearTimer]);

  const start = useCallback(async () => {
    setIsActive(true);
    setCurrentStep(0);
    setPlayState('playing');
    isPausedRef.current = false;
  }, []);

  const pause = useCallback(() => {
    setPlayState('paused');
    isPausedRef.current = true;
    clearTimer();
  }, [clearTimer]);

  const resume = useCallback(() => {
    setPlayState('playing');
    isPausedRef.current = false;
  }, []);

  const restart = useCallback(() => {
    setIsActive(true);
    setCurrentStep(0);
    setPlayState('playing');
    isPausedRef.current = false;
    clearTimer();
    navigate('/');
  }, [navigate, clearTimer]);

  const stop = useCallback(() => {
    setIsActive(false);
    setPlayState('idle');
    isPausedRef.current = true;
    clearTimer();
  }, [clearTimer]);

  const goToStep = useCallback((stepIndex) => {
    if (stepIndex >= 0 && stepIndex < DEMO_SCRIPT.length) {
      clearTimer();
      setCurrentStep(stepIndex);
    }
  }, [clearTimer]);

  const toggleSpeed = useCallback(() => {
    setSpeed((s) => (s === 1 ? 1.5 : s === 1.5 ? 2 : 1));
  }, []);

  const value = {
    isActive,
    currentStep,
    playState,
    speed,
    totalSteps: DEMO_SCRIPT.length,
    currentStepData: DEMO_SCRIPT[currentStep] || null,
    demoProjectId,
    start,
    pause,
    resume,
    restart,
    stop,
    goToStep,
    toggleSpeed,
  };

  return (
    <DemoContext.Provider value={value}>
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => useContext(DemoContext);
