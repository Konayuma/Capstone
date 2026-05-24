import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CoolLoader from '../components/CoolLoader';
import axios from 'axios';
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

  const fetchQuestions = async () => {
    try {
      // Fetch existing questions
      const res = await axios.get(`/projects/${id}/viva/questions`);
      setQuestions(res.data);
    } catch (err) {
      console.error('Failed to fetch viva questions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [id]);

  const handleGenerateQuestions = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`/projects/${id}/viva/generate`);
      setQuestions(res.data);
      setCurrentIdx(0);
      setEvaluation(null);
      setAnswerText('');
      alert('Veteran panel assembled! 8 brutal viva defense questions generated.');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to assemble AI panel.');
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
      const res = await axios.post(`/viva/questions/${q.id}/answer`, {
        answerText
      });
      setEvaluation(res.data);
      fetchQuestions(); // reload to register answer in list
    } catch (err) {
      alert(err.response?.data?.error || 'Answer grading failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <CoolLoader title="Assembling panel" subtitle="Generating AI viva questions from your project data..." />;

  const activeQuestion = questions[currentIdx];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', textAlign: 'left' }}>
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
        <h1>VivaBoss AI Examiner Panel</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Practice defending your project against a strict virtual panel chair. Get tested on database choices, architectural patterns, individual code modules, and originality.
        </p>
      </div>

      {/* Initial state: no questions generated yet */}
      {questions.length === 0 ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center', maxWidth: '600px', marginInline: 'auto' }}>
          <HelpCircle size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3>AI Examiner Panel is Offline</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            To begin, trigger the AI panel assembly. Gemini will review your active functional requirements, uploaded codes, and group contributions to draft 8 unique examiner viva questions.
          </p>
          <button onClick={handleGenerateQuestions} className="btn btn-primary">
            Assemble Panel
          </button>
        </div>
      ) : (
        <div className="grid-3" style={{ gridTemplateColumns: '280px 1fr', gap: '32px', alignItems: 'flex-start' }}>
          {/* Left panel: Questions Index */}
          <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle size={18} />
              Questions List
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                    style={{
                      width: '100%',
                      background: currentIdx === idx ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                      color: currentIdx === idx ? 'white' : 'var(--text-primary)',
                      border: '1px solid var(--border-medium)',
                      padding: '12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.85rem'
                    }}
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
              Regenerate Panel
            </button>
          </div>

          {/* Right panel: Active Question practice block */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-info" style={{ textTransform: 'uppercase' }}>
                  {activeQuestion.category}
                </span>
                <span className="badge badge-danger" style={{ textTransform: 'uppercase', background: activeQuestion.difficulty === 'brutal' ? 'var(--color-danger-bg)' : 'var(--color-warning-bg)', color: activeQuestion.difficulty === 'brutal' ? 'var(--color-danger)' : 'var(--color-warning)' }}>
                  {activeQuestion.difficulty} examiner
                </span>
              </div>
              <h2 style={{ fontSize: '1.5rem', lineHeight: 1.4 }}>"{activeQuestion.questionText}"</h2>
            </div>

            {/* Answer Box */}
            <div className="card">
              <h3>Your Answer Response</h3>
              <form onSubmit={handleSubmitAnswer} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                <textarea
                  className="form-input"
                  placeholder="Type your response. Mention specific architectural choices, tech terms, and evidence..."
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
                    {submitting ? <><Loader2 className="spinner-icon" size={15} /> Examiner grading response...</> : 'Submit Response to Panel'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAnswerOutline(!showAnswerOutline)}
                    className="btn btn-secondary"
                  >
                    {showAnswerOutline ? 'Hide Answer Outline' : 'View Recommended Outline'}
                  </button>
                </div>
              </form>
            </div>

            {/* Suggested Outline Answer Guide */}
            {showAnswerOutline && (
              <div className="card" style={{ borderLeft: '4px solid var(--accent-secondary)' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-secondary)' }}>
                  <CheckSquare size={18} />
                  Suggested Concept Check-offs
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '8px', whiteSpace: 'pre-line' }}>
                  {activeQuestion.suggestedAnswer}
                </p>
              </div>
            )}

            {/* Evaluation block */}
            {(evaluation || (activeQuestion.answers && activeQuestion.answers.length > 0)) && (
              <div className="card" style={{ borderLeft: '4px solid var(--color-success)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-success)' }}>
                  <Award size={20} />
                  Examiner Panel Feedback & Grading
                </h3>
                
                {(() => {
                  const evalData = evaluation || activeQuestion.answers[0];
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', gap: '32px' }}>
                        <div>
                          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-success)' }}>
                            {evalData.aiScore}/100
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Grading Score</div>
                        </div>
                      </div>
                      <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                        <h4 style={{ marginBottom: '8px' }}>Detailed Conceptual Feedback:</h4>
                        <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', whiteSpace: 'pre-line', lineHeight: 1.5 }}>
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
