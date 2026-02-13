import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { exportAllData, importData } from '../../utils/storage';
import { getPasswordStrength } from '../../utils/encryption'; // Keeping strength meter for UI
import { Download, Upload, Key, Trash2, Globe, Shield, X, Palette, Type, Layout, Sparkles } from 'lucide-react';

const ACCENT_COLORS = [
    { id: 'teal', label: 'Teal', color: '#00d4aa' },
    { id: 'indigo', label: 'Indigo', color: '#6366f1' },
    { id: 'rose', label: 'Rose', color: '#ff4d6a' },
    { id: 'amber', label: 'Amber', color: '#ffab40' },
    { id: 'cyan', label: 'Cyan', color: '#40c4ff' },
    { id: 'violet', label: 'Violet', color: '#a855f7' }
];

const FONT_SIZES = [
    { id: 'compact', label: 'Compact', desc: 'Smaller text' },
    { id: 'default', label: 'Default', desc: 'Balanced' },
    { id: 'comfortable', label: 'Comfortable', desc: 'Larger text' }
];

const ANIMATION_OPTS = [
    { id: 'on', label: 'Full', desc: 'Cinematic transitions' },
    { id: 'reduced', label: 'Reduced', desc: 'Faster, subtler' },
    { id: 'off', label: 'Off', desc: 'No animations' }
];

export default function SettingsModule({ settings, onUpdateSettings, encryptionKey, onLock }) {
    const [showPwdChange, setShowPwdChange] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [oldPwd, setOldPwd] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [msg, setMsg] = useState({ text: '', type: '' });
    const fileRef = useRef(null);

    const update = (key, value) => onUpdateSettings({ ...settings, [key]: value });

    const handleExport = () => {
        const data = exportAllData(encryptionKey);
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `nexuscommand-backup-${new Date().toISOString().split('T')[0]}.json`; a.click();
        URL.revokeObjectURL(url);
        setMsg({ text: 'Backup exported successfully!', type: 'success' });
    };

    const handleImport = (e) => {
        const file = e.target.files?.[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const json = JSON.parse(ev.target.result);
                if (importData(json, encryptionKey)) setMsg({ text: 'Data imported! Please refresh.', type: 'success' });
                else setMsg({ text: 'Invalid backup file.', type: 'error' });
            } catch { setMsg({ text: 'Failed to parse file.', type: 'error' }); }
        };
        reader.readAsText(file);
    };

    const handleChangePwd = async (e) => {
        e.preventDefault();
        if (newPwd.length < 8) { setMsg({ text: 'Password must be at least 8 characters.', type: 'error' }); return; }
        if (newPwd !== confirmPwd) { setMsg({ text: 'Passwords do not match.', type: 'error' }); return; }

        const { error } = await supabase.auth.updateUser({ password: newPwd });

        if (!error) {
            setMsg({ text: 'Password changed! Please re-login on other devices.', type: 'success' });
            setShowPwdChange(false);
        } else {
            setMsg({ text: error.message, type: 'error' });
        }
    };

    const handleDelete = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('user_data').delete().eq('user_id', user.id);
            await supabase.auth.signOut();
            window.location.reload();
        }
    };
    const strength = getPasswordStrength(newPwd);

    const currencies = [
        { code: 'USD', symbol: '$', name: 'US Dollar' }, { code: 'EUR', symbol: '€', name: 'Euro' },
        { code: 'GBP', symbol: '£', name: 'British Pound' }, { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
        { code: 'JPY', symbol: '¥', name: 'Japanese Yen' }, { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
        { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' }, { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' }
    ];

    return (
        <div>
            <div className="section-header"><div><h1 className="section-title" style={{ fontSize: 'var(--text-2xl)' }}>Settings</h1><p className="section-subtitle">Customize your command center</p></div></div>

            {msg.text && (
                <div className={`toast toast--${msg.type}`} style={{ marginBottom: 'var(--space-lg)' }}>
                    <span style={{ flex: 1, fontSize: 'var(--text-sm)' }}>{msg.text}</span>
                    <button className="btn-icon" onClick={() => setMsg({ text: '', type: '' })}><X size={14} /></button>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>

                {/* ═══ APPEARANCE ═══ */}
                <div className="card card--static" style={{ padding: 'var(--space-xl)' }}>
                    <div className="settings-section-header"><Palette size={16} color="var(--accent-light)" /><h3>Appearance</h3></div>

                    {/* Accent Color */}
                    <div className="settings-row">
                        <div className="settings-row__label">
                            <span className="settings-row__title">Accent Color</span>
                            <span className="settings-row__desc">Choose your primary color</span>
                        </div>
                        <div className="color-picker">
                            {ACCENT_COLORS.map(c => (
                                <button
                                    key={c.id}
                                    className={`color-swatch ${settings?.accentColor === c.id ? 'color-swatch--active' : ''}`}
                                    style={{ '--swatch-color': c.color }}
                                    onClick={() => update('accentColor', c.id)}
                                    title={c.label}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* ═══ TYPOGRAPHY & LAYOUT ═══ */}
                <div className="card card--static" style={{ padding: 'var(--space-xl)' }}>
                    <div className="settings-section-header"><Type size={16} color="var(--info)" /><h3>Typography & Layout</h3></div>

                    {/* Font Size */}
                    <div className="settings-row">
                        <div className="settings-row__label">
                            <span className="settings-row__title">Text Size</span>
                            <span className="settings-row__desc">Adjust overall font size</span>
                        </div>
                        <div className="option-chips">
                            {FONT_SIZES.map(f => (
                                <button key={f.id} className={`option-chip ${settings?.fontSize === f.id ? 'option-chip--active' : ''}`} onClick={() => update('fontSize', f.id)}>
                                    <span className="option-chip__label">{f.label}</span>
                                    <span className="option-chip__desc">{f.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sidebar Position */}
                    <div className="settings-row" style={{ borderBottom: 'none' }}>
                        <div className="settings-row__label">
                            <span className="settings-row__title">Sidebar Position</span>
                            <span className="settings-row__desc">Move sidebar to either side</span>
                        </div>
                        <div className="option-chips">
                            {['left', 'right'].map(p => (
                                <button key={p} className={`option-chip ${settings?.sidebarPosition === p ? 'option-chip--active' : ''}`} onClick={() => update('sidebarPosition', p)}>
                                    <Layout size={16} style={{ transform: p === 'right' ? 'scaleX(-1)' : 'none' }} />
                                    <span className="option-chip__label">{p.charAt(0).toUpperCase() + p.slice(1)}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ═══ ANIMATIONS ═══ */}
                <div className="card card--static" style={{ padding: 'var(--space-xl)' }}>
                    <div className="settings-section-header"><Sparkles size={16} color="var(--warning)" /><h3>Animations</h3></div>

                    <div className="settings-row" style={{ borderBottom: 'none' }}>
                        <div className="settings-row__label">
                            <span className="settings-row__title">Transition Intensity</span>
                            <span className="settings-row__desc">Control page transition effects</span>
                        </div>
                        <div className="option-chips">
                            {ANIMATION_OPTS.map(a => (
                                <button key={a.id} className={`option-chip ${settings?.animations === a.id ? 'option-chip--active' : ''}`} onClick={() => update('animations', a.id)}>
                                    <span className="option-chip__label">{a.label}</span>
                                    <span className="option-chip__desc">{a.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ═══ PREFERENCES ═══ */}
                <div className="card card--static" style={{ padding: 'var(--space-xl)' }}>
                    <div className="settings-section-header"><Globe size={16} color="var(--accent-light)" /><h3>Preferences</h3></div>
                    <div className="grid-2">
                        <div className="input-group">
                            <label className="input-label">Currency</label>
                            <select className="input-field" value={settings?.currency || 'USD'} onChange={e => {
                                const cur = currencies.find(c => c.code === e.target.value);
                                onUpdateSettings({ ...settings, currency: e.target.value, currencySymbol: cur?.symbol || '$' });
                            }}>
                                {currencies.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.name}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Auto-Lock (minutes)</label>
                            <select className="input-field" value={settings?.autoLockMinutes || 15} onChange={e => update('autoLockMinutes', parseInt(e.target.value))}>
                                {[5, 10, 15, 30, 60].map(m => <option key={m} value={m}>{m} minutes</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* ═══ DATA MANAGEMENT ═══ */}
                <div className="card card--static" style={{ padding: 'var(--space-xl)' }}>
                    <div className="settings-section-header"><Download size={16} color="var(--success)" /><h3>Data Management</h3></div>
                    <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                        <button className="btn btn-secondary" onClick={handleExport}><Download size={16} /> Export Backup</button>
                        <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}><Upload size={16} /> Import Backup</button>
                        <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
                    </div>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-md)' }}>Backups are exported as JSON. Your data remains encrypted in local storage.</p>
                </div>

                {/* ═══ SECURITY ═══ */}
                <div className="card card--static" style={{ padding: 'var(--space-xl)' }}>
                    <div className="settings-section-header"><Shield size={16} color="var(--danger)" /><h3>Security</h3></div>
                    <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                        <button className="btn btn-secondary" onClick={() => setShowPwdChange(true)}><Key size={16} /> Change Password</button>
                        <button className="btn btn-danger" onClick={() => setShowDeleteConfirm(true)}><Trash2 size={16} /> Delete All Data</button>
                    </div>
                </div>
            </div>

            {/* Change Password Modal */}
            {showPwdChange && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowPwdChange(false)}>
                    <div className="modal">
                        <div className="modal__header"><h3 className="modal__title">Change Password</h3><button className="btn-icon" onClick={() => setShowPwdChange(false)}><X size={18} /></button></div>
                        <form onSubmit={handleChangePwd}>
                            <div className="modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                {/* Note: We don't verify old pwd client-side with Supabase, it handles security */}
                                <div className="input-group"><label className="input-label">New Password</label><input type={showPwd ? 'text' : 'password'} className="input-field" value={newPwd} onChange={e => setNewPwd(e.target.value)} required />
                                    {newPwd && <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}><div style={{ flex: 1, height: 3, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden' }}><div style={{ height: '100%', width: strength.width, background: strength.color, borderRadius: 99, transition: 'all 0.3s' }} /></div><span style={{ fontSize: 'var(--text-xs)', color: strength.color, fontWeight: 600, textTransform: 'uppercase' }}>{strength.level}</span></div>}
                                </div>
                                <div className="input-group"><label className="input-label">Confirm New</label><input type={showPwd ? 'text' : 'password'} className="input-field" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} required /></div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={showPwd} onChange={e => setShowPwd(e.target.checked)} /> Show passwords
                                </label>
                            </div>
                            <div className="modal__footer"><button type="button" className="btn btn-secondary" onClick={() => setShowPwdChange(false)}>Cancel</button><button type="submit" className="btn btn-primary">Change Password</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {showDeleteConfirm && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowDeleteConfirm(false)}>
                    <div className="modal">
                        <div className="modal__header"><h3 className="modal__title" style={{ color: 'var(--danger)' }}>⚠️ Delete All Data</h3><button className="btn-icon" onClick={() => setShowDeleteConfirm(false)}><X size={18} /></button></div>
                        <div className="modal__body"><p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>This will permanently delete all your data including finances, tasks, health logs, goals, and habits. This action cannot be undone.</p></div>
                        <div className="modal__footer"><button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button><button className="btn btn-danger" onClick={handleDelete}><Trash2 size={16} /> Delete Everything</button></div>
                    </div>
                </div>
            )}

            <style>{`
        .settings-section-header {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          margin-bottom: var(--space-xl);
        }
        .settings-section-header h3 {
          font-size: var(--text-sm);
          font-weight: 700;
          color: var(--text-primary);
        }
        .settings-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-xl);
          padding: var(--space-lg) 0;
          border-bottom: 1px solid var(--border);
        }
        .settings-row:last-child { border-bottom: none; }
        .settings-row__label { }
        .settings-row__title {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--text-primary);
          display: block;
        }
        .settings-row__desc {
          font-size: var(--text-xs);
          color: var(--text-muted);
          display: block;
          margin-top: 2px;
        }

        /* Color Picker */
        .color-picker {
          display: flex;
          gap: 8px;
        }
        .color-swatch {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-full);
          background: var(--swatch-color);
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }
        .color-swatch:hover {
          transform: scale(1.15);
        }
        .color-swatch--active {
          border-color: var(--text-primary);
          box-shadow: 0 0 0 3px var(--bg-primary), 0 0 0 5px var(--swatch-color);
        }
        .color-swatch--active::after {
          content: '✓';
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          color: white;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }

        /* Option Chips */
        .option-chips {
          display: flex;
          gap: 6px;
        }
        .option-chip {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 10px 14px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s;
          font-family: var(--font-sans);
          min-width: 80px;
        }
        .option-chip:hover {
          border-color: var(--border-hover);
          background: var(--bg-card-hover);
        }
        .option-chip--active {
          border-color: var(--accent);
          background: var(--accent-subtle);
        }
        .option-chip__label {
          font-size: var(--text-xs);
          font-weight: 600;
          color: var(--text-primary);
        }
        .option-chip__desc {
          font-size: 10px;
          color: var(--text-muted);
        }
        .option-chip--active .option-chip__label {
          color: var(--accent-light);
        }

        @media (max-width: 768px) {
          .settings-row {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--space-md);
          }
          .color-picker { flex-wrap: wrap; }
          .option-chips { flex-wrap: wrap; }
        }
      `}</style>
        </div>
    );
}

import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
    return (
        <div role="alert" style={{ padding: 20, background: '#331111', color: 'white' }}>
            <p>Something went wrong:</p>
            <pre style={{ color: 'red' }}>{error.message}</pre>
            <button onClick={resetErrorBoundary}>Try again</button>
        </div>
    );
}

export default function SettingsModuleWrapper(props) {
    return (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
            <SettingsModule {...props} />
        </ErrorBoundary>
    );
}
