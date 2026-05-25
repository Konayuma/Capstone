import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import CoolLoader from '../components/CoolLoader';
import { 
  Sparkles, 
  ListTodo, 
  BarChart3, 
  Download, 
  MessageSquare,
  Users,
  UserPlus,
  Plus, 
  Copy,
  Search,
  ShieldCheck,
  Trash2,
  ExternalLink,
  KeyRound,
  CalendarDays,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  GraduationCap,
  Loader2,
  UserRound
} from 'lucide-react';

const taskStatusLabel = {
  todo: 'Open',
  in_progress: 'In progress',
  review: 'In review',
  completed: 'Closed',
  rejected: 'Needs changes',
};

const formatTaskDeadline = (deadline) => {
  if (!deadline) return 'No deadline';

  const date = new Date(deadline);
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const toDateTimeInputValue = (deadline) => {
  if (!deadline) return '';
  const date = new Date(deadline);
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
};

const isOverdueTask = (task) => (
  task.deadline && task.status !== 'completed' && new Date(task.deadline) < new Date()
);

const commentTargetOptions = [
  {
    id: 'project',
    label: 'Project / General Dashboard',
    note: 'Use this for direction, scope, or whole-workspace feedback.',
  },
  {
    id: 'requirement',
    label: 'Requirements Specification',
    note: 'Use this for spec gaps, unclear wording, or testability issues.',
  },
  {
    id: 'contribution',
    label: 'Contribution Score Audit',
    note: 'Use this for contribution reviews and peer assessment notes.',
  },
];

const commentTargetLabels = commentTargetOptions.reduce((labels, option) => {
  labels[option.id] = option.label;
  return labels;
}, {});

const formatCommentDate = (value) => new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
}).format(new Date(value));

const getCommentTargetLabel = (targetType) => commentTargetLabels[targetType] || targetType;

const projectRoleOptions = [
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'frontend_dev', label: 'Frontend Developer' },
  { value: 'backend_dev', label: 'Backend Developer' },
  { value: 'fullstack_dev', label: 'Full-stack Developer' },
  { value: 'ui_ux', label: 'UI/UX Designer' },
  { value: 'tester', label: 'Tester' },
  { value: 'researcher', label: 'Researcher' },
  { value: 'doc_lead', label: 'Documentation Lead' },
];

const roleLabelMap = projectRoleOptions.reduce((labels, option) => {
  labels[option.value] = option.label;
  return labels;
}, {});

const getInitials = (name = '') => name
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0]?.toUpperCase())
  .join('') || '?';

const getProjectRoleLabel = (role) => roleLabelMap[role] || 'Team Member';

export const ProjectWorkspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState('requirements');
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState([]);
  const [canManageTeam, setCanManageTeam] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [recentInvites, setRecentInvites] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberSearchResults, setMemberSearchResults] = useState([]);
  const [searchingMembers, setSearchingMembers] = useState(false);

  // Requirements state
  const [requirements, setRequirements] = useState([]);
  const [selectedRequirementId, setSelectedRequirementId] = useState(null);
  const [selectedRequirementIds, setSelectedRequirementIds] = useState([]);
  const [rawDesc, setRawDesc] = useState('');
  const [refining, setRefining] = useState(false);
  const [ambiguities, setAmbiguities] = useState([]);
  const [expandingRequirements, setExpandingRequirements] = useState(false);
  const requirementsPromptRef = useRef(null);

  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskReqId, setTaskReqId] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskFilter, setTaskFilter] = useState('all');

  // Contribution stats state
  const [contribData, setContribData] = useState(null);
  const [progressLogText, setProgressLogText] = useState('');
  const [logWeek, setLogWeek] = useState(1);
  const [reviews, setReviews] = useState({
    reviewedUserId: '',
    reliability: 5,
    technicalContribution: 5,
    communication: 5,
    meetingAttendance: 5,
    documentationContribution: 5,
    comment: ''
  });

  // Supervisor Comments state
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentTarget, setCommentTarget] = useState('project');

  // Readiness Score
  const [readiness, setReadiness] = useState(null);

  const selectedReq = requirements.find((requirement) => requirement.id === selectedRequirementId) || null;

  const fetchWorkspaceData = async () => {
    try {
      const projRes = await axios.get(`/projects/${id}`);
      setProject(projRes.data);

      const memberRes = await axios.get(`/projects/${id}/members`);
      setTeamMembers(memberRes.data.members || []);
      setCanManageTeam(Boolean(memberRes.data.canManageTeam));

      const reqRes = await axios.get(`/projects/${id}/requirements`);
      setRequirements(reqRes.data);

      const taskRes = await axios.get(`/projects/${id}/tasks`);
      setTasks(taskRes.data);

      const contribRes = await axios.get(`/projects/${id}/contribution-report`);
      setContribData(contribRes.data);

      const commentRes = await axios.get(`/projects/${id}/comments`);
      setComments(commentRes.data);

      const readinessRes = await axios.get(`/projects/${id}/readiness-score`);
      setReadiness(readinessRes.data);

      if (memberRes.data.canManageTeam) {
        const invitesRes = await axios.get(`/projects/${id}/invites`);
        setRecentInvites(invitesRes.data);
      }
    } catch (err) {
      console.error('Failed to load workspace:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, [id]);

  useEffect(() => {
    if (requirements.length === 0) {
      setSelectedRequirementId(null);
      setSelectedRequirementIds([]);
      return;
    }

    setSelectedRequirementIds((currentIds) => currentIds.filter((requirementId) => requirements.some((requirement) => requirement.id === requirementId)));
    setSelectedRequirementId((currentId) => {
      if (currentId && requirements.some((requirement) => requirement.id === currentId)) {
        return currentId;
      }

      return requirements[0].id;
    });
  }, [requirements]);

  useEffect(() => {
    const hashTab = location.hash.replace('#', '');
    if (['requirements', 'tasks', 'team', 'contribution', 'readiness', 'comments'].includes(hashTab)) {
      setActiveTab(hashTab);
    }
  }, [location.hash]);

  const switchTab = (tab) => {
    setActiveTab(tab);
    navigate(`/projects/${id}#${tab}`, { replace: true });
  };

  const focusRequirementsPrompt = () => {
    requirementsPromptRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    requirementsPromptRef.current?.focus();
  };

  const toggleRequirementSelection = (requirementId) => {
    setSelectedRequirementIds((currentIds) => (
      currentIds.includes(requirementId)
        ? currentIds.filter((selectedId) => selectedId !== requirementId)
        : [...currentIds, requirementId]
    ));
  };

  const selectAllRequirements = () => {
    setSelectedRequirementIds(requirements.map((requirement) => requirement.id));
  };

  const clearRequirementSelection = () => {
    setSelectedRequirementIds([]);
  };

  const handleGenerateRequirementArtifacts = async (requirementIds = selectedRequirementIds) => {
    const uniqueIds = [...new Set(requirementIds)].filter((requirementId) => requirements.some((requirement) => requirement.id === requirementId));

    if (uniqueIds.length === 0) {
      toast.error('Select one or more requirements first.');
      return;
    }

    setExpandingRequirements(true);
    try {
      for (const requirementId of uniqueIds) {
        await axios.post(`/projects/requirements/${requirementId}/acceptance-criteria/generate`);
        await axios.post(`/projects/requirements/${requirementId}/test-cases/generate`);
      }

      await fetchWorkspaceData();
      setSelectedRequirementId((currentId) => (uniqueIds.includes(currentId) ? currentId : uniqueIds[0]));
      toast.success(`Expanded ${uniqueIds.length} requirement${uniqueIds.length === 1 ? '' : 's'} with acceptance criteria and test cases.`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to expand the selected requirements right now.');
    } finally {
      setExpandingRequirements(false);
    }
  };

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const activeInviteCode = inviteCode || recentInvites[0]?.code || '';
  const inviteLink = activeInviteCode ? `${window.location.origin}/join/${activeInviteCode}` : '';
  const visibleTeamStack = teamMembers.slice(0, 5);
  const extraTeamCount = Math.max(0, teamMembers.length - visibleTeamStack.length);
  const openTasks = tasks.filter((task) => !['completed', 'rejected'].includes(task.status));
  const closedTasks = tasks.filter((task) => task.status === 'completed');
  const overdueTasks = tasks.filter(isOverdueTask);
  const visibleTasks = tasks.filter((task) => {
    if (taskFilter === 'open') return !['completed', 'rejected'].includes(task.status);
    if (taskFilter === 'closed') return task.status === 'completed';
    if (taskFilter === 'overdue') return isOverdueTask(task);
    return true;
  });
  const sortedComments = [...comments].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
  const commentCounts = comments.reduce((counts, comment) => {
    counts[comment.targetType] = (counts[comment.targetType] || 0) + 1;
    return counts;
  }, { project: 0, requirement: 0, contribution: 0 });
  const taskFilters = [
    { id: 'all', label: 'All', count: tasks.length },
    { id: 'open', label: 'Open', count: openTasks.length },
    { id: 'closed', label: 'Closed', count: closedTasks.length },
    { id: 'overdue', label: 'Overdue', count: overdueTasks.length },
  ];

  const refreshTeam = async () => {
    const memberRes = await axios.get(`/projects/${id}/members`);
    setTeamMembers(memberRes.data.members || []);
    setCanManageTeam(Boolean(memberRes.data.canManageTeam));

    if (memberRes.data.canManageTeam) {
      const invitesRes = await axios.get(`/projects/${id}/invites`);
      setRecentInvites(invitesRes.data);
    }
  };

  const handleCreateInvite = async () => {
    try {
      const res = await axios.post(`/projects/${id}/invites`);
      setInviteCode(res.data.code);
      setRecentInvites((current) => [res.data, ...current].slice(0, 8));
      toast.success('Invite code created. Share it with your teammate.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to create invite code.');
    }
  };

  const handleCopyInvite = async () => {
    if (!inviteCode) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
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

  // Tab 1: Requirements Generator
  const handleAIRefinement = async () => {
    setRefining(true);
    setAmbiguities([]);
    try {
      const res = await axios.post(`/projects/${id}/requirements/generate`, {
        rawDescription: rawDesc || project.description
      });
      setRequirements(res.data.requirements);
      setAmbiguities(res.data.ambiguityWarnings);
      setSelectedRequirementIds(res.data.requirements.map((requirement) => requirement.id));
      setSelectedRequirementId(res.data.requirements[0]?.id || null);
      toast.success('Requirements draft created. Select one or more items to expand them, or refine the prompt and regenerate.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to draft requirements right now.');
    } finally {
      setRefining(false);
    }
  };

  // Tab 2: Task CRUD
  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/projects/${id}/tasks`, {
        title: taskTitle,
        description: taskDesc,
        priority: taskPriority,
        assignedTo: taskAssignee ? parseInt(taskAssignee, 10) : null,
        deadline: taskDeadline || null,
        requirementId: taskReqId ? parseInt(taskReqId, 10) : null
      });
      setShowTaskModal(false);
      setTaskTitle('');
      setTaskDesc('');
      setTaskReqId('');
      setTaskAssignee('');
      setTaskDeadline('');
      fetchWorkspaceData();
      toast.success('Task created and added to the board.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create task.');
    }
  };

  // Tab 3: Weekly Logs & Peer Reviews
  const handleSubmitLog = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/projects/${id}/progress-logs`, {
        logText: progressLogText,
        weekNumber: logWeek
      });
      setProgressLogText('');
      fetchWorkspaceData();
      toast.success('Weekly progress log submitted successfully.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit log.');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/projects/${id}/peer-reviews`, {
        ...reviews,
        reviewedUserId: parseInt(reviews.reviewedUserId, 10)
      });
      setReviews({
        reviewedUserId: '',
        reliability: 5,
        technicalContribution: 5,
        communication: 5,
        meetingAttendance: 5,
        documentationContribution: 5,
        comment: ''
      });
      fetchWorkspaceData();
      toast.success('Peer review registered successfully.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit review.');
    }
  };

  // Tab 5: Comments CRUD
  const handleAddComment = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/projects/${id}/comments`, {
        targetType: commentTarget,
        commentText: newComment
      });
      setNewComment('');
      fetchWorkspaceData();
      toast.success('Comment added to the review stream.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add comment.');
    }
  };

  // Reports
  const handleDownloadReport = (reportType) => {
    window.open(`${API_BASE}/api/projects/${id}/reports/${reportType}?token=${localStorage.getItem('token')}`);
  };

  if (loading) return <CoolLoader title="Scaffolding workspace" subtitle="Loading project data and team signals..." />;
  if (!project) return <div>Workspace not found.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', textAlign: 'left' }}>
      {/* Workspace Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span className="badge badge-info" style={{ marginBottom: '8px' }}>Project Workspace</span>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>{project.title}</h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '800px' }}>{project.description}</p>
        </div>

        <div className="workspace-actions">
          <button
            type="button"
            className="member-stack"
            onClick={() => switchTab('team')}
            aria-label="Open team members"
            title="Open team members"
          >
            {visibleTeamStack.map((member) => (
              <span key={member.userId} className="member-stack-avatar" title={member.user.name}>
                {getInitials(member.user.name)}
              </span>
            ))}
            {extraTeamCount > 0 && <span className="member-stack-more">+{extraTeamCount}</span>}
          </button>
            <button 
              onClick={() => navigate(`/projects/${id}/viva`)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <GraduationCap size={20} />
              <span>Open Viva Practice</span>
            </button>
        </div>
      </div>

      {/* Tabs Selector */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-medium)', gap: '8px', paddingBottom: '2px' }}>
        <button
          className={`btn ${activeTab === 'requirements' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => switchTab('requirements')}
          style={{ padding: '8px 16px', fontSize: '0.9rem' }}
        >
          <Sparkles size={16} />
              Requirements
        </button>

        <button
          className={`btn ${activeTab === 'tasks' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => switchTab('tasks')}
          style={{ padding: '8px 16px', fontSize: '0.9rem' }}
        >
          <ListTodo size={16} />
              Tasks
        </button>

        <button
          className={`btn ${activeTab === 'team' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => switchTab('team')}
          style={{ padding: '8px 16px', fontSize: '0.9rem' }}
        >
          <Users size={16} />
              Team
        </button>

        <button 
          className={`btn ${activeTab === 'contribution' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => switchTab('contribution')}
          style={{ padding: '8px 16px', fontSize: '0.9rem' }}
        >
          <BarChart3 size={16} />
              Contributions
        </button>

        <button 
          className={`btn ${activeTab === 'readiness' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => switchTab('readiness')}
          style={{ padding: '8px 16px', fontSize: '0.9rem' }}
        >
          <Download size={16} />
              Readiness & Reports
        </button>

        <button 
          className={`btn ${activeTab === 'comments' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => switchTab('comments')}
          style={{ padding: '8px 16px', fontSize: '0.9rem' }}
        >
          <MessageSquare size={16} />
              Comments
        </button>
      </div>

      {/* Tab Contents */}
      <main style={{ marginTop: '16px' }}>
        {/* TAB 1: Requirements Engineering */}
        {activeTab === 'requirements' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div className="grid-2">
              {/* Requirements Generator Console */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3>Requirements Drafting</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                  Paste a project idea, feature request, or rough scope note. We will turn it into measurable functional and non-functional requirements.
                </p>
                <textarea 
                  className="form-input"
                  placeholder="Paste the rough project description or requested feature..."
                  value={rawDesc}
                  onChange={(e) => setRawDesc(e.target.value)}
                  ref={requirementsPromptRef}
                  style={{ minHeight: '120px', resize: 'vertical' }}
                />
                <button 
                  onClick={handleAIRefinement} 
                  className="btn btn-primary"
                  disabled={refining}
                  style={{ alignSelf: 'flex-start' }}
                >
                  {refining ? <><Loader2 className="spinner-icon" size={15} /> Drafting requirements...</> : 'Draft Requirements'}
                </button>
              </div>

              {/* Ambiguity warnings display */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h3>Clarity Checks</h3>
                {ambiguities.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No clarity checks yet. Draft requirements to highlight vague or hard-to-test wording.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '250px', overflowY: 'auto' }}>
                    {ambiguities.map((warn, i) => (
                      <div key={i} style={{ borderLeft: '3px solid var(--color-warning)', paddingLeft: '12px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-warning)', fontSize: '0.9rem' }}>
                          Needs clarification: "{warn.vagueTerm}"
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{warn.explanation}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-success)', fontWeight: 500 }}>
                          Suggestion: {warn.suggestion}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="requirements-workbench">
              <div className="requirements-workbench-header card">
                <div>
                  <span className="badge badge-info">Review queue</span>
                  <h3>Inspect the generated requirements</h3>
                  <p className="requirements-workbench-copy">
                    Click a card to inspect its detail view, select several requirements for batch expansion, or jump back to the prompt if the draft needs another pass.
                  </p>
                </div>

                <div className="requirements-workbench-actions">
                  <button type="button" className="btn btn-secondary" onClick={focusRequirementsPrompt}>
                    Refine prompt
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={selectAllRequirements} disabled={requirements.length === 0}>
                    Select all
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={clearRequirementSelection} disabled={selectedRequirementIds.length === 0}>
                    Clear selection
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleGenerateRequirementArtifacts()}
                    disabled={selectedRequirementIds.length === 0 || expandingRequirements}
                  >
                    {expandingRequirements ? <><Loader2 className="spinner-icon" size={15} /> Expanding selected...</> : 'Generate details for selected'}
                  </button>
                </div>
              </div>

              <div className="requirements-selection-summary">
                <span>{selectedRequirementIds.length} selected</span>
                <span>{requirements.length} total requirements</span>
                <span>{selectedReq ? `Viewing: ${selectedReq.title}` : 'Pick a requirement to inspect'}</span>
              </div>

              <div className="grid-2">
                <div className="requirements-list-column">
                  <div className="requirements-list-head">
                    <h3>Project Specification Tree</h3>
                    <p>Choose requirements to expand, or use the right panel to review the active one in detail.</p>
                  </div>

                  <div className="requirements-list">
                    {requirements.length === 0 ? (
                      <div className="requirements-empty-state card">
                        <Sparkles size={22} />
                        <h4>No requirements drafted yet</h4>
                        <p>Generate a draft above to build the review queue.</p>
                      </div>
                    ) : requirements.map((req) => {
                      const isSelected = selectedRequirementId === req.id;
                      const isQueued = selectedRequirementIds.includes(req.id);

                      return (
                        <div
                          key={req.id}
                          className={`card requirement-item ${isSelected ? 'active' : ''}`}
                          onClick={() => setSelectedRequirementId(req.id)}
                        >
                          <div className="requirement-item-top">
                            <label className="requirement-item-select" onClick={(event) => event.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isQueued}
                                onChange={() => toggleRequirementSelection(req.id)}
                              />
                              <span>{isQueued ? 'Queued' : 'Queue'}</span>
                            </label>
                            <span className={`badge ${req.type === 'functional' ? 'badge-info' : 'badge-warning'}`}>
                              {req.type === 'functional' ? 'Functional' : 'Non-Functional'}
                            </span>
                            <span className="badge badge-success" style={{ textTransform: 'uppercase' }}>
                              {req.status}
                            </span>
                          </div>

                          <h4>{req.title}</h4>
                          <p className="requirement-item-copy">{req.description}</p>

                          <div className="requirement-item-meta">
                            <span>Priority: {req.priority}</span>
                            <span>Criteria: {req.acceptanceCriteria?.length || 0}</span>
                            <span>Tests: {req.testCases?.length || 0}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="card requirement-detail-shell">
                  {selectedReq ? (
                    <div className="requirement-detail-view">
                      <div className="requirement-detail-header">
                        <div>
                          <span className={`badge ${selectedReq.type === 'functional' ? 'badge-info' : 'badge-warning'}`}>
                            {selectedReq.type === 'functional' ? 'Functional' : 'Non-Functional'}
                          </span>
                          <h2>{selectedReq.title}</h2>
                          <p>{selectedReq.description}</p>
                        </div>

                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => handleGenerateRequirementArtifacts([selectedReq.id])}
                          disabled={expandingRequirements}
                        >
                          {expandingRequirements ? 'Working...' : 'Expand this requirement'}
                        </button>
                      </div>

                      <div className="requirement-detail-metrics">
                        <div><span>Priority</span><strong>{selectedReq.priority}</strong></div>
                        <div><span>Status</span><strong>{selectedReq.status}</strong></div>
                        <div><span>Acceptance criteria</span><strong>{selectedReq.acceptanceCriteria?.length || 0}</strong></div>
                        <div><span>Test cases</span><strong>{selectedReq.testCases?.length || 0}</strong></div>
                        <div><span>Linked tasks</span><strong>{selectedReq.tasks?.length || 0}</strong></div>
                        <div><span>Type</span><strong>{selectedReq.type === 'functional' ? 'Functional' : 'Non-Functional'}</strong></div>
                      </div>

                      <div className="requirement-detail-section">
                        <div className="requirement-detail-section-head">
                          <h4>Acceptance Criteria</h4>
                          <span>{selectedReq.acceptanceCriteria?.length || 0} items</span>
                        </div>
                        {selectedReq.acceptanceCriteria?.length ? (
                          <div className="requirement-detail-list">
                            {selectedReq.acceptanceCriteria.map((ac, idx) => (
                              <div key={ac.id} className="requirement-detail-item">
                                <span>{idx + 1}</span>
                                <p>{ac.criteriaText}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="requirement-detail-empty">
                            <p>No acceptance criteria generated yet.</p>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => handleGenerateRequirementArtifacts([selectedReq.id])}
                              disabled={expandingRequirements}
                            >
                              Generate criteria and test cases
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="requirement-detail-section">
                        <div className="requirement-detail-section-head">
                          <h4>Test Cases</h4>
                          <span>{selectedReq.testCases?.length || 0} items</span>
                        </div>
                        {selectedReq.testCases?.length ? (
                          <div className="requirement-detail-list">
                            {selectedReq.testCases.map((testCase, idx) => (
                              <div key={testCase.id} className="requirement-detail-item requirement-testcase-item">
                                <span>{idx + 1}</span>
                                <div>
                                  <strong>{testCase.testTitle}</strong>
                                  <p>{testCase.testSteps}</p>
                                  <small>Expected: {testCase.expectedResult}</small>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="requirement-detail-empty">
                            <p>No test cases generated yet.</p>
                          </div>
                        )}
                      </div>

                      <div className="requirement-detail-section">
                        <div className="requirement-detail-section-head">
                          <h4>Linked Tasks</h4>
                          <span>{selectedReq.tasks?.length || 0} items</span>
                        </div>
                        {selectedReq.tasks?.length ? (
                          <div className="requirement-detail-tags">
                            {selectedReq.tasks.map((task) => (
                              <span key={task.id} className="requirement-task-pill">
                                {task.title} · {task.status}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="requirement-detail-empty">
                            <p>No tasks are linked to this requirement yet.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>
                      Select a requirement from the list to inspect its parameters, acceptance criteria, test cases, and linked tasks.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Deliverables & Tasks */}
        {activeTab === 'tasks' && (
          <div className="task-board-shell">
            <div className="task-board-panel">
              <div className="task-top-tabs" aria-label="Task workspace sections">
                <button type="button" className="task-top-tab muted">Messages</button>
                <button type="button" className="task-top-tab active">Project Tasks</button>
                <button type="button" className="task-top-tab muted">Last Activity</button>
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
                            onClick={async () => {
                              await axios.put(`/projects/tasks/${task.id}`, {
                                status: isClosed ? 'todo' : 'completed',
                              });
                              fetchWorkspaceData();
                            }}
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
                                await axios.put(`/projects/tasks/${task.id}`, {
                                  deadline: e.target.value || null,
                                });
                                fetchWorkspaceData();
                              }}
                            />
                          </label>

                          <select
                            value={task.status}
                            onChange={async (e) => {
                              await axios.put(`/projects/tasks/${task.id}`, { status: e.target.value });
                              fetchWorkspaceData();
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
                      </article>
                    );
                  })
                )}
              </div>
            </div>

            {/* Task creation modal */}
            {showTaskModal && (
              <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                backdropFilter: 'blur(8px)'
              }}>
                <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '32px' }}>
                  <h2>Create New Task</h2>
                  <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Task Title</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea 
                        className="form-input" 
                        value={taskDesc}
                        onChange={(e) => setTaskDesc(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Priority</label>
                      <select 
                        className="form-input" 
                        value={taskPriority} 
                        onChange={(e) => setTaskPriority(e.target.value)}
                        style={{ background: 'var(--bg-secondary)' }}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>

                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">Assignee</label>
                        <select
                          className="form-input"
                          value={taskAssignee}
                          onChange={(e) => setTaskAssignee(e.target.value)}
                          style={{ background: 'var(--bg-secondary)' }}
                        >
                          <option value="">Unassigned</option>
                          {teamMembers.map((member) => (
                            <option key={member.userId} value={member.userId}>{member.user.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Deadline</label>
                        <input
                          type="datetime-local"
                          className="form-input"
                          value={taskDeadline}
                          onChange={(e) => setTaskDeadline(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Linked requirement</label>
                      <select
                        className="form-input"
                        value={taskReqId}
                        onChange={(e) => setTaskReqId(e.target.value)}
                        style={{ background: 'var(--bg-secondary)' }}
                      >
                        <option value="">No requirement link</option>
                        {requirements.map((requirement) => (
                          <option key={requirement.id} value={requirement.id}>{requirement.title}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                      <button type="button" onClick={() => setShowTaskModal(false)} className="btn btn-secondary">
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary">
                        Assign Task
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Team Management */}
        {activeTab === 'team' && (
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

                {teamMembers.map((member) => (
                  <article key={member.userId} className="team-table-row">
                    <button
                      type="button"
                      className="team-person"
                      onClick={() => navigate(`/users/${member.userId}?projectId=${id}`)}
                    >
                      <span className="team-avatar">{getInitials(member.user.name)}</span>
                      <span>
                        <strong>{member.user.name}</strong>
                        <small>{member.user.email}</small>
                      </span>
                    </button>

                    <div>
                      {canManageTeam ? (
                        <select
                          className="team-role-select"
                          value={member.projectRole || 'researcher'}
                          onChange={(e) => handleUpdateMember(member, { projectRole: e.target.value })}
                        >
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
                        <span className="badge badge-success">
                          <ShieldCheck size={13} />
                          Lead
                        </span>
                      )}
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => navigate(`/users/${member.userId}?projectId=${id}`)}
                        title="View profile"
                      >
                        <ExternalLink size={15} />
                      </button>
                      {canManageTeam && member.userId !== user.id && !member.isLeader && (
                        <button
                          type="button"
                          className="icon-button danger"
                          onClick={() => handleRemoveMember(member)}
                          title="Remove member"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </article>
                ))}
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
                      <button type="button" className="icon-button" onClick={handleCopyInvite} disabled={!activeInviteCode}>
                        <Copy size={15} />
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
                            <span>{invite.usedAt ? 'Used' : 'Ready'} · {formatCommentDate(invite.createdAt)}</span>
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
                  <input
                    className="form-input"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search by name or email"
                  />
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
                        <button
                          type="button"
                          className="team-person"
                          onClick={() => navigate(`/users/${candidate.id}?projectId=${id}`)}
                        >
                          <span className="team-avatar">{getInitials(candidate.name)}</span>
                          <span>
                            <strong>{candidate.name}</strong>
                            <small>{candidate.email}</small>
                          </span>
                        </button>
                        {canManageTeam && !alreadyMember ? (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => handleAddMember(candidate.id)}
                          >
                            <UserPlus size={15} />
                            Add
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
        )}

        {/* TAB 4: Contribution Audits */}
        {activeTab === 'contribution' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div className="grid-2">
              {/* Member lists & Scores */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3>Contribution Scores Audit</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {contribData?.members.map((member) => (
                    <div key={member.userId} style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 600 }}>{member.name} ({member.role})</span>
                        <span style={{ fontWeight: 'bold', color: 'var(--accent-secondary)' }}>{member.finalScore}%</span>
                      </div>
                      {/* Metric bar */}
                      <div style={{ height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${member.finalScore}%`, background: 'var(--accent-primary)', borderRadius: '4px' }}></div>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                        <span>Tasks: {member.metrics.completedTasks}</span>
                        <span>Logs: {member.metrics.progressLogsSubmitted}</span>
                        <span>Rating: {member.metrics.averagePeerReviewRating}/5.0</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warning panel */}
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

            {/* Submit progress log */}
            <div className="grid-2">
              <div className="card">
                <h3>Submit Weekly Log</h3>
                <form onSubmit={handleSubmitLog} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Week Number</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={logWeek} 
                      onChange={(e) => setLogWeek(e.target.value)} 
                      min="1"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Log details</label>
                    <textarea 
                      className="form-input" 
                      placeholder="Detail your work completed this week..."
                      value={progressLogText} 
                      onChange={(e) => setProgressLogText(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                    Submit Log
                  </button>
                </form>
              </div>

              <div className="card">
                <h3>Submit Member Peer Review</h3>
                <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Select Peer</label>
                    <select 
                      className="form-input"
                      value={reviews.reviewedUserId}
                      onChange={(e) => setReviews({ ...reviews, reviewedUserId: e.target.value })}
                      style={{ background: 'var(--bg-secondary)' }}
                      required
                    >
                      <option value="">-- Choose Peer --</option>
                      {teamMembers.filter(m => m.userId !== user.id).map(m => (
                        <option key={m.userId} value={m.userId}>{m.user.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Technical Contribution (1-5)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={reviews.technicalContribution} 
                      onChange={(e) => setReviews({ ...reviews, technicalContribution: parseInt(e.target.value, 10) })}
                      min="1" max="5"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Review comment</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Always delivers coding modules on time."
                      value={reviews.comment} 
                      onChange={(e) => setReviews({ ...reviews, comment: e.target.value })}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                    Register Rating
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Readiness & Reports */}
        {activeTab === 'readiness' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3>Viva Readiness</h3>
                {readiness ? (
                  <div style={{ display: 'flex', gap: '40px', marginTop: '16px' }}>
                    <div>
                      <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{readiness.overallScore}%</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Readiness Score</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.9rem' }}>
                      <div>Requirements Quality: {readiness.requirementsScore}%</div>
                      <div>Testing Evidence: {readiness.testingScore}%</div>
                      <div>Documentation Completeness: {readiness.documentationScore}%</div>
                      <div>Contribution Balance: {readiness.contributionScore}%</div>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)' }}>No readiness calculated yet.</p>
                )}
              </div>

              <button 
                onClick={async () => {
                  try {
                    const res = await axios.post(`/projects/${id}/readiness-score/generate`);
                    setReadiness(res.data);
                    toast.success('Readiness score updated successfully.');
                  } catch (err) {
                    toast.error(err.response?.data?.error || 'Unable to update readiness score.');
                  }
                }}
                className="btn btn-primary"
              >
                Update Score
              </button>
            </div>

            {/* Document PDF Exports card */}
            <div className="card">
              <h3>Export Review Documents</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Download academic PDF reports for requirements, contribution records, viva practice, and overall readiness.
              </p>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <button onClick={() => handleDownloadReport('requirements')} className="btn btn-secondary">
                  <Download size={16} />
                  Requirements Specification PDF
                </button>
                <button onClick={() => handleDownloadReport('contribution')} className="btn btn-secondary">
                  <Download size={16} />
                  Individual Contribution PDF
                </button>
                <button onClick={() => handleDownloadReport('viva')} className="btn btn-secondary">
                  <Download size={16} />
                  Viva Readiness PDF
                </button>
                <button onClick={() => handleDownloadReport('full')} className="btn btn-primary">
                  <Download size={16} />
                  Full Audit Summary PDF
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Comments */}
        {activeTab === 'comments' && (
          <div className="comments-layout">
            <section className="card comments-compose">
              <div className="comments-panel-head">
                <div>
                  <span className="badge badge-info">Review notes</span>
                  <h3>Compose a comment</h3>
                  <p className="comments-panel-copy">
                    Pick the surface first, then leave feedback that is specific enough to act on.
                  </p>
                </div>
                <div className="comments-summary">
                  {commentTargetOptions.map((option) => (
                    <div key={option.id} className="comments-summary-item">
                      <span>{option.label}</span>
                      <strong>{commentCounts[option.id] || 0}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleAddComment} className="comments-form">
                <div className="form-group">
                  <label className="form-label">Comment target</label>
                  <div className="comment-target-toggle" aria-label="Choose a comment target">
                    {commentTargetOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className={`comment-target-option ${commentTarget === option.id ? 'active' : ''}`}
                        onClick={() => setCommentTarget(option.id)}
                        aria-pressed={commentTarget === option.id}
                      >
                        <span>{option.label}</span>
                        <small>{option.note}</small>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Review comment</label>
                  <textarea
                    className="form-input comments-textarea"
                    placeholder="Explain what should change, why it matters, and where the team should look next."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    required
                  />
                  <p className="comments-helper">
                    Short, direct comments work best. Keep the note tied to the selected target.
                  </p>
                </div>

                <div className="comments-form-actions">
                  <div className="comments-active-target">
                    <span className="comments-active-target-label">Posting to</span>
                    <strong>{getCommentTargetLabel(commentTarget)}</strong>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={!newComment.trim()}>
                    Post Comment
                  </button>
                </div>
              </form>
            </section>

            <section className="card comments-feed">
              <div className="comments-panel-head comments-feed-head">
                <div>
                  <span className="badge badge-info">Latest updates</span>
                  <h3>Comment stream</h3>
                  <p className="comments-panel-copy">
                    Newest notes appear first so the feed reads like an active review thread.
                  </p>
                </div>
                <div className="comments-feed-count">
                  {sortedComments.length} note{sortedComments.length === 1 ? '' : 's'}
                </div>
              </div>

              {sortedComments.length === 0 ? (
                <div className="comments-empty">
                  <MessageSquare size={24} />
                  <h4>No comments yet</h4>
                  <p>
                    Use the compose panel to leave the first review note. It will appear here as a structured feed.
                  </p>
                </div>
              ) : (
                <div className="comment-stream">
                  {sortedComments.map((comment) => (
                    <article key={comment.id} className="comment-item">
                      <div className="comment-item-top">
                        <div className="comment-author">
                          <span className="comment-avatar">
                            <UserRound size={14} />
                          </span>
                          <div>
                            <strong>{comment.user.name}</strong>
                            <span>{comment.user.role}</span>
                          </div>
                        </div>
                        <span className="comment-date">{formatCommentDate(comment.createdAt)}</span>
                      </div>

                      <div className="comment-item-meta">
                        <span className="badge badge-info">{getCommentTargetLabel(comment.targetType)}</span>
                      </div>

                      <p className="comment-item-body">{comment.commentText}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProjectWorkspace;
