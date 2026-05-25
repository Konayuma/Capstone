import React, { useEffect, useState } from 'react';
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

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const [searchParams] = useSearchParams();
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
      navigate(`/projects/${projectId}#team`);
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
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          Back
        </button>
        <div className="card">Profile not found.</div>
      </div>
    );
  }

  const alreadyOnProject = projectId
    && profile.memberships?.some((membership) => String(membership.project.id) === String(projectId));

  return (
    <div className="profile-page">
      <button className="btn btn-secondary" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} />
        Back
      </button>

      <section className="profile-hero">
        <span className="profile-avatar-xl">{getInitials(profile.name)}</span>
        <div>
          <span className="badge badge-info">{profile.role}</span>
          <h1>{profile.name}</h1>
          <p>{profile.email}</p>
        </div>
        {projectId && (
          alreadyOnProject ? (
            <span className="badge badge-success">
              <CheckCircle2 size={14} />
              Already on this team
            </span>
          ) : (
            <button className="btn btn-primary" onClick={handleAddToProject} disabled={adding}>
              <UserPlus size={16} />
              {adding ? 'Adding...' : 'Add to project'}
            </button>
          )
        )}
      </section>

      {isOwnProfile && (
        <section className="card profile-panel">
          <div>
            <span className="badge badge-info">Account details</span>
            <h3>Edit profile</h3>
          </div>

          <form className="profile-edit-form" onSubmit={handleSaveProfile}>
            <div className="form-group">
              <label className="form-label">Display name</label>
              <input
                className="form-input"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                minLength={2}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">New password</label>
              <input
                className="form-input"
                type="password"
                value={profilePassword}
                onChange={(e) => setProfilePassword(e.target.value)}
                minLength={6}
                placeholder="Leave blank to keep current password"
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={savingProfile}>
              <Save size={16} />
              {savingProfile ? 'Saving...' : 'Save profile'}
            </button>
          </form>
        </section>
      )}

      <section className="profile-grid">
        <article className="card profile-stat">
          <span>Progress logs</span>
          <strong>{profile._count?.progressLogs || 0}</strong>
        </article>
        <article className="card profile-stat">
          <span>Uploaded files</span>
          <strong>{profile._count?.uploadedFiles || 0}</strong>
        </article>
        <article className="card profile-stat">
          <span>Viva answers</span>
          <strong>{profile._count?.vivaAnswers || 0}</strong>
        </article>
      </section>

      <section className="grid-2">
        <article className="card profile-panel">
          <div>
            <span className="badge badge-info">
              <FolderKanban size={14} />
              Projects
            </span>
            <h3>Project history</h3>
          </div>

          <div className="profile-list">
            {profile.memberships?.length ? profile.memberships.map((membership) => (
              <button
                key={`${membership.project.id}-${membership.joinedAt}`}
                type="button"
                className="profile-list-item"
                onClick={() => navigate(`/projects/${membership.project.id}#team`)}
              >
                <span>
                  <strong>{membership.project.title}</strong>
                  <small>{membership.project.academicYear || 'Current term'} · {membership.project.status}</small>
                </span>
                <span className="badge badge-info">
                  {membership.isLeader && <ShieldCheck size={13} />}
                  {roleLabel(membership.projectRole)}
                </span>
              </button>
            )) : (
              <p>No project memberships yet. Join a team or ask a supervisor to add you.</p>
            )}
          </div>
        </article>

        <article className="card profile-panel">
          <div>
            <span className="badge badge-info">Assigned work</span>
            <h3>Recent tasks</h3>
          </div>

          <div className="profile-list">
            {profile.assignedTasks?.length ? profile.assignedTasks.map((task) => (
              <button
                key={task.id}
                type="button"
                className="profile-list-item"
                onClick={() => navigate(`/projects/${task.projectId}#tasks`)}
              >
                <span>
                  <strong>{task.title}</strong>
                  <small>{task.status.replace('_', ' ')}</small>
                </span>
              </button>
            )) : (
              <p>No assigned tasks yet. Tasks will appear here once the project lead assigns work.</p>
            )}
          </div>
        </article>
      </section>
    </div>
  );
};

export default UserProfile;
