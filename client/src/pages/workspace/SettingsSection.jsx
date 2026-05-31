import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import CoolLoader from '../../components/CoolLoader';
import { useWorkspace } from './ProjectWorkspaceLayout';
import { formatCommentDate } from './workspace.helpers';
import {
  Pencil, GitBranch, ExternalLink, Link2, RefreshCw, Unlink,
  Loader2, Trash2, Download, UserRoundCheck,
} from 'lucide-react';

export const SettingsSection = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { project, canManageTeam, refreshProject, fetchWorkspaceData } = useWorkspace();

  const [loading, setLoading] = useState(true);
  const [supervisors, setSupervisors] = useState([]);
  const [projectForm, setProjectForm] = useState({
    title: '', description: '', category: '', department: '', academicYear: '', status: 'active',
  });
  const [githubForm, setGithubForm] = useState({
    repositoryUrl: '', defaultBranch: 'main', docsPath: 'docs', requirementsPath: 'requirements', notesPath: 'notes',
  });
  const [savingProject, setSavingProject] = useState(false);
  const [savingSupervisor, setSavingSupervisor] = useState(false);
  const [savingGithubConnection, setSavingGithubConnection] = useState(false);
  const [syncingGithubRepository, setSyncingGithubRepository] = useState(false);
  const [disconnectingGithubRepository, setDisconnectingGithubRepository] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [exporting, setExporting] = useState(false);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState('');

  useEffect(() => {
    if (project) {
      setProjectForm({
        title: project.title || '', description: project.description || '',
        category: project.category || '', department: project.department || '',
        academicYear: project.academicYear || '', status: project.status || 'active',
      });
      setGithubForm({
        repositoryUrl: project.githubRepositoryUrl || '', defaultBranch: project.githubDefaultBranch || 'main',
        docsPath: project.githubDocsPath || 'docs', requirementsPath: project.githubRequirementsPath || 'requirements',
        notesPath: project.githubNotesPath || 'notes',
      });
      setSelectedSupervisorId(String(project.supervisorId || ''));
      setLoading(false);
    }
  }, [project]);

  useEffect(() => {
    axios.get('/users/by-role/supervisor')
      .then((res) => setSupervisors(res.data))
      .catch(() => {});
  }, []);

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    setSavingProject(true);
    try {
      const res = await axios.put(`/projects/${id}`, projectForm);
      await refreshProject();
      toast.success('Project details updated.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to update project details.');
    } finally {
      setSavingProject(false);
    }
  };

  const handleAssignSupervisor = async () => {
    if (!selectedSupervisorId) { toast.error('Select a supervisor first.'); return; }
    setSavingSupervisor(true);
    try {
      await axios.put(`/projects/${id}`, { supervisorId: parseInt(selectedSupervisorId, 10) });
      await refreshProject();
      toast.success('Supervisor assigned.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to assign supervisor.');
    } finally {
      setSavingSupervisor(false);
    }
  };

  const handleExportProject = async () => {
    setExporting(true);
    try {
      const res = await axios.get(`/projects/${id}/export`);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project?.title?.replace(/\s+/g, '_') || 'project'}_export.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Project data exported.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to export project data.');
    } finally {
      setExporting(false);
    }
  };

  const handleUpdateGithubConnection = async (e) => {
    e.preventDefault();
    if (!githubForm.repositoryUrl.trim()) { toast.error('Enter a GitHub repository URL first.'); return; }
    setSavingGithubConnection(true);
    try {
      await axios.put(`/projects/${id}/github`, githubForm);
      await refreshProject();
      toast.success('GitHub connection saved.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to save the GitHub connection.');
    } finally {
      setSavingGithubConnection(false);
    }
  };

  const handleOpenGithubInstall = async () => {
    try {
      const res = await axios.get(`/projects/${id}/github/install-url`);
      if (!res.data.installUrl) {
        toast.error('Set VITE_GITHUB_APP_SLUG to enable the install button.');
        return;
      }
      window.open(res.data.installUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to open the GitHub App install page.');
    }
  };

  const handleSetupGithubSync = async () => {
    if (!githubForm.repositoryUrl.trim()) { toast.error('Enter a GitHub repository URL first.'); return; }
    setSavingGithubConnection(true);
    try {
      await axios.put(`/projects/${id}/github`, githubForm);
      await refreshProject();
      toast.success('GitHub sync is ready.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to set up GitHub sync.');
    } finally {
      setSavingGithubConnection(false);
    }
  };

  const handleSyncGithubRepository = async () => {
    if (!githubForm.repositoryUrl.trim()) { toast.error('Connect a GitHub repository before syncing.'); return; }
    setSyncingGithubRepository(true);
    try {
      const res = await axios.post(`/projects/${id}/github/sync`);
      await refreshProject();
      toast.success(`Imported ${res.data.importedCount} GitHub file${res.data.importedCount === 1 ? '' : 's'}.`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to sync the GitHub repository.');
    } finally {
      setSyncingGithubRepository(false);
    }
  };

  const handleDisconnectGithubRepository = async () => {
    if (!window.confirm('Disconnect the GitHub repository and remove imported GitHub files?')) return;
    setDisconnectingGithubRepository(true);
    try {
      await axios.delete(`/projects/${id}/github`);
      await refreshProject();
      toast.success('GitHub connection removed.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to disconnect the GitHub repository.');
    } finally {
      setDisconnectingGithubRepository(false);
    }
  };

  const handleDeleteProject = async () => {
    setDeletingProject(true);
    try {
      await axios.delete(`/projects/${id}`);
      toast.success('Project workspace deleted.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to delete this project.');
    } finally {
      setDeletingProject(false);
    }
  };

  if (loading) return <CoolLoader compact title="Loading settings..." />;

  return (
    <div className="settings-layout">
      <div className="grid-2 settings-grid">
        <section className="card settings-card">
          <div>
            <span className="badge badge-info"><Pencil size={14} /> Workspace settings</span>
            <h3>Edit project details</h3>
            <p>Keep the title, scope, department, category, academic year, and status current.</p>
          </div>
          <form className="settings-form" onSubmit={handleUpdateProject}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Project title</label>
                <input className="form-input" value={projectForm.title}
                  onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-input" value={projectForm.status}
                  onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input" value={projectForm.description}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} minLength={10} required />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Department or course</label>
                <input className="form-input" value={projectForm.department}
                  onChange={(e) => setProjectForm({ ...projectForm, department: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Project category</label>
                <input className="form-input" value={projectForm.category}
                  onChange={(e) => setProjectForm({ ...projectForm, category: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Academic year</label>
              <input className="form-input" value={projectForm.academicYear}
                onChange={(e) => setProjectForm({ ...projectForm, academicYear: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingProject}>
              {savingProject ? <><Loader2 className="spinner-icon" size={15} /> Saving...</> : 'Save project details'}
            </button>
          </form>
        </section>

        <section className="card github-card settings-card">
          <div>
            <span className="badge badge-info"><GitBranch size={14} /> GitHub App sync</span>
            <h3>Import repository docs through the app</h3>
            <p>Read GitHub markdown and text files into the Documents tab through an installation token, not a user token.</p>
          </div>

          <div className="github-status-grid">
            <div className="github-status-pill">
              <span>Setup</span>
              <strong>{project?.githubSyncEnabled ? 'Ready' : 'Needs setup'}</strong>
            </div>
            <div className="github-status-pill">
              <span>Repository</span>
              <strong>{project?.githubRepositoryOwner && project?.githubRepositoryName
                ? `${project.githubRepositoryOwner}/${project.githubRepositoryName}` : 'Not set'}</strong>
            </div>
            <div className="github-status-pill">
              <span>Connection</span>
              <strong>{project?.githubSyncEnabled ? 'Connected' : 'Not connected'}</strong>
            </div>
            <div className="github-status-pill">
              <span>Last sync</span>
              <strong>{project?.githubLastSyncedAt ? formatCommentDate(project.githubLastSyncedAt) : 'Never'}</strong>
            </div>
            <div className="github-status-pill">
              <span>Sync result</span>
              <strong>{project?.githubLastSyncStatus || 'Idle'}</strong>
            </div>
          </div>

          {project?.githubLastSyncSummary && <p className="github-status-summary">{project.githubLastSyncSummary}</p>}
          {project?.githubLastSyncError && <p className="github-status-error">{project.githubLastSyncError}</p>}

          <form className="settings-form github-form" onSubmit={handleUpdateGithubConnection}>
            <div className="form-group">
              <label className="form-label">Repository URL</label>
              <input className="form-input" placeholder="https://github.com/owner/repository"
                value={githubForm.repositoryUrl}
                onChange={(e) => setGithubForm({ ...githubForm, repositoryUrl: e.target.value })} required />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Default branch</label>
                <input className="form-input" value={githubForm.defaultBranch}
                  onChange={(e) => setGithubForm({ ...githubForm, defaultBranch: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Docs folder</label>
                <input className="form-input" value={githubForm.docsPath}
                  onChange={(e) => setGithubForm({ ...githubForm, docsPath: e.target.value })} />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Requirements folder</label>
                <input className="form-input" value={githubForm.requirementsPath}
                  onChange={(e) => setGithubForm({ ...githubForm, requirementsPath: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Notes folder</label>
                <input className="form-input" value={githubForm.notesPath}
                  onChange={(e) => setGithubForm({ ...githubForm, notesPath: e.target.value })} />
              </div>
            </div>
            <p className="github-helper-text">
              Install the GitHub App on the repository, then click Set up GitHub sync. Capstone discovers the installation
              automatically and imports supported markdown and text files from the selected folders.
            </p>
            <div className="github-actions">
              <button type="button" className="btn btn-secondary" onClick={handleOpenGithubInstall}
                disabled={!githubForm.repositoryUrl.trim()}>
                <ExternalLink size={15} /> Open GitHub App
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSetupGithubSync}
                disabled={savingGithubConnection}>
                {savingGithubConnection ? <><Loader2 className="spinner-icon" size={15} /> Setting up...</> : <><Link2 size={15} /> Set up GitHub sync</>}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleSyncGithubRepository}
                disabled={syncingGithubRepository || !githubForm.repositoryUrl.trim()}>
                {syncingGithubRepository ? <><Loader2 className="spinner-icon" size={15} /> Syncing...</> : <><RefreshCw size={15} /> Sync now</>}
              </button>
              <button type="button" className="btn btn-secondary github-disconnect-button" onClick={handleDisconnectGithubRepository}
                disabled={disconnectingGithubRepository || !project?.githubSyncEnabled}>
                {disconnectingGithubRepository ? <><Loader2 className="spinner-icon" size={15} /> Disconnecting...</> : <><Unlink size={15} /> Disconnect</>}
              </button>
            </div>
          </form>
        </section>
      </div>

      <div className="grid-2 settings-grid">
        <section className="card settings-card">
          <div>
            <span className="badge badge-info"><UserRoundCheck size={14} /> Supervision</span>
            <h3>Assign a supervisor</h3>
            <p>Set the project supervisor who will review requirements, give feedback, and evaluate readiness.</p>
          </div>
          <div className="settings-form">
            <div className="form-group">
              <label className="form-label">Current supervisor</label>
              <p style={{ margin: '4px 0', color: 'var(--ink-soft)' }}>
                {project?.supervisor?.name || 'None assigned'}
              </p>
            </div>
            <div className="form-group">
              <label className="form-label">Select supervisor</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select className="form-input" value={selectedSupervisorId}
                  onChange={(e) => setSelectedSupervisorId(e.target.value)}
                  style={{ background: 'var(--bg-secondary)' }}>
                  <option value="">-- Choose a supervisor --</option>
                  {supervisors.map((sup) => (
                    <option key={sup.id} value={sup.id}>{sup.name} ({sup.email})</option>
                  ))}
                </select>
                <button type="button" className="btn btn-primary" onClick={handleAssignSupervisor}
                  disabled={savingSupervisor || !selectedSupervisorId}>
                  {savingSupervisor ? <Loader2 className="spinner-icon" size={15} /> : <UserRoundCheck size={15} />}
                  Assign
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="card settings-card">
          <div>
            <span className="badge badge-info"><Download size={14} /> Export</span>
            <h3>Export project data</h3>
            <p>Download all requirements, tasks, files, logs, comments, and readiness scores as a single JSON file.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '8px' }}>
            <button type="button" className="btn btn-primary" onClick={handleExportProject} disabled={exporting}>
              {exporting ? <Loader2 className="spinner-icon" size={16} /> : <Download size={16} />}
              {exporting ? 'Exporting...' : 'Export as JSON'}
            </button>
            <span style={{ fontSize: '0.82rem', color: 'var(--ink-soft)' }}>
              Includes members, requirements with criteria and tests, tasks, files, logs, comments, and readiness.
            </span>
          </div>
        </section>
      </div>

      <section className="card danger-zone-card">
        <div>
          <span className="badge badge-danger"><Trash2 size={14} /> Danger zone</span>
          <h3>Delete project workspace</h3>
          <p>This removes the project and its connected records. Use only when the workspace is no longer needed.</p>
        </div>
        <div className="form-group">
          <label className="form-label">Type DELETE to enable deletion</label>
          <input className="form-input" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} />
        </div>
        <button type="button" className="btn btn-danger" onClick={handleDeleteProject}
          disabled={deletingProject || deleteConfirmText !== 'DELETE'}>
          {deletingProject ? 'Deleting...' : 'Delete project'}
        </button>
      </section>
    </div>
  );
};

export default SettingsSection;
