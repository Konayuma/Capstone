import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, ShieldCheck, LayoutPanelLeft, Loader2 } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err || 'Unable to sign in. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-shell">
        <aside className="auth-side">
          <h1>Welcome Back to the Studio</h1>
          <p style={{ marginTop: '12px' }}>
            Enter your account to resume project execution, monitor completion signals, and prep your team for review sessions.
          </p>

          <div className="auth-points">
            <div className="auth-point"><ShieldCheck size={15} /> Secure role-based workspace access</div>
            <div className="auth-point"><LayoutPanelLeft size={15} /> Board-based project progress view</div>
          </div>
        </aside>

        <section className="auth-card">
          <header className="auth-header">
            <h2 className="auth-logo">Sign In</h2>
            <p>Use your account details to continue.</p>
          </header>

          {error && (
            <div className="badge badge-danger" style={{ marginBottom: '10px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><Loader2 className="spinner-icon" size={15} /> Signing in...</> : 'Continue'}
              <ArrowRight size={15} />
            </button>
          </form>

          <p style={{ marginTop: '14px', fontSize: '0.9rem' }}>
            New here? <Link to="/register" style={{ fontWeight: 700 }}>Create your account</Link>
          </p>
        </section>
      </div>
    </div>
  );
};

export default Login;
