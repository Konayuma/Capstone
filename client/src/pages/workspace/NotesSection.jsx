import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import CoolLoader from '../../components/CoolLoader';
import { useWorkspace } from './ProjectWorkspaceLayout';
import {
  commentTargetOptions, formatCommentDate, getCommentTargetLabel as getLabel,
} from './workspace.helpers';
import { Plus, MessageSquare, UserRound, X } from 'lucide-react';

export const NotesSection = () => {
  const { id } = useParams();
  const { setCounts } = useWorkspace();

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [commentTarget, setCommentTarget] = useState('project');
  const [showCommentModal, setShowCommentModal] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const res = await axios.get(`/projects/${id}/comments`);
      setComments(res.data);
      setCounts((c) => ({ ...c, comments: res.data.length }));
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  }, [id, setCounts]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  useEffect(() => {
    if (!showCommentModal) return;
    const handleEscape = (e) => { if (e.key === 'Escape') setShowCommentModal(false); };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showCommentModal]);

  const sortedComments = useMemo(() =>
    [...comments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [comments],
  );

  const commentCounts = useMemo(() =>
    comments.reduce((counts, comment) => {
      counts[comment.targetType] = (counts[comment.targetType] || 0) + 1;
      return counts;
    }, { project: 0, requirement: 0, task: 0, document: 0, contribution: 0, viva: 0 }),
    [comments],
  );

  const handleAddComment = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/projects/${id}/comments`, { targetType: commentTarget, commentText: newComment });
      setNewComment('');
      setShowCommentModal(false);
      fetchComments();
      toast.success('Comment added to the review stream.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add comment.');
    }
  };

  if (loading) return <CoolLoader compact title="Loading notes..." />;

  return (
    <div className="comments-page">
      <section className="card comments-hero">
        <div className="comments-hero-copy">
          <span className="badge badge-info">Review notes</span>
          <h3>Comment stream</h3>
          <p>Keep the conversation visible. Open the composer only when you need to add a new note.</p>
        </div>
        <div className="comments-hero-actions">
          <div className="comments-summary-grid" aria-label="Comment target counts">
            {commentTargetOptions.map((option) => (
              <div key={option.id} className="comments-summary-item comments-summary-item--dense">
                <span>{option.label}</span>
                <strong>{commentCounts[option.id] || 0}</strong>
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-primary comments-new-button" onClick={() => setShowCommentModal(true)}>
            <Plus size={16} /> New note
          </button>
        </div>
      </section>

      <section className="card comments-feed comments-feed-shell">
        <div className="comments-panel-head comments-feed-head">
          <div>
            <span className="badge badge-info">Latest updates</span>
            <h3>Project review thread</h3>
            <p className="comments-panel-copy">Newest notes appear first so the feed reads like an active review thread.</p>
          </div>
          <div className="comments-feed-count">{sortedComments.length} note{sortedComments.length === 1 ? '' : 's'}</div>
        </div>

        {sortedComments.length === 0 ? (
          <div className="comments-empty comments-empty--tight">
            <MessageSquare size={24} />
            <h4>No notes yet</h4>
            <p>Use the new note button to leave the first review note. It will appear here as a structured feed.</p>
          </div>
        ) : (
          <div className="comment-stream">
            {sortedComments.map((comment) => (
              <article key={comment.id} className="comment-item">
                <div className="comment-item-top">
                  <div className="comment-author">
                    <span className="comment-avatar"><UserRound size={14} /></span>
                    <div>
                      <strong>{comment.user?.name || 'Anonymous'}</strong>
                      <span>{comment.user?.role || 'Member'}</span>
                    </div>
                  </div>
                  <span className="comment-date">{formatCommentDate(comment.createdAt)}</span>
                </div>
                <div className="comment-item-meta">
                  <span className="badge badge-info">{getLabel(comment.targetType)}</span>
                </div>
                <p className="comment-item-body">{comment.commentText}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      {showCommentModal && (
        <div className="workspace-modal-overlay" role="presentation" onClick={() => setShowCommentModal(false)}>
          <div className="workspace-modal comments-modal" role="dialog" aria-modal="true" aria-labelledby="comment-modal-title"
            onClick={(e) => e.stopPropagation()}>
            <div className="comments-modal-head">
              <div>
                <span className="badge badge-info">New note</span>
                <h3 id="comment-modal-title">Add a review note</h3>
                <p>Choose the target surface, then capture the next action clearly and directly.</p>
              </div>
              <button type="button" className="icon-button" onClick={() => setShowCommentModal(false)} aria-label="Close comment composer">
                <X size={15} />
              </button>
            </div>
            <form onSubmit={handleAddComment} className="comments-modal-form">
              <div className="comments-modal-grid">
                <div className="comments-modal-aside">
                  <h4>Note targets</h4>
                  <p>Pick the exact surface you want to discuss so the note lands in the right place.</p>
                  <div className="comments-modal-targets" aria-label="Choose a note target">
                    {commentTargetOptions.map((option) => (
                      <button key={option.id} type="button"
                        className={`comment-target-option ${commentTarget === option.id ? 'active' : ''}`}
                        onClick={() => setCommentTarget(option.id)} aria-pressed={commentTarget === option.id}>
                        <span>{option.label}</span>
                        <small>{option.note}</small>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="comments-modal-body">
                  <div className="form-group">
                    <label className="form-label">Review note</label>
                    <textarea className="form-input comments-textarea comments-textarea--modal"
                      placeholder="Explain what should change, why it matters, and where the team should look next."
                      value={newComment} onChange={(e) => setNewComment(e.target.value)} required autoFocus />
                    <p className="comments-helper">Short, direct comments work best. Keep the note tied to the selected target.</p>
                  </div>
                  <div className="comments-form-actions comments-form-actions--modal">
                    <div className="comments-active-target">
                      <span className="comments-active-target-label">Posting to</span>
                      <strong>{getLabel(commentTarget)}</strong>
                    </div>
                    <div className="comments-modal-actions">
                      <button type="button" className="btn btn-secondary" onClick={() => setShowCommentModal(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary" disabled={!newComment.trim()}>Post Comment</button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesSection;
