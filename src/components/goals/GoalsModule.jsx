import { useState, useMemo } from 'react';
import { generateId, getTodayKey } from '../../utils/storage';
import { Plus, X, Trash2, Edit3, Check, Flame, Trophy, Target, CircleDot, BarChart3 } from 'lucide-react';
import ModalPortal from '../layout/ModalPortal';

export default function GoalsModule({ data, onUpdate }) {
    const [tab, setTab] = useState('goals');
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [formData, setFormData] = useState({ title: '', description: '', category: 'personal', targetDate: '', milestones: '' });
    const [habitForm, setHabitForm] = useState({ title: '', frequency: 'daily', category: 'health' });
    const [showHabitForm, setShowHabitForm] = useState(false);

    const goals = data?.items || [];
    const habits = data?.habits || [];
    const streaks = data?.streaks || {};
    const todayKey = getTodayKey();

    const habitStats = useMemo(() => {
        return habits.map(h => {
            const s = streaks[h.id] || { dates: [] };
            const dates = s.dates || [];
            const isDoneToday = dates.includes(todayKey);
            let currentStreak = 0;
            const d = new Date();
            for (let i = 0; i < 365; i++) {
                const key = d.toISOString().split('T')[0];
                if (dates.includes(key)) { currentStreak++; d.setDate(d.getDate() - 1); }
                else break;
            }
            if (!isDoneToday && currentStreak > 0) currentStreak--;
            return { ...h, isDoneToday, currentStreak, totalDays: dates.length };
        });
    }, [habits, streaks, todayKey]);

    const toggleHabit = (habitId) => {
        const s = { ...streaks };
        if (!s[habitId]) s[habitId] = { dates: [] };
        const dates = [...s[habitId].dates];
        const idx = dates.indexOf(todayKey);
        if (idx >= 0) dates.splice(idx, 1); else dates.push(todayKey);
        s[habitId] = { ...s[habitId], dates };
        onUpdate({ ...data, streaks: s });
    };

    const addGoal = (e) => {
        e.preventDefault();
        const goal = { id: editItem?.id || generateId(), ...formData, completed: false, progress: editItem?.progress || 0, createdAt: editItem?.createdAt || new Date().toISOString() };
        onUpdate({ ...data, items: editItem ? goals.map(g => g.id === editItem.id ? goal : g) : [...goals, goal] });
        setFormData({ title: '', description: '', category: 'personal', targetDate: '', milestones: '' });
        setEditItem(null); setShowForm(false);
    };

    const addHabit = (e) => {
        e.preventDefault();
        onUpdate({ ...data, habits: [...habits, { id: generateId(), ...habitForm, createdAt: new Date().toISOString() }] });
        setHabitForm({ title: '', frequency: 'daily', category: 'health' }); setShowHabitForm(false);
    };

    const deleteGoal = (id) => onUpdate({ ...data, items: goals.filter(g => g.id !== id) });
    const deleteHabit = (id) => { const s = { ...streaks }; delete s[id]; onUpdate({ ...data, habits: habits.filter(h => h.id !== id), streaks: s }); };
    const updateProgress = (id, val) => onUpdate({ ...data, items: goals.map(g => g.id === id ? { ...g, progress: val, completed: val >= 100 } : g) });

    const categoryColors = { personal: 'accent', financial: 'green', health: 'orange', career: 'blue', education: 'purple' };

    return (
        <div>
            <div className="section-header">
                <div><h1 className="section-title" style={{ fontSize: 'var(--text-2xl)' }}>Goals & Habits</h1><p className="section-subtitle">Build consistency, achieve greatness</p></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                    <div className="tabs">
                        <button className={`tab ${tab === 'goals' ? 'tab--active' : ''}`} onClick={() => setTab('goals')}><Target size={14} /> Goals</button>
                        <button className={`tab ${tab === 'habits' ? 'tab--active' : ''}`} onClick={() => setTab('habits')}><Flame size={14} /> Habits</button>
                    </div>
                    <button className="btn btn-primary" onClick={() => tab === 'goals' ? setShowForm(true) : setShowHabitForm(true)}><Plus size={16} /> Add {tab === 'goals' ? 'Goal' : 'Habit'}</button>
                </div>
            </div>

            {tab === 'goals' && (
                <div>
                    <div className="grid-4" style={{ marginBottom: 'var(--space-xl)' }}>
                        <div className="card stat-card">
                            <div className="stat-card__icon stat-card__icon--accent"><Target size={18} /></div>
                            <div className="stat-card__label">Active Goals</div>
                            <div className="stat-card__value">{goals.filter(g => !g.completed).length}</div>
                        </div>
                        <div className="card stat-card">
                            <div className="stat-card__icon stat-card__icon--success"><Trophy size={18} /></div>
                            <div className="stat-card__label">Completed</div>
                            <div className="stat-card__value" style={{ color: 'var(--success)' }}>{goals.filter(g => g.completed).length}</div>
                        </div>
                        <div className="card stat-card">
                            <div className="stat-card__icon stat-card__icon--info"><BarChart3 size={18} /></div>
                            <div className="stat-card__label">Avg Progress</div>
                            <div className="stat-card__value">{goals.length ? Math.round(goals.reduce((s, g) => s + (g.progress || 0), 0) / goals.length) : 0}%</div>
                        </div>
                        <div className="card stat-card">
                            <div className="stat-card__icon stat-card__icon--warning"><CircleDot size={18} /></div>
                            <div className="stat-card__label">Completion Rate</div>
                            <div className="stat-card__value">{goals.length ? Math.round(goals.filter(g => g.completed).length / goals.length * 100) : 0}%</div>
                        </div>
                    </div>

                    {goals.length === 0 ? <div className="card card--static"><div className="empty-state"><p className="empty-state__text">No goals yet. Set your first goal!</p></div></div> :
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            {goals.map(goal => (
                                <div key={goal.id} className="card" style={{ padding: 'var(--space-xl)' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 4 }}>
                                                <span className={`badge badge--${categoryColors[goal.category] || 'accent'}`}>{goal.category}</span>
                                                {goal.completed && <span className="badge badge--green"><Trophy size={12} /> Done</span>}
                                            </div>
                                            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>{goal.title}</h3>
                                            {goal.description && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 4 }}>{goal.description}</p>}
                                            {goal.targetDate && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4 }}>Target: {new Date(goal.targetDate).toLocaleDateString()}</p>}
                                        </div>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <button className="btn-icon" onClick={() => { setFormData({ title: goal.title, description: goal.description || '', category: goal.category, targetDate: goal.targetDate || '', milestones: goal.milestones || '' }); setEditItem(goal); setShowForm(true); }}><Edit3 size={14} /></button>
                                            <button className="btn-icon" onClick={() => deleteGoal(goal.id)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                        <div className="progress-bar" style={{ flex: 1 }}><div className="progress-bar__fill" style={{ width: `${goal.progress || 0}%` }} /></div>
                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--accent-light)', minWidth: 40 }}>{goal.progress || 0}%</span>
                                    </div>
                                    <input type="range" min="0" max="100" value={goal.progress || 0} style={{ width: '100%', accentColor: 'var(--accent)', marginTop: 8 }} onChange={e => updateProgress(goal.id, parseInt(e.target.value))} />
                                </div>
                            ))}
                        </div>
                    }
                </div>
            )}

            {tab === 'habits' && (
                <div>
                    <div className="grid-4" style={{ marginBottom: 'var(--space-xl)' }}>
                        <div className="card stat-card">
                            <div className="stat-card__icon stat-card__icon--accent"><Flame size={18} /></div>
                            <div className="stat-card__label">Total Habits</div>
                            <div className="stat-card__value">{habits.length}</div>
                        </div>
                        <div className="card stat-card">
                            <div className="stat-card__icon stat-card__icon--success"><Check size={18} /></div>
                            <div className="stat-card__label">Done Today</div>
                            <div className="stat-card__value" style={{ color: 'var(--success)' }}>{habitStats.filter(h => h.isDoneToday).length}/{habits.length}</div>
                        </div>
                        <div className="card stat-card">
                            <div className="stat-card__icon stat-card__icon--warning"><Flame size={18} /></div>
                            <div className="stat-card__label">Best Streak</div>
                            <div className="stat-card__value">{Math.max(0, ...habitStats.map(h => h.currentStreak))} 🔥</div>
                        </div>
                        <div className="card stat-card">
                            <div className="stat-card__icon stat-card__icon--info"><BarChart3 size={18} /></div>
                            <div className="stat-card__label">Today's Progress</div>
                            <div className="stat-card__value">{habits.length ? Math.round(habitStats.filter(h => h.isDoneToday).length / habits.length * 100) : 0}%</div>
                        </div>
                    </div>

                    {habits.length === 0 ? <div className="card card--static"><div className="empty-state"><p className="empty-state__text">No habits yet. Build your routine!</p></div></div> :
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                            {habitStats.map(habit => (
                                <div key={habit.id} className="card" style={{ padding: '12px var(--space-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)', cursor: 'pointer' }} onClick={() => toggleHabit(habit.id)}>
                                    <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', border: `2px solid ${habit.isDoneToday ? 'var(--success)' : 'var(--border-hover)'}`, background: habit.isDoneToday ? 'var(--success-subtle)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}>
                                        {habit.isDoneToday && <Check size={16} color="var(--success)" />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, textDecoration: habit.isDoneToday ? 'line-through' : 'none', opacity: habit.isDoneToday ? 0.5 : 1 }}>{habit.title}</div>
                                        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 4 }}>
                                            <span className="badge badge--accent">{habit.frequency}</span>
                                            <span className="badge badge--orange"><Flame size={10} /> {habit.currentStreak} streak</span>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{habit.totalDays} total</div>
                                    <button className="btn-icon" onClick={e => { e.stopPropagation(); deleteHabit(habit.id); }} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                                </div>
                            ))}
                        </div>
                    }
                </div>
            )}

            {showForm && (
                <ModalPortal onClose={() => { setShowForm(false); setEditItem(null); }}>
                    <div className="modal">
                        <div className="modal__header"><h3 className="modal__title">{editItem ? 'Edit' : 'New'} Goal</h3><button className="btn-icon" onClick={() => { setShowForm(false); setEditItem(null); }}><X size={18} /></button></div>
                        <form onSubmit={addGoal}>
                            <div className="modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                <div className="input-group"><label className="input-label">Title</label><input type="text" className="input-field" placeholder="What do you want to achieve?" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} required autoFocus /></div>
                                <div className="input-group"><label className="input-label">Description</label><textarea className="input-field" placeholder="Why is this important?" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} /></div>
                                <div className="grid-2">
                                    <div className="input-group"><label className="input-label">Category</label><select className="input-field" value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}><option value="personal">Personal</option><option value="financial">Financial</option><option value="health">Health</option><option value="career">Career</option><option value="education">Education</option></select></div>
                                    <div className="input-group"><label className="input-label">Target Date</label><input type="date" className="input-field" value={formData.targetDate} onChange={e => setFormData(p => ({ ...p, targetDate: e.target.value }))} /></div>
                                </div>
                            </div>
                            <div className="modal__footer"><button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditItem(null); }}>Cancel</button><button type="submit" className="btn btn-primary">{editItem ? 'Update' : 'Create'}</button></div>
                        </form>
                    </div>
                </ModalPortal>
            )}

            {showHabitForm && (
                <ModalPortal onClose={() => setShowHabitForm(false)}>
                    <div className="modal">
                        <div className="modal__header"><h3 className="modal__title">New Habit</h3><button className="btn-icon" onClick={() => setShowHabitForm(false)}><X size={18} /></button></div>
                        <form onSubmit={addHabit}>
                            <div className="modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                <div className="input-group"><label className="input-label">Habit Name</label><input type="text" className="input-field" placeholder="e.g. Read 30 minutes" value={habitForm.title} onChange={e => setHabitForm(p => ({ ...p, title: e.target.value }))} required autoFocus /></div>
                                <div className="grid-2">
                                    <div className="input-group"><label className="input-label">Frequency</label><select className="input-field" value={habitForm.frequency} onChange={e => setHabitForm(p => ({ ...p, frequency: e.target.value }))}><option value="daily">Daily</option><option value="weekly">Weekly</option></select></div>
                                    <div className="input-group"><label className="input-label">Category</label><select className="input-field" value={habitForm.category} onChange={e => setHabitForm(p => ({ ...p, category: e.target.value }))}><option value="health">Health</option><option value="productivity">Productivity</option><option value="learning">Learning</option><option value="mindfulness">Mindfulness</option></select></div>
                                </div>
                            </div>
                            <div className="modal__footer"><button type="button" className="btn btn-secondary" onClick={() => setShowHabitForm(false)}>Cancel</button><button type="submit" className="btn btn-primary">Create Habit</button></div>
                        </form>
                    </div>
                </ModalPortal>
            )}
        </div>
    );
}
