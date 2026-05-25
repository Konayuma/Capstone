import React from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';

const ActionDelight = ({ visible, title, message }) => {
  if (!visible) return null;

  return (
    <div className="action-delight" role="status" aria-live="polite">
      <span className="action-delight-icon">
        <Sparkles size={14} />
      </span>
      <div className="action-delight-copy">
        <strong>{title}</strong>
        <p>{message}</p>
      </div>
      <CheckCircle2 size={15} className="action-delight-check" />
    </div>
  );
};

export default ActionDelight;
