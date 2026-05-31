import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import CoolLoader from '../../components/CoolLoader';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from './ProjectWorkspaceLayout';
import { AlertTriangle, Loader2, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const ContributionSection = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { teamMembers } = useWorkspace();

  const [contribData, setContribData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progressLogText, setProgressLogText] = useState('');
  const [logWeek, setLogWeek] = useState(1);
  const [reviews, setReviews] = useState({
    reviewedUserId: '', reliability: 5, technicalContribution: 5,
    communication: 5, meetingAttendance: 5, documentationContribution: 5, comment: '',
  });

  const fetchContribution = useCallback(async () => {
    try {
      const res = await axios.get(`/projects/${id}/contribution-report`);
      setContribData(res.data);
    } catch (err) {
      console.error('Failed to load contribution data:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchContribution(); }, [fetchContribution]);

  const handleSubmitLog = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/projects/${id}/progress-logs`, { logText: progressLogText, weekNumber: logWeek });
      setProgressLogText('');
      fetchContribution();
      toast.success('Weekly progress log submitted successfully.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit log.');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/projects/${id}/peer-reviews`, {
        ...reviews, reviewedUserId: parseInt(reviews.reviewedUserId, 10),
      });
      setReviews({
        reviewedUserId: '', reliability: 5, technicalContribution: 5,
        communication: 5, meetingAttendance: 5, documentationContribution: 5, comment: '',
      });
      fetchContribution();
      toast.success('Peer review registered successfully.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit review.');
    }
  };

  if (loading) return <CoolLoader compact title="Loading contribution data..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="grid-2">
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3>Contribution Scores Audit</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {contribData?.members.map((member) => {
              const memberWarnings = contribData.warnings?.filter((w) => w.userId === member.userId) || [];
              return (
                <div key={member.userId} style={{
                  borderBottom: '1px solid var(--border-light)',
                  paddingBottom: '12px',
                  paddingLeft: memberWarnings.length > 0 ? '8px' : '0',
                  borderLeft: memberWarnings.length > 0 ? '3px solid var(--color-warning)' : 'none',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {member.name} ({member.role})
                      {memberWarnings.length > 0 && (
                        <span className="badge badge-warning" style={{ fontSize: '0.7rem', padding: '2px 6px' }} title={memberWarnings[0].message}>
                          <AlertTriangle size={11} />
                          {' '}{memberWarnings.length} flag{memberWarnings.length > 1 ? 's' : ''}
                        </span>
                      )}
                      {member.finalScore >= 80 && memberWarnings.length === 0 && (
                        <CheckCircle2 size={14} style={{ color: 'var(--color-success)' }} />
                      )}
                    </span>
                    <span style={{
                      fontWeight: 'bold',
                      color: member.finalScore < 45 ? 'var(--color-danger)' : member.finalScore < 65 ? 'var(--color-warning)' : 'var(--accent-secondary)',
                    }}>{member.finalScore}%</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${member.finalScore}%`,
                      background: member.finalScore < 45 ? 'var(--color-danger)' : member.finalScore < 65 ? 'var(--color-warning)' : 'var(--accent-primary)',
                      borderRadius: '4px',
                    }} />
                  </div>
                  {memberWarnings.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                      {memberWarnings.map((w, i) => (
                        <span key={i} style={{ fontSize: '0.78rem', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ShieldAlert size={11} />
                          {w.message}
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                    <span>Tasks: {member.metrics.completedTasks}</span>
                    <span>Logs: {member.metrics.progressLogsSubmitted}</span>
                    <span>Rating: {member.metrics.averagePeerReviewRating}/5.0</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-warning)' }}>
            <AlertTriangle size={20} />
            Imbalance Flags & Anomalies
          </h3>
          {contribData?.warnings.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No distribution anomalies registered. Team contribution is evenly balanced.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {contribData?.warnings.map((warn, i) => (
                <div key={i} className="badge badge-warning" style={{ display: 'block', padding: '12px', borderRadius: '12px', lineHeight: 1.4, textAlign: 'left' }}>
                  <strong>{warn.userName}:</strong> {warn.message}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>Submit Weekly Log</h3>
          <form onSubmit={handleSubmitLog} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
            <div className="form-group">
              <label className="form-label">Week Number</label>
              <input type="number" className="form-input" value={logWeek} onChange={(e) => setLogWeek(e.target.value)} min="1" />
            </div>
            <div className="form-group">
              <label className="form-label">Log details</label>
              <textarea className="form-input" placeholder="Detail your work completed this week..." value={progressLogText}
                onChange={(e) => setProgressLogText(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Submit Log</button>
          </form>
        </div>

        <div className="card">
          <h3>Submit Member Peer Review</h3>
          <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
            <div className="form-group">
              <label className="form-label">Select Peer</label>
              <select className="form-input" value={reviews.reviewedUserId}
                onChange={(e) => setReviews({ ...reviews, reviewedUserId: e.target.value })}
                style={{ background: 'var(--bg-secondary)' }} required>
                <option value="">-- Choose Peer --</option>
                {teamMembers.filter((m) => m.userId !== user.id).map((m) => (
                  <option key={m.userId} value={m.userId}>{m.user.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Technical Contribution (1-5)</label>
              <input type="number" className="form-input" value={reviews.technicalContribution}
                onChange={(e) => setReviews({ ...reviews, technicalContribution: parseInt(e.target.value, 10) })} min="1" max="5" />
            </div>
            <div className="form-group">
              <label className="form-label">Review comment</label>
              <input type="text" className="form-input" placeholder="e.g. Always delivers coding modules on time."
                value={reviews.comment} onChange={(e) => setReviews({ ...reviews, comment: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Register Rating</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContributionSection;
