import React, { useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BookOpenCheck,
  ChevronDown,
  ClipboardList,
  FileText,
  FolderGit2,
  Gauge,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Search,
  Settings,
  ShieldAlert,
  Sparkles,
  Users,
} from 'lucide-react';

const buildProjectHref = (projectId, tab) => (
  projectId ? `/projects/${projectId}#${tab}` : '/projects'
);

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const userRole = user?.role;

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
            { label: 'Reports', icon: FileText, to: buildProjectHref(currentProjectId, 'readiness') },
            { label: 'Comments', icon: MessageSquare, to: buildProjectHref(currentProjectId, 'comments') },
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
            { label: 'Profile', icon: Users, to: '/dashboard' },
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

  if (!user) return null;

  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <div className="sidebar-logo">
          <div className="user-avatar">CS</div>
          <div>
            <div className="sidebar-logo-text">Capstone Studio</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>Project workspace</div>
          </div>
        </div>

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
      </div>

      <nav className="sidebar-menu">
        {filteredSections.map((section) => (
          <section className="sidebar-section" key={section.eyebrow}>
            <div className="sidebar-eyebrow">{section.eyebrow}</div>

            {section.items.map((item) => {
              const Icon = item.icon;

              return (
                <div className="sidebar-tree-group" key={item.label}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) => `sidebar-link sidebar-parent ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={17} />
                    <span>{item.label}</span>
                    <ChevronDown size={15} className="sidebar-chevron" />
                  </NavLink>

                  <div className="sidebar-branch">
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
                </div>
              );
            })}
          </section>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile-widget">
          <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
          <div>
            <div style={{ fontWeight: 700 }}>{user.name}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', textTransform: 'capitalize' }}>
              Signed in as {user.role}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '8px', marginTop: '12px' }}>
          <button className="btn btn-secondary" type="button" onClick={() => navigate('/dashboard')}>
            <Sparkles size={15} />
            Open board
          </button>
          <button className="btn btn-danger" type="button" onClick={handleLogout}>
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
