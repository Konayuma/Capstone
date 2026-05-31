import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import CoolLoader from '../../components/CoolLoader';
import { API_ORIGIN } from '../../lib/apiBase';
import { Download, Loader2 } from 'lucide-react';

export const ReadinessSection = () => {
  const { id } = useParams();

  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReadiness = useCallback(async () => {
    try {
      const res = await axios.get(`/projects/${id}/readiness-score`);
      setReadiness(res.data);
    } catch (err) {
      console.error('Failed to load readiness:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchReadiness(); }, [fetchReadiness]);

  const handleGenerateReadiness = async () => {
    try {
      const res = await axios.post(`/projects/${id}/readiness-score/generate`);
      setReadiness(res.data);
      toast.success('Readiness score updated successfully.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to update readiness score.');
    }
  };

  const handleDownloadReport = (reportType) => {
    window.open(`${API_ORIGIN}/api/projects/${id}/reports/${reportType}?token=${localStorage.getItem('token')}`);
  };

  if (loading) return <CoolLoader compact title="Loading readiness data..." />;

  return (
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
        <button onClick={handleGenerateReadiness} className="btn btn-primary">
          Update Score
        </button>
      </div>

      <div className="card">
        <h3>Export Review Documents</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Download academic PDF reports for requirements, contribution records, viva practice, and overall readiness.
        </p>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <button onClick={() => handleDownloadReport('requirements')} className="btn btn-secondary">
            <Download size={16} /> Requirements Specification PDF
          </button>
          <button onClick={() => handleDownloadReport('contribution')} className="btn btn-secondary">
            <Download size={16} /> Individual Contribution PDF
          </button>
          <button onClick={() => handleDownloadReport('viva')} className="btn btn-secondary">
            <Download size={16} /> Viva Readiness PDF
          </button>
          <button onClick={() => handleDownloadReport('full')} className="btn btn-primary">
            <Download size={16} /> Full Audit Summary PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReadinessSection;
