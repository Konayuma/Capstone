import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  FolderPlus,
  Clock3,
  Activity,
  CheckCircle2,
  CalendarDays,
  Layers,
} from 'lucide-react';

const STATUS_META = {
  active: { lane: 'ongoing', label: 'On Going', score: 55 },
  completed: { lane: 'done', label: 'Complete', score: 100 },
  archived: { lane: 'done', label: 'Archived', score: 90 },
  draft: { lane: 'todo', label: 'To Do', score: 18 },
};

const laneTitles = {
  todo: 'To Do',
  ongoing: 'On Going',
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
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [department, setDepartment] = useState('');
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [error, setError] = useState('');

  const fetchProjects = async () => {
    try {
      const res = await axios.get('/projects');
      setProjects(res.data);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('/projects', {
        title,
        description,
        category,
        department,
        academicYear,
      });

      setShowModal(false);
      setTitle('');
      setDescription('');
      setCategory('');
      setDepartment('');
      fetchProjects();
      navigate(`/projects/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project workspace');
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
            Keep track of active work, see completion signals, and jump directly into each workspace.
          </p>
        </div>

        <div style={{ display: 'grid', gap: '10px', minWidth: '220px', alignSelf: 'start' }}>
          <span className="badge badge-info">
            <CalendarDays size={14} />
            {toDisplayDate()}
          </span>
          {user.role === 'student' && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <FolderPlus size={16} />
              New Project
            </button>
          )}
        </div>
      </section>

      <section className="status-row" style={{ marginTop: '14px' }}>
        <article className="status-chip">
          <span style={{ color: 'var(--ink-soft)', fontSize: '0.82rem' }}>Average completion</span>
          <strong>{completionAverage}%</strong>
        </article>
        <article className="status-chip">
          <span style={{ color: 'var(--ink-soft)', fontSize: '0.82rem' }}>Projects on going</span>
          <strong>{ongoingCount}</strong>
        </article>
        <article className="status-chip">
          <span style={{ color: 'var(--ink-soft)', fontSize: '0.82rem' }}>Projects complete</span>
          <strong>{doneCount}</strong>
        </article>
      </section>

      <section className="board-lanes">
        {['todo', 'ongoing', 'done'].map((laneKey) => (
          <article key={laneKey} className="lane">
            <div className="lane-header">
              <h3>{laneTitles[laneKey]}</h3>
              <span className="badge badge-info">{boardData[laneKey].length}</span>
            </div>

            <div className="lane-list">
              {loading && <p>Loading projects...</p>}

              {!loading && boardData[laneKey].length === 0 && (
                <div className="project-tile" style={{ cursor: 'default' }}>
                  <p style={{ color: 'var(--ink-soft)' }}>No projects in this lane yet.</p>
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
                      <span>Completion signal</span>
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
          <div className="card" style={{ width: 'min(620px, 100%)' }}>
            <h2 style={{ marginBottom: '14px' }}>Create a New Project</h2>
            {error && <div className="badge badge-danger" style={{ marginBottom: '12px' }}>{error}</div>}

            <form onSubmit={handleCreateProject} style={{ display: 'grid', gap: '12px' }}>
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <Activity size={15} />
                  Create project
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
