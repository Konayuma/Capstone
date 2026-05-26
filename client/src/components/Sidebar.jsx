import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoImage from '../assets/logo copy.png';
import {
  ArrowRight,
  BookOpenCheck,
  ChevronDown,
  ClipboardList,
  FileText,
  FolderGit2,
  Gauge,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  ShieldAlert,
  Sparkles,
  Users,
  X,
} from 'lucide-react';

import { useOnboarding } from '../context/OnboardingContext';
const buildProjectHref = (projectId, tab) => (
  projectId ? `/projects/${projectId}#${tab}` : '/projects'
);

const sidebarGroupDefaults = {
  'Studio Board': true,
  'Project Tools': true,
  'Settings': true,
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

export const Sidebar = ({ collapsed = false, onCollapsedChange, mobileOpen = false, onMobileClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [openGroups, setOpenGroups] = useState(readStoredSidebarGroups);
  const userRole = user?.role;

  const { openHelp } = useOnboarding();
  const projectMatch = location.pathname.match(/^\/projects\/(\d+)/);
  const currentProjectId = projectMatch?.[1];

  const navSections = useMemo(() => [
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
    {
      eyebrow: 'Workspace',
      items: [
        {
          label: 'Project Tools',
          icon: ClipboardList,
          to: currentProjectId ? `/projects/${currentProjectId}` : '/projects',
          children: [
            { label: 'Requirements', icon: BookOpenCheck, to: buildProjectHref(currentProjectId, 'requirements') },
            { label: 'Tasks', icon: ClipboardList, to: buildProjectHref(currentProjectId, 'tasks') },
            { label: 'Contributions', icon: Users, to: buildProjectHref(currentProjectId, 'contribution') },
            { label: 'Viva Practice', icon: GraduationCap, to: currentProjectId ? `/projects/${currentProjectId}/viva` : '/projects' },
            { label: 'Documents', icon: FileText, to: buildProjectHref(currentProjectId, 'documents') },
            { label: 'Reports', icon: FileText, to: buildProjectHref(currentProjectId, 'readiness') },
            { label: 'Comments', icon: MessageSquare, to: buildProjectHref(currentProjectId, 'comments') },
            { label: 'Project Settings', icon: Settings, to: buildProjectHref(currentProjectId, 'settings') },
          ],
        },
      ],
    },
    {
      eyebrow: 'System',
      items: [
        {
          label: 'Settings',
          icon: Settings,
          to: '/dashboard',
          children: [
            { label: 'Profile', icon: Users, to: '/profile' },
            ...(userRole === 'admin'
              ? [{ label: 'Admin Control', icon: ShieldAlert, to: '/admin' }]
              : []),
          ],
        },
      ],
    },
  ], [currentProjectId, userRole]);

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
    const [pathname, hash] = to.split('#');
    if (hash) {
      return location.pathname === pathname && location.hash === `#${hash}`;
    }
    return location.pathname === pathname;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const nextOpenGroups = {
      'Studio Board': location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/projects'),
      'Project Tools': location.pathname.startsWith('/projects'),
      'Settings': location.pathname.startsWith('/profile') || location.pathname.startsWith('/admin'),
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
          <button className="btn btn-secondary" type="button" onClick={() => navigate('/dashboard')}>
            <Sparkles size={15} />
            <span>Open board</span>
          </button>
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
