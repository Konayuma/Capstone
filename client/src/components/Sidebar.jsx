import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FolderGit2, ShieldAlert, LogOut, Sparkles } from 'lucide-react';

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="user-avatar">CS</div>
        <div>
          <div className="sidebar-logo-text">Capstone Studio</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>Project workspace</div>
        </div>
      </div>

      <nav className="sidebar-menu">
        <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>

        <NavLink to="/projects" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <FolderGit2 size={18} />
          Projects
        </NavLink>

        {user.role === 'admin' && (
          <NavLink to="/admin" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <ShieldAlert size={18} />
            Admin Control
          </NavLink>
        )}
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
