import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import CoolLoader from '../../components/CoolLoader';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from './ProjectWorkspaceLayout';
import { Sparkles, Loader2, Search, CheckCircle2, XCircle, Pencil, Wand2 } from 'lucide-react';

const priorityOrder = { high: 0, medium: 1, low: 2 };

export const RequirementsSection = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { project, teamMembers, setCounts } = useWorkspace();

  const [requirements, setRequirements] = useState([]);
  const [selectedRequirementId, setSelectedRequirementId] = useState(null);
  const [selectedRequirementIds, setSelectedRequirementIds] = useState([]);
  const [requirementDetailTab, setRequirementDetailTab] = useState('overview');
  const [rawDesc, setRawDesc] = useState('');
  const [refining, setRefining] = useState(false);
  const [ambiguities, setAmbiguities] = useState([]);
  const [expandingRequirements, setExpandingRequirements] = useState(false);
  const [loading, setLoading] = useState(true);
  const requirementsPromptRef = useRef(null);

  // Filter/sort state
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('id');

  // Inline editing state
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');

  // AI refine state
  const [refineResult, setRefineResult] = useState(null);
  const [refiningSingle, setRefiningSingle] = useState(false);

  // Bulk action state
  const [bulkActionProcessing, setBulkActionProcessing] = useState(false);

  const selectedReq = requirements.find((r) => r.id === selectedRequirementId) || null;

  const canReview = useMemo(() => {
    if (!user || !project || !teamMembers) return false;
    return user.role === 'admin'
      || project.supervisorId === user.id
      || project.createdBy === user.id
      || teamMembers.some((m) => m.userId === user.id && (m.isLeader || m.projectRole === 'project_manager'));
  }, [user, project, teamMembers]);

  const filteredRequirements = useMemo(() => {
    let result = [...requirements];
    if (filterType !== 'all') result = result.filter((r) => r.type === filterType);
    if (filterPriority !== 'all') result = result.filter((r) => r.priority === filterPriority);
    if (filterStatus !== 'all') result = result.filter((r) => r.status === filterStatus);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r) => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q));
    }
    if (sortBy === 'priority') result.sort((a, b) => (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99));
    else if (sortBy === 'status') result.sort((a, b) => a.status.localeCompare(b.status));
    else result.sort((a, b) => a.id - b.id);
    return result;
  }, [requirements, filterType, filterPriority, filterStatus, searchQuery, sortBy]);

  const fetchRequirements = useCallback(async () => {
    try {
      const res = await axios.get(`/projects/${id}/requirements`);
      setRequirements(res.data);
      setCounts((c) => ({ ...c, requirements: res.data.length }));
    } catch (err) {
      console.error('Failed to load requirements:', err);
    } finally {
      setLoading(false);
    }
  }, [id, setCounts]);

  useEffect(() => { fetchRequirements(); }, [fetchRequirements]);

  useEffect(() => {
    if (requirements.length === 0) {
      setSelectedRequirementId(null);
      setSelectedRequirementIds([]);
      return;
    }
    setSelectedRequirementIds((current) =>
      current.filter((rid) => requirements.some((r) => r.id === rid))
    );
    setSelectedRequirementId((current) => {
      if (current && requirements.some((r) => r.id === current)) return current;
      return requirements[0].id;
    });
  }, [requirements]);

  useEffect(() => { setRequirementDetailTab('overview'); }, [selectedRequirementId]);

  const focusRequirementsPrompt = () => {
    requirementsPromptRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    requirementsPromptRef.current?.focus();
  };

  const toggleRequirementSelection = (requirementId) => {
    setSelectedRequirementIds((current) =>
      current.includes(requirementId)
        ? current.filter((id) => id !== requirementId)
        : [...current, requirementId]
    );
  };

  const selectAllRequirements = () => {
    setSelectedRequirementIds(filteredRequirements.map((r) => r.id));
  };

  const clearRequirementSelection = () => {
    setSelectedRequirementIds([]);
  };

  const handleAIRefinement = async () => {
    setRefining(true);
    setAmbiguities([]);
    try {
      const res = await axios.post(`/projects/${id}/requirements/generate`, {
        rawDescription: rawDesc,
      });
      setRequirements(res.data.requirements);
      setAmbiguities(res.data.ambiguityWarnings);
      setSelectedRequirementIds(res.data.requirements.map((r) => r.id));
      setSelectedRequirementId(res.data.requirements[0]?.id || null);
      setCounts((c) => ({ ...c, requirements: res.data.requirements.length }));
      toast.success('Requirements draft created.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to draft requirements right now.');
    } finally {
      setRefining(false);
    }
  };

  const handleGenerateRequirementArtifacts = async (requirementIds = selectedRequirementIds) => {
    const uniqueIds = [...new Set(requirementIds)].filter((rid) =>
      requirements.some((r) => r.id === rid)
    );
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
      await fetchRequirements();
      toast.success(`Expanded ${uniqueIds.length} requirement${uniqueIds.length === 1 ? '' : 's'}.`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to expand the selected requirements.');
    } finally {
      setExpandingRequirements(false);
    }
  };

  /** Inline editing */
  const startEditing = (field, value) => {
    setEditingField(field);
    setEditValue(value);
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValue('');
  };

  const saveEdit = async (requirementId) => {
    if (!editValue.trim() || !selectedReq) return;
    try {
      const updateData = editingField === 'title' ? { title: editValue } : { description: editValue };
      await axios.put(`/projects/requirements/${requirementId}`, updateData);
      cancelEditing();
      await fetchRequirements();
      toast.success('Requirement updated.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to update requirement.');
    }
  };

  /** AI refine for a single requirement */
  const handleRefineRequirement = async (requirementId) => {
    setRefiningSingle(true);
    setRefineResult(null);
    try {
      const res = await axios.post(`/projects/requirements/${requirementId}/refine`);
      setRefineResult({ ...res.data, requirementId });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to refine requirement.');
    } finally {
      setRefiningSingle(false);
    }
  };

  const applyRefinement = async () => {
    if (!refineResult) return;
    try {
      await axios.put(`/projects/requirements/${refineResult.requirementId}/refine/apply`, refineResult.suggested);
      setRefineResult(null);
      await fetchRequirements();
      toast.success('Refinement applied.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to apply refinement.');
    }
  };

  /** Approve/reject */
  const handleReview = async (requirementId, status) => {
    try {
      await axios.put(`/projects/requirements/${requirementId}/review`, { status });
      await fetchRequirements();
      toast.success(`Requirement ${status}.`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to update requirement status.');
    }
  };

  /** Bulk actions */
  const handleBulkAction = async (action) => {
    const ids = [...new Set(selectedRequirementIds)].filter((rid) =>
      requirements.some((r) => r.id === rid)
    );
    if (ids.length === 0) { toast.error('Select requirements first.'); return; }
    setBulkActionProcessing(true);
    try {
      await axios.post(`/projects/${id}/requirements/bulk`, { action, requirementIds: ids });
      await fetchRequirements();
      setSelectedRequirementIds([]);
      toast.success(`Bulk ${action} completed for ${ids.length} requirements.`);
    } catch (err) {
      toast.error(err.response?.data?.error || `Bulk ${action} failed.`);
    } finally {
      setBulkActionProcessing(false);
    }
  };

  if (loading) return <CoolLoader compact title="Loading requirements..." />;

  return (
    <div className="requirements-page">
      {/* Hero section */}
      <section className="card requirements-hero">
        <div className="requirements-hero-copy">
          <span className="badge badge-info">Requirements workspace</span>
          <h3>Shape the spec before the board fills up</h3>
          <p>Draft requirements, scan ambiguity warnings, and expand only the items that matter.</p>
          <div className="requirements-hero-stats">
            <div className="requirements-hero-stat">
              <span>Drafted</span>
              <strong>{requirements.length}</strong>
            </div>
            <div className="requirements-hero-stat">
              <span>Queued</span>
              <strong>{selectedRequirementIds.length}</strong>
            </div>
            <div className="requirements-hero-stat">
              <span>Warnings</span>
              <strong>{ambiguities.length}</strong>
            </div>
          </div>
        </div>
        <div className="requirements-hero-actions">
          <button type="button" className="btn btn-secondary" onClick={focusRequirementsPrompt}>Refine prompt</button>
          <button type="button" className="btn btn-secondary" onClick={selectAllRequirements} disabled={filteredRequirements.length === 0}>Select all</button>
          <button type="button" className="btn btn-secondary" onClick={clearRequirementSelection} disabled={selectedRequirementIds.length === 0}>Clear selection</button>
          <button type="button" className="btn btn-primary" onClick={() => handleGenerateRequirementArtifacts()}
            disabled={selectedRequirementIds.length === 0 || expandingRequirements}>
            {expandingRequirements ? <><Loader2 className="spinner-icon" size={15} /> Expanding...</> : 'Generate details for selected'}
          </button>
        </div>
      </section>

      {/* Intake grid */}
      <div className="requirements-intake-grid">
        <div className="card requirements-drafting-card">
          <div>
            <span className="badge badge-info">Drafting lane</span>
            <h3>Requirements drafting</h3>
            <p className="requirements-copy">Paste a project idea, feature request, or rough scope note.</p>
          </div>
          <textarea className="form-input requirements-prompt" placeholder="Paste the rough project description..."
            value={rawDesc} onChange={(e) => setRawDesc(e.target.value)} ref={requirementsPromptRef} />
          <button onClick={handleAIRefinement} className="btn btn-primary requirements-draft-button" disabled={refining}>
            {refining ? <><Loader2 className="spinner-icon" size={15} /> Drafting...</> : 'Draft Requirements'}
          </button>
        </div>

        <div className="card requirements-clarity-card">
          <div>
            <span className="badge badge-info">Clarity lane</span>
            <h3>Clarity checks</h3>
            <p className="requirements-copy">Ambiguity warnings stay compact here.</p>
          </div>
          {ambiguities.length === 0 ? (
            <div className="requirements-empty-state requirements-empty-state--compact">
              <Sparkles size={20} />
              <h4>No clarity checks yet</h4>
              <p>Draft requirements to highlight vague wording.</p>
            </div>
          ) : (
            <div className="clarity-list">
              {ambiguities.map((warn, i) => (
                <div key={i} className="clarity-item">
                  <div className="clarity-item-title">Needs clarification: &ldquo;{warn.vagueTerm}&rdquo;</div>
                  <div className="clarity-item-copy">{warn.explanation}</div>
                  <div className="clarity-item-suggestion">Suggestion: {warn.suggestion}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filter bar */}
      {requirements.length > 0 && (
        <div className="card" style={{ padding: '12px 16px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
            <Search size={14} />
            <input className="form-input" style={{ width: '160px', padding: '4px 8px' }} placeholder="Search..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </label>
          <select className="form-input" style={{ width: 'auto', padding: '4px 8px', background: 'var(--bg-secondary)' }}
            value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All types</option>
            <option value="functional">Functional</option>
            <option value="non_functional">Non-Functional</option>
          </select>
          <select className="form-input" style={{ width: 'auto', padding: '4px 8px', background: 'var(--bg-secondary)' }}
            value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
            <option value="all">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select className="form-input" style={{ width: 'auto', padding: '4px 8px', background: 'var(--bg-secondary)' }}
            value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select className="form-input" style={{ width: 'auto', padding: '4px 8px', background: 'var(--bg-secondary)' }}
            value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="id">Sort: ID</option>
            <option value="priority">Sort: Priority</option>
            <option value="status">Sort: Status</option>
          </select>
          <span style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', marginLeft: 'auto' }}>
            {filteredRequirements.length} / {requirements.length} shown
          </span>
        </div>
      )}

      {/* Bulk actions toolbar */}
      {selectedRequirementIds.length > 0 && (
        <div className="card" style={{ padding: '10px 16px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', background: 'var(--accent-primary)', color: '#fff' }}>
          <strong style={{ fontSize: '0.85rem' }}>{selectedRequirementIds.length} selected</strong>
          {canReview && (
            <>
              <button className="btn btn-secondary" style={{ background: '#fff', color: 'var(--accent-primary)' }}
                onClick={() => handleBulkAction('approve')} disabled={bulkActionProcessing}>
                <CheckCircle2 size={14} /> Approve
              </button>
              <button className="btn btn-secondary" style={{ background: '#fff', color: 'var(--color-danger)' }}
                onClick={() => handleBulkAction('reject')} disabled={bulkActionProcessing}>
                <XCircle size={14} /> Reject
              </button>
            </>
          )}
          <button className="btn btn-secondary" style={{ background: '#fff' }}
            onClick={() => handleBulkAction('generate_criteria')} disabled={bulkActionProcessing}>
            <Sparkles size={14} /> Gen. Criteria
          </button>
          <button className="btn btn-secondary" style={{ background: '#fff' }}
            onClick={() => handleBulkAction('generate_tests')} disabled={bulkActionProcessing}>
            <Sparkles size={14} /> Gen. Tests
          </button>
          <button className="btn btn-secondary" style={{ background: '#fff', color: 'var(--color-danger)' }}
            onClick={() => handleBulkAction('delete')} disabled={bulkActionProcessing}>
            Delete
          </button>
          <button className="btn btn-secondary" style={{ background: '#fff' }}
            onClick={clearRequirementSelection} disabled={bulkActionProcessing}>
            Clear
          </button>
        </div>
      )}

      {/* Workbench */}
      <div className="requirements-workbench">
        <div className="requirements-workbench-header card">
          <div>
            <span className="badge badge-info">Review queue</span>
            <h3>Inspect the generated requirements</h3>
            <p className="requirements-workbench-copy">Click a card to inspect, select several for batch operations.</p>
          </div>
          <div className="requirements-selection-summary requirements-selection-summary--compact">
            <span>{selectedRequirementIds.length} selected</span>
            <span>{filteredRequirements.length} total</span>
            <span>{selectedReq ? `Viewing: ${selectedReq.title}` : 'Pick a requirement'}</span>
          </div>
        </div>

        <div className="requirements-workbench-grid">
          <div className="requirements-list-column">
            <div className="requirements-list-head">
              <h3>Project specification tree</h3>
            </div>
            <div className="requirements-list">
              {filteredRequirements.length === 0 ? (
                <div className="requirements-empty-state card">
                  <Sparkles size={22} />
                  <h4>No requirements match filters</h4>
                  <p>Adjust the filter or draft new requirements.</p>
                </div>
              ) : filteredRequirements.map((req) => {
                const isSelected = selectedRequirementId === req.id;
                const isQueued = selectedRequirementIds.includes(req.id);
                return (
                  <div key={req.id} className={`card requirement-item ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedRequirementId(req.id)}>
                    <div className="requirement-item-top">
                      <label className="requirement-item-select" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={isQueued} onChange={() => toggleRequirementSelection(req.id)} />
                        <span>{isQueued ? 'Queued' : 'Queue'}</span>
                      </label>
                      <span className={`badge ${req.type === 'functional' ? 'badge-info' : 'badge-warning'}`}>
                        {req.type === 'functional' ? 'Functional' : 'Non-Functional'}
                      </span>
                      <span className={`badge ${req.status === 'approved' ? 'badge-success' : req.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}
                        style={{ textTransform: 'uppercase' }}>
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
                    {/* Approve/reject on card */}
                    {canReview && (
                      <div className="requirement-item-actions" style={{ marginTop: '8px', display: 'flex', gap: '6px' }}
                        onClick={(e) => e.stopPropagation()}>
                        {req.status !== 'approved' && (
                          <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.78rem' }}
                            onClick={() => handleReview(req.id, 'approved')}>
                            <CheckCircle2 size={12} /> Approve
                          </button>
                        )}
                        {req.status !== 'rejected' && (
                          <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.78rem' }}
                            onClick={() => handleReview(req.id, 'rejected')}>
                            <XCircle size={12} /> Reject
                          </button>
                        )}
                        {req.status !== 'draft' && (
                          <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.78rem' }}
                            onClick={() => handleReview(req.id, 'draft')}>
                            Draft
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detail panel */}
          <div className="card requirement-detail-shell">
            {selectedReq ? (
              <div className="requirement-detail-view">
                <div className="requirement-detail-header">
                  <div>
                    <span className={`badge ${selectedReq.type === 'functional' ? 'badge-info' : 'badge-warning'}`}>
                      {selectedReq.type === 'functional' ? 'Functional' : 'Non-Functional'}
                    </span>
                    {/* Inline editable title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      {editingField === 'title' ? (
                        <input className="form-input" style={{ flex: 1 }} value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(selectedReq.id); if (e.key === 'Escape') cancelEditing(); }}
                          autoFocus />
                      ) : (
                        <>
                          <h2 style={{ margin: 0 }}>{selectedReq.title}</h2>
                          <button className="icon-button" onClick={() => startEditing('title', selectedReq.title)} title="Edit title">
                            <Pencil size={13} />
                          </button>
                        </>
                      )}
                    </div>
                    {/* Inline editable description */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '4px' }}>
                      {editingField === 'description' ? (
                        <textarea className="form-input" style={{ flex: 1, minHeight: '60px' }} value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) saveEdit(selectedReq.id); if (e.key === 'Escape') cancelEditing(); }}
                          autoFocus />
                      ) : (
                        <>
                          <p style={{ margin: 0 }}>{selectedReq.description}</p>
                          <button className="icon-button" onClick={() => startEditing('description', selectedReq.description)} title="Edit description">
                            <Pencil size={13} />
                          </button>
                        </>
                      )}
                    </div>
                    {editingField && (
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                        <button className="btn btn-primary" style={{ padding: '2px 10px', fontSize: '0.8rem' }}
                          onClick={() => saveEdit(selectedReq.id)}>Save</button>
                        <button className="btn btn-secondary" style={{ padding: '2px 10px', fontSize: '0.8rem' }}
                          onClick={cancelEditing}>Cancel</button>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => handleGenerateRequirementArtifacts([selectedReq.id])}
                      disabled={expandingRequirements}>
                      {expandingRequirements ? 'Working...' : 'Expand'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => handleRefineRequirement(selectedReq.id)}
                      disabled={refiningSingle}>
                      {refiningSingle ? <><Loader2 className="spinner-icon" size={14} /> Refining...</> : <><Wand2 size={14} /> Refine with AI</>}
                    </button>
                  </div>
                </div>

                <div className="requirement-detail-metrics">
                  <div><span>Priority</span><strong>{selectedReq.priority}</strong></div>
                  <div><span>Status</span><strong>{selectedReq.status}</strong></div>
                  <div><span>Acceptance criteria</span><strong>{selectedReq.acceptanceCriteria?.length || 0}</strong></div>
                  <div><span>Test cases</span><strong>{selectedReq.testCases?.length || 0}</strong></div>
                  <div><span>Linked tasks</span><strong>{selectedReq.tasks?.length || 0}</strong></div>
                  <div><span>Type</span><strong>{selectedReq.type === 'functional' ? 'Functional' : 'Non-Functional'}</strong></div>
                </div>

                <div className="requirement-detail-tabs" role="tablist" aria-label="Requirement detail sections">
                  {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'criteria', label: 'Criteria' },
                    { id: 'tests', label: 'Tests' },
                    { id: 'tasks', label: 'Tasks' },
                  ].map((tab) => (
                    <button key={tab.id} type="button" role="tab"
                      aria-selected={requirementDetailTab === tab.id}
                      className={`requirement-detail-tab ${requirementDetailTab === tab.id ? 'active' : ''}`}
                      onClick={() => setRequirementDetailTab(tab.id)}>
                      {tab.label}
                    </button>
                  ))}
                </div>

                {requirementDetailTab === 'overview' && (
                  <div className="requirement-detail-section requirement-detail-section--overview">
                    <div className="requirement-detail-empty requirement-detail-empty--soft">
                      <p>This requirement is selected for review. Switch tabs to inspect generated criteria, test cases, or linked tasks.</p>
                    </div>
                  </div>
                )}

                {requirementDetailTab === 'criteria' && (
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
                        <button type="button" className="btn btn-secondary"
                          onClick={() => handleGenerateRequirementArtifacts([selectedReq.id])} disabled={expandingRequirements}>
                          Generate criteria and test cases
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {requirementDetailTab === 'tests' && (
                  <div className="requirement-detail-section">
                    <div className="requirement-detail-section-head">
                      <h4>Test Cases</h4>
                      <span>{selectedReq.testCases?.length || 0} items</span>
                    </div>
                    {selectedReq.testCases?.length ? (
                      <div className="requirement-detail-list">
                        {selectedReq.testCases.map((tc, idx) => (
                          <div key={tc.id} className="requirement-detail-item requirement-testcase-item">
                            <span>{idx + 1}</span>
                            <div>
                              <strong>{tc.testTitle}</strong>
                              <p>{tc.testSteps}</p>
                              <small>Expected: {tc.expectedResult}</small>
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
                )}

                {requirementDetailTab === 'tasks' && (
                  <div className="requirement-detail-section">
                    <div className="requirement-detail-section-head">
                      <h4>Linked Tasks</h4>
                      <span>{selectedReq.tasks?.length || 0} items</span>
                    </div>
                    {selectedReq.tasks?.length ? (
                      <div className="requirement-detail-tags">
                        {selectedReq.tasks.map((task) => (
                          <span key={task.id} className="requirement-task-pill">
                            {task.title} &middot; {task.status}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="requirement-detail-empty">
                        <p>No tasks are linked to this requirement yet.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="requirement-detail-empty requirement-detail-empty--hero">
                <Sparkles size={22} />
                <h4>Select a requirement to inspect</h4>
                <p>The detail inspector reveals one section at a time.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Refinement Modal */}
      {refineResult && (
        <div className="workspace-modal-overlay" role="presentation" onClick={() => setRefineResult(null)}>
          <div className="workspace-modal" role="dialog" aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '600px', padding: '24px' }}>
            <h3>AI Refinement Suggestion</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{refineResult.changes}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <strong>Current Title:</strong>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{refineResult.current.title}</p>
                <strong>Suggested Title:</strong>
                <p style={{ color: 'var(--accent-primary)', fontSize: '0.9rem' }}>{refineResult.suggested.title}</p>
              </div>
              <div>
                <strong>Current Description:</strong>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{refineResult.current.description}</p>
                <strong>Suggested Description:</strong>
                <p style={{ color: 'var(--accent-primary)', fontSize: '0.9rem' }}>{refineResult.suggested.description}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={() => setRefineResult(null)}>Dismiss</button>
              <button className="btn btn-primary" onClick={applyRefinement}>Apply Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequirementsSection;
