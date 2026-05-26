import React from 'react';
import { ChevronRight, ChevronLeft, X, SkipForward } from 'lucide-react';
import { useOnboarding } from '../context/OnboardingContext';
import '../styles/tour.css';

const tourSteps = [
  {
    id: 'welcome',
    title: 'Welcome to Capstone Studio',
    description: 'An AI-assisted platform to help your team turn ideas into testable requirements, track progress, and prepare for vivas.',
    target: null,
    position: 'center',
  },
  {
    id: 'studio-board',
    title: 'Studio Board',
    description: 'View and manage all your active projects in one place. Click on a project to open its workspace.',
    target: '[data-tour="studio-board"]',
    position: 'bottom',
  },
  {
    id: 'requirements',
    title: 'AI-Generated Requirements',
    description: 'Start with a rough idea and let AI help you create structured requirements with acceptance criteria and test cases.',
    target: '[data-tour="requirements"]',
    position: 'bottom',
  },
  {
    id: 'tasks',
    title: 'Task Planning & Evidence',
    description: 'Break requirements into tasks, assign deadlines, and upload evidence files to track progress.',
    target: '[data-tour="tasks"]',
    position: 'bottom',
  },
  {
    id: 'documents',
    title: 'Document Library',
    description: 'Upload proposals, reports, and source files. AI analyzes them to surface gaps and next steps.',
    target: '[data-tour="documents"]',
    position: 'bottom',
  },
  {
    id: 'viva',
    title: 'Viva Practice',
    description: 'Generate practice questions based on your project, get AI feedback, and prepare for presentations.',
    target: '[data-tour="viva"]',
    position: 'bottom',
  },
  {
    id: 'complete',
    title: 'Ready to start?',
    description: 'You can always access this guide from the Help button in the top right. Let\'s get started!',
    target: null,
    position: 'center',
  },
];

export const OnboardingTour = () => {
  const { showTour, currentStep, nextStep, prevStep, completeTour, skipTour } = useOnboarding();

  if (!showTour) return null;

  const step = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;

  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('tour-backdrop')) {
      skipTour();
    }
  };

  return (
    <div className="tour-backdrop" onClick={handleBackdropClick}>
      <div className={`tour-spotlight ${step.position}`}>
        {step.target && document.querySelector(step.target) && (
          <div className="tour-target-highlight" />
        )}

        <div className={`tour-card tour-card-${step.position}`}>
          <div className="tour-header">
            <h3>{step.title}</h3>
            <button
              className="tour-close"
              onClick={skipTour}
              aria-label="Skip tour"
            >
              <X size={18} />
            </button>
          </div>

          <p className="tour-description">{step.description}</p>

          <div className="tour-progress">
            <div className="tour-dots">
              {tourSteps.map((_, idx) => (
                <button
                  key={idx}
                  className={`tour-dot ${idx === currentStep ? 'active' : ''} ${
                    idx < currentStep ? 'completed' : ''
                  }`}
                  onClick={() => {
                    if (idx < currentStep) prevStep();
                    while (idx > currentStep) nextStep();
                  }}
                  aria-label={`Step ${idx + 1}`}
                />
              ))}
            </div>
            <span className="tour-count">
              {currentStep + 1} / {tourSteps.length}
            </span>
          </div>

          <div className="tour-actions">
            <button
              className="btn btn-ghost"
              onClick={skipTour}
            >
              <SkipForward size={14} />
              Skip
            </button>

            <div className="tour-nav">
              {currentStep > 0 && (
                <button
                  className="btn btn-secondary"
                  onClick={prevStep}
                >
                  <ChevronLeft size={14} />
                  Back
                </button>
              )}

              <button
                className="btn btn-primary"
                onClick={isLastStep ? completeTour : nextStep}
              >
                {isLastStep ? 'Get Started' : 'Next'}
                {!isLastStep && <ChevronRight size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
