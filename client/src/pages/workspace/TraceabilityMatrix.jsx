import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import CoolLoader from '../../components/CoolLoader';
import { useWorkspace } from './ProjectWorkspaceLayout';
import { Layers, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';

export const TraceabilityMatrix = () => {
  const { id } = useParams();
  const { setCounts } = useWorkspace();

  const [matrix, setMatrix] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState(new Set());

  const fetchMatrix = useCallback(async () => {
    try {
      const res = await axios.get(`/projects/${id}/requirements/traceability`);
      setMatrix(res.data);
      setCounts((c) => ({ ...c, requirements: res.data.length }));
    } catch (err) {
      console.error('Failed to load traceability matrix:', err);
    } finally {
      setLoading(false);
    }
  }, [id, setCounts]);

  useEffect(() => { fetchMatrix(); }, [fetchMatrix]);

  const toggleRow = (reqId) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(reqId)) next.delete(reqId);
      else next.add(reqId);
      return next;
    });
  };

  const statusIcon = (status) => {
    if (status === 'approved') return <CheckCircle2 size={14} style={{ color: 'var(--color-success)' }} />;
    if (status === 'rejected') return <XCircle size={14} style={{ color: 'var(--color-danger)' }} />;
    return <AlertTriangle size={14} style={{ color: 'var(--color-warning)' }} />;
  };

  const totalApproved = matrix.filter((r) => r.status === 'approved').length;
  const totalWithCriteria = matrix.filter((r) => r.acceptanceCriteria?.length > 0).length;
  const totalWithTests = matrix.filter((r) => r.testCases?.length > 0).length;
  const totalWithTasks = matrix.filter((r) => r.tasks?.length > 0).length;

  if (loading) return <CoolLoader compact title="Loading traceability matrix..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Layers size={22} />
          <div>
            <h3 style={{ margin: 0 }}>Requirements Traceability Matrix</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Traceability overview linking requirements to acceptance criteria, test cases, and tasks.
            </p>
          </div>
        </div>

        {/* Summary chips */}
        <div className="requirements-hero-stats" style={{ marginBottom: '0' }}>
          <div className="requirements-hero-stat">
            <span>Total Reqs</span>
            <strong>{matrix.length}</strong>
          </div>
          <div className="requirements-hero-stat">
            <span>Approved</span>
            <strong>{totalApproved}</strong>
          </div>
          <div className="requirements-hero-stat">
            <span>Has Criteria</span>
            <strong>{totalWithCriteria}</strong>
          </div>
          <div className="requirements-hero-stat">
            <span>Has Tests</span>
            <strong>{totalWithTests}</strong>
          </div>
          <div className="requirements-hero-stat">
            <span>Linked to Tasks</span>
            <strong>{totalWithTasks}</strong>
          </div>
        </div>
      </div>

      {matrix.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <Layers size={32} style={{ opacity: 0.3 }} />
          <h4>No requirements yet</h4>
          <p style={{ color: 'var(--text-muted)' }}>Draft requirements first to populate the traceability matrix.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px', width: '30px' }}></th>
                <th style={{ padding: '10px 12px' }}>ID</th>
                <th style={{ padding: '10px 12px' }}>Title</th>
                <th style={{ padding: '10px 12px' }}>Type</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Criteria</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Tests</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Pass Rate</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Task Coverage</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((req) => {
                const isExpanded = expandedRows.has(req.id);
                const stats = req._stats || {};
                return (
                  <React.Fragment key={req.id}>
                    <tr style={{ borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }}
                      onClick={() => toggleRow(req.id)}>
                      <td style={{ padding: '10px 12px' }}>
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>R-{req.id}</td>
                      <td style={{ padding: '10px 12px' }}>{req.title}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span className={`badge ${req.type === 'functional' ? 'badge-info' : 'badge-warning'}`}>
                          {req.type === 'functional' ? 'Func' : 'NFR'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {statusIcon(req.status)} {req.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>{stats.criteriaCount ?? req.acceptanceCriteria?.length ?? 0}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>{stats.testCount ?? req.testCases?.length ?? 0}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span style={{ color: (stats.testPassRate ?? 0) >= 80 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                          {stats.testPassRate ?? 0}%
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        {stats.taskCount ?? req.tasks?.length ?? 0}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr style={{ background: 'var(--bg-tertiary)' }}>
                        <td colSpan={9} style={{ padding: '16px 24px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                              <strong>Description:</strong>
                              <p style={{ margin: '4px 0', color: 'var(--text-secondary)' }}>{req.description}</p>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                              <div>
                                <strong style={{ fontSize: '0.8rem' }}>Acceptance Criteria ({req.acceptanceCriteria?.length || 0})</strong>
                                {req.acceptanceCriteria?.length ? (
                                  <ul style={{ margin: '4px 0', paddingLeft: '16px', fontSize: '0.8rem' }}>
                                    {req.acceptanceCriteria.map((ac) => (
                                      <li key={ac.id}>{ac.criteriaText}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>None</p>
                                )}
                              </div>
                              <div>
                                <strong style={{ fontSize: '0.8rem' }}>Test Cases ({req.testCases?.length || 0})</strong>
                                {req.testCases?.length ? (
                                  <ul style={{ margin: '4px 0', paddingLeft: '16px', fontSize: '0.8rem' }}>
                                    {req.testCases.map((tc) => (
                                      <li key={tc.id}>
                                        {tc.testTitle}
                                        <span style={{ marginLeft: '6px' }} className={`badge ${tc.status === 'passed' ? 'badge-success' : tc.status === 'failed' ? 'badge-danger' : 'badge-warning'}`}>
                                          {tc.status}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>None</p>
                                )}
                              </div>
                              <div>
                                <strong style={{ fontSize: '0.8rem' }}>Linked Tasks ({req.tasks?.length || 0})</strong>
                                {req.tasks?.length ? (
                                  <ul style={{ margin: '4px 0', paddingLeft: '16px', fontSize: '0.8rem' }}>
                                    {req.tasks.map((task) => (
                                      <li key={task.id}>
                                        {task.title}
                                        <span style={{ marginLeft: '6px' }} className={`badge ${task.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                                          {task.status}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>None</p>
                                )}
                              </div>
                            </div>
                            {stats && (
                              <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-light)', paddingTop: '8px' }}>
                                <span>Coverage: {stats.criteriaCount || 0} criteria, {stats.testCount || 0} tests</span>
                                <span>Test pass rate: {stats.testPassRate ?? 0}%</span>
                                <span>Tasks: {stats.completedTasks ?? 0}/{stats.taskCount ?? 0} completed</span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TraceabilityMatrix;
