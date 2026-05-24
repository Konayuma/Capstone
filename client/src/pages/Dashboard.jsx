import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  FolderPlus, 
  ChevronRight, 
  AlertTriangle,
  GraduationCap,
  Layers,
  CheckCircle2,
  Calendar
} from 'lucide-react';

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // New project modal states
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Upper Welcome Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ textAlign: 'left' }}>
          <h1>Welcome back, {user.name}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {user.role === 'student' 
              ? 'Track your project deliverable timelines and refine specifications for panel presentation.'
              : 'Audit student groups, check individual tasks contribution metrics, and leave review comments.'}
          </p>
        </div>
        
        {user.role === 'student' && (
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <FolderPlus size={18} />
            <span>Create Workspace</span>
          </button>
        )}
      </div>

      {/* Main Workspace List */}
      <section style={{ textAlign: 'left' }}>
        <h2 style={{ marginBottom: '20px' }}>Active Capstone Workspaces</h2>
        
        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>Scanning active workspaces...</div>
        ) : projects.length === 0 ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
            <FolderPlus size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
            <h3>No Active Workspaces Found</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '400px', marginInline: 'auto' }}>
              Create a new workspace project to start mapping functional requirements, recording contribution tasks, and running AI viva simulations.
            </p>
            {user.role === 'student' && (
              <button onClick={() => setShowModal(true)} className="btn btn-primary">
                Initialize First Workspace
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {projects.map((proj) => (
              <div 
                key={proj.id} 
                className="card"
                onClick={() => navigate(`/projects/${proj.id}`)}
                style={{ 
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '24px'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h3 style={{ margin: 0 }}>{proj.title}</h3>
                    <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
                      {proj.status}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '700px' }}>
                    {proj.description.substring(0, 150)}...
                  </p>
                  <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Layers size={14} />
                      {proj._count?.requirements || 0} Requirements
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={14} />
                      {proj._count?.tasks || 0} Tasks
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} />
                      Term: {proj.academicYear || '2025/2026'}
                    </span>
                  </div>
                </div>
                <ChevronRight size={24} style={{ color: 'var(--text-muted)' }} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Creation Modal (Standard HTML overlay styled beautifully) */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(8px)'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', padding: '40px' }}>
            <h2 style={{ marginBottom: '24px' }}>Create Capstone Workspace</h2>
            
            {error && (
              <div className="badge badge-danger" style={{ width: '100%', padding: '12px', borderRadius: '12px', marginBottom: '20px', justifyContent: 'center' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Project Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Autonomous Agrobot Router"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Raw Scope Description (At least 10 characters)</label>
                <textarea 
                  className="form-input" 
                  placeholder="A robot navigating fields automatically avoiding obstacles and recording crop health..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ minHeight: '100px', resize: 'vertical' }}
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Robotics, Blockchain"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Computer Engineering"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Launch Workspace
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
