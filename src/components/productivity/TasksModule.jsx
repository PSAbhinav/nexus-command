import { useState, useMemo, useEffect, useRef } from 'react';
import { generateId, getTodayKey } from '../../utils/storage';
import { Plus, Trash2, Edit3, Check, Clock, AlertCircle, X, Play, Pause, RotateCcw, ListTodo, CheckCircle2, CircleDot, Minus, Timer } from 'lucide-react';
import ModalPortal from '../layout/ModalPortal';

const TIMER_PRESETS = [15, 25, 30, 45, 60];

export default function TasksModule({ data, onUpdate }) {
    const [showForm, setShowForm] = useState(false);
    const [editTask, setEditTask] = useState(null);
    const [filter, setFilter] = useState('active');
    const [formData, setFormData] = useState({ title: '', description: '', priority: 'medium', dueDate: '', project: '' });
    const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
    const [pomodoroActive, setPomodoroActive] = useState(false);
    const [pomodoroMode, setPomodoroMode] = useState('work');
    const [pomodoroSetting, setPomodoroSetting] = useState(25);
    const timerRef = useRef(null);

    const items = data?.items || [];
    const today = new Date();

    useEffect(() => {
        if (pomodoroActive) {
            timerRef.current = setInterval(() => {
                setPomodoroTime(prev => {
                    if (prev <= 1) {
                        setPomodoroActive(false);
                        const nextMode = pomodoroMode === 'work' ? 'break' : 'work';
                        setPomodoroMode(nextMode);
                        return nextMode === 'break' ? 5 * 60 : pomodoroSetting * 60;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [pomodoroActive, pomodoroMode, pomodoroSetting]);

    const filteredTasks = useMemo(() => {
        switch (filter) {
            case 'active': return items.filter(t => !t.completed);
            case 'completed': return items.filter(t => t.completed);
            default: return items;
        }
    }, [items, filter]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const task = { id: editTask?.id || generateId(), ...formData, completed: editTask?.completed || false, createdAt: editTask?.createdAt || new Date().toISOString() };
        onUpdate({ ...data, items: editTask ? items.map(t => t.id === editTask.id ? task : t) : [...items, task] });
        setFormData({ title: '', description: '', priority: 'medium', dueDate: '', project: '' }); setEditTask(null); setShowForm(false);
    };

    const toggleComplete = (id) => {
        onUpdate({ ...data, items: items.map(t => t.id === id ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : null } : t) });
    };

    const deleteTask = (id) => onUpdate({ ...data, items: items.filter(t => t.id !== id) });
    const mins = Math.floor(pomodoroTime / 60);
    const secs = pomodoroTime % 60;
    const priorityColors = { high: 'red', medium: 'orange', low: 'accent' };

    const activeCount = items.filter(t => !t.completed).length;
    const completedCount = items.filter(t => t.completed).length;

    const closeForm = () => { setShowForm(false); setEditTask(null); };

    const adjustTimer = (delta) => {
        if (pomodoroActive) return;
        const newVal = Math.max(1, Math.min(120, pomodoroSetting + delta));
        setPomodoroSetting(newVal);
        setPomodoroTime(newVal * 60);
    };

    const selectPreset = (minutes) => {
        if (pomodoroActive) return;
        setPomodoroSetting(minutes);
        setPomodoroTime(minutes * 60);
    };

    return (
        <div>
            <div className="section-header">
                <div><h1 className="section-title" style={{ fontSize: 'var(--text-2xl)' }}>Tasks</h1><p className="section-subtitle">Stay organized and productive</p></div>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Add Task</button>
            </div>

            <div className="grid-4" style={{ marginBottom: 'var(--space-xl)' }}>
                <div className="card stat-card">
                    <div className="stat-card__icon stat-card__icon--accent"><ListTodo size={18} /></div>
                    <div className="stat-card__label">Total Tasks</div>
                    <div className="stat-card__value">{items.length}</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-card__icon stat-card__icon--warning"><CircleDot size={18} /></div>
                    <div className="stat-card__label">Active</div>
                    <div className="stat-card__value">{activeCount}</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-card__icon stat-card__icon--success"><CheckCircle2 size={18} /></div>
                    <div className="stat-card__label">Completed</div>
                    <div className="stat-card__value" style={{ color: 'var(--success)' }}>{completedCount}</div>
                </div>

                {/* Pomodoro Timer */}
                <div className="card stat-card" style={{ alignItems: 'center', textAlign: 'center' }}>
                    <div className="stat-card__label">{pomodoroMode === 'work' ? '🎯 Focus Timer' : '☕ Break Time'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        {!pomodoroActive && <button className="btn-icon" onClick={() => adjustTimer(-5)} title="-5 min"><Minus size={14} /></button>}
                        <div className="stat-card__value" style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xl)' }}>{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</div>
                        {!pomodoroActive && <button className="btn-icon" onClick={() => adjustTimer(5)} title="+5 min"><Plus size={14} /></button>}
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-xs)', marginTop: 4 }}>
                        <button className="btn-icon" onClick={() => setPomodoroActive(!pomodoroActive)}>{pomodoroActive ? <Pause size={16} /> : <Play size={16} />}</button>
                        <button className="btn-icon" onClick={() => { setPomodoroActive(false); setPomodoroTime(pomodoroSetting * 60); }}><RotateCcw size={16} /></button>
                    </div>
                    {!pomodoroActive && (
                        <div style={{ display: 'flex', gap: 3, marginTop: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                            {TIMER_PRESETS.map(p => (
                                <button key={p} onClick={() => selectPreset(p)} style={{
                                    padding: '2px 8px', fontSize: '10px', fontWeight: 600, fontFamily: 'var(--font-sans)',
                                    borderRadius: 'var(--radius-full)', border: '1px solid',
                                    borderColor: pomodoroSetting === p ? 'var(--accent)' : 'var(--border)',
                                    background: pomodoroSetting === p ? 'var(--accent-subtle)' : 'transparent',
                                    color: pomodoroSetting === p ? 'var(--accent-light)' : 'var(--text-muted)',
                                    cursor: 'pointer', transition: 'all 0.15s'
                                }}>{p}m</button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="section-header">
                <h2 className="section-title">Task List</h2>
                <div className="tabs">
                    {['active', 'completed', 'all'].map(f => (
                        <button key={f} className={`tab ${filter === f ? 'tab--active' : ''}`} onClick={() => setFilter(f)}>
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {filteredTasks.length === 0
                ? <div className="card card--static"><div className="empty-state"><p className="empty-state__text">No tasks found. Add one to get started!</p></div></div>
                : <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                    {filteredTasks.map(task => {
                        const overdue = !task.completed && task.dueDate && new Date(task.dueDate) < today;
                        return (
                            <div key={task.id} className="card" style={{ padding: '14px var(--space-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                <button className="btn-icon" onClick={() => toggleComplete(task.id)} style={{ border: `2px solid ${task.completed ? 'var(--success)' : 'var(--border-hover)'}`, borderRadius: 'var(--radius-sm)', width: 24, height: 24, background: task.completed ? 'var(--success-subtle)' : 'transparent', flexShrink: 0 }}>
                                    {task.completed && <Check size={14} color="var(--success)" />}
                                </button>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, textDecoration: task.completed ? 'line-through' : 'none', opacity: task.completed ? 0.5 : 1 }}>{task.title}</div>
                                    <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 4, flexWrap: 'wrap' }}>
                                        <span className={`badge badge--${priorityColors[task.priority] || 'accent'}`}>{task.priority}</span>
                                        {task.project && <span className="badge badge--purple">{task.project}</span>}
                                        {overdue && <span className="badge badge--red"><AlertCircle size={10} /> Overdue</span>}
                                        {task.dueDate && <span style={{ fontSize: 'var(--text-xs)', color: overdue ? 'var(--danger)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={11} /> {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 4 }}>
                                    <button className="btn-icon" onClick={() => { setFormData({ title: task.title, description: task.description || '', priority: task.priority, dueDate: task.dueDate || '', project: task.project || '' }); setEditTask(task); setShowForm(true); }}><Edit3 size={14} /></button>
                                    <button className="btn-icon" onClick={() => deleteTask(task.id)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            }

            {showForm && (
                <ModalPortal onClose={closeForm}>
                    <div className="modal">
                        <div className="modal__header"><h3 className="modal__title">{editTask ? 'Edit Task' : 'New Task'}</h3><button className="btn-icon" onClick={closeForm}><X size={18} /></button></div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                <div className="input-group"><label className="input-label">Title</label><input type="text" className="input-field" placeholder="What needs to be done?" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} required autoFocus /></div>
                                <div className="input-group"><label className="input-label">Description</label><textarea className="input-field" placeholder="Add details..." value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} /></div>
                                <div className="grid-2">
                                    <div className="input-group"><label className="input-label">Priority</label><select className="input-field" value={formData.priority} onChange={e => setFormData(p => ({ ...p, priority: e.target.value }))}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
                                    <div className="input-group"><label className="input-label">Due Date</label><input type="date" className="input-field" value={formData.dueDate} onChange={e => setFormData(p => ({ ...p, dueDate: e.target.value }))} /></div>
                                </div>
                                <div className="input-group"><label className="input-label">Project</label><input type="text" className="input-field" placeholder="Optional project name" value={formData.project} onChange={e => setFormData(p => ({ ...p, project: e.target.value }))} /></div>
                            </div>
                            <div className="modal__footer"><button type="button" className="btn btn-secondary" onClick={closeForm}>Cancel</button><button type="submit" className="btn btn-primary">{editTask ? 'Update' : 'Add Task'}</button></div>
                        </form>
                    </div>
                </ModalPortal>
            )}
        </div>
    );
}
