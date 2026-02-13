import { useState, useCallback } from 'react';
import { setupAccount, verifyPassword, hasAccount, getAccountEmail, getPasswordStrength, deleteAccount } from '../../utils/encryption';
import { Shield, Eye, EyeOff, Lock, Mail, ArrowRight, BarChart3, Target, Zap, Heart } from 'lucide-react';

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState(hasAccount() ? 'login' : 'register');
  const [email, setEmail] = useState(hasAccount() ? getAccountEmail() : '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(password);

  const handleLogin = useCallback((e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const key = verifyPassword(password);
      if (key) onAuthenticated(key);
      else setError('Invalid password. Please try again.');
      setLoading(false);
    }, 500);
  }, [password, onAuthenticated]);


  const handleRegister = useCallback((e) => {
    e.preventDefault();
    setError('');
    if (!email.includes('@')) { setError('Please enter a valid email address.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters long.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    setTimeout(() => {
      const key = setupAccount(email, password);
      onAuthenticated(key);
      setLoading(false);
    }, 500);
  }, [email, password, confirmPassword, onAuthenticated]);

  const handleReset = useCallback(() => {
    if (window.confirm('Are you sure? This will DELETE ALL DATA permanently. You cannot undo this.')) {
      deleteAccount();
      setMode('register');
      setEmail('');
      setPassword('');
      setError('');
    }
  }, []);

  const features = [
    { icon: <BarChart3 size={18} />, title: 'Finance Tracker', desc: 'Budgets, expenses & insights' },
    { icon: <Target size={18} />, title: 'Goals & Habits', desc: 'Track streaks & milestones' },
    { icon: <Zap size={18} />, title: 'Productivity', desc: 'Tasks, focus timer & more' },
    { icon: <Heart size={18} />, title: 'Health Metrics', desc: 'Wellness & fitness tracking' }
  ];

  return (
    <div className="auth-screen">
      <div className="auth-container">
        {/* Left side — Branding */}
        <div className="auth-left">
          <div className="auth-brand">
            <div className="auth-logo"><Shield size={24} strokeWidth={2.5} /></div>
            <h1 className="auth-title">NexusCommand</h1>
            <p className="auth-tagline">Your encrypted personal command center</p>
          </div>

          <div className="auth-features">
            {features.map((f, i) => (
              <div key={i} className="auth-feature" style={{ animationDelay: `${0.1 + i * 0.08}s` }}>
                <div className="auth-feature__icon">{f.icon}</div>
                <div>
                  <div className="auth-feature__title">{f.title}</div>
                  <div className="auth-feature__desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="auth-security-note">
            <Lock size={13} />
            <span>AES-256 encryption · Data never leaves your device</span>
          </div>
        </div>

        {/* Right side — Form */}
        <div className="auth-right">
          <div className="auth-form-card card card--static">
            <h2 className="auth-form-title">
              {mode === 'login' ? 'Welcome back' : 'Create your vault'}
            </h2>
            <p className="auth-form-subtitle">
              {mode === 'login' ? 'Enter your password to unlock' : 'Set up your encrypted command center'}
            </p>

            <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
              {mode === 'register' && (
                <div className="input-group" style={{ marginBottom: 'var(--space-md)' }}>
                  <label className="input-label">Email</label>
                  <div className="input-with-icon">
                    <Mail size={15} className="input-icon" />
                    <input type="email" className="input-field input-field--icon" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                </div>
              )}

              {mode === 'login' && (
                <div className="auth-user-info"><Mail size={13} /><span>{email}</span></div>
              )}

              <div className="input-group" style={{ marginBottom: 'var(--space-md)' }}>
                <label className="input-label">Password</label>
                <div className="input-with-icon">
                  <Lock size={15} className="input-icon" />
                  <input type={showPassword ? 'text' : 'password'} className="input-field input-field--icon" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required autoFocus />
                  <button type="button" className="input-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {mode === 'register' && password && (
                  <div className="password-strength">
                    <div className="password-strength__bar"><div className="password-strength__fill" style={{ width: strength.width, background: strength.color }} /></div>
                    <span className="password-strength__label" style={{ color: strength.color }}>{strength.level}</span>
                  </div>
                )}
              </div>

              {mode === 'register' && (
                <div className="input-group" style={{ marginBottom: 'var(--space-lg)' }}>
                  <label className="input-label">Confirm Password</label>
                  <div className="input-with-icon">
                    <Lock size={15} className="input-icon" />
                    <input type={showPassword ? 'text' : 'password'} className="input-field input-field--icon" placeholder="Confirm your password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                  </div>
                </div>
              )}

              {error && <div className="auth-error">{error}</div>}

              <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
                {loading ? <span className="auth-spinner" /> : <>{mode === 'login' ? 'Unlock Dashboard' : 'Create Vault'}<ArrowRight size={16} /></>}
              </button>
            </form>

            <div className="auth-switch">
              {mode === 'login'
                ? <span>No account? <button className="auth-link" onClick={() => { setMode('register'); setError(''); }}>Create one</button></span>
                : <span>Already have an account? <button className="auth-link" onClick={() => { setMode('login'); setError(''); }}>Sign in</button></span>
              }
              {mode === 'login' && (
                <div style={{ marginTop: 'var(--space-md)' }}>
                  <button className="auth-link" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }} onClick={handleReset}>
                    Reset Vault / Forgot Password?
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .auth-screen {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-xl);
          background: var(--bg-primary);
        }
        .auth-container {
          display: flex;
          width: 100%;
          max-width: 880px;
          gap: var(--space-3xl);
          align-items: center;
          animation: fade-in 0.5s var(--ease-out);
        }
        .auth-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: var(--space-xl);
        }
        .auth-logo {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-lg);
          background: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          margin-bottom: var(--space-md);
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
        }
        .auth-title {
          font-size: var(--text-3xl);
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.03em;
          line-height: 1.1;
        }
        .auth-tagline {
          color: var(--text-secondary);
          font-size: var(--text-base);
          margin-top: var(--space-sm);
        }
        .auth-features {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }
        .auth-feature {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          padding: var(--space-sm) 0;
          animation: slide-up 0.4s var(--ease-out) both;
        }
        .auth-feature__icon {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          background: var(--accent-subtle);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-light);
          flex-shrink: 0;
        }
        .auth-feature__title {
          font-weight: 600;
          font-size: var(--text-sm);
          color: var(--text-primary);
        }
        .auth-feature__desc {
          font-size: var(--text-xs);
          color: var(--text-muted);
        }
        .auth-security-note {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          font-size: var(--text-xs);
          color: var(--text-muted);
          padding-top: var(--space-md);
          border-top: 1px solid var(--border);
        }
        .auth-right { flex: 1; max-width: 400px; }
        .auth-form-card { padding: var(--space-2xl); }
        .auth-form-title {
          font-size: var(--text-xl);
          font-weight: 700;
          margin-bottom: 4px;
          letter-spacing: -0.01em;
        }
        .auth-form-subtitle {
          color: var(--text-muted);
          font-size: var(--text-sm);
          margin-bottom: var(--space-xl);
        }
        .auth-user-info {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-md);
          background: var(--accent-subtle);
          border: 1px solid var(--accent-muted);
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
          color: var(--accent-light);
          margin-bottom: var(--space-md);
        }
        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
          pointer-events: none;
          z-index: 1;
        }
        .input-field--icon { padding-left: 36px; }
        .input-toggle {
          position: absolute;
          right: 8px;
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          display: flex;
          z-index: 1;
          transition: color var(--duration-fast);
        }
        .input-toggle:hover { color: var(--text-secondary); }
        .password-strength {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          margin-top: 6px;
        }
        .password-strength__bar {
          flex: 1;
          height: 3px;
          background: var(--bg-elevated);
          border-radius: var(--radius-full);
          overflow: hidden;
        }
        .password-strength__fill {
          height: 100%;
          border-radius: var(--radius-full);
          transition: all var(--duration-normal) var(--ease-out);
        }
        .password-strength__label {
          font-size: var(--text-xs);
          font-weight: 600;
          text-transform: uppercase;
        }
        .auth-error {
          padding: var(--space-sm) var(--space-md);
          background: var(--danger-subtle);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: var(--radius-md);
          color: var(--danger);
          font-size: var(--text-sm);
          margin-bottom: var(--space-md);
        }
        .auth-submit {
          width: 100%;
          margin-top: var(--space-sm);
        }
        .auth-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid transparent;
          border-top-color: currentColor;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .auth-switch {
          text-align: center;
          margin-top: var(--space-xl);
          font-size: var(--text-sm);
          color: var(--text-muted);
        }
        .auth-link {
          background: none;
          border: none;
          color: var(--accent-light);
          cursor: pointer;
          font-size: inherit;
          font-family: inherit;
          font-weight: 500;
        }
        .auth-link:hover { color: var(--text-primary); text-decoration: underline; }
        @media (max-width: 768px) {
          .auth-container { flex-direction: column; gap: var(--space-xl); }
          .auth-left { align-items: center; text-align: center; }
          .auth-right { max-width: 100%; width: 100%; }
          .auth-features { display: none; }
        }
      `}</style>
    </div>
  );
}
