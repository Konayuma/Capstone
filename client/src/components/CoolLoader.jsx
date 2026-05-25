import React from 'react';
import { Sparkles } from 'lucide-react';

export const CoolLoader = ({ title = 'Loading your workspace', subtitle = 'Pulling together project details, files, and team activity...', compact = false }) => {
  return (
    <section className={`cool-loader-shell ${compact ? 'compact' : ''}`} aria-live="polite" aria-busy="true">
      <div className="cool-loader-orbit" aria-hidden="true">
        <span className="orbit orbit-a" />
        <span className="orbit orbit-b" />
        <span className="orbit orbit-c" />
        <span className="loader-core">
          <Sparkles size={18} />
        </span>
      </div>

      <div className="cool-loader-copy">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>

      <div className="cool-loader-activity" aria-hidden="true">
        <span style={{ animationDelay: '0ms' }} />
        <span style={{ animationDelay: '120ms' }} />
        <span style={{ animationDelay: '240ms' }} />
      </div>
    </section>
  );
};

export default CoolLoader;
