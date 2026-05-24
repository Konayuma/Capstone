import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, FileText, FolderKanban, GraduationCap, ListChecks, ShieldCheck, Users } from 'lucide-react';

const capabilities = [
  {
    icon: FolderKanban,
    title: 'Project workspace',
    copy: 'Keep the brief, scope, and milestones in one shared place.',
  },
  {
    icon: ListChecks,
    title: 'Requirements and tasks',
    copy: 'Turn loose ideas into trackable requirements, tasks, and evidence.',
  },
  {
    icon: GraduationCap,
    title: 'Viva practice',
    copy: 'Prepare for the defense with guided questions and answer review.',
  },
  {
    icon: FileText,
    title: 'Reports and PDFs',
    copy: 'Compile progress, contribution, and readiness reports when needed.',
  },
];

const audienceNotes = [
  {
    icon: Users,
    title: 'For student teams',
    copy: 'Organize the work, align on responsibilities, and keep evidence together.',
  },
  {
    icon: ShieldCheck,
    title: 'For supervisors and examiners',
    copy: 'Review progress, leave comments, and check readiness without digging through chats.',
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
            <div className="landing-brand-name">Capstone Studio</div>
            <div className="landing-brand-subtitle">Project supervision workspace</div>
          </div>
        </div>

        <div className="landing-actions">
          {user ? (
            <Link to="/dashboard" className="btn btn-primary">
              Open dashboard
              <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary">Log in</Link>
              <Link to="/register" className="btn btn-primary">
                Create account
                <ArrowRight size={16} />
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="landing-shell">
        <section className="landing-hero">
          <div className="landing-copy">
            <p className="landing-eyebrow">Capstone project supervision</p>
            <h1>One workspace for the project, the team, and the defense.</h1>
            <p className="landing-lead">
              Capstone Studio keeps requirements, tasks, files, contribution reviews, and viva preparation in one calm place.
              It is built for student groups, supervisors, and admins who need structure without clutter.
            </p>

            <div className="landing-cta-row">
              {user ? (
                <Link to="/dashboard" className="btn btn-primary">
                  Open dashboard
                  <ArrowRight size={16} />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary">
                    Start a workspace
                    <ArrowRight size={16} />
                  </Link>
                  <Link to="/login" className="btn btn-secondary">
                    I already have an account
                  </Link>
                </>
              )}
            </div>
          </div>

          <aside className="landing-summary card">
            <div className="landing-summary-header">
              <span className="badge badge-info">Project info</span>
              <h2>What the platform helps you do</h2>
            </div>

            <div className="landing-summary-list">
              {capabilities.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="landing-summary-item">
                    <Icon size={18} />
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.copy}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        </section>

        <section className="landing-grid">
          {audienceNotes.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="landing-card card">
                <Icon size={22} />
                <h3>{item.title}</h3>
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