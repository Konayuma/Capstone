import React from 'react';
import { useDemo } from '../context/DemoContext';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, X, Sparkles, Zap, MousePointer2 } from 'lucide-react';

const DEMO_MODE_STORAGE_KEY = 'capstone.demoMode';

export const DemoLauncher = () => {
  const { isActive, start } = useDemo();

  if (isActive) return null;

  const handleStart = () => {
    localStorage.setItem(DEMO_MODE_STORAGE_KEY, 'true');
    start();
  };

  return (
    <div className="demo-launcher">
      <button
        type="button"
        className="demo-launcher-btn"
        onClick={handleStart}
        aria-label="Launch demo mode"
        title="Launch demo mode"
      >
        <Sparkles size={18} />
        <span>Demo</span>
      </button>
    </div>
  );
};

export const DemoOverlay = () => {
  const {
    isActive,
    currentStep,
    playState,
    speed,
    totalSteps,
    currentStepData,
    pause,
    resume,
    restart,
    stop,
    goToStep,
    toggleSpeed,
  } = useDemo();

  if (!isActive || !currentStepData) return null;

  const isPlaying = playState === 'playing';
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const targetEl = currentStepData.target
    ? document.querySelector(currentStepData.target)
    : null;

  return (
    <div className="demo-overlay-container" role="dialog" aria-label="Demo mode">
      <div className="demo-backdrop" onClick={isPlaying ? pause : resume} />

      {targetEl && (
        <div
          className="demo-spotlight"
          style={getBoundingRect(targetEl)}
        />
      )}

      <div className="demo-tooltip">
        <div className="demo-tooltip-header">
          <div>
            <span className="demo-step-counter">
              Step {currentStep + 1} / {totalSteps}
            </span>
            <h3 className="demo-tooltip-title">{currentStepData.title}</h3>
          </div>
          <button
            type="button"
            className="demo-tooltip-close"
            onClick={stop}
            aria-label="Exit demo"
          >
            <X size={16} />
          </button>
        </div>
        <p className="demo-tooltip-desc">{currentStepData.description}</p>
        {currentStepData.action === 'DEMO_LOGIN' && (
          <div className="demo-hint">
            <MousePointer2 size={14} />
            Auto-logging in as <strong>demo@capstonestudio.ai</strong>
          </div>
        )}
      </div>

      <div className="demo-controls">
        <div className="demo-controls-row">
          <div className="demo-controls-left">
            <span className="demo-speed-label">{speed}x</span>
          </div>
          <div className="demo-controls-center">
            <button
              type="button"
              className="demo-ctrl-btn"
              onClick={() => goToStep(0)}
              aria-label="Restart demo"
              title="Restart"
            >
              <RotateCcw size={16} />
            </button>
            <button
              type="button"
              className="demo-ctrl-btn"
              onClick={() => goToStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              aria-label="Previous step"
              title="Previous"
            >
              <SkipBack size={16} />
            </button>
            <button
              type="button"
              className="demo-ctrl-btn demo-ctrl-btn--play"
              onClick={isPlaying ? pause : resume}
              aria-label={isPlaying ? 'Pause demo' : 'Resume demo'}
              title={isPlaying ? 'Pause' : 'Resume'}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button
              type="button"
              className="demo-ctrl-btn"
              onClick={() => goToStep(Math.min(totalSteps - 1, currentStep + 1))}
              disabled={currentStep >= totalSteps - 1}
              aria-label="Next step"
              title="Next"
            >
              <SkipForward size={16} />
            </button>
            <button
              type="button"
              className="demo-ctrl-btn"
              onClick={restart}
              aria-label="Restart from beginning"
              title="Restart from beginning"
            >
              <RotateCcw size={16} />
            </button>
          </div>
          <div className="demo-controls-right">
            <button
              type="button"
              className="demo-ctrl-btn demo-speed-btn"
              onClick={toggleSpeed}
              aria-label={`Speed: ${speed}x`}
              title={`Speed: ${speed}x`}
            >
              <Zap size={14} />
              <span>{speed}x</span>
            </button>
          </div>
        </div>
        <div className="demo-progress-track">
          <div
            className="demo-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

function getBoundingRect(el) {
  if (!el) return {};
  const rect = el.getBoundingClientRect();
  return {
    left: rect.left - 6,
    top: rect.top - 6,
    width: rect.width + 12,
    height: rect.height + 12,
  };
}

export default DemoOverlay;
