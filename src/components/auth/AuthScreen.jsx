import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Shield, Mail, ArrowRight, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

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
      // Check if email confirmation is required (depends on Supabase settings)
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
      redirectTo: window.location.origin, // Redirect back to app
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

  // background animation
  return (
    <div className="auth-screen">
      <div className="aurora-bg">
        <div className="aurora-blob blob-1"></div>
        <div className="aurora-blob blob-2"></div>
        <div className="aurora-blob blob-3"></div>
      </div>

      <div className="auth-container">
        <div className="auth-card">
          {/* Header */}
          <div className="auth-header">
            <div className="logo-icon"><Shield size={28} /></div>
            <h1 className="app-title">NexusCommand</h1>
            <p className="app-tagline">Secure Cloud Command Center</p>
          </div>

          {/* Mode Title */}
          <h2 className="auth-mode-title">
            {mode === 'login' && 'Welcome Back'}
            {mode === 'register' && 'Create Account'}
            {mode === 'forgot' && 'Reset Password'}
            {mode === 'reset' && 'Set New Password'}
          </h2>

          {/* Feedback Messages */}
          {error && <div className="feedback error"><AlertCircle size={16} />{error}</div>}
          {successMsg && <div className="feedback success"><CheckCircle2 size={16} />{successMsg}</div>}

          {/* Form */}
          <form onSubmit={
            mode === 'login' ? handleLogin :
              mode === 'register' ? handleRegister :
                mode === 'forgot' ? handleForgotPassword :
                  handleResetPassword
          }>

            {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
              <div className="input-group">
                <label>Email Address</label>
                <div className="input-field">
                  <Mail size={18} className="icon" />
                  <input type="email" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoFocus={mode === 'login'} />
                </div>
              </div>
            )}

            {(mode === 'login' || mode === 'register' || mode === 'reset') && (
              <div className="input-group">
                <label>{mode === 'reset' ? 'New Password' : 'Password'}</label>
                <div className="input-field">
                  <Lock size={18} className="icon" />
                  <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                  <button type="button" className="toggle-pwd" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {(mode === 'register' || mode === 'reset') && (
              <div className="input-group">
                <label>Confirm Password</label>
                <div className="input-field">
                  <Lock size={18} className="icon" />
                  <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
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

          {/* Footer Switch */}
          <div className="auth-footer">
            {mode === 'login' && (
              <p>New to Nexus? <button onClick={() => { setMode('register'); setError(''); }}>Sign Up</button></p>
            )}
            {mode === 'register' && (
              <p>Already have an account? <button onClick={() => { setMode('login'); setError(''); }}>Sign In</button></p>
            )}
            {(mode === 'forgot' || mode === 'reset') && (
              <p><button onClick={() => { setMode('login'); setError(''); }}>Back to Login</button></p>
            )}
          </div>
        </div>
      </div>

      <style>{`
                .auth-screen {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #080b16; /* Midnight base */
                    color: white;
                    font-family: 'Outfit', sans-serif;
                    position: relative;
                    overflow: hidden;
                }

                /* Aurora Background */
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
                    width: 100%;
                    max-width: 420px;
                    padding: 20px;
                }

                .auth-card {
                    background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 24px;
                    padding: 40px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    animation: scaleIn 0.4s ease-out;
                }

                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }

                .auth-header { text-align: center; margin-bottom: 30px; }
                .logo-icon {
                    width: 56px; height: 56px;
                    background: linear-gradient(135deg, #6366f1, #a855f7);
                    border-radius: 16px;
                    display: flex; align-items: center; justify-content: center;
                    margin: 0 auto 16px;
                    box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4);
                }
                .app-title { font-size: 24px; font-weight: 700; background: linear-gradient(to right, #fff, #a5b4fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0; }
                .app-tagline { color: #94a3b8; font-size: 14px; margin-top: 4px; }

                .auth-mode-title { font-size: 20px; font-weight: 600; text-align: center; margin-bottom: 24px; color: white; }

                .input-group { margin-bottom: 16px; }
                .input-group label { display: block; font-size: 13px; color: #cbd5e1; margin-bottom: 6px; font-weight: 500; }
                .input-field {
                    position: relative;
                    display: flex; align-items: center;
                }
                .input-field input {
                    width: 100%;
                    background: rgba(30, 41, 59, 0.5);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 12px 16px 12px 42px;
                    border-radius: 12px;
                    color: white;
                    font-size: 15px;
                    transition: all 0.2s;
                    outline: none;
                }
                .input-field input:focus {
                    background: rgba(30, 41, 59, 0.8);
                    border-color: #6366f1;
                    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
                }
                .input-field .icon {
                    position: absolute; left: 14px; color: #94a3b8; pointer-events: none;
                }
                .toggle-pwd {
                    position: absolute; right: 12px; background: none; border: none; color: #94a3b8; cursor: pointer; padding: 4px;
                }
                .toggle-pwd:hover { color: white; }

                .forgot-link { text-align: right; margin-bottom: 20px; }
                .forgot-link button { background: none; border: none; color: #818cf8; font-size: 13px; cursor: pointer; font-weight: 500; }
                .forgot-link button:hover { color: #a5b4fc; text-decoration: underline; }

                .submit-btn {
                    width: 100%;
                    background: linear-gradient(135deg, #4f46e5, #7c3aed);
                    border: none;
                    padding: 14px;
                    border-radius: 12px;
                    color: white;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                    transition: transform 0.1s, box-shadow 0.2s;
                }
                .submit-btn:hover {
                    box-shadow: 0 10px 20px -5px rgba(79, 70, 229, 0.4);
                    transform: translateY(-1px);
                }
                .submit-btn:active { transform: translateY(0); }
                .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }

                .auth-footer { margin-top: 24px; text-align: center; font-size: 14px; color: #94a3b8; }
                .auth-footer button { background: none; border: none; color: #38bdf8; font-weight: 600; cursor: pointer; margin-left: 4px; }
                .auth-footer button:hover { color: #7dd3fc; }

                .feedback {
                    padding: 12px; border-radius: 10px; margin-bottom: 20px; font-size: 14px; display: flex; align-items: center; gap: 10px;
                }
                .feedback.error { background: rgba(239, 68, 68, 0.1); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.2); }
                .feedback.success { background: rgba(34, 197, 94, 0.1); color: #86efac; border: 1px solid rgba(34, 197, 94, 0.2); }

                .spinner {
                    width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite;
                }
                @keyframes spin { to { transform: rotate(360deg); } }

                @media (max-width: 480px) {
                    .auth-card { padding: 30px 20px; }
                }
            `}</style>
    </div>
  );
}
