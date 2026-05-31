import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoImage from '../assets/logo copy.png';
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  ChevronDown,
  ClipboardList,
  Download,
  ExternalLink,
  FileText,
  FolderGit2,
  Gauge,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  Layers,
  LogOut,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  ShieldAlert,
  Sparkles,
  Users,
  UserRound,
  X,
} from 'lucide-react';

import { useOnboarding } from '../context/OnboardingContext';
const buildProjectHref = (projectId, tab) => (
  projectId ? `/projects/${projectId}/${tab}` : '/projects'
);

const sidebarGroupDefaults = {
  'Studio Board': true,
  'Project Tools': true,
  'Account': true,
};

const sidebarGroupStorageKey = 'capstone.sidebarGroups';

const readStoredSidebarGroups = () => {
  if (typeof window === 'undefined') return sidebarGroupDefaults;

  try {
    const raw = window.localStorage.getItem(sidebarGroupStorageKey);
    return raw ? { ...sidebarGroupDefaults, ...JSON.parse(raw) } : sidebarGroupDefaults;
  } catch {
    return sidebarGroupDefaults;
  }
};

const projectTitleCache = new Map();

export const Sidebar = ({ collapsed = false, onCollapsedChange, mobileOpen = false, onMobileClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [openGroups, setOpenGroups] = useState(readStoredSidebarGroups);
  const [projectName, setProjectName] = useState('');
  const userRole = user?.role;

  const { openHelp } = useOnboarding();
  const projectMatch = location.pathname.match(/^\/projects\/(\d+)/);
  const currentProjectId = projectMatch?.[1];

  useEffect(() => {
    if (!currentProjectId) { setProjectName(''); return; }
    const cached = projectTitleCache.get(currentProjectId);
    if (cached) { setProjectName(cached); return; }
    import('axios').then(({ default: axios }) => {
      axios.get(`/projects/${currentProjectId}`, { timeout: 3000 })
        .then((res) => {
          const name = res.data.title || '';
          projectTitleCache.set(currentProjectId, name);
          setProjectName(name);
        })
        .catch(() => {});
    });
  }, [currentProjectId]);

  const isOnDashboard = location.pathname === '/dashboard' || location.pathname === '/projects';

  const navSections = useMemo(() => {
    const sections = [
      {
        eyebrow: 'Overview',
        items: [
          {
            label: 'Studio Board',
            icon: LayoutDashboard,
            to: '/dashboard',
            children: [
              { label: 'Active Projects', icon: Gauge, to: '/dashboard' },
              { label: 'All Projects', icon: FolderGit2, to: '/projects' },
            ],
          },
        ],
      },
    ];

    if (currentProjectId) {
      sections.push({
        eyebrow: projectName || 'Workspace',
        items: [
          {
            label: 'Project Tools',
            icon: ClipboardList,
            to: buildProjectHref(currentProjectId, 'requirements'),
            children: [
              { label: 'Requirements', icon: BookOpenCheck, to: buildProjectHref(currentProjectId, 'requirements') },
              { label: 'Traceability', icon: Layers, to: buildProjectHref(currentProjectId, 'traceability') },
              { label: 'Tasks', icon: ClipboardList, to: buildProjectHref(currentProjectId, 'tasks') },
              { label: 'Team', icon: Users, to: buildProjectHref(currentProjectId, 'team') },
              { label: 'Contributions', icon: BarChart3, to: buildProjectHref(currentProjectId, 'contribution') },
              { label: 'Documents', icon: FileText, to: buildProjectHref(currentProjectId, 'documents') },
              { label: 'Notes', icon: MessageSquare, to: buildProjectHref(currentProjectId, 'notes') },
              { label: 'Reports', icon: Download, to: buildProjectHref(currentProjectId, 'readiness') },
              { label: 'Viva Practice', icon: GraduationCap, to: `/projects/${currentProjectId}/viva` },
              { label: 'Settings', icon: Settings, to: buildProjectHref(currentProjectId, 'settings') },
            ],
          },
        ],
      });
    }

    sections.push({
      eyebrow: 'System',
      items: [
        {
          label: 'Account',
          icon: UserRound,
          to: '/profile',
          children: [
            { label: 'Profile', icon: UserRound, to: '/profile' },
            ...(userRole === 'admin'
              ? [{ label: 'Admin Control', icon: ShieldAlert, to: '/admin' }]
              : []),
          ],
        },
      ],
    });

    return sections;
  }, [currentProjectId, projectName, userRole]);

  const filteredSections = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return navSections;

    return navSections
      .map((section) => ({
        ...section,
        items: section.items
          .map((item) => {
            const itemMatches = item.label.toLowerCase().includes(needle);
            const children = item.children.filter((child) => child.label.toLowerCase().includes(needle));
            return itemMatches ? item : { ...item, children };
          })
          .filter((item) => item.label.toLowerCase().includes(needle) || item.children.length > 0),
      }))
      .filter((section) => section.items.length > 0);
  }, [navSections, query]);

  const forceOpenGroups = query.trim().length > 0;

  const isChildActive = (to) => {
    if (location.pathname === to) return true;
    if (to.endsWith('/requirements') && (location.pathname === `/projects/${currentProjectId}` || location.pathname === `/projects/${currentProjectId}/`)) return true;
    return false;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const nextOpenGroups = {
      'Studio Board': location.pathname.startsWith('/dashboard') || !location.pathname.startsWith('/projects'),
      'Project Tools': location.pathname.startsWith('/projects') && !location.pathname.includes('/viva'),
      'Account': location.pathname.startsWith('/profile') || location.pathname.startsWith('/admin'),
    };

    setOpenGroups((current) => ({
      ...current,
      ...nextOpenGroups,
    }));
  }, [location.pathname]);

  useEffect(() => {
    try {
      window.localStorage.setItem(sidebarGroupStorageKey, JSON.stringify(openGroups));
    } catch {
      // Ignore storage failures and fall back to in-memory state.
    }
  }, [openGroups]);

  useEffect(() => {
    if (collapsed) {
      setQuery('');
    }
  }, [collapsed]);

  if (!user) return null;

  return (
    <aside className={`sidebar ${collapsed ? 'is-rail' : ''} ${mobileOpen ? 'is-mobile-open' : ''}`}>
      <div className="sidebar-head">
        <div className="sidebar-logo">
          <img className="app-brand-logo app-brand-logo--sidebar" src={logoImage} alt="Capstone Studio" />
          <div className="sidebar-logo-copy">
            <div className="sidebar-logo-text">Capstone Studio</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>Project workspace</div>
          </div>
          <button
            type="button"
            className="sidebar-mobile-close"
            onClick={onMobileClose}
            aria-label="Close navigation drawer"
          >
            <X size={17} />
          </button>
          <button
            type="button"
            className="sidebar-rail-toggle"
            onClick={() => onCollapsedChange?.(!collapsed)}
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            aria-pressed={collapsed}
          >
            {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
        </div>

        {!collapsed && (
          <label className="sidebar-search">
            <Search size={16} />
            <input
              type="search"
              placeholder="Search..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <kbd>Ctrl F</kbd>
          </label>
        )}
      </div>

      <nav className="sidebar-menu">
        {filteredSections.map((section) => (
          <section className="sidebar-section" key={section.eyebrow}>
            {!collapsed && <div className="sidebar-eyebrow">{section.eyebrow}</div>}

            {section.items.map((item) => {
              const Icon = item.icon;
              const isOpen = !collapsed && (forceOpenGroups || (openGroups[item.label] ?? true));

              return (
                <div className={`sidebar-tree-group ${isOpen ? '' : 'is-collapsed'}`} key={item.label}>
                  <div className="sidebar-parent-row">
                    <NavLink
                      to={item.to}
                      className={({ isActive }) => `sidebar-link sidebar-parent ${isActive ? 'active' : ''}`}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon size={17} />
                      <span>{item.label}</span>
                    </NavLink>

                    {!collapsed && (
                      <button
                        type="button"
                        className="sidebar-collapse-toggle"
                        onClick={() => setOpenGroups((current) => ({ ...current, [item.label]: !isOpen }))}
                        aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${item.label}`}
                        aria-expanded={isOpen}
                      >
                        <ChevronDown size={15} className="sidebar-chevron" />
                      </button>
                    )}
                  </div>

                  {!collapsed && (
                    <div className="sidebar-branch" aria-hidden={!isOpen}>
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;

                      return (
                        <NavLink
                          key={child.label}
                          to={child.to}
                          className={`sidebar-link sidebar-child ${isChildActive(child.to) ? 'active' : ''}`}
                        >
                          <ChildIcon size={16} />
                          <span>{child.label}</span>
                        </NavLink>
                      );
                    })}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-profile-widget" type="button" onClick={() => navigate('/profile')}>
          <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
          <div className="sidebar-profile-copy">
            <div className="sidebar-profile-name">{user.name}</div>
            <div className="sidebar-profile-role">
              Signed in as {user.role}
            </div>
          </div>
          <ArrowRight size={15} className="sidebar-profile-arrow" />
        </button>

        <div className="sidebar-footer-actions">
          {!isOnDashboard && (
            <button className="btn btn-secondary" type="button" onClick={() => navigate('/dashboard')}>
              <LayoutDashboard size={15} />
              <span>Dashboard</span>
            </button>
          )}
          <button className="btn btn-secondary" type="button" onClick={openHelp}>
            <HelpCircle size={15} />
            <span>Help</span>
          </button>
          <button className="btn btn-danger" type="button" onClick={handleLogout}>
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
