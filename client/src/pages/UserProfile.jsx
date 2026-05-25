import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import CoolLoader from '../components/CoolLoader';
import {
  ArrowLeft,
  FolderKanban,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
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
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`/users/${userId}`);
        setProfile(res.data);
      } catch (err) {
        toast.error(err.response?.data?.error || 'Unable to load this profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

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
              <p>No project memberships yet.</p>
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
              <p>No assigned tasks yet.</p>
            )}
          </div>
        </article>
      </section>
    </div>
  );
};

export default UserProfile;
