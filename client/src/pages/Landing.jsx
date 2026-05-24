import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, CheckCircle2, FolderKanban, GraduationCap, FileStack } from 'lucide-react';

const pillars = [
  {
    icon: FolderKanban,
    title: 'Board-native project tracking',
    copy: 'Turn each capstone into a visible workflow with clear lanes and ownership.',
  },
  {
    icon: FileStack,
    title: 'One place for project evidence',
    copy: 'Collect requirements, documents, and review artifacts without fragmented tools.',
  },
  {
    icon: GraduationCap,
    title: 'Continuous viva readiness',
    copy: 'Monitor preparation and export reports when your panel review approaches.',
  },
];

export const Landing = () => {
  const { user } = useAuth();

  return (
    <div className="landing-page">
      <header className="landing-topbar">
        <div className="landing-brand">
          <div className="landing-brand-mark">CS</div>
          <div>
            <div style={{ fontWeight: 800 }}>Capstone Studio</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--ink-soft)' }}>Project supervision platform</div>
          </div>
        </div>

        <div className="landing-actions">
          {user ? (
            <Link to="/dashboard" className="btn btn-primary">Open Dashboard <ArrowRight size={15} /></Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary">Sign In</Link>
              <Link to="/register" className="btn btn-primary">Get Started <ArrowRight size={15} /></Link>
            </>
          )}
        </div>
      </header>

      <main className="landing-shell">
        <section className="landing-hero">
          <article className="card landing-copy">
            <span className="landing-eyebrow">Studio workflow</span>
            <h1>Run your capstone like a structured design board.</h1>
            <p className="landing-lead">
              Capstone Studio gives teams and supervisors one shared workspace for requirements,
              progress, contribution reviews, and readiness reports.
            </p>
            <div className="landing-cta-row">
              {user ? (
                <Link to="/dashboard" className="btn btn-primary">Enter workspace <ArrowRight size={15} /></Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary">Create account</Link>
                  <Link to="/login" className="btn btn-secondary">I already have one</Link>
                </>
              )}
            </div>
          </article>

          <aside className="card landing-summary">
            <h2 style={{ marginBottom: '12px' }}>Designed for both sides of supervision</h2>
            <div className="landing-summary-list">
              <div className="landing-summary-item">
                <CheckCircle2 size={16} />
                <div>
                  <h3>Students stay aligned</h3>
                  <p>Scope, tasks, and progress stay visible to the full team.</p>
                </div>
              </div>
              <div className="landing-summary-item">
                <CheckCircle2 size={16} />
                <div>
                  <h3>Supervisors review faster</h3>
                  <p>Critical context and evidence are grouped by project without hunting.</p>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className="landing-grid">
          {pillars.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="card">
                <Icon size={18} />
                <h3 style={{ margin: '8px 0 6px' }}>{item.title}</h3>
                <p>{item.copy}</p>
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
};

export default Landing;
