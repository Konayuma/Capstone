import React, { useState, useEffect } from 'react';
import { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CoolLoader from '../components/CoolLoader';
import ActionDelight from '../components/ActionDelight';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Sparkles, 
  ArrowLeft, 
  ChevronRight, 
  Send,
  HelpCircle,
  Award,
  CheckSquare,
  Loader2,
  X
} from 'lucide-react';

const rubricLabels = ['Clarity', 'Correctness', 'Depth', 'Confidence'];

const parseFeedback = (rawFeedback = '') => {
  const text = rawFeedback.trim();
  const rubric = rubricLabels.map((label) => {
    const match = text.match(new RegExp(`${label}:\\s*([^\\.\\n]+)`, 'i'));
    return {
      label,
      value: match?.[1]?.trim() || 'Not assessed',
    };
  });
  const feedbackBody = text.replace(/^.*?Feedback:\s*/is, '').trim() || text;
  const sentences = feedbackBody
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const mainFinding = sentences[0] || 'Review the suggested answer and add more project-specific evidence.';
  const nextSteps = sentences.slice(1, 5);

  return { rubric, mainFinding, nextSteps };
};

export const VivaPractice = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  // Practice states
  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [showAnswerOutline, setShowAnswerOutline] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [delight, setDelight] = useState(null);
  const delightTimeoutRef = useRef(null);

  const fetchQuestions = async () => {
    try {
      // Fetch existing questions
      const res = await axios.get(`/projects/${id}/viva/questions`);
      setQuestions(res.data);
      setCurrentIdx((current) => Math.min(current, Math.max(res.data.length - 1, 0)));
    } catch (err) {
      console.error('Failed to fetch viva questions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [id]);

  useEffect(() => () => {
    if (delightTimeoutRef.current) {
      clearTimeout(delightTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    const active = questions[currentIdx];
    if (!active) return;
    setAnswerText(active.answers?.[0]?.answerText || '');
    setEvaluation(null);
    setShowAnswerOutline(false);
    setShowFeedbackModal(false);
  }, [questions[currentIdx]?.id]);

  const triggerDelight = () => {
    const options = [
      { title: 'Answer logged', message: 'Nice. The feedback is in and the practice set is richer now.' },
      { title: 'Response recorded', message: 'That answer now gives you something concrete to improve on.' },
    ];
    const picked = options[Math.floor(Math.random() * options.length)];

    if (delightTimeoutRef.current) {
      clearTimeout(delightTimeoutRef.current);
    }

    setDelight(picked);
    delightTimeoutRef.current = setTimeout(() => setDelight(null), 2400);
  };

  const handleGenerateQuestions = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`/projects/${id}/viva/generate`);
      setQuestions(res.data);
      setCurrentIdx(0);
      setEvaluation(null);
      setAnswerText('');
      toast.success('Practice questions are ready. Review them with your team before the viva.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to prepare practice questions right now.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!answerText.trim()) return;

    setSubmitting(true);
    setEvaluation(null);
    try {
      const q = questions[currentIdx];
      const res = await axios.post(`/projects/${id}/viva/questions/${q.id}/answer`, {
        answerText
      });
      setEvaluation(res.data);
      await fetchQuestions(); // reload to register answer in list
      setShowFeedbackModal(true);
      triggerDelight();
      toast.success('Answer reviewed. Open the feedback panel to revise.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to review this answer right now.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <CoolLoader title="Preparing viva practice" subtitle="Reviewing your project materials and building focused questions..." />;

  const activeQuestion = questions[currentIdx];
  const difficultyLabel = activeQuestion?.difficulty === 'brutal'
    ? 'challenge'
    : activeQuestion?.difficulty;
  const feedbackData = evaluation || activeQuestion?.answers?.[0];
  const parsedFeedback = parseFeedback(feedbackData?.aiFeedback);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', textAlign: 'left' }}>
      <ActionDelight
        visible={Boolean(delight)}
        title={delight?.title}
        message={delight?.message}
      />

      {/* Back button */}
      <div>
        <button 
          onClick={() => navigate(`/projects/${id}`)}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.85rem' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Workspace</span>
        </button>
      </div>

      {/* Title */}
      <div>
        <h1>Viva Practice</h1>
        <p style={{ color: 'var(--ink-soft)' }}>
          Rehearse the questions your team is likely to face on design choices, architecture, code ownership, testing evidence, and originality.
        </p>
      </div>

      {/* Initial state: no questions generated yet */}
      {questions.length === 0 ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center', maxWidth: '600px', marginInline: 'auto' }}>
          <HelpCircle size={48} style={{ color: 'var(--ink-soft)', marginBottom: '16px' }} />
          <h3>No practice questions yet</h3>
          <p style={{ color: 'var(--ink-soft)', marginBottom: '24px' }}>
            Create a set of viva questions from your current requirements, uploaded files, and contribution records.
          </p>
          <button onClick={handleGenerateQuestions} className="btn btn-primary">
            Create Practice Set
          </button>
        </div>
      ) : (
        <div className="viva-layout">
          {/* Left panel: Questions Index */}
          <div className="card viva-question-panel">
            <h4 className="viva-question-panel-title">
              <HelpCircle size={18} />
              Practice Questions
            </h4>
            <div className="viva-question-list">
              {questions.map((q, idx) => {
                const hasAnswered = q.answers && q.answers.length > 0;
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentIdx(idx);
                      setEvaluation(null);
                      setAnswerText(hasAnswered ? q.answers[0].answerText : '');
                      setShowAnswerOutline(false);
                      setShowFeedbackModal(false);
                    }}
                    className={`viva-question-button ${currentIdx === idx ? 'is-active' : ''}`}
                    aria-current={currentIdx === idx ? 'true' : undefined}
                  >
                    <span>Question {idx + 1}</span>
                    {hasAnswered && (
                      <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                        Graded
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <button 
              onClick={handleGenerateQuestions}
              className="btn btn-secondary"
              style={{ marginTop: '16px', fontSize: '0.85rem', width: '100%', padding: '10px' }}
            >
              Refresh Questions
            </button>
          </div>

          {/* Right panel: Active Question practice block */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-info" style={{ textTransform: 'uppercase' }}>
                  {activeQuestion.category}
                </span>
                <span className={`badge ${activeQuestion.difficulty === 'brutal' ? 'badge-danger' : 'badge-warning'}`} style={{ textTransform: 'uppercase' }}>
                  {difficultyLabel} level
                </span>
              </div>
              <h2 style={{ fontSize: '1.5rem', lineHeight: 1.4 }}>"{activeQuestion.questionText}"</h2>
            </div>

            {/* Answer Box */}
            <div className="card">
              <h3>Your Answer</h3>
              <form onSubmit={handleSubmitAnswer} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                <textarea
                  className="form-input"
                  placeholder="Answer as you would in the viva. Include specific choices, trade-offs, and evidence from your project..."
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  style={{ minHeight: '150px', resize: 'vertical' }}
                  required
                />
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    <Send size={16} />
                    {submitting ? <><Loader2 className="spinner-icon" size={15} /> Reviewing answer...</> : 'Submit Answer'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAnswerOutline(!showAnswerOutline)}
                    className="btn btn-secondary"
                  >
                    {showAnswerOutline ? 'Hide Answer Guide' : 'View Answer Guide'}
                  </button>

                  {feedbackData && (
                    <button
                      type="button"
                      onClick={() => setShowFeedbackModal(true)}
                      className="btn btn-secondary viva-feedback-open"
                    >
                      <Award size={16} />
                      View Feedback
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Suggested Outline Answer Guide */}
            {showAnswerOutline && (
              <div className="card" style={{ borderLeft: '4px solid var(--brand-1)' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-1)' }}>
                  <CheckSquare size={18} />
                  Answer Guide
                </h4>
                <p style={{ color: 'var(--ink-body)', fontSize: '0.95rem', marginTop: '8px', whiteSpace: 'pre-line' }}>
                  {activeQuestion.suggestedAnswer}
                </p>
              </div>
            )}

            {feedbackData && showFeedbackModal && (
              <div className="workspace-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="viva-feedback-title">
                <div className="workspace-modal viva-feedback-modal">
                  <div className="viva-feedback-head">
                    <div>
                      <span className="landing-eyebrow"><Award size={14} /> Reviewed answer</span>
                      <h2 id="viva-feedback-title">Feedback</h2>
                    </div>
                    <button
                      type="button"
                      className="viva-feedback-close"
                      onClick={() => setShowFeedbackModal(false)}
                      aria-label="Close feedback"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="viva-feedback-score-card">
                    <div>
                      <span>Answer score</span>
                      <strong>{feedbackData.aiScore}/100</strong>
                    </div>
                    <p>{parsedFeedback.mainFinding}</p>
                  </div>

                  <div className="viva-feedback-rubric" aria-label="Feedback rubric">
                    {parsedFeedback.rubric.map((item) => (
                      <div key={item.label}>
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                      </div>
                    ))}
                  </div>

                  <div className="viva-feedback-section">
                    <h3>What to strengthen first</h3>
                    {parsedFeedback.nextSteps.length > 0 ? (
                      <ol className="viva-feedback-list">
                        {parsedFeedback.nextSteps.map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ol>
                    ) : (
                      <p>Add direct project evidence, name the technical mechanism, and explain the trade-off behind the choice.</p>
                    )}
                  </div>

                  <div className="viva-feedback-section viva-feedback-next">
                    <h3>How to revise your answer</h3>
                    <ul>
                      <li>Name the exact component, library, data field, or architecture decision.</li>
                      <li>Connect the explanation to evidence already in your project workspace.</li>
                      <li>Use a short sequence: input, processing step, output, limitation.</li>
                    </ul>
                  </div>

                  <div className="comments-modal-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowFeedbackModal(false)}>
                      Close
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => setShowFeedbackModal(false)}>
                      Revise answer
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VivaPractice;
