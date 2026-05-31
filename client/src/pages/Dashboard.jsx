import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import CoolLoader from '../components/CoolLoader';
import {
  ArrowRight,
  FolderPlus,
  Clock3,
  Activity,
  CheckCircle2,
  CalendarDays,
  KeyRound,
  Layers,
  Loader2,
  UserRound,
  FileText,
  AlertTriangle,
} from 'lucide-react';

const STATUS_META = {
  active: { lane: 'ongoing', label: 'In Progress', score: 55 },
  completed: { lane: 'done', label: 'Complete', score: 100 },
  archived: { lane: 'done', label: 'Archived', score: 90 },
  draft: { lane: 'todo', label: 'To Do', score: 18 },
};

const laneTitles = {
  todo: 'To Do',
  ongoing: 'In Progress',
  done: 'Complete',
};

const toDisplayDate = () => new Date().toLocaleDateString(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const estimateCompletion = (project) => {
  const base = STATUS_META[project.status]?.score ?? 38;
  const reqCount = project._count?.requirements || 0;
  const taskCount = project._count?.tasks || 0;
  const maturityBoost = Math.min(22, reqCount * 2 + taskCount);
  return Math.min(100, base + maturityBoost);
};

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [department, setDepartment] = useState('');
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [error, setError] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [joiningTeam, setJoiningTeam] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);

  const openCreateProjectModal = () => {
    setError('');
    setShowModal(true);
  };

  const closeCreateProjectModal = () => {
    if (creatingProject) return;
    setShowModal(false);
    setError('');
  };

  const resetProjectForm = () => {
    setTitle('');
    setDescription('');
    setCategory('');
    setDepartment('');
    setAcademicYear('2025/2026');
  };

  const fetchProjects = async () => {
    try {
      const [projRes, summaryRes] = await Promise.all([
        axios.get('/projects'),
        axios.get('/projects/dashboard-summary'),
      ]);
      setProjects(projRes.data);
      setDashboardSummary(summaryRes.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setError('');
    if (creatingProject) return;

    setCreatingProject(true);
    try {
      const res = await axios.post('/projects', {
        title,
        description,
        category,
        department,
        academicYear,
      });

      resetProjectForm();
      setShowModal(false);
      fetchProjects();
      navigate(`/projects/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project workspace');
    } finally {
      setCreatingProject(false);
    }
  };

  const handleJoinWithInvite = async (e) => {
    e.preventDefault();
    const normalizedCode = inviteCode
      .trim()
      .split('/')
      .filter(Boolean)
      .pop()
      ?.toUpperCase();
    if (!normalizedCode) {
      toast.error('Enter an invite code first.');
      return;
    }

    setJoiningTeam(true);
    try {
      const res = await axios.post(`/projects/join/${normalizedCode}`);
      setInviteCode('');
      await fetchProjects();
      toast.success(`Joined ${res.data.project.title}.`);
      navigate(`/projects/${res.data.project.id}#team`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to join with this invite code.');
    } finally {
      setJoiningTeam(false);
    }
  };

  const boardData = useMemo(() => {
    const normalized = projects.map((project) => {
      const meta = STATUS_META[project.status] || STATUS_META.active;
      return {
        ...project,
        lane: meta.lane,
        statusLabel: meta.label,
        completion: estimateCompletion(project),
      };
    });

    return {
      todo: normalized.filter((item) => item.lane === 'todo'),
      ongoing: normalized.filter((item) => item.lane === 'ongoing'),
      done: normalized.filter((item) => item.lane === 'done'),
    };
  }, [projects]);

  const completionAverage = useMemo(() => {
    if (!projects.length) return 0;
    const total = projects.reduce((sum, project) => sum + estimateCompletion(project), 0);
    return Math.round(total / projects.length);
  }, [projects]);

  const ongoingCount = boardData.ongoing.length;
  const doneCount = boardData.done.length;

  return (
    <div>
      <section className="board-header">
        <div className="board-title">
          <h1>Studio Board</h1>
          <p>
            Signed in as <strong>{user.name}</strong> ({user.role}).
            Track active work, review progress, and jump directly into each project workspace.
          </p>
        </div>

        <div className="dashboard-action-stack">
          <button
            type="button"
            className="dashboard-profile-button"
            onClick={() => navigate('/profile')}
            aria-label="Open profile"
          >
            <span className="user-avatar dashboard-profile-avatar">{user.name.charAt(0).toUpperCase()}</span>
            <span className="dashboard-profile-copy">
              <strong>{user.name}</strong>
              <small>{user.role}</small>
            </span>
            <span className="dashboard-profile-action">
              Open profile
              <ArrowRight size={15} />
            </span>
          </button>

          <span className="badge badge-info">
            <CalendarDays size={14} />
            {toDisplayDate()}
          </span>
          {user.role === 'student' && (
            <button className="btn btn-primary" onClick={openCreateProjectModal}>
              <FolderPlus size={16} />
              New Project
            </button>
          )}
        </div>
      </section>

      <section className="dashboard-invite-card">
        <div>
          <span className="badge badge-info">
            <KeyRound size={14} />
            Team invite
          </span>
          <h3>Join a project team</h3>
          <p>Paste an invite code from your project manager to join the workspace directly.</p>
        </div>

        <form onSubmit={handleJoinWithInvite} className="dashboard-invite-form">
          <input
            className="form-input"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="CAP-1234-ABCD"
            aria-label="Invite code"
          />
          <button type="submit" className="btn btn-secondary" disabled={joiningTeam}>
            {joiningTeam ? <Loader2 className="spinner-icon" size={15} /> : <ArrowRight size={15} />}
            Join team
          </button>
        </form>
      </section>

      {/* Workspace Summary Widgets */}
      {dashboardSummary && !summaryLoading && (
        <section className="dashboard-summary-widgets">
          <div className="dashboard-summary-grid">
            <article className="status-chip dashboard-summary-card">
              <Layers size={18} />
              <div>
                <span style={{ color: 'var(--ink-soft)', fontSize: '0.82rem' }}>Requirements</span>
                <strong>{dashboardSummary.approvedRequirements}/{dashboardSummary.totalRequirements} approved</strong>
                <small style={{ color: dashboardSummary.approvalRate >= 70 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                  {dashboardSummary.approvalRate}% approval rate
                </small>
              </div>
            </article>
            <article className="status-chip dashboard-summary-card">
              <CheckCircle2 size={18} />
              <div>
                <span style={{ color: 'var(--ink-soft)', fontSize: '0.82rem' }}>Tasks</span>
                <strong>{dashboardSummary.completedTasks}/{dashboardSummary.totalTasks} completed</strong>
                <small style={{ color: dashboardSummary.taskCompletionRate >= 70 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                  {dashboardSummary.taskCompletionRate}% completion rate
                </small>
              </div>
            </article>
            <article className="status-chip dashboard-summary-card">
              <FileText size={18} />
              <div>
                <span style={{ color: 'var(--ink-soft)', fontSize: '0.82rem' }}>Recent Uploads</span>
                <strong>{dashboardSummary.recentUploads.length} files</strong>
                {dashboardSummary.recentUploads.length > 0 && (
                  <small>
                    Latest: {dashboardSummary.recentUploads[0]?.fileName?.length > 30
                      ? dashboardSummary.recentUploads[0].fileName.slice(0, 30) + '...'
                      : dashboardSummary.recentUploads[0]?.fileName}
                  </small>
                )}
              </div>
            </article>
            <article className="status-chip dashboard-summary-card">
              <Activity size={18} />
              <div>
                <span style={{ color: 'var(--ink-soft)', fontSize: '0.82rem' }}>Projects</span>
                <strong>{dashboardSummary.totalProjects} total</strong>
                <small>{dashboardSummary.totalProjects > 0 ? `${dashboardSummary.totalProjects} workspace${dashboardSummary.totalProjects !== 1 ? 's' : ''}` : 'No workspaces'}</small>
              </div>
            </article>
          </div>
        </section>
      )}

      <section className="status-row" style={{ marginTop: '14px' }}>
        <article className="status-chip">
          <span style={{ color: 'var(--ink-soft)', fontSize: '0.82rem' }}>Average completion</span>
          <strong>{completionAverage}%</strong>
        </article>
        <article className="status-chip">
          <span style={{ color: 'var(--ink-soft)', fontSize: '0.82rem' }}>Projects in progress</span>
          <strong>{ongoingCount}</strong>
        </article>
        <article className="status-chip">
          <span style={{ color: 'var(--ink-soft)', fontSize: '0.82rem' }}>Projects complete</span>
          <strong>{doneCount}</strong>
        </article>
      </section>

  <section className="board-lanes" data-tour="studio-board">
        {['todo', 'ongoing', 'done'].map((laneKey) => (
          <article key={laneKey} className="lane">
            <div className="lane-header">
              <h3>{laneTitles[laneKey]}</h3>
              <span className="badge badge-info">{boardData[laneKey].length}</span>
            </div>

            <div className="lane-list">
              {loading && <CoolLoader compact title="Loading projects..." />}

              {!loading && boardData[laneKey].length === 0 && (
                <div className="project-tile" style={{ cursor: 'default' }}>
                  <p style={{ color: 'var(--ink-soft)' }}>Nothing here yet. Add a project or move work into this lane.</p>
                </div>
              )}

              {!loading && boardData[laneKey].map((project) => (
                <article
                  key={project.id}
                  className="project-tile"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                    <h3 style={{ fontSize: '1rem' }}>{project.title}</h3>
                    <span className="badge badge-warning">{project.statusLabel}</span>
                  </div>

                  <p style={{ fontSize: '0.9rem' }}>
                    {project.description?.length > 105
                      ? `${project.description.slice(0, 105)}...`
                      : project.description}
                  </p>

                  <div className="project-progress">
                    <div className="completion-label">
                      <span>Estimated completion</span>
                      <strong>{project.completion}%</strong>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${project.completion}%` }} />
                    </div>
                  </div>

                  <div className="project-meta">
                    <span><Layers size={13} /> {project._count?.requirements || 0} reqs</span>
                    <span><CheckCircle2 size={13} /> {project._count?.tasks || 0} tasks</span>
                    <span><Clock3 size={13} /> {project.academicYear || 'Current term'}</span>
                  </div>
                </article>
              ))}
            </div>
          </article>
        ))}
      </section>

      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(22, 19, 37, 0.36)',
            backdropFilter: 'blur(5px)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 90,
            padding: '18px',
          }}
        >
          <div className="card dashboard-modal-card" style={{ width: 'min(620px, 100%)' }}>
            <h2 style={{ marginBottom: '14px' }}>Create a project workspace</h2>
            {error && <div className="badge badge-danger" style={{ marginBottom: '12px' }}>{error}</div>}

            <form onSubmit={handleCreateProject} className="dashboard-modal-form">
              <div className="form-group">
                <label className="form-label">Project title</label>
                <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  minLength={10}
                  required
                  style={{ minHeight: '100px', resize: 'vertical' }}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input className="form-input" value={category} onChange={(e) => setCategory(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input className="form-input" value={department} onChange={(e) => setDepartment(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Academic year</label>
                <input className="form-input" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} />
              </div>

              <div className="dashboard-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeCreateProjectModal} disabled={creatingProject}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creatingProject} aria-busy={creatingProject}>
                  {creatingProject ? <Loader2 className="spinner-icon" size={15} /> : <Activity size={15} />}
                  {creatingProject ? 'Creating workspace...' : 'Create workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
