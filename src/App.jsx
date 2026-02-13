import { useState, useEffect, useCallback, useRef } from 'react';
import { hasAccount } from './utils/encryption';
import { loadData, saveData } from './utils/storage';
import AuthScreen from './components/auth/AuthScreen';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/layout/Dashboard';
import FinanceModule from './components/finance/FinanceModule';
import TasksModule from './components/productivity/TasksModule';
import HealthModule from './components/health/HealthModule';
import GoalsModule from './components/goals/GoalsModule';
import AnalyticsModule from './components/analytics/AnalyticsModule';
import SettingsModule from './components/settings/Settings';

/* Each module gets a unique entrance animation */
const MODULE_TRANSITIONS = {
  dashboard: 'transition-cascade',
  finance: 'transition-slide-right',
  tasks: 'transition-float',
  health: 'transition-reveal',
  goals: 'transition-scale',
  analytics: 'transition-cascade',
  settings: 'transition-slide-right'
};

/* Accent color presets */
const ACCENT_PRESETS = {
  teal: { accent: '#00d4aa', light: '#00f5c8', dark: '#00b894' },
  indigo: { accent: '#6366f1', light: '#818cf8', dark: '#4f46e5' },
  rose: { accent: '#ff4d6a', light: '#ff7590', dark: '#e63956' },
  amber: { accent: '#ffab40', light: '#ffc570', dark: '#e89020' },
  cyan: { accent: '#40c4ff', light: '#6dd6ff', dark: '#20a8e8' },
  violet: { accent: '#a855f7', light: '#c084fc', dark: '#8b38e0' }
};

/* Font size scale multipliers */
const FONT_SCALES = {
  compact: 0.9,
  default: 1,
  comfortable: 1.1
};

export default function App() {
  const [encKey, setEncKey] = useState(null);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [data, setData] = useState({ finance: null, tasks: null, health: null, goals: null, settings: null });
  const [transitionKey, setTransitionKey] = useState(0);
  const activityTimer = useRef(null);

  useEffect(() => {
    if (!encKey) return;
    setData({
      finance: loadData('finance', encKey),
      tasks: loadData('tasks', encKey),
      health: loadData('health', encKey),
      goals: loadData('goals', encKey),
      settings: loadData('settings', encKey)
    });
  }, [encKey]);

  /* Apply appearance settings as CSS vars */
  useEffect(() => {
    const s = data.settings;
    if (!s) return;
    const root = document.documentElement;

    // Theme (dark/light)
    root.setAttribute('data-theme', s.theme || 'dark');

    // Accent color
    const preset = ACCENT_PRESETS[s.accentColor || 'indigo'];
    if (preset) {
      root.style.setProperty('--accent', preset.accent);
      root.style.setProperty('--accent-light', preset.light);
      root.style.setProperty('--accent-dark', preset.dark);
      root.style.setProperty('--accent-subtle', `${preset.accent}14`);
      root.style.setProperty('--accent-muted', `${preset.accent}26`);
      root.style.setProperty('--border-focus', `${preset.accent}80`);
    }

    // Font scale
    const scale = FONT_SCALES[s.fontSize || 'default'];
    root.style.setProperty('--text-xs', `${0.6875 * scale}rem`);
    root.style.setProperty('--text-sm', `${0.8125 * scale}rem`);
    root.style.setProperty('--text-base', `${0.875 * scale}rem`);
    root.style.setProperty('--text-md', `${1 * scale}rem`);
    root.style.setProperty('--text-lg', `${1.125 * scale}rem`);
    root.style.setProperty('--text-xl', `${1.375 * scale}rem`);
    root.style.setProperty('--text-2xl', `${1.75 * scale}rem`);

    // Animation intensity
    root.setAttribute('data-animations', s.animations || 'on');

    // Sidebar position
    root.setAttribute('data-sidebar', s.sidebarPosition || 'left');

  }, [data.settings]);

  useEffect(() => {
    if (!encKey) return;
    const timeout = (data.settings?.autoLockMinutes || 15) * 60 * 1000;
    const resetTimer = () => {
      clearTimeout(activityTimer.current);
      activityTimer.current = setTimeout(() => setEncKey(null), timeout);
    };
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      clearTimeout(activityTimer.current);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [encKey, data.settings?.autoLockMinutes]);

  const updateModule = useCallback((module, newData) => {
    setData(prev => ({ ...prev, [module]: newData }));
    saveData(module, newData, encKey);
  }, [encKey]);

  const handleLock = useCallback(() => setEncKey(null), []);
  const handleAuthenticated = useCallback((key) => { setEncKey(key); setActiveModule('dashboard'); }, []);

  const switchModule = useCallback((mod) => {
    setTransitionKey(k => k + 1);
    setActiveModule(mod);
  }, []);

  const handleToggleTheme = useCallback(() => {
    const newTheme = (data.settings?.theme || 'dark') === 'dark' ? 'light' : 'dark';
    updateModule('settings', { ...data.settings, theme: newTheme });
  }, [data.settings, updateModule]);

  if (!encKey) return <AuthScreen onAuthenticated={handleAuthenticated} />;

  const transitionClass = MODULE_TRANSITIONS[activeModule] || 'transition-cascade';
  const sidebarRight = data.settings?.sidebarPosition === 'right';
  const currentTheme = data.settings?.theme || 'dark';

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard': return <Dashboard data={data} settings={data.settings} onNavigate={switchModule} />;
      case 'finance': return <FinanceModule data={data.finance} settings={data.settings} onUpdate={d => updateModule('finance', d)} />;
      case 'tasks': return <TasksModule data={data.tasks} onUpdate={d => updateModule('tasks', d)} />;
      case 'health': return <HealthModule data={data.health} onUpdate={d => updateModule('health', d)} />;
      case 'goals': return <GoalsModule data={data.goals} onUpdate={d => updateModule('goals', d)} />;
      case 'analytics': return <AnalyticsModule data={data} settings={data.settings} />;
      case 'settings': return <SettingsModule settings={data.settings} onUpdateSettings={d => updateModule('settings', d)} encryptionKey={encKey} onLock={handleLock} />;
      default: return <Dashboard data={data} settings={data.settings} onNavigate={switchModule} />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar
        activeModule={activeModule}
        onModuleChange={switchModule}
        onLock={handleLock}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        position={sidebarRight ? 'right' : 'left'}
        theme={currentTheme}
        onToggleTheme={handleToggleTheme}
      />
      <main className="app-main" style={{
        [sidebarRight ? 'marginRight' : 'marginLeft']: sidebarCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
        [sidebarRight ? 'marginLeft' : 'marginRight']: 0,
        transition: 'margin var(--duration-normal) var(--ease-out)'
      }}>
        <div className={`app-content page-enter ${transitionClass}`} key={`${activeModule}-${transitionKey}`}>
          {renderModule()}
        </div>
      </main>

      <style>{`
        .app-layout { min-height: 100vh; }
        .app-main {
          min-height: 100vh;
          padding: var(--space-2xl);
        }
        .app-content {
          max-width: 1200px;
          margin: 0 auto;
        }
        @media (max-width: 768px) {
          .app-main {
            margin-left: 0 !important;
            margin-right: 0 !important;
            padding: var(--space-lg) var(--space-md);
            padding-bottom: 100px;
          }
        }
      `}</style>
    </div>
  );
}
