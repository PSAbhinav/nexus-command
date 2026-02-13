import { useMemo } from 'react';
import { formatCurrency, getTodayKey } from '../../utils/storage';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Tooltip, Legend);

const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#8b95b0', font: { size: 11, family: 'Space Grotesk' } } }, tooltip: { backgroundColor: '#151a32', titleColor: '#e8ecf4', bodyColor: '#8b95b0', borderColor: 'rgba(255,255,255,0.06)', borderWidth: 1, padding: 10, cornerRadius: 8 } },
    scales: { x: { ticks: { color: '#4e5775' }, grid: { color: 'rgba(255,255,255,0.03)' } }, y: { ticks: { color: '#4e5775' }, grid: { color: 'rgba(255,255,255,0.03)' } } }
};

export default function AnalyticsModule({ data, settings }) {
    const { finance, tasks, health, goals } = data;
    const sym = settings?.currencySymbol || '$';

    const monthlyFinance = useMemo(() => {
        const labels = []; const inc = []; const exp = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(); d.setMonth(d.getMonth() - i);
            const key = d.toISOString().slice(0, 7);
            labels.push(d.toLocaleDateString('en-US', { month: 'short' }));
            const txns = (finance?.transactions || []).filter(t => t.date?.startsWith(key));
            inc.push(txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0));
            exp.push(txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0));
        }
        return {
            labels, datasets: [
                { label: 'Income', data: inc, backgroundColor: 'rgba(0,230,118,0.5)', borderColor: '#00e676', borderWidth: 1, borderRadius: 6 },
                { label: 'Expenses', data: exp, backgroundColor: 'rgba(255,82,82,0.5)', borderColor: '#ff5252', borderWidth: 1, borderRadius: 6 }
            ]
        };
    }, [finance]);

    const taskCompletion = useMemo(() => {
        const labels = []; const completed = []; const created = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
            completed.push((tasks?.items || []).filter(t => t.completedAt?.startsWith(key)).length);
            created.push((tasks?.items || []).filter(t => t.createdAt?.startsWith(key)).length);
        }
        return {
            labels, datasets: [
                { label: 'Completed', data: completed, borderColor: '#00e676', backgroundColor: 'rgba(0,230,118,0.08)', fill: true, tension: 0.4 },
                { label: 'Created', data: created, borderColor: '#00d4aa', backgroundColor: 'rgba(0,212,170,0.08)', fill: true, tension: 0.4 }
            ]
        };
    }, [tasks]);

    const healthTrend = useMemo(() => {
        const labels = []; const mood = []; const sleep = [];
        for (let i = 13; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            const entry = (health?.entries || []).find(e => e.date === key);
            mood.push(entry?.mood || null);
            sleep.push(entry?.sleep || null);
        }
        return {
            labels, datasets: [
                { label: 'Mood', data: mood, borderColor: '#ffab40', backgroundColor: 'rgba(255,171,64,0.08)', fill: true, tension: 0.4, yAxisID: 'y' },
                { label: 'Sleep (hrs)', data: sleep, borderColor: '#a855f7', backgroundColor: 'rgba(120,0,255,0.08)', fill: true, tension: 0.4, yAxisID: 'y1' }
            ]
        };
    }, [health]);

    const healthChartOpts = { ...chartOpts, scales: { ...chartOpts.scales, y: { ...chartOpts.scales.y, position: 'left', title: { display: true, text: 'Mood', color: '#4e5775' } }, y1: { position: 'right', ticks: { color: '#4e5775' }, grid: { drawOnChartArea: false }, title: { display: true, text: 'Sleep', color: '#4e5775' } }, x: { ticks: { color: '#4e5775', maxRotation: 45 }, grid: { display: false } } } };

    const expenseCategories = useMemo(() => {
        const grouped = {};
        (finance?.transactions || []).filter(t => t.type === 'expense').forEach(t => { grouped[t.category] = (grouped[t.category] || 0) + t.amount; });
        const cats = finance?.categories || [];
        const labels = Object.keys(grouped).map(k => cats.find(c => c.id === k)?.name || k);
        const values = Object.values(grouped);
        const colors = ['#00d4aa', '#00e676', '#ffab40', '#ff5252', '#40c4ff', '#a855f7', '#ff4d6a', '#00f5c8'];
        return { labels, datasets: [{ data: values, backgroundColor: colors.slice(0, values.length).map(c => c + '55'), borderColor: colors.slice(0, values.length), borderWidth: 2 }] };
    }, [finance]);

    const summary = useMemo(() => {
        const totalIncome = (finance?.transactions || []).filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const totalExpenses = (finance?.transactions || []).filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const tasksDone = (tasks?.items || []).filter(t => t.completed).length;
        const tasksTotal = (tasks?.items || []).length;
        const goalsCompleted = (goals?.items || []).filter(g => g.completed).length;
        const avgMood = (health?.entries || []).length ? ((health?.entries || []).reduce((s, e) => s + (e.mood || 0), 0) / (health?.entries || []).length).toFixed(1) : '--';
        return { totalIncome, totalExpenses, tasksDone, tasksTotal, goalsCompleted, avgMood };
    }, [finance, tasks, goals, health]);

    return (
        <div>
            <div className="section-header"><div><h1 className="section-title" style={{ fontSize: 'var(--text-2xl)' }}>Analytics</h1><p className="section-subtitle">Deep insights across all modules</p></div></div>

            <div className="grid-4" style={{ marginBottom: 'var(--space-xl)' }}>
                <div className="card stat-card"><div className="stat-card__label">Total Income</div><div className="stat-card__value" style={{ fontSize: 'var(--text-lg)' }}>{formatCurrency(summary.totalIncome, sym)}</div></div>
                <div className="card stat-card"><div className="stat-card__label">Task Rate</div><div className="stat-card__value">{summary.tasksTotal ? Math.round(summary.tasksDone / summary.tasksTotal * 100) : 0}%</div></div>
                <div className="card stat-card"><div className="stat-card__label">Avg Mood</div><div className="stat-card__value">{summary.avgMood}</div></div>
                <div className="card stat-card"><div className="stat-card__label">Goals Done</div><div className="stat-card__value">{summary.goalsCompleted}</div></div>
            </div>

            <div className="grid-2" style={{ marginBottom: 'var(--space-xl)' }}>
                <div className="card card--static" style={{ padding: 'var(--space-xl)' }}>
                    <h3 className="section-title" style={{ marginBottom: 'var(--space-md)' }}>Income vs Expenses (6 months)</h3>
                    <div style={{ height: 250 }}><Bar data={monthlyFinance} options={chartOpts} /></div>
                </div>
                <div className="card card--static" style={{ padding: 'var(--space-xl)' }}>
                    <h3 className="section-title" style={{ marginBottom: 'var(--space-md)' }}>Task Activity (7 days)</h3>
                    <div style={{ height: 250 }}><Line data={taskCompletion} options={chartOpts} /></div>
                </div>
            </div>

            <div className="grid-2">
                <div className="card card--static" style={{ padding: 'var(--space-xl)' }}>
                    <h3 className="section-title" style={{ marginBottom: 'var(--space-md)' }}>Mood vs Sleep (14 days)</h3>
                    <div style={{ height: 250 }}><Line data={healthTrend} options={healthChartOpts} /></div>
                </div>
                <div className="card card--static" style={{ padding: 'var(--space-xl)' }}>
                    <h3 className="section-title" style={{ marginBottom: 'var(--space-md)' }}>All-Time Expense Categories</h3>
                    <div style={{ height: 250 }}>{expenseCategories.labels.length > 0 ? <Doughnut data={expenseCategories} options={{ ...chartOpts, cutout: '65%', scales: undefined }} /> : <div className="empty-state"><p className="empty-state__text">No expense data</p></div>}</div>
                </div>
            </div>
        </div>
    );
}
