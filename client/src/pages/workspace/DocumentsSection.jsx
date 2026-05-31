import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import CoolLoader from '../../components/CoolLoader';
import { useWorkspace } from './ProjectWorkspaceLayout';
import {
  formatCommentDate, formatProjectFileTypeLabel, formatFileSize, getFileUrl,
  fileTypeOptions, parseAnalysisSections,
} from './workspace.helpers';
import {
  Upload, Sparkles, FileText, Download, Trash2,
  ArrowDownToLine, Loader2,
} from 'lucide-react';

export const DocumentsSection = () => {
  const { id } = useParams();
  const { triggerDelight, setCounts } = useWorkspace();

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadFileType, setUploadFileType] = useState('proposal');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [analyzingFiles, setAnalyzingFiles] = useState(false);
  const [refreshingFiles, setRefreshingFiles] = useState(false);
  const [fileAnalysis, setFileAnalysis] = useState('');

  const fetchFiles = useCallback(async () => {
    try {
      const res = await axios.get(`/projects/${id}/files`);
      setFiles(res.data);
      setCounts((c) => ({ ...c, files: res.data.length }));
    } catch (err) {
      console.error('Failed to load files:', err);
    } finally {
      setLoading(false);
    }
  }, [id, setCounts]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const analysisSections = useMemo(() => fileAnalysis ? parseAnalysisSections(fileAnalysis) : [], [fileAnalysis]);
  const githubImportedFiles = useMemo(() => files.filter((f) => String(f.fileType || '').startsWith('github:')), [files]);

  const documentOverviewItems = useMemo(() => [
    { title: 'What is incomplete', section: analysisSections.find((s) => /completeness|gaps/i.test(s.title)) },
    { title: 'What to upload next', section: analysisSections.find((s) => /recommended next uploads|fixes/i.test(s.title)) },
    { title: 'What may hurt viva', section: analysisSections.find((s) => /viva defense risks/i.test(s.title)) },
  ].filter((item) => item.section), [analysisSections]);

  const handleUploadProjectFile = async (e) => {
    e.preventDefault();
    if (!uploadFile) { toast.error('Choose a file to upload.'); return; }
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('fileType', uploadFileType);
    setUploadingFile(true);
    try {
      await axios.post(`/projects/${id}/files/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadFile(null);
      toast.success('Project document uploaded.');
      triggerDelight('upload');
      e.currentTarget.reset();
      fetchFiles();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to upload this file.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteFile = async (file) => {
    try {
      await axios.delete(`/projects/files/${file.id}`);
      setFiles((current) => current.filter((item) => item.id !== file.id));
      setCounts((c) => ({ ...c, files: files.length - 1 }));
      toast.success('File deleted.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to delete this file.');
    }
  };

  const handleAnalyzeFiles = async () => {
    if (files.length === 0) { toast.error('Upload documents before running analysis.'); return; }
    setAnalyzingFiles(true);
    try {
      const res = await axios.post(`/projects/${id}/files/analyze`);
      setFileAnalysis(res.data.analysis);
      toast.success('Document analysis is ready.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to analyze the uploaded documents.');
    } finally {
      setAnalyzingFiles(false);
    }
  };

  const refreshProjectFiles = async () => {
    setRefreshingFiles(true);
    try {
      const filesRes = await axios.get(`/projects/${id}/files`);
      setFiles(filesRes.data);
      setCounts((c) => ({ ...c, files: filesRes.data.length }));
      toast.success('Document library refreshed.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to refresh documents right now.');
    } finally {
      setRefreshingFiles(false);
    }
  };

  if (loading) return <CoolLoader compact title="Loading documents..." />;

  return (
    <div className="documents-layout">
      <div className="documents-side-stack">
        <section className="card documents-upload-card">
          <div>
            <span className="badge badge-info"><Upload size={14} /> Project files</span>
            <h3>Upload project documents</h3>
            <p>Attach proposals, reports, slides, source archives, screenshots, test evidence, and diagrams.</p>
          </div>
          <form className="documents-upload-form" onSubmit={handleUploadProjectFile}>
            <div className="form-group">
              <label className="form-label">File type</label>
              <select className="form-input" value={uploadFileType} onChange={(e) => setUploadFileType(e.target.value)}>
                {fileTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Document</label>
              <input className="form-input" type="file" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={uploadingFile}>
              {uploadingFile ? <><Loader2 className="spinner-icon" size={15} /> Uploading...</> : <><Upload size={16} /> Upload document</>}
            </button>
          </form>
        </section>

        <section className="card documents-overview-card">
          <div>
            <span className="badge badge-info">At a glance</span>
            <h3>What is missing or needs action</h3>
            <p>Run analysis after uploading. This overview keeps the next moves visible without reading the full report.</p>
          </div>
          {fileAnalysis && documentOverviewItems.length > 0 ? (
            <div className="documents-overview-list">
              {documentOverviewItems.map((item) => (
                <article key={item.title} className="documents-overview-item">
                  <strong>{item.title}</strong>
                  <ul>
                    {item.section.items.slice(0, 3).map((entry, index) => (
                      <li key={`${item.title}-${index}`}>{entry}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          ) : (
            <div className="documents-overview-empty">
              <Sparkles size={18} />
              <p>Add a proposal, report, or evidence file, then run a review to surface the next gap worth closing.</p>
            </div>
          )}
        </section>
      </div>

      <section className="card documents-list-card">
        <div className="documents-list-head">
          <div>
            <span className="badge badge-info">{files.length} file{files.length === 1 ? '' : 's'}</span>
            {githubImportedFiles.length > 0 && (
              <span className="badge badge-info" style={{ marginLeft: '8px' }}>{githubImportedFiles.length} from GitHub</span>
            )}
            <h3>Document library</h3>
          </div>
          <div className="documents-list-actions">
            <button type="button" className="btn btn-secondary" onClick={refreshProjectFiles} disabled={refreshingFiles}>
              {refreshingFiles ? <><Loader2 className="spinner-icon" size={15} /> Refreshing...</> : <><ArrowDownToLine size={15} /> Refresh list</>}
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleAnalyzeFiles} disabled={analyzingFiles || files.length === 0}>
              {analyzingFiles ? <><Loader2 className="spinner-icon" size={15} /> Reviewing...</> : <><Sparkles size={15} /> Run review</>}
            </button>
          </div>
        </div>

        {fileAnalysis && (
          <div className="documents-analysis">
            <strong>Document review</strong>
            <div className="documents-analysis-body">
              {analysisSections.length ? analysisSections.map((section) => (
                <section key={section.title} className="documents-analysis-section">
                  <h4>{section.title}</h4>
                  <ul>{section.items.map((item, index) => (
                    <li key={`${section.title}-${index}`}>{item}</li>
                  ))}</ul>
                </section>
              )) : <p>{fileAnalysis}</p>}
            </div>
          </div>
        )}

        {files.length === 0 ? (
          <div className="documents-empty">
            <FileText size={28} />
            <h4>No files in this project yet</h4>
            <p>Add a proposal, report, slide deck, source archive, or evidence file to start the project record.</p>
          </div>
        ) : (
          <div className="documents-list">
            {files.map((file) => (
              <article key={file.id} className="documents-item">
                <div className="documents-file-icon"><FileText size={18} /></div>
                <div>
                  <strong>{file.fileName}</strong>
                  <span>{formatProjectFileTypeLabel(file.fileType)} &middot; {formatFileSize(file.size)} &middot; Uploaded by {file.uploader?.name || 'Unknown'} &middot; {formatCommentDate(file.uploadedAt)}</span>
                </div>
                <div className="documents-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => window.open(getFileUrl(file), '_blank')}>
                    <Download size={14} /> Download
                  </button>
                  <button type="button" className="icon-button danger" onClick={() => handleDeleteFile(file)} title="Delete file">
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default DocumentsSection;
