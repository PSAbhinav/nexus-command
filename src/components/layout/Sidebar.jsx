import { LayoutDashboard, Wallet, CheckSquare, Heart, Target, BarChart2, Settings, Lock, ChevronLeft, ChevronRight, Shield, Sun, Moon } from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'finance', label: 'Finances', icon: Wallet },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'health', label: 'Health', icon: Heart },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'settings', label: 'Settings', icon: Settings }
];

export default function Sidebar({ activeModule, onModuleChange, onLock, collapsed, onToggleCollapse, position = 'left', theme = 'dark', onToggleTheme }) {
  const isRight = position === 'right';

  return (
    <nav className="sidebar" data-collapsed={collapsed} data-position={position}>
      {/* Brand */}
      <div className="sidebar__brand">
        <div className="sidebar__logo"><Shield size={18} strokeWidth={2.5} /></div>
        {!collapsed && <span className="sidebar__name">NexusCommand</span>}
        {!collapsed && (
          <button className="sidebar__theme-toggle" onClick={onToggleTheme} title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}>
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="sidebar__nav">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              className={`sidebar__item ${isActive ? 'sidebar__item--active' : ''}`}
              onClick={() => onModuleChange(item.id)}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="sidebar__footer">
        {collapsed && (
          <button className="sidebar__item" onClick={onToggleTheme} title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        )}
        <button className="sidebar__item" onClick={onLock} title="Lock">
          <Lock size={18} />
          {!collapsed && <span>Lock</span>}
        </button>
        <button className="sidebar__collapse" onClick={onToggleCollapse}>
          {collapsed
            ? (isRight ? <ChevronLeft size={16} /> : <ChevronRight size={16} />)
            : (isRight ? <ChevronRight size={16} /> : <ChevronLeft size={16} />)
          }
        </button>
      </div>

      <style>{`
        .sidebar {
          position: fixed;
          top: 0;
          bottom: 0;
          width: var(--sidebar-width);
          background: var(--sidebar-bg, rgba(18, 20, 31, 0.88));
          backdrop-filter: blur(20px) saturate(1.5);
          -webkit-backdrop-filter: blur(20px) saturate(1.5);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          z-index: 100;
          transition: width var(--duration-normal) var(--ease-out);
          overflow: hidden;
        }
        .sidebar[data-position="left"] { left: 0; right: auto; border-right: 1px solid var(--border); border-left: none; }
        .sidebar[data-position="right"] { right: 0; left: auto; border-left: 1px solid var(--border); border-right: none; }
        .sidebar[data-collapsed="true"] {
          width: var(--sidebar-collapsed);
        }
        .sidebar__brand {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          padding: var(--space-xl) var(--space-lg);
          border-bottom: 1px solid var(--border);
        }
        .sidebar__logo {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          background: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
          transition: all var(--duration-normal);
          box-shadow: 0 0 12px rgba(0, 212, 170, 0.3), 0 0 24px rgba(0, 212, 170, 0.1);
          background: linear-gradient(135deg, var(--accent), #008a70);
          animation: logo-pulse 4s ease-in-out infinite;
        }
        @keyframes logo-pulse {
          0%, 100% { box-shadow: 0 0 12px rgba(0, 212, 170, 0.3), 0 0 24px rgba(0, 212, 170, 0.1); }
          50% { box-shadow: 0 0 18px rgba(0, 212, 170, 0.45), 0 0 36px rgba(0, 212, 170, 0.15); }
        }
        .sidebar__name {
          font-size: var(--text-sm);
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          letter-spacing: -0.01em;
          flex: 1;
        }
        .sidebar__theme-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: var(--radius-sm);
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .sidebar__theme-toggle:hover {
          color: var(--accent-light);
          border-color: var(--accent);
          background: var(--accent-subtle);
        }
        .sidebar__nav {
          flex: 1;
          padding: var(--space-md) var(--space-sm);
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow-y: auto;
        }
        .sidebar__item {
          position: relative;
          display: flex;
          align-items: center;
          gap: var(--space-md);
          padding: 10px 12px;
          font-family: var(--font-sans);
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--text-muted);
          background: transparent;
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--duration-fast);
          white-space: nowrap;
          width: 100%;
          text-align: left;
        }
        .sidebar__item:hover {
          color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.04);
        }
        .sidebar__item--active {
          color: var(--accent-light);
          background: var(--accent-subtle);
          font-weight: 600;
        }
        .sidebar[data-position="left"] .sidebar__item--active::before {
          content: '';
          position: absolute;
          left: -8px;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 20px;
          background: linear-gradient(180deg, var(--accent), #008a70);
          border-radius: 0 var(--radius-full) var(--radius-full) 0;
          box-shadow: 0 0 8px rgba(0, 212, 170, 0.4);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .sidebar[data-position="right"] .sidebar__item--active::before {
          content: '';
          position: absolute;
          right: -8px;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 20px;
          background: linear-gradient(180deg, var(--accent), #008a70);
          border-radius: var(--radius-full) 0 0 var(--radius-full);
          box-shadow: 0 0 8px rgba(0, 212, 170, 0.4);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .sidebar__footer {
          padding: var(--space-md) var(--space-sm);
          border-top: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        [data-theme="light"] .sidebar {
          background: rgba(255, 255, 255, 0.82);
        }
        [data-theme="light"] .sidebar__footer {
          border-top-color: rgba(0, 0, 0, 0.06);
        }
        .sidebar__collapse {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          border-radius: var(--radius-sm);
          transition: all var(--duration-fast);
        }
        .sidebar__collapse:hover {
          color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.03);
        }
        @media (max-width: 768px) {
          .sidebar {
            width: 100% !important;
            height: 64px;
            top: auto;
            bottom: 0;
            left: 0 !important;
            right: 0 !important;
            flex-direction: row;
            border-right: none;
            border-top: 1px solid var(--border);
            padding: 0 var(--space-sm);
            justify-content: space-around;
            align-items: center;
          }
          .sidebar__brand, .sidebar__footer { display: none; }
          .sidebar__nav {
            flex-direction: row;
            padding: 0;
            gap: 4px;
            overflow-x: auto;
            overflow-y: hidden;
            width: 100%;
            justify-content: space-between;
          }
          .sidebar__item {
            flex-direction: column;
            justify-content: center;
            padding: 8px;
            gap: 4px;
            border-radius: var(--radius-sm);
            text-align: center;
            width: auto;
            flex: 1;
          }
          .sidebar__item svg { width: 20px; height: 20px; margin: 0 auto; }
          .sidebar__item span {
             display: block; /* Show label on mobile bottom nav if enough space, or hide if too cramped. Let's show small text. */
             font-size: 10px;
             line-height: 1;
          }
          .sidebar__logo { width: 24px; height: 24px; }
          
          /* Active indicator bottom bar style */
          .sidebar[data-position="left"] .sidebar__item--active::before,
          .sidebar[data-position="right"] .sidebar__item--active::before {
            display: none;
          }
          .sidebar__item--active {
            background: transparent;
            color: var(--accent-light);
          }
          .sidebar__item--active svg {
            filter: drop-shadow(0 0 8px var(--accent));
            transform: translateY(-2px);
          }
        }
      `}</style>
    </nav>
  );
}
