import React, { useEffect, useState, useId } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import CoolLoader from '../components/CoolLoader';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  FolderKanban,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  Save,
  FileText,
  MessageSquare,
  HelpCircle,
  ClipboardList,
  Loader2,
} from 'lucide-react';

const getInitials = (name = '') => name
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0]?.toUpperCase())
  .join('') || '?';

const roleLabel = (role) => ({
  project_manager: 'Project Manager',
  frontend_dev: 'Frontend Developer',
  backend_dev: 'Backend Developer',
  fullstack_dev: 'Full-stack Developer',
  ui_ux: 'UI/UX Designer',
  tester: 'Tester',
  researcher: 'Researcher',
  doc_lead: 'Documentation Lead',
}[role] || 'Team Member');

const statConfig = [
  { key: 'progressLogs', label: 'Progress logs', icon: MessageSquare },
  { key: 'uploadedFiles', label: 'Uploaded files', icon: FileText },
  { key: 'vivaAnswers', label: 'Viva answers', icon: HelpCircle },
];

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const formId = useId();
  const projectId = searchParams.get('projectId');
  const targetUserId = userId || user?.id;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profilePassword, setProfilePassword] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!targetUserId) return;

      try {
        const res = await axios.get(`/users/${targetUserId}`);
        setProfile(res.data);
        setProfileName(res.data.name);
      } catch (err) {
        toast.error(err.response?.data?.error || 'Unable to load this profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [targetUserId]);

  const isOwnProfile = profile && user && String(profile.id) === String(user.id);

  const handleAddToProject = async () => {
    if (!projectId) return;
    setAdding(true);
    try {
      await axios.post(`/projects/${projectId}/members`, {
        userId: profile.id,
        projectRole: 'researcher',
      });
      toast.success(`${profile.name} was added to the team.`);
      navigate(`/projects/${projectId}/team`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to add this user to the project.');
    } finally {
      setAdding(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!isOwnProfile) return;

    setSavingProfile(true);
    try {
      const payload = { name: profileName.trim() };
      if (profilePassword.trim()) payload.password = profilePassword;
      const updated = await updateProfile(payload);
      setProfile((current) => ({ ...current, ...updated }));
      setProfilePassword('');
      toast.success('Profile updated.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) return <CoolLoader title="Opening profile" subtitle="Loading team history and project signals..." />;

  if (!profile) {
    return (
      <div className="profile-page">
        <div className="profile-section">
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
            Back
          </button>
          <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
            <h3>Profile not found</h3>
            <p style={{ color: 'var(--text-muted)' }}>This user may have been removed or the link is incorrect.</p>
          </div>
        </div>
      </div>
    );
  }

  const alreadyOnProject = projectId
    && profile.memberships?.some((m) => String(m.project.id) === String(projectId));

  return (
    <div className="profile-page">
      {/* Hero */}
      <section className="profile-section profile-hero">
        <span className="profile-avatar-xl" aria-hidden="true">{getInitials(profile.name)}</span>
        <div className="profile-hero-copy">
          <div className="profile-hero-badges">
            <span className="badge badge-info">{profile.role}</span>
            {projectId && alreadyOnProject && (
              <span className="badge badge-success">
                <CheckCircle2 size={13} />
                On your team
              </span>
            )}
          </div>
          <h1>{profile.name}</h1>
          <p>{profile.email}</p>
        </div>
        <div className="profile-hero-actions">
          <button
            className="btn btn-secondary profile-back-btn"
            onClick={() => navigate(projectId ? `/projects/${projectId}/team` : -1)}
            aria-label="Go back"
          >
            <ArrowLeft size={16} />
            <span className="profile-back-label">Back</span>
          </button>
          {projectId && !alreadyOnProject && (
            <button className="btn btn-primary" onClick={handleAddToProject} disabled={adding}>
              {adding ? <Loader2 className="spinner-icon" size={16} /> : <UserPlus size={16} />}
              {adding ? 'Adding...' : 'Add to project'}
            </button>
          )}
        </div>
      </section>

      {/* Edit profile */}
      {isOwnProfile && (
        <section className="profile-section">
          <div className="card profile-panel">
            <div>
              <span className="badge badge-info">Account details</span>
              <h3>Edit profile</h3>
            </div>

            <form className="profile-edit-form" onSubmit={handleSaveProfile} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor={`${formId}-name`}>Display name</label>
                <input
                  id={`${formId}-name`}
                  className="form-input"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  minLength={2}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor={`${formId}-password`}>New password</label>
                <input
                  id={`${formId}-password`}
                  className="form-input"
                  type="password"
                  value={profilePassword}
                  onChange={(e) => setProfilePassword(e.target.value)}
                  minLength={6}
                  placeholder="Leave blank to keep current password"
                  autoComplete="new-password"
                />
              </div>
              <div className="profile-edit-actions">
                <button className="btn btn-secondary" type="button" onClick={() => {
                  setProfileName(profile.name);
                  setProfilePassword('');
                }}>
                  Reset
                </button>
                <button className="btn btn-primary" type="submit" disabled={savingProfile}>
                  {savingProfile ? <Loader2 className="spinner-icon" size={16} /> : <Save size={16} />}
                  {savingProfile ? 'Saving...' : 'Save profile'}
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* Stats */}
      <section className="profile-section profile-grid">
        {statConfig.map(({ key, label, icon: Icon }) => (
          <article key={key} className="card profile-stat">
            <span className="profile-stat-icon"><Icon size={18} /></span>
            <span className="profile-stat-label">{label}</span>
            <strong className="profile-stat-value">{profile._count?.[key] || 0}</strong>
          </article>
        ))}
      </section>

      {/* Projects + Tasks */}
      <section className="profile-section grid-2">
        <article className="card profile-panel">
          <div>
            <span className="badge badge-info">
              <FolderKanban size={14} />
              Projects
            </span>
            <h3>Project history</h3>
          </div>

          <div className="profile-list">
            {profile.memberships?.length ? (
              profile.memberships.map((membership) => (
                <button
                  key={`${membership.project.id}-${membership.joinedAt}`}
                  type="button"
                  className="profile-list-item"
                  onClick={() => navigate(`/projects/${membership.project.id}/team`)}
                >
                  <span className="profile-list-item-copy">
                    <strong>{membership.project.title}</strong>
                    <small>{membership.project.academicYear || 'Current term'} &middot; {membership.project.status}</small>
                  </span>
                  <span className="badge badge-info profile-list-item-role">
                    {membership.isLeader && <ShieldCheck size={13} />}
                    {roleLabel(membership.projectRole)}
                  </span>
                </button>
              ))
            ) : (
              <div className="profile-list-empty">
                <FolderKanban size={24} />
                <p>No project memberships yet.</p>
                <small>Join a team or ask a supervisor to add you.</small>
              </div>
            )}
          </div>
        </article>

        <article className="card profile-panel">
          <div>
            <span className="badge badge-info">
              <ClipboardList size={14} />
              Tasks
            </span>
            <h3>Recent tasks</h3>
          </div>

          <div className="profile-list">
            {profile.assignedTasks?.length ? (
              profile.assignedTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  className="profile-list-item"
                  onClick={() => navigate(`/projects/${task.projectId}/tasks`)}
                >
                  <span className="profile-list-item-copy">
                    <strong>{task.title}</strong>
                    <small>{task.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</small>
                  </span>
                  <span className={`badge ${task.status === 'completed' ? 'badge-success' : task.status === 'in_progress' ? 'badge-warning' : 'badge-info'}`}>
                    {task.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                </button>
              ))
            ) : (
              <div className="profile-list-empty">
                <ClipboardList size={24} />
                <p>No assigned tasks yet.</p>
                <small>Tasks will appear here once the project lead assigns work.</small>
              </div>
            )}
          </div>
        </article>
      </section>
    </div>
  );
};

export default UserProfile;
