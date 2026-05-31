import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import CoolLoader from '../../components/CoolLoader';
import { useWorkspace } from './ProjectWorkspaceLayout';
import {
  taskStatusLabel, formatTaskDeadline, toDateTimeInputValue, isOverdueTask,
  getFileUrl, formatFileSize, getInitials,
} from './workspace.helpers';
import {
  ListTodo, Plus, CheckCircle2, CalendarDays, UserRound, Clock3,
  Upload, Download, Loader2, X,
} from 'lucide-react';

export const TasksSection = () => {
  const { id } = useParams();
  const { teamMembers, triggerDelight, setCounts } = useWorkspace();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskReqId, setTaskReqId] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskFilter, setTaskFilter] = useState('all');
  const [evidenceDrafts, setEvidenceDrafts] = useState({});
  const [requirements, setRequirements] = useState([]);

  const fetchTasks = useCallback(async () => {
    try {
      const [taskRes, reqRes] = await Promise.all([
        axios.get(`/projects/${id}/tasks`),
        axios.get(`/projects/${id}/requirements`),
      ]);
      setTasks(taskRes.data);
      setRequirements(reqRes.data);
      setCounts((c) => ({ ...c, tasks: taskRes.data.length }));
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [id, setCounts]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const openTasks = useMemo(() => tasks.filter((t) => !['completed', 'rejected'].includes(t.status)), [tasks]);
  const closedTasks = useMemo(() => tasks.filter((t) => t.status === 'completed'), [tasks]);
  const overdueTasks = useMemo(() => tasks.filter(isOverdueTask), [tasks]);
  const unassignedTasks = useMemo(() => tasks.filter((t) => !t.assignee), [tasks]);

  const visibleTasks = useMemo(() => tasks.filter((task) => {
    if (taskFilter === 'open') return !['completed', 'rejected'].includes(task.status);
    if (taskFilter === 'closed') return task.status === 'completed';
    if (taskFilter === 'overdue') return isOverdueTask(task);
    return true;
  }), [tasks, taskFilter]);

  const taskOverviewCards = [
    { label: 'Open tasks', value: openTasks.length, hint: 'Ready for assignment or completion.' },
    { label: 'Overdue', value: overdueTasks.length, hint: 'Needs attention before it slips further.' },
    { label: 'Unassigned', value: unassignedTasks.length, hint: 'Waiting for an owner.' },
  ];

  const taskFilters = [
    { id: 'all', label: 'All', count: tasks.length },
    { id: 'open', label: 'Open', count: openTasks.length },
    { id: 'closed', label: 'Closed', count: closedTasks.length },
    { id: 'overdue', label: 'Overdue', count: overdueTasks.length },
  ];

  const setEvidenceDraft = (taskId, patch) => {
    setEvidenceDrafts((current) => ({
      ...current,
      [taskId]: { note: '', file: null, ...(current[taskId] || {}), ...patch },
    }));
  };

  const handleToggleTaskStatus = async (task) => {
    const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
    try {
      await axios.put(`/projects/tasks/${task.id}`, { status: nextStatus });
      if (nextStatus === 'completed') triggerDelight('task');
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to update this task right now.');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/projects/${id}/tasks`, {
        title: taskTitle,
        description: taskDesc,
        priority: taskPriority,
        assignedTo: taskAssignee ? parseInt(taskAssignee, 10) : null,
        deadline: taskDeadline || null,
        requirementId: taskReqId ? parseInt(taskReqId, 10) : null,
      });
      setShowTaskModal(false);
      setTaskTitle('');
      setTaskDesc('');
      setTaskReqId('');
      setTaskAssignee('');
      setTaskDeadline('');
      fetchTasks();
      toast.success('Task created and added to the board.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create task.');
    }
  };

  const handleSubmitTaskEvidence = async (e, taskId) => {
    e.preventDefault();
    const draft = evidenceDrafts[taskId] || {};
    if (!draft.file && !draft.note?.trim()) {
      toast.error('Add a short note or choose an evidence file.');
      return;
    }
    try {
      let fileId = null;
      if (draft.file) {
        const formData = new FormData();
        formData.append('file', draft.file);
        formData.append('fileType', 'evidence');
        const uploadRes = await axios.post(`/projects/${id}/files/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        fileId = uploadRes.data.id;
      }
      await axios.post(`/projects/tasks/${taskId}/evidence`, { fileId, note: draft.note || '' });
      setEvidenceDrafts((current) => ({ ...current, [taskId]: { note: '', file: null } }));
      e.currentTarget.reset();
      fetchTasks();
      toast.success('Task evidence submitted.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to submit task evidence.');
    }
  };

  if (loading) return <CoolLoader compact title="Loading tasks..." />;

  return (
    <div className="task-board-shell">
      <div className="task-board-panel">
        <div className="task-overview-grid" aria-label="Task overview">
          {taskOverviewCards.map((card) => (
            <article key={card.label} className="task-overview-card">
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <p>{card.hint}</p>
            </article>
          ))}
        </div>

        <div className="task-board-head">
          <div>
            <h2>Project Tasks</h2>
            <p>Plan work across the full project timeline.</p>
          </div>
          <button onClick={() => setShowTaskModal(true)} className="btn btn-primary task-new-button">
            <Plus size={16} />
            New Task
          </button>
        </div>

        <div className="task-filter-row" aria-label="Task filters">
          {taskFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={`task-filter ${taskFilter === filter.id ? 'active' : ''}`}
              onClick={() => setTaskFilter(filter.id)}
            >
              {filter.label}
              <span>{filter.count}</span>
            </button>
          ))}
        </div>

        <div className="task-list">
          {visibleTasks.length === 0 ? (
            <div className="task-empty-state">
              <ListTodo size={28} />
              <h3>No tasks here</h3>
              <p>Create a task or switch filters to review the rest of the work.</p>
            </div>
          ) : (
            visibleTasks.map((task) => {
              const isClosed = task.status === 'completed';
              const isOverdue = isOverdueTask(task);
              const assigneeName = task.assignee?.name || 'Unassigned';
              return (
                <article key={task.id} className={`task-item ${isClosed ? 'closed' : ''} ${isOverdue ? 'overdue' : ''}`}>
                  <div className="task-item-main">
                    <div>
                      <h3>{task.title}</h3>
                      <p>{task.description || task.requirement?.title || 'No description provided.'}</p>
                    </div>
                    <button
                      type="button"
                      className={`task-check ${isClosed ? 'checked' : ''}`}
                      aria-label={isClosed ? 'Mark task open' : 'Mark task completed'}
                      onClick={() => handleToggleTaskStatus(task)}
                    >
                      <CheckCircle2 size={18} />
                    </button>
                  </div>

                  <div className="task-item-meta">
                    <span className="task-date">
                      <CalendarDays size={15} />
                      {formatTaskDeadline(task.deadline)}
                    </span>
                    <span className="task-assignee" title={assigneeName}>
                      <UserRound size={15} />
                      {assigneeName}
                    </span>
                    <span className={`task-priority ${task.priority}`}>{task.priority}</span>
                  </div>

                  <div className="task-item-controls">
                    <label>
                      <Clock3 size={14} />
                      <input
                        type="datetime-local"
                        value={toDateTimeInputValue(task.deadline)}
                        onChange={async (e) => {
                          await axios.put(`/projects/tasks/${task.id}`, { deadline: e.target.value || null });
                          fetchTasks();
                        }}
                      />
                    </label>
                    <select
                      value={task.status}
                      onChange={async (e) => {
                        await axios.put(`/projects/tasks/${task.id}`, { status: e.target.value });
                        fetchTasks();
                      }}
                    >
                      <option value="todo">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">In Review</option>
                      <option value="completed">Closed</option>
                      <option value="rejected">Needs Changes</option>
                    </select>
                    <span className="task-status-text">{taskStatusLabel[task.status] || task.status}</span>
                  </div>

                  <div className="task-evidence-panel">
                    <div className="task-evidence-head">
                      <div>
                        <strong>Evidence</strong>
                        <p>Capture what changed, attach proof, and keep each task ready for review.</p>
                      </div>
                      <span>{task.evidence?.length || 0} item{task.evidence?.length === 1 ? '' : 's'}</span>
                    </div>

                    {task.evidence?.length > 0 && (
                      <div className="task-evidence-list">
                        {task.evidence.map((item) => (
                          <div key={item.id} className="task-evidence-item">
                            <div className="task-evidence-copy">
                              <strong>{item.note || item.file?.fileName || 'Evidence note'}</strong>
                              {item.file?.fileName && item.note && <span>{item.file.fileName}</span>}
                            </div>
                            {item.file?.filePath && (
                              <button type="button" className="btn btn-secondary" onClick={() => window.open(getFileUrl(item.file), '_blank')}>
                                <Download size={14} />
                                Open
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <form className="task-evidence-form" onSubmit={(e) => handleSubmitTaskEvidence(e, task.id)}>
                      <div className="task-evidence-form-field task-evidence-form-field--note">
                        <label className="task-evidence-label" htmlFor={`task-evidence-note-${task.id}`}>
                          Note or link
                        </label>
                        <input
                          id={`task-evidence-note-${task.id}`}
                          className="form-input"
                          value={evidenceDrafts[task.id]?.note || ''}
                          placeholder="What did you verify or finish?"
                          onChange={(e) => setEvidenceDraft(task.id, { note: e.target.value })}
                        />
                      </div>
                      <div className="task-evidence-form-field task-evidence-form-field--file">
                        <label className="task-evidence-label" htmlFor={`task-evidence-file-${task.id}`}>
                          Attach file
                        </label>
                        <input
                          id={`task-evidence-file-${task.id}`}
                          className="form-input"
                          type="file"
                          onChange={(e) => setEvidenceDraft(task.id, { file: e.target.files?.[0] || null })}
                        />
                        {evidenceDrafts[task.id]?.file?.name && (
                          <div className="task-evidence-file-chip">
                            <span>{evidenceDrafts[task.id].file.name}</span>
                            <button type="button" className="task-evidence-clear" onClick={() => setEvidenceDraft(task.id, { file: null })}>
                              Clear
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="task-evidence-form-actions">
                        <p className="task-evidence-hint">Add a note, a file, or both. Keep the proof tied to this task so review stays fast.</p>
                        <button type="submit" className="btn btn-secondary">
                          <Upload size={14} />
                          Add evidence
                        </button>
                      </div>
                    </form>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>

      {showTaskModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          backdropFilter: 'blur(8px)',
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '32px' }}>
            <h2>Create New Task</h2>
            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div className="form-group">
                <label className="form-label">Task Title</label>
                <input type="text" className="form-input" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-input" value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}
                  style={{ background: 'var(--bg-secondary)' }}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Assignee</label>
                  <select className="form-input" value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)}
                    style={{ background: 'var(--bg-secondary)' }}>
                    <option value="">Unassigned</option>
                    {teamMembers.map((member) => (
                      <option key={member.userId} value={member.userId}>{member.user.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Deadline</label>
                  <input type="datetime-local" className="form-input" value={taskDeadline} onChange={(e) => setTaskDeadline(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Linked requirement</label>
                <select className="form-input" value={taskReqId} onChange={(e) => setTaskReqId(e.target.value)}
                  style={{ background: 'var(--bg-secondary)' }}>
                  <option value="">No requirement link</option>
                  {requirements.map((req) => (
                    <option key={req.id} value={req.id}>{req.title}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowTaskModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Assign Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksSection;
