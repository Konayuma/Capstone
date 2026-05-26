import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';
import '../styles/tooltip.css';

export const Tooltip = ({ 
  children, 
  text, 
  position = 'top',
  theme = 'default',
  showIcon = true,
  persistent = false,
  onDismiss = null 
}) => {
  const [isVisible, setIsVisible] = useState(persistent);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (!isVisible || !triggerRef.current || !tooltipRef.current) return;

    const updatePosition = () => {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const gap = 8;

      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = triggerRect.top - tooltipRect.height - gap;
          left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
          break;
        case 'bottom':
          top = triggerRect.bottom + gap;
          left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
          break;
        case 'left':
          top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
          left = triggerRect.left - tooltipRect.width - gap;
          break;
        case 'right':
          top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
          left = triggerRect.right + gap;
          break;
        default:
          break;
      }

      setCoords({ top: Math.max(8, top), left: Math.max(8, left) });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isVisible, position]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) onDismiss();
  };

  return (
    <>
      <div
        ref={triggerRef}
        className="tooltip-trigger"
        onMouseEnter={() => !persistent && setIsVisible(true)}
        onMouseLeave={() => !persistent && setIsVisible(false)}
      >
        {children}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          className={`tooltip tooltip-${position} tooltip-${theme}`}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            zIndex: 1000,
            pointerEvents: 'auto',
          }}
        >
          <div className="tooltip-content">
            {showIcon && <HelpCircle size={14} className="tooltip-icon" />}
            <p>{text}</p>
          </div>
          {persistent && (
            <button
              className="tooltip-close"
              onClick={handleDismiss}
              aria-label="Dismiss tooltip"
            >
              <X size={14} />
            </button>
          )}
          <div className={`tooltip-arrow`} />
        </div>
      )}
    </>
  );
};

export const InlineTooltip = ({ text, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="inline-tooltip-container">
      <button
        className="inline-tooltip-trigger"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        aria-label="Help"
      >
        <HelpCircle size={16} />
      </button>
      {isVisible && (
        <div className="inline-tooltip-content">
          {text}
        </div>
      )}
      {children}
    </div>
  );
};
