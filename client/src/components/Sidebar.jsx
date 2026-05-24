import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FolderGit2, 
  Sparkles, 
  ShieldAlert, 
  FileText, 
  LogOut, 
  User 
} from 'lucide-react';

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="user-avatar">
          🛡️
        </div>
        <span className="sidebar-logo-text">Capstone Studio</span>
      </div>

      <nav className="sidebar-menu">
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink 
          to="/projects" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <FolderGit2 size={20} />
          <span>Workspaces</span>
        </NavLink>

        {user.role === 'admin' && (
          <NavLink 
            to="/admin" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <ShieldAlert size={20} />
            <span>Admin Control</span>
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile-widget" style={{ marginBottom: '16px' }}>
          <div className="user-avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{user.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
              {user.role}
            </div>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="sidebar-link" 
          style={{ 
            width: '100%', 
            border: 'none', 
            background: 'none', 
            cursor: 'pointer',
            textAlign: 'left',
            color: 'var(--color-danger)'
          }}
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
