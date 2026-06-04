import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoImage from '../assets/logo copy.png';
import { useDemo } from '../context/DemoContext';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  FileText,
  Gauge,
  GraduationCap,
  MessageSquare,
  Play,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';

const featureCards = [
  {
    icon: SearchCheck,
    title: 'Requirements that can survive review',
    copy: 'Convert vague project ideas into structured requirements, acceptance criteria, and test cases.',
  },
  {
    icon: Users,
    title: 'Team evidence in one place',
    copy: 'Invite members, assign roles, track work, and connect task evidence to contribution reviews.',
  },
  {
    icon: GraduationCap,
    title: 'Viva practice before panic',
    copy: 'Generate examiner-style questions, answer them, and see readiness signals before defense day.',
  },
];

const workflow = [
  'Create a supervised project workspace',
  'Refine requirements and assign work',
  'Upload evidence, reports, and slides',
  'Review contribution and viva readiness',
];

export const Landing = () => {
  const { user } = useAuth();
  const { isActive, start } = useDemo();
  const primaryHref = user ? '/dashboard' : '/register';

  return (
    <div className="landing-page">
      <header className="landing-topbar">
        <Link to="/" className="landing-brand" aria-label="Capstone Studio home">
          <img className="app-brand-logo app-brand-logo--landing" src={logoImage} alt="Capstone Studio" />
          <div>
            <div className="landing-brand-name">Capstone Studio</div>
            <div className="landing-brand-subtitle">Defense-ready project supervision</div>
          </div>
        </Link>

        <nav className="landing-nav" aria-label="Landing page">
          <a href="#features">Features</a>
          <a href="#workflow">Workflow</a>
          <a href="#roles">Roles</a>
        </nav>

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
          <div className="landing-hero-copy">
            <span className="landing-eyebrow"><Sparkles size={14} /> AI-assisted capstone workspace</span>
            <h1>Bring requirements, team work, and viva readiness into one supervised board.</h1>
            <p className="landing-lead">
              Capstone Studio helps student teams and supervisors turn a project from a loose idea into
              testable requirements, visible contribution records, and defense-ready evidence.
            </p>
            <div className="landing-cta-row">
              <Link to={primaryHref} className="btn btn-primary">
                {user ? 'Enter workspace' : 'Start your project'} <ArrowRight size={16} />
              </Link>
              {!user && (
                <>
                  <Link to="/login" className="btn btn-secondary">Sign in</Link>
                  <button type="button" className="btn btn-secondary demo-hero-btn" onClick={start}>
                    <Play size={14} /> Demo
                  </button>
                </>
              )}
            </div>
            <div className="landing-proof-row" aria-label="Platform highlights">
              <span><CheckCircle2 size={15} /> Requirements</span>
              <span><CheckCircle2 size={15} /> Contribution</span>
              <span><CheckCircle2 size={15} /> Viva reports</span>
            </div>
          </div>

          <div className="landing-product-visual" aria-label="Capstone Studio workspace preview">
            <div className="landing-browser-bar">
              <span />
              <span />
              <span />
              <strong>Capstone Studio workspace</strong>
            </div>
            <div className="landing-preview-grid">
              <aside className="landing-preview-sidebar">
                <div />
                <span />
                <span />
                <span />
              </aside>
              <section className="landing-preview-main">
                <div className="landing-preview-head">
                  <div>
                    <small>Project Workspace</small>
                    <strong>Defense Readiness</strong>
                  </div>
                  <Gauge size={22} />
                </div>
                <div className="landing-preview-score">
                  <span>78%</span>
                  <div>
                    <strong>Moderate readiness</strong>
                    <p>Upload test evidence and review rejected requirements.</p>
                  </div>
                </div>
                <div className="landing-preview-lanes">
                  <div><ClipboardList size={16} /> 12 tasks</div>
                  <div><FileText size={16} /> 6 documents</div>
                  <div><MessageSquare size={16} /> 4 notes</div>
                </div>
              </section>
            </div>
          </div>
        </section>

        <section className="landing-metrics" aria-label="Capstone Studio outcomes">
          <div>
            <strong>Structured</strong>
            <span>Requirements, tasks, files, and feedback stay connected.</span>
          </div>
          <div>
            <strong>Traceable</strong>
            <span>Every contribution can point back to work and evidence.</span>
          </div>
          <div>
            <strong>Defensible</strong>
            <span>Teams practice answers against the actual project context.</span>
          </div>
        </section>

        <section className="landing-section" id="features">
          <div className="landing-section-head">
            <span className="landing-eyebrow">Core modules</span>
            <h2>A standard landing page, but for a very specific problem.</h2>
            <p>Everything points back to the supervisor question: can this team explain, evidence, and defend what they built?</p>
          </div>
          <div className="landing-feature-grid">
            {featureCards.map((item) => {
              const Icon = item.icon;
              return (
                <article className="landing-feature-card" key={item.title}>
                  <Icon size={22} />
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="landing-section landing-workflow" id="workflow">
          <div>
            <span className="landing-eyebrow">Workflow</span>
            <h2>From project idea to review packet.</h2>
          </div>
          <ol className="landing-steps">
            {workflow.map((step, index) => (
              <li key={step}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{step}</strong>
              </li>
            ))}
          </ol>
        </section>

        <section className="landing-section landing-roles" id="roles">
          <article>
            <Users size={24} />
            <h2>For students</h2>
            <p>Manage teammates, tasks, uploads, peer reviews, and viva practice without spreading project truth across chats and folders.</p>
          </article>
          <article>
            <ShieldCheck size={24} />
            <h2>For supervisors</h2>
            <p>Review requirements, contribution patterns, uploaded evidence, and risk signals from a single project surface.</p>
          </article>
          <article>
            <BarChart3 size={24} />
            <h2>For admins</h2>
            <p>Keep the platform organized with user management, role control, and visibility into usage across projects.</p>
          </article>
        </section>

        <section className="landing-final-cta">
          <div>
            <span className="landing-eyebrow">Ready when the panel asks why</span>
            <h2>Make the project easier to supervise before it becomes harder to defend.</h2>
          </div>
          <Link to={primaryHref} className="btn btn-primary">
            {user ? 'Open dashboard' : 'Create account'} <ArrowRight size={16} />
          </Link>
        </section>
      </main>
    </div>
  );
};

export default Landing;
