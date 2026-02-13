import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Shield, Mail, ArrowRight, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, BarChart3, Zap, Target, Heart, Layout } from 'lucide-react';

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Check for password recovery flow
  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('reset');
      }
    });
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setSuccessMsg(''); setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) { setError(error.message); setLoading(false); }
    else { onAuthenticated(data.user); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); setSuccessMsg('');

    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) { setError(error.message); setLoading(false); }
    else {
      if (data.user && !data.session) {
        setSuccessMsg('Registration successful! Please check your email to confirm your account.');
        setLoading(false);
      } else {
        onAuthenticated(data.user);
      }
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email address.'); return; }
    setLoading(true); setError(''); setSuccessMsg('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });

    if (error) { setError(error.message); }
    else { setSuccessMsg('Password reset link sent! Check your inbox (valid for 5 mins).'); }
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password.length < 6) { setError('New password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }

    setLoading(true); setError('');

    const { error } = await supabase.auth.updateUser({ password });

    if (error) { setError(error.message); setLoading(false); }
    else {
      setSuccessMsg('Password updated successfully! You can now log in.');
      setTimeout(() => { setMode('login'); setPassword(''); setConfirmPassword(''); setSuccessMsg(''); }, 2000);
      setLoading(false);
    }
  };

  // Original modules list from generic previous design
  const modules = [
    { icon: <BarChart3 size={20} />, title: 'Finance Tracker', desc: 'Budgets, expenses & insights' },
    { icon: <Target size={20} />, title: 'Goals & Habits', desc: 'Track streaks & milestones' },
    { icon: <Zap size={20} />, title: 'Productivity', desc: 'Tasks, focus timer & more' },
    { icon: <Heart size={20} />, title: 'Health Metrics', desc: 'Wellness & fitness tracking' }
  ];

  return (
    <div className="auth-screen">
      <div className="aurora-bg">
        <div className="aurora-blob blob-1"></div>
        <div className="aurora-blob blob-2"></div>
        <div className="aurora-blob blob-3"></div>
      </div>

      <div className="auth-container">
        {/* Left Side - Module Showcase (Restored from Previous Design) */}
        <div className="auth-left">
          <div className="brand-header">
            <div className="logo-icon"><Shield size={32} /></div>
            <div>
              <h1 className="app-title">NexusCommand</h1>
              <p className="app-tagline">Your cloud-synced personal command center</p>
            </div>
          </div>

          <div className="module-list">
            {modules.map((m, i) => (
              <div key={i} className="module-item">
                <div className="module-icon">{m.icon}</div>
                <div>
                  <div className="module-title">{m.title}</div>
                  <div className="module-desc">{m.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="auth-footer-note">
            <p>© 2026 NexusCommand. Secure by design.</p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="auth-right">
          <div className="auth-card">
            <h2 className="auth-mode-title">
              {mode === 'login' && 'Welcome Back'}
              {mode === 'register' && 'Create Account'}
              {mode === 'forgot' && 'Reset Password'}
              {mode === 'reset' && 'Set New Password'}
            </h2>

            {mode === 'login' && <p className="auth-subtitle">Enter your credentials to access your dashboard</p>}

            {error && <div className="feedback error"><AlertCircle size={16} />{error}</div>}
            {successMsg && <div className="feedback success"><CheckCircle2 size={16} />{successMsg}</div>}

            <form onSubmit={mode === 'login' ? handleLogin : mode === 'register' ? handleRegister : mode === 'forgot' ? handleForgotPassword : handleResetPassword}>
              {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
                <div className="input-group">
                  <label>Email Address</label>
                  <div className="simple-input-wrapper">
                    <Mail size={18} className="input-icon" />
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoFocus={mode === 'login'}
                    />
                  </div>
                </div>
              )}

              {(mode === 'login' || mode === 'register' || mode === 'reset') && (
                <div className="input-group">
                  <label>{mode === 'reset' ? 'New Password' : 'Password'}</label>
                  <div className="simple-input-wrapper">
                    <Lock size={18} className="input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                    <button type="button" className="toggle-pwd" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {(mode === 'register' || mode === 'reset') && (
                <div className="input-group">
                  <label>Confirm Password</label>
                  <div className="simple-input-wrapper">
                    <Lock size={18} className="input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              {mode === 'login' && (
                <div className="forgot-link">
                  <button type="button" onClick={() => { setMode('forgot'); setError(''); setSuccessMsg(''); }}>Forgot Password?</button>
                </div>
              )}

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? <div className="spinner"></div> : (
                  <>
                    {mode === 'login' && 'Sign In'}
                    {mode === 'register' && 'Create Account'}
                    {mode === 'forgot' && 'Send Reset Link'}
                    {mode === 'reset' && 'Update Password'}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="auth-footer-switch">
              {mode === 'login' && <p>New here? <button onClick={() => { setMode('register'); setError(''); }}>Sign Up</button></p>}
              {mode === 'register' && <p>Have an account? <button onClick={() => { setMode('login'); setError(''); }}>Sign In</button></p>}
              {(mode === 'forgot' || mode === 'reset') && <p><button onClick={() => { setMode('login'); setError(''); }}>Back to Login</button></p>}
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
                    background: #080b16;
                    color: white;
                    font-family: 'Outfit', sans-serif;
                    position: relative;
                    overflow: hidden;
                    padding: 20px;
                }

                .aurora-bg { position: absolute; inset: 0; overflow: hidden; z-index: 0; }
                .aurora-blob {
                    position: absolute;
                    filter: blur(80px);
                    opacity: 0.4;
                    animation: float 20s infinite ease-in-out;
                }
                .blob-1 { width: 50vw; height: 50vw; background: #6366f1; top: -20%; left: -10%; animation-delay: 0s; }
                .blob-2 { width: 40vw; height: 40vw; background: #a855f7; bottom: -10%; right: -10%; animation-delay: -5s; }
                .blob-3 { width: 30vw; height: 30vw; background: #40c4ff; top: 40%; left: 30%; animation-delay: -10s; }

                @keyframes float {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(30px, -30px) scale(1.1); }
                }

                .auth-container {
                    position: relative;
                    z-index: 10;
                    display: flex;
                    width: 100%;
                    max-width: 900px;
                    gap: 80px;
                    align-items: center;
                    justify-content: center;
                }

                /* Left Side - Modules List */
                .auth-left {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 30px;
                }

                .brand-header { display: flex; align-items: center; gap: 16px; margin-bottom: 10px; }
                .logo-icon {
                    width: 48px; height: 48px;
                    background: linear-gradient(135deg, #6366f1, #a855f7);
                    border-radius: 12px;
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4);
                }
                .app-title { font-size: 28px; font-weight: 700; color: white; margin: 0; line-height: 1.2; }
                .app-tagline { color: #94a3b8; font-size: 14px; margin: 4px 0 0 0; }

                .module-list { display: flex; flex-direction: column; gap: 16px; }
                .module-item { 
                    display: flex; gap: 16px; align-items: center;
                    padding: 12px;
                    border-radius: 12px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    transition: transform 0.2s;
                }
                .module-item:hover { transform: translateX(5px); background: rgba(255, 255, 255, 0.06); }

                .module-icon {
                    width: 36px; height: 36px;
                    background: rgba(99, 102, 241, 0.1);
                    border-radius: 8px;
                    display: flex; align-items: center; justify-content: center;
                    color: #a5b4fc;
                    flex-shrink: 0;
                }
                .module-title { font-weight: 600; font-size: 15px; color: white; }
                .module-desc { font-size: 13px; color: #94a3b8; }

                .auth-footer-note { font-size: 12px; color: #64748b; margin-top: 20px; }

                /* Right Side - Form */
                .auth-right {
                    flex: 1;
                    max-width: 400px;
                }

                .auth-card {
                    background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 24px;
                    padding: 40px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    animation: slideUp 0.5s ease-out;
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .auth-mode-title { font-size: 24px; font-weight: 700; margin-bottom: 8px; color: white; }
                .auth-subtitle { color: #94a3b8; font-size: 14px; margin-bottom: 24px; }

                /* Simplified Inputs - No 'box in box' */
                .input-group { margin-bottom: 16px; }
                .input-group label { display: block; font-size: 13px; color: #cbd5e1; margin-bottom: 8px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
                
                .simple-input-wrapper {
                    position: relative;
                }
                
                .simple-input-wrapper input {
                    width: 100%;
                    background: rgba(15, 23, 42, 0.8);
                    border: 1px solid rgba(51, 65, 85, 1);
                    padding: 12px 16px 12px 40px; /* Space for icon */
                    border-radius: 8px;
                    color: white;
                    font-size: 15px;
                    transition: all 0.2s;
                    outline: none;
                }
                
                .simple-input-wrapper input:focus {
                    border-color: #6366f1;
                    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
                    background: rgba(30, 41, 59, 1);
                }

                .input-icon {
                    position: absolute;
                    left: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #64748b;
                    pointer-events: none;
                    transition: color 0.2s;
                }
                
                .simple-input-wrapper input:focus + .input-icon {
                    color: #818cf8;
                }
                /* Use sibling selector hack or just rely on focus-within if we wrapper */

                .toggle-pwd {
                    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
                    background: none; border: none; color: #64748b; cursor: pointer; padding: 4px;
                }
                .toggle-pwd:hover { color: #white; }

                .forgot-link { text-align: right; margin-bottom: 24px; }
                .forgot-link button { background: none; border: none; color: #2dd4bf; /* Teal accent */ font-size: 13px; cursor: pointer; font-weight: 500; }
                .forgot-link button:hover { color: #5eead4; text-decoration: underline; }

                .submit-btn {
                    width: 100%;
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    border: none;
                    padding: 14px;
                    border-radius: 8px;
                    color: white;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                    transition: transform 0.1s, box-shadow 0.2s;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                }
                .submit-btn:hover {
                    box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.4);
                    transform: translateY(-1px);
                    background: linear-gradient(135deg, #4f46e5, #7c3aed);
                }
                .submit-btn:active { transform: translateY(0); }
                .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }

                .auth-footer-switch { margin-top: 24px; text-align: center; font-size: 14px; color: #94a3b8; }
                .auth-footer-switch button { background: none; border: none; color: #818cf8; font-weight: 600; cursor: pointer; margin-left: 4px; }
                .auth-footer-switch button:hover { color: #a5b4fc; }

                .feedback { padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; display: flex; align-items: center; gap: 10px; }
                .feedback.error { background: rgba(239, 68, 68, 0.1); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.2); }
                .feedback.success { background: rgba(34, 197, 94, 0.1); color: #86efac; border: 1px solid rgba(34, 197, 94, 0.2); }

                .spinner { width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }

                /* Mobile Responsive */
                @media (max-width: 900px) {
                    .auth-container { flex-direction: column; gap: 40px; }
                    .auth-left { order: 2; text-align: center; align-items: center; } 
                    .module-list { display: none; }
                    .auth-right { order: 1; width: 100%; }
                    .brand-header { justify-content: center; }
                }
            `}</style>
    </div>
  );
}
