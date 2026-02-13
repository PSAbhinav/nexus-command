import { useState, useMemo } from 'react';
import { generateId, getTodayKey } from '../../utils/storage';
import { Plus, X, Droplets, Moon, Smile, Footprints, Weight } from 'lucide-react';
import ModalPortal from '../layout/ModalPortal';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1c1e2a', titleColor: '#f0f1f5', bodyColor: '#9ca3b4', borderColor: 'rgba(255,255,255,0.06)', borderWidth: 1, padding: 8, cornerRadius: 8 } },
    scales: { x: { ticks: { color: '#5c6378', font: { size: 10 } }, grid: { display: false } }, y: { ticks: { color: '#5c6378' }, grid: { color: 'rgba(255,255,255,0.03)' } } }
};

export default function HealthModule({ data, onUpdate }) {
    const [showLog, setShowLog] = useState(false);
    const todayKey = getTodayKey();
    const entries = data?.entries || [];
    const settings = data?.settings || { waterGoal: 8, sleepGoal: 8 };

    const todayEntry = useMemo(() => entries.find(e => e.date === todayKey) || { date: todayKey, water: 0, sleep: null, mood: null, steps: null, weight: null, exercise: '', notes: '' }, [entries, todayKey]);

    const updateToday = (field, value) => {
        const updated = { ...todayEntry, [field]: value };
        const exists = entries.find(e => e.date === todayKey);
        onUpdate({ ...data, entries: exists ? entries.map(e => e.date === todayKey ? updated : e) : [...entries, updated] });
    };

    const addWater = () => updateToday('water', (todayEntry.water || 0) + 1);

    const last7 = useMemo(() => {
        const result = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            const entry = entries.find(e => e.date === key);
            result.push({ date: key, label: d.toLocaleDateString('en-US', { weekday: 'short' }), ...entry });
        }
        return result;
    }, [entries]);

    const waterChart = { labels: last7.map(d => d.label), datasets: [{ data: last7.map(d => d.water || 0), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.08)', fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: '#3b82f6' }] };
    const sleepChart = { labels: last7.map(d => d.label), datasets: [{ data: last7.map(d => d.sleep || null), borderColor: '#a855f7', backgroundColor: 'rgba(168,85,247,0.08)', fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: '#a855f7' }] };
    const moodChart = { labels: last7.map(d => d.label), datasets: [{ data: last7.map(d => d.mood || null), borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.08)', fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: '#f59e0b' }] };
    const stepsChart = { labels: last7.map(d => d.label), datasets: [{ data: last7.map(d => d.steps || null), borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.08)', fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: '#22c55e' }] };

    const [logData, setLogData] = useState({ sleep: '', mood: '', steps: '', weight: '', exercise: '', notes: '' });

    const saveLog = (e) => {
        e.preventDefault();
        const updated = { ...todayEntry };
        if (logData.sleep) updated.sleep = parseFloat(logData.sleep);
        if (logData.mood) updated.mood = parseInt(logData.mood);
        if (logData.steps) updated.steps = parseInt(logData.steps);
        if (logData.weight) updated.weight = parseFloat(logData.weight);
        if (logData.exercise) updated.exercise = logData.exercise;
        if (logData.notes) updated.notes = logData.notes;
        const exists = entries.find(e => e.date === todayKey);
        onUpdate({ ...data, entries: exists ? entries.map(e => e.date === todayKey ? updated : e) : [...entries, updated] });
        setLogData({ sleep: '', mood: '', steps: '', weight: '', exercise: '', notes: '' });
        setShowLog(false);
    };

    const waterPct = Math.min(100, Math.round((todayEntry.water / settings.waterGoal) * 100));

    return (
        <div>
            <div className="section-header">
                <div><h1 className="section-title" style={{ fontSize: 'var(--text-2xl)' }}>Health & Wellness</h1><p className="section-subtitle">Track your daily health metrics</p></div>
                <button className="btn btn-primary" onClick={() => setShowLog(true)}><Plus size={16} /> Log Today</button>
            </div>

            <div className="grid-4" style={{ marginBottom: 'var(--space-xl)' }}>
                <div className="card stat-card" style={{ cursor: 'pointer' }} onClick={addWater}>
                    <div className="stat-card__icon stat-card__icon--info"><Droplets size={18} /></div>
                    <div className="stat-card__label">Water</div>
                    <div className="stat-card__value">{todayEntry.water}<span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontWeight: 400 }}>/{settings.waterGoal}</span></div>
                    <div className="progress-bar"><div className="progress-bar__fill" style={{ width: `${waterPct}%`, background: 'var(--info)' }} /></div>
                    <div className="stat-card__subtitle" style={{ marginTop: 4 }}>Tap to add a glass</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-card__icon stat-card__icon--accent" style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}><Moon size={18} /></div>
                    <div className="stat-card__label">Sleep</div>
                    <div className="stat-card__value">{todayEntry.sleep ?? '--'}<span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontWeight: 400 }}> hrs</span></div>
                </div>
                <div className="card stat-card">
                    <div className="stat-card__icon stat-card__icon--warning"><Smile size={18} /></div>
                    <div className="stat-card__label">Mood</div>
                    <div className="stat-card__value">{todayEntry.mood ?? '--'}<span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontWeight: 400 }}>/10</span></div>
                </div>
                <div className="card stat-card">
                    <div className="stat-card__icon stat-card__icon--success"><Footprints size={18} /></div>
                    <div className="stat-card__label">Steps</div>
                    <div className="stat-card__value">{todayEntry.steps?.toLocaleString() ?? '--'}</div>
                </div>
            </div>

            <div className="grid-2" style={{ marginBottom: 'var(--space-xl)' }}>
                <div className="card card--static" style={{ padding: 'var(--space-xl)' }}><h3 className="section-title" style={{ marginBottom: 'var(--space-md)' }}>Water (7 days)</h3><div style={{ height: 180 }}><Line data={waterChart} options={chartOpts} /></div></div>
                <div className="card card--static" style={{ padding: 'var(--space-xl)' }}><h3 className="section-title" style={{ marginBottom: 'var(--space-md)' }}>Sleep (7 days)</h3><div style={{ height: 180 }}><Line data={sleepChart} options={chartOpts} /></div></div>
            </div>
            <div className="grid-2">
                <div className="card card--static" style={{ padding: 'var(--space-xl)' }}><h3 className="section-title" style={{ marginBottom: 'var(--space-md)' }}>Mood (7 days)</h3><div style={{ height: 180 }}><Line data={moodChart} options={chartOpts} /></div></div>
                <div className="card card--static" style={{ padding: 'var(--space-xl)' }}><h3 className="section-title" style={{ marginBottom: 'var(--space-md)' }}>Steps (7 days)</h3><div style={{ height: 180 }}><Line data={stepsChart} options={chartOpts} /></div></div>
            </div>

            {showLog && (
                <ModalPortal onClose={() => setShowLog(false)}>
                    <div className="modal">
                        <div className="modal__header"><h3 className="modal__title">Log Today</h3><button className="btn-icon" onClick={() => setShowLog(false)}><X size={18} /></button></div>
                        <form onSubmit={saveLog}>
                            <div className="modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                <div className="grid-2">
                                    <div className="input-group"><label className="input-label">Sleep (hours)</label><input type="number" className="input-field" step="0.5" min="0" max="24" placeholder="8" value={logData.sleep} onChange={e => setLogData(p => ({ ...p, sleep: e.target.value }))} /></div>
                                    <div className="input-group"><label className="input-label">Mood (1-10)</label><input type="number" className="input-field" min="1" max="10" placeholder="7" value={logData.mood} onChange={e => setLogData(p => ({ ...p, mood: e.target.value }))} /></div>
                                </div>
                                <div className="grid-2">
                                    <div className="input-group"><label className="input-label">Steps</label><input type="number" className="input-field" min="0" placeholder="10000" value={logData.steps} onChange={e => setLogData(p => ({ ...p, steps: e.target.value }))} /></div>
                                    <div className="input-group"><label className="input-label">Weight</label><input type="number" className="input-field" step="0.1" min="0" placeholder="kg/lbs" value={logData.weight} onChange={e => setLogData(p => ({ ...p, weight: e.target.value }))} /></div>
                                </div>
                                <div className="input-group"><label className="input-label">Exercise</label><input type="text" className="input-field" placeholder="e.g. 30 min run" value={logData.exercise} onChange={e => setLogData(p => ({ ...p, exercise: e.target.value }))} /></div>
                                <div className="input-group"><label className="input-label">Notes</label><textarea className="input-field" placeholder="How are you feeling?" value={logData.notes} onChange={e => setLogData(p => ({ ...p, notes: e.target.value }))} /></div>
                            </div>
                            <div className="modal__footer"><button type="button" className="btn btn-secondary" onClick={() => setShowLog(false)}>Cancel</button><button type="submit" className="btn btn-primary">Save Entry</button></div>
                        </form>
                    </div>
                </ModalPortal>
            )}
        </div>
    );
}
