import React, { useState, useEffect, useMemo, createContext, useContext, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Outlet } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import CoolLoader from '../../components/CoolLoader';
import ActionDelight from '../../components/ActionDelight';
import {
  Sparkles, ListTodo, BarChart3, Download, MessageSquare,
  Users, FileText, Settings, GraduationCap,
  Layers, CheckCircle2, Clock3,
} from 'lucide-react';
import { getInitials } from './workspace.helpers';

const WorkspaceContext = createContext(null);
export const useWorkspace = () => useContext(WorkspaceContext);

const tabConfig = [
  { id: 'requirements', label: 'Requirements', icon: Sparkles, badgeKey: 'requirements', tour: 'requirements' },
  { id: 'traceability', label: 'Traceability', icon: Layers, badgeKey: null, tour: null },
  { id: 'tasks', label: 'Tasks', icon: ListTodo, badgeKey: 'tasks', tour: 'tasks' },
  { id: 'team', label: 'Team', icon: Users, badgeKey: null, tour: null },
  { id: 'contribution', label: 'Contributions', icon: BarChart3, badgeKey: null, tour: null },
  { id: 'readiness', label: 'Readiness & Reports', icon: Download, badgeKey: null, tour: null },
  { id: 'documents', label: 'Documents', icon: FileText, badgeKey: 'files', tour: 'documents' },
  { id: 'notes', label: 'Notes', icon: MessageSquare, badgeKey: 'comments', tour: null },
  { id: 'settings', label: 'Settings', icon: Settings, badgeKey: null, tour: null },
];

const delightCopy = {
  upload: [
    { title: 'Document received', message: 'The archive is in. The workspace has fresh evidence to work with.' },
    { title: 'Upload complete', message: 'That piece is safely in the library and ready for review.' },
  ],
  task: [
    { title: 'Task closed', message: 'One more moving part is off the board.' },
    { title: 'Nice finish', message: 'That task is wrapped and ready for the next handoff.' },
  ],
};

export const ProjectWorkspaceLayout = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [canManageTeam, setCanManageTeam] = useState(false);
  const [loading, setLoading] = useState(true);
  const [delight, setDelight] = useState(null);
  const [counts, setCounts] = useState({ requirements: 0, tasks: 0, files: 0, comments: 0 });

  const delightTimeoutRef = React.useRef(null);

  useEffect(() => () => {
    if (delightTimeoutRef.current) clearTimeout(delightTimeoutRef.current);
  }, []);

  const triggerDelight = useCallback((kind) => {
    const choices = delightCopy[kind] || delightCopy.upload;
    const picked = choices[Math.floor(Math.random() * choices.length)];
    if (delightTimeoutRef.current) clearTimeout(delightTimeoutRef.current);
    setDelight(picked);
    delightTimeoutRef.current = setTimeout(() => setDelight(null), 2400);
  }, []);

  const activeTab = useMemo(() => {
    const path = location.pathname.replace(`/projects/${id}/`, '');
    return path || 'requirements';
  }, [location.pathname, id]);

  const fetchWorkspaceData = useCallback(async () => {
    try {
      const [projRes, memberRes] = await Promise.all([
        axios.get(`/projects/${id}`),
        axios.get(`/projects/${id}/members`),
      ]);
      setProject(projRes.data);
      setTeamMembers(memberRes.data.members || []);
      setCanManageTeam(Boolean(memberRes.data.canManageTeam));
      return { project: projRes.data, members: memberRes.data.members || [] };
    } catch (err) {
      console.error('Failed to load workspace:', err);
      throw err;
    }
  }, [id]);

  const refreshProject = useCallback(async () => {
    const projRes = await axios.get(`/projects/${id}`);
    setProject(projRes.data);
    return projRes.data;
  }, [id]);

  const refreshTeam = useCallback(async () => {
    const memberRes = await axios.get(`/projects/${id}/members`);
    setTeamMembers(memberRes.data.members || []);
    setCanManageTeam(Boolean(memberRes.data.canManageTeam));
    return memberRes.data;
  }, [id]);

  useEffect(() => {
    setLoading(true);
    fetchWorkspaceData().finally(() => setLoading(false));
  }, [fetchWorkspaceData]);

  const switchTab = useCallback((tab) => {
    navigate(`/projects/${id}/${tab}`, { replace: true });
  }, [navigate, id]);

  const visibleTeamStack = teamMembers.slice(0, 5);
  const extraTeamCount = Math.max(0, teamMembers.length - visibleTeamStack.length);

  const workspaceProgress = useMemo(() => {
    return Math.max(0, Math.min(100, Math.round(
      (counts.requirements ? Math.min(counts.requirements, 10) * 4 : 0)
      + (counts.tasks ? 20 : 0)
    )));
  }, [counts]);

  const workspaceProgressLabel = workspaceProgress >= 75
    ? 'Strong momentum'
    : workspaceProgress >= 45
      ? 'Taking shape'
      : 'Just getting started';

  const contextValue = useMemo(() => ({
    project,
    teamMembers,
    canManageTeam,
    counts,
    setCounts,
    refreshTeam,
    refreshProject,
    triggerDelight,
    fetchWorkspaceData,
  }), [project, teamMembers, canManageTeam, counts, refreshTeam, refreshProject, triggerDelight, fetchWorkspaceData]);

  if (loading) return <CoolLoader title="Scaffolding workspace" subtitle="Loading project data and team signals..." />;
  if (!project) return <div>Workspace not found.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', textAlign: 'left' }}>
      <ActionDelight visible={Boolean(delight)} title={delight?.title} message={delight?.message} />

      <div className="workspace-header">
        <div className="workspace-header-copy">
          <span className="badge badge-info" style={{ marginBottom: '8px' }}>Project Workspace</span>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>{project.title}</h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '800px' }}>{project.description}</p>
        </div>

        <div className="workspace-actions">
          <button
            type="button"
            className="member-stack"
            onClick={() => switchTab('team')}
            aria-label="Open team members"
            title="Open team members"
          >
            {visibleTeamStack.map((member) => (
              <span key={member.userId} className="member-stack-avatar" title={member.user.name}>
                {getInitials(member.user.name)}
              </span>
            ))}
            {extraTeamCount > 0 && <span className="member-stack-more">+{extraTeamCount}</span>}
          </button>
          <button
            onClick={() => navigate(`/projects/${id}/viva`)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <GraduationCap size={20} />
            <span>Open Viva Practice</span>
          </button>
        </div>
      </div>

      <section className="card workspace-live-hero" aria-live="polite">
        <div className="workspace-live-hero-copy">
          <span className="badge badge-info">Live board</span>
          <h2>Progress updates as the workspace changes.</h2>
          <p>Tasks, documents, and notes stay in sync with uploads, status changes, and review activity.</p>
        </div>

        <div className="workspace-live-hero-panel">
          <div className="workspace-live-hero-head">
            <span>{workspaceProgressLabel}</span>
            <strong>{workspaceProgress}%</strong>
          </div>
          <div className="workspace-progress-track workspace-progress-track--live" aria-hidden="true">
            <div className="workspace-progress-fill workspace-progress-fill--live" style={{ width: `${workspaceProgress}%` }} />
          </div>
          <div className="workspace-live-metrics" aria-label="Live workspace counts">
            <article className="workspace-live-metric">
              <strong>{counts.tasks}</strong>
              <span>Tasks</span>
              <small>{counts.tasks > 0 ? `${counts.tasks} total` : 'No tasks yet'}</small>
            </article>
            <article className="workspace-live-metric">
              <strong>{counts.files}</strong>
              <span>Documents</span>
              <small>{counts.files > 0 ? `${counts.files} uploaded` : 'No files yet'}</small>
            </article>
            <article className="workspace-live-metric">
              <strong>{counts.comments}</strong>
              <span>Notes</span>
              <small>{counts.comments > 0 ? 'Live review thread' : 'No notes yet'}</small>
            </article>
          </div>
        </div>
      </section>

      <div className="workspace-tabs">
        {tabConfig.map((tab) => {
          const Icon = tab.icon;
          const badgeCount = tab.badgeKey ? counts[tab.badgeKey] : null;
          return (
            <button
              key={tab.id}
              className={`btn workspace-tab ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => switchTab(tab.id)}
              data-tour={tab.tour || undefined}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {badgeCount !== null && badgeCount !== undefined && (
                <span className="workspace-tab-badge">{badgeCount}</span>
              )}
            </button>
          );
        })}
      </div>

      <main style={{ marginTop: '16px' }}>
        <WorkspaceContext.Provider value={contextValue}>
          <Outlet />
        </WorkspaceContext.Provider>
      </main>
    </div>
  );
};

export default ProjectWorkspaceLayout;
