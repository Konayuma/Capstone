import React, { createContext, useContext, useState, useEffect } from 'react';

const OnboardingContext = createContext(null);

export const OnboardingProvider = ({ children }) => {
  const [showTour, setShowTour] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    const completed = localStorage.getItem('capstone_onboarding_complete');
    const neverShow = localStorage.getItem('capstone_onboarding_skip');
    
    if (completed) {
      setOnboardingComplete(true);
    }
    
    // Show tour on first visit unless dismissed
    if (!completed && !neverShow) {
      setShowTour(true);
    }
  }, []);

  const startTour = () => {
    setShowTour(true);
    setCurrentStep(0);
  };

  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const completeTour = () => {
    setShowTour(false);
    setOnboardingComplete(true);
    localStorage.setItem('capstone_onboarding_complete', 'true');
  };

  const skipTour = () => {
    setShowTour(false);
    localStorage.setItem('capstone_onboarding_skip', 'true');
  };

  const openHelp = () => {
    setShowHelp(true);
  };

  const closeHelp = () => {
    setShowHelp(false);
  };

  return (
    <OnboardingContext.Provider
      value={{
        showTour,
        currentStep,
        onboardingComplete,
        showHelp,
        startTour,
        nextStep,
        prevStep,
        completeTour,
        skipTour,
        openHelp,
        closeHelp,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
};
