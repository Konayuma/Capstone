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
  Loader2
} from 'lucide-react';

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
  }, [currentIdx, questions]);

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
      triggerDelight();
      toast.success('Answer reviewed. Feedback is ready below.');
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

            {/* Evaluation block */}
            {(evaluation || (activeQuestion.answers && activeQuestion.answers.length > 0)) && (
              <div className="card" style={{ borderLeft: '4px solid var(--success)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)' }}>
                  <Award size={20} />
                  Feedback
                </h3>
                
                {(() => {
                  const evalData = evaluation || activeQuestion.answers[0];
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', gap: '32px' }}>
                        <div>
                          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--success)' }}>
                            {evalData.aiScore}/100
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)' }}>Answer score</div>
                        </div>
                      </div>
                      <div style={{ borderTop: '1px solid var(--line-subtle)', paddingTop: '16px' }}>
                        <h4 style={{ marginBottom: '8px' }}>What to strengthen</h4>
                        <p style={{ color: 'var(--ink-body)', fontSize: '0.95rem', whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                          {evalData.aiFeedback}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VivaPractice;
