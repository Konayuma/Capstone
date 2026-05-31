import { API_ORIGIN } from '../../lib/apiBase';

export const taskStatusLabel = {
  todo: 'Open',
  in_progress: 'In progress',
  review: 'In review',
  completed: 'Closed',
  rejected: 'Needs changes',
};

export const formatTaskDeadline = (deadline) => {
  if (!deadline) return 'No deadline';
  const date = new Date(deadline);
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(date);
};

export const toDateTimeInputValue = (deadline) => {
  if (!deadline) return '';
  const date = new Date(deadline);
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
};

export const isOverdueTask = (task) => (
  task.deadline && task.status !== 'completed' && new Date(task.deadline) < new Date()
);

export const getInitials = (name = '') => name
  .split(' ').filter(Boolean).slice(0, 2)
  .map((part) => part[0]?.toUpperCase()).join('') || '?';

export const formatCommentDate = (value) => new Intl.DateTimeFormat(undefined, {
  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
}).format(new Date(value));

export const formatFileSize = (size) => {
  if (!size) return 'Unknown size';
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export const formatProjectFileTypeLabel = (fileType = '') => {
  const normalized = String(fileType || '').trim();
  if (!normalized) return 'Document';
  if (normalized.startsWith('github:')) return `GitHub ${normalized.split(':')[1] || 'document'}`;
  return normalized.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

export const getFileUrl = (file) => (
  file.filePath?.startsWith('http') ? file.filePath : `${API_ORIGIN}${file.filePath}`
);

export const projectRoleOptions = [
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'frontend_dev', label: 'Frontend Developer' },
  { value: 'backend_dev', label: 'Backend Developer' },
  { value: 'fullstack_dev', label: 'Full-stack Developer' },
  { value: 'ui_ux', label: 'UI/UX Designer' },
  { value: 'tester', label: 'Tester' },
  { value: 'researcher', label: 'Researcher' },
  { value: 'doc_lead', label: 'Documentation Lead' },
];

export const roleLabelMap = projectRoleOptions.reduce((labels, option) => {
  labels[option.value] = option.label;
  return labels;
}, {});

export const getProjectRoleLabel = (role) => roleLabelMap[role] || 'Team Member';

export const commentTargetOptions = [
  { id: 'project', label: 'Project / General Dashboard', note: 'Use this for direction, scope, or whole-workspace feedback.' },
  { id: 'requirement', label: 'Requirements Specification', note: 'Use this for spec gaps, unclear wording, or testability issues.' },
  { id: 'task', label: 'Task Delivery', note: 'Use this for task scope, deadlines, evidence, or review status.' },
  { id: 'document', label: 'Project Documents', note: 'Use this for proposal, report, slides, source archive, or evidence files.' },
  { id: 'contribution', label: 'Contribution Score Audit', note: 'Use this for contribution reviews and peer assessment notes.' },
  { id: 'viva', label: 'Viva Readiness', note: 'Use this for defense preparation and examiner-style feedback.' },
];

export const commentTargetLabels = commentTargetOptions.reduce((labels, option) => {
  labels[option.id] = option.label;
  return labels;
}, {});

export const getCommentTargetLabel = (targetType) => commentTargetLabels[targetType] || targetType;

export const fileTypeOptions = [
  { value: 'proposal', label: 'Project proposal' },
  { value: 'report', label: 'Project report' },
  { value: 'slides', label: 'Presentation slides' },
  { value: 'code', label: 'Source code ZIP' },
  { value: 'screenshot', label: 'Screenshot' },
  { value: 'evidence', label: 'Testing evidence' },
  { value: 'diagram', label: 'Diagram' },
];

export const stripMarkdownEmphasis = (text) => text
  .replace(/\*\*(.*?)\*\*/g, '$1')
  .replace(/__(.*?)__/g, '$1')
  .replace(/\*(.*?)\*/g, '$1')
  .replace(/_(.*?)_/g, '$1')
  .replace(/`([^`]+)`/g, '$1')
  .trim();

export const parseAnalysisSections = (analysisText) => {
  const lines = analysisText.split(/\r?\n/);
  const sections = [];
  let currentSection = null;
  const flushSection = () => { if (currentSection) sections.push(currentSection); };
  lines.forEach((line) => {
    const headingMatch = line.match(/^#{1,3}\s+(.+)/);
    if (headingMatch) {
      flushSection();
      currentSection = { title: stripMarkdownEmphasis(headingMatch[1]), items: [] };
      return;
    }
    if (!currentSection) { currentSection = { title: 'Analysis', items: [] }; }
    const trimmed = line.trim();
    if (!trimmed) return;
    const bulletMatch = trimmed.match(/^[-*+]\s+(.+)/);
    if (bulletMatch) { currentSection.items.push(stripMarkdownEmphasis(bulletMatch[1])); return; }
    const numberedMatch = trimmed.match(/^\d+[.)]\s+(.+)/);
    if (numberedMatch) { currentSection.items.push(stripMarkdownEmphasis(numberedMatch[1])); return; }
    if (currentSection.items.length === 0) {
      currentSection.items.push(stripMarkdownEmphasis(trimmed));
    } else {
      currentSection.items[currentSection.items.length - 1] += ` ${stripMarkdownEmphasis(trimmed)}`;
    }
  });
  flushSection();
  return sections.filter((section) => section.items.length > 0);
};
