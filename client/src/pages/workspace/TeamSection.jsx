import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import CoolLoader from '../../components/CoolLoader';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from './ProjectWorkspaceLayout';
import { getInitials, formatCommentDate, getProjectRoleLabel, projectRoleOptions } from './workspace.helpers';
import { Users, KeyRound, Copy, CheckCircle2, Search, UserPlus, ShieldCheck, ExternalLink, Trash2, Loader2, AlertTriangle } from 'lucide-react';

export const TeamSection = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { teamMembers, canManageTeam, refreshTeam } = useWorkspace();

  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState('');
  const [recentInvites, setRecentInvites] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberSearchResults, setMemberSearchResults] = useState([]);
  const [searchingMembers, setSearchingMembers] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [contribWarnings, setContribWarnings] = useState([]);

  useEffect(() => {
    Promise.all([
      canManageTeam ? axios.get(`/projects/${id}/invites`) : Promise.resolve({ data: [] }),
      axios.get(`/projects/${id}/contribution-report`).catch(() => ({ data: { warnings: [] } })),
    ]).then(([invitesRes, contribRes]) => {
      setRecentInvites(invitesRes.data);
      setContribWarnings(contribRes.data.warnings || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id, teamMembers, canManageTeam]);

  const activeInviteCode = inviteCode || recentInvites[0]?.code || '';
  const inviteLink = activeInviteCode ? `${window.location.origin}/join/${activeInviteCode}` : '';

  const handleCreateInvite = async () => {
    try {
      const res = await axios.post(`/projects/${id}/invites`);
      setInviteCode(res.data.code);
      setRecentInvites((current) => [res.data, ...current].slice(0, 8));
      setInviteCopied(false);
      toast.success('Invite code created. Share it with your teammate.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to create invite code.');
    }
  };

  const handleCopyInvite = async () => {
    if (!activeInviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 1400);
      toast.success('Invite link copied.');
    } catch {
      toast.error('Unable to copy invite link. Select and copy it manually.');
    }
  };

  const handleSearchUsers = async (e) => {
    e.preventDefault();
    if (memberSearch.trim().length < 2) {
      toast.error('Type at least two characters to search.');
      return;
    }
    setSearchingMembers(true);
    try {
      const res = await axios.get(`/users/search?q=${encodeURIComponent(memberSearch.trim())}`);
      setMemberSearchResults(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to search users.');
    } finally {
      setSearchingMembers(false);
    }
  };

  const handleAddMember = async (userId, projectRole = 'researcher') => {
    try {
      await axios.post(`/projects/${id}/members`, { userId, projectRole });
      await refreshTeam();
      toast.success('Team member added.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to add this user.');
    }
  };

  const handleUpdateMember = async (member, updates) => {
    try {
      const nextRole = updates.projectRole ?? member.projectRole;
      await axios.put(`/projects/${id}/members/${member.userId}`, {
        projectRole: nextRole,
        isLeader: nextRole === 'project_manager',
      });
      await refreshTeam();
      toast.success('Team role updated.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to update this member.');
    }
  };

  const handleRemoveMember = async (member) => {
    try {
      await axios.delete(`/projects/${id}/members/${member.userId}`);
      await refreshTeam();
      toast.success(`${member.user.name} was removed from the team.`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to remove this member.');
    }
  };

  if (loading) return <CoolLoader compact title="Loading team..." />;

  return (
    <div className="team-layout">
      <section className="team-main">
        <div className="team-head">
          <div>
            <span className="badge badge-info">
              <Users size={14} />
              {teamMembers.length} member{teamMembers.length === 1 ? '' : 's'}
            </span>
            <h2>Team members</h2>
            <p>Manage project roles, add teammates, and keep the working group visible.</p>
          </div>
          {canManageTeam && (
            <button type="button" className="btn btn-primary" onClick={handleCreateInvite}>
              <KeyRound size={16} />
              Create invite code
            </button>
          )}
        </div>

        <div className="team-table">
          <div className="team-table-row team-table-header">
            <span>Member</span>
            <span>Project role</span>
            <span>Joined</span>
            <span>Actions</span>
          </div>
          {teamMembers.map((member) => {
            const memberWarnings = contribWarnings.filter((w) => w.userId === member.userId);
            return (
            <article key={member.userId} className="team-table-row" style={memberWarnings.length > 0 ? { borderLeft: '3px solid var(--color-warning)' } : undefined}>
              <button type="button" className="team-person" onClick={() => navigate(`/users/${member.userId}?projectId=${id}`)}>
                <span className="team-avatar" style={memberWarnings.length > 0 ? { border: '2px solid var(--color-warning)' } : undefined}>
                  {getInitials(member.user.name)}
                </span>
                <span>
                  <strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {member.user.name}
                    {memberWarnings.length > 0 && (
                      <span className="badge badge-warning" style={{ fontSize: '0.65rem', padding: '1px 5px', lineHeight: '1.2' }} title={memberWarnings[0].message}>
                        <AlertTriangle size={10} />
                      </span>
                    )}
                  </strong>
                  <small>{member.user.email}</small>
                </span>
              </button>
              <div>
                {canManageTeam ? (
                  <select className="team-role-select" value={member.projectRole || 'researcher'}
                    onChange={(e) => handleUpdateMember(member, { projectRole: e.target.value })}>
                    {projectRoleOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                ) : (
                  <span className="badge badge-info">{getProjectRoleLabel(member.projectRole)}</span>
                )}
              </div>
              <span className="team-date">{formatCommentDate(member.joinedAt)}</span>
              <div className="team-actions">
                {member.isLeader && (
                  <span className="badge badge-success"><ShieldCheck size={13} /> Lead</span>
                )}
                <button type="button" className="icon-button" onClick={() => navigate(`/users/${member.userId}?projectId=${id}`)} title="View profile">
                  <ExternalLink size={15} />
                </button>
                {canManageTeam && member.userId !== user.id && !member.isLeader && (
                  <button type="button" className="icon-button danger" onClick={() => handleRemoveMember(member)} title="Remove member">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </article>
          );
          })}
        </div>
      </section>

      <aside className="team-side">
        <section className="card team-invite-card">
          <div>
            <span className="badge badge-info">Invite code</span>
            <h3>Bring someone in</h3>
            <p>Share a code link with a teammate so they can join after signing in.</p>
          </div>
          {canManageTeam ? (
            <>
              <div className="invite-code-box">
                <span>{activeInviteCode || 'No active code yet'}</span>
                <button type="button" className="icon-button" onClick={handleCopyInvite} disabled={!activeInviteCode}
                  aria-label={inviteCopied ? 'Invite link copied' : 'Copy invite link'} title={inviteCopied ? 'Copied' : 'Copy invite link'}>
                  {inviteCopied ? <CheckCircle2 size={15} /> : <Copy size={15} />}
                </button>
              </div>
              {inviteLink && <input className="form-input" value={inviteLink} readOnly />}
              <button type="button" className="btn btn-secondary" onClick={handleCreateInvite}>
                <KeyRound size={16} />
                Generate new code
              </button>
              {recentInvites.length > 0 && (
                <div className="recent-invites">
                  {recentInvites.slice(0, 3).map((invite) => (
                    <div key={invite.id}>
                      <strong>{invite.code}</strong>
                      <span>{invite.usedAt ? 'Used' : 'Ready'} &middot; {formatCommentDate(invite.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="team-muted">Only the project manager can create invite codes.</p>
          )}
        </section>

        <section className="card team-search-card">
          <div>
            <span className="badge badge-info">Directory search</span>
            <h3>Find a teammate</h3>
          </div>
          <form onSubmit={handleSearchUsers} className="team-search-form">
            <input className="form-input" value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Search by name or email" />
            <button type="submit" className="btn btn-secondary" disabled={searchingMembers}>
              {searchingMembers ? <Loader2 className="spinner-icon" size={15} /> : <Search size={15} />}
              Search
            </button>
          </form>
          <div className="team-search-results">
            {memberSearchResults.map((candidate) => {
              const alreadyMember = teamMembers.some((member) => member.userId === candidate.id);
              return (
                <article key={candidate.id} className="team-search-result">
                  <button type="button" className="team-person" onClick={() => navigate(`/users/${candidate.id}?projectId=${id}`)}>
                    <span className="team-avatar">{getInitials(candidate.name)}</span>
                    <span>
                      <strong>{candidate.name}</strong>
                      <small>{candidate.email}</small>
                    </span>
                  </button>
                  {canManageTeam && !alreadyMember ? (
                    <button type="button" className="btn btn-secondary" onClick={() => handleAddMember(candidate.id)}>
                      <UserPlus size={15} /> Add
                    </button>
                  ) : (
                    <span className="badge badge-info">{alreadyMember ? 'On team' : candidate.role}</span>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </aside>
    </div>
  );
};

export default TeamSection;
