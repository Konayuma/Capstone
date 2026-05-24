import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Users, ArrowRight } from 'lucide-react';

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(name, email, password, role);
      navigate('/dashboard');
    } catch (err) {
      setError(err || 'Registration failed. Please use another email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-shell">
        <aside className="auth-side">
          <h1>Build Your Team Space</h1>
          <p style={{ marginTop: '12px' }}>
            Create your account and step into a shared board where requirements, tasks, and readiness stay visible from day one.
          </p>

          <div className="auth-points">
            <div className="auth-point"><Users size={15} /> Collaboration with roles and supervision</div>
            <div className="auth-point"><UserPlus size={15} /> Fast onboarding for student teams</div>
          </div>
        </aside>

        <section className="auth-card">
          <header className="auth-header">
            <h2 className="auth-logo">Create Account</h2>
            <p>Choose your role and get started.</p>
          </header>

          {error && (
            <div className="badge badge-danger" style={{ marginBottom: '10px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-input" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="student">Student</option>
                <option value="supervisor">Supervisor</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
              <ArrowRight size={15} />
            </button>
          </form>

          <p style={{ marginTop: '14px', fontSize: '0.9rem' }}>
            Already registered? <Link to="/login" style={{ fontWeight: 700 }}>Sign in</Link>
          </p>
        </section>
      </div>
    </div>
  );
};

export default Register;
