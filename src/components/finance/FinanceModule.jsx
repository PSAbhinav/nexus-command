import { useState, useMemo } from 'react';
import { formatCurrency, generateId, getTodayKey } from '../../utils/storage';
import { Plus, Trash2, Edit3, ArrowUpRight, ArrowDownRight, X, Wallet, TrendingUp, TrendingDown, Landmark, PiggyBank } from 'lucide-react';
import { Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler } from 'chart.js';
import ModalPortal from '../layout/ModalPortal';
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler);

const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
        legend: { labels: { color: '#9ca3b4', font: { size: 11 } } },
        tooltip: { backgroundColor: '#1c1e2a', titleColor: '#f0f1f5', bodyColor: '#9ca3b4', borderColor: 'rgba(255,255,255,0.06)', borderWidth: 1, padding: 10, cornerRadius: 8 }
    },
    scales: {
        x: { ticks: { color: '#5c6378' }, grid: { color: 'rgba(255,255,255,0.03)' } },
        y: { ticks: { color: '#5c6378' }, grid: { color: 'rgba(255,255,255,0.03)' } }
    }
};

const LEDGER_TABS = [
    { id: 'income', label: 'Income', icon: '↗' },
    { id: 'expense', label: 'Expenses', icon: '↙' },
    { id: 'debt', label: 'Debts', icon: '🏦' },
    { id: 'investment', label: 'Investments', icon: '📊' },
    { id: 'savings', label: 'Savings', icon: '💎' },
];

export default function FinanceModule({ data, settings, onUpdate }) {
    const [showForm, setShowForm] = useState(false);
    const [editingTxn, setEditingTxn] = useState(null);
    const [activeTab, setActiveTab] = useState('income');
    const [formData, setFormData] = useState({ type: 'expense', amount: '', category: 'food', description: '', date: getTodayKey(), accountId: '1' });

    const sym = settings?.currencySymbol || '$';
    const cats = data?.categories || [];
    const txns = data?.transactions || [];
    const accounts = data?.accounts || [];

    const stats = useMemo(() => {
        const thisMonth = new Date().toISOString().slice(0, 7);
        const monthTxns = txns.filter(t => t.date?.startsWith(thisMonth));
        const income = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expenses = monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const debts = txns.filter(t => t.type === 'debt').reduce((s, t) => s + t.amount, 0);
        const investments = txns.filter(t => t.type === 'investment').reduce((s, t) => s + t.amount, 0);
        const savings = txns.filter(t => t.type === 'savings').reduce((s, t) => s + t.amount, 0);
        const balance = accounts.reduce((s, a) => s + (a.balance || 0), 0);
        const netWorth = balance + investments + savings - debts;
        return { income, expenses, debts, investments, savings, balance, netWorth };
    }, [txns, accounts]);

    const filteredTxns = useMemo(() => {
        return [...txns].filter(t => t.type === activeTab).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [txns, activeTab]);

    const expenseByCategory = useMemo(() => {
        const thisMonth = new Date().toISOString().slice(0, 7);
        const grouped = {};
        txns.filter(t => t.type === 'expense' && t.date?.startsWith(thisMonth)).forEach(t => { grouped[t.category] = (grouped[t.category] || 0) + t.amount; });
        return grouped;
    }, [txns]);

    const doughnutData = useMemo(() => {
        const labels = Object.keys(expenseByCategory).map(k => cats.find(c => c.id === k)?.name || k);
        const values = Object.values(expenseByCategory);
        const colors = ['#00d4aa', '#00e676', '#ffab40', '#ff5252', '#40c4ff', '#a855f7', '#ff4d6a', '#00f5c8'];
        return { labels, datasets: [{ data: values, backgroundColor: colors.slice(0, values.length).map(c => c + '55'), borderColor: colors.slice(0, values.length), borderWidth: 2 }] };
    }, [expenseByCategory, cats]);

    const trendData = useMemo(() => {
        const months = []; const incomes = []; const expenses = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(); d.setMonth(d.getMonth() - i);
            const key = d.toISOString().slice(0, 7);
            months.push(d.toLocaleDateString('en-US', { month: 'short' }));
            const mt = txns.filter(t => t.date?.startsWith(key));
            incomes.push(mt.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0));
            expenses.push(mt.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0));
        }
        return {
            labels: months, datasets: [
                { label: 'Income', data: incomes, borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.08)', fill: true, tension: 0.4 },
                { label: 'Expenses', data: expenses, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)', fill: true, tension: 0.4 }
            ]
        };
    }, [txns]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const amount = parseFloat(formData.amount);
        if (!amount || amount <= 0) return;
        const newTxn = { id: editingTxn?.id || generateId(), ...formData, amount, createdAt: editingTxn?.createdAt || new Date().toISOString() };
        let updatedTxns = editingTxn ? txns.map(t => t.id === editingTxn.id ? newTxn : t) : [...txns, newTxn];
        const updatedAccounts = accounts.map(a => {
            if (a.id === formData.accountId) {
                let balanceChange = amount;
                if (editingTxn && editingTxn.accountId === a.id) {
                    balanceChange = amount - editingTxn.amount;
                    if (editingTxn.type !== formData.type) balanceChange = editingTxn.type === 'income' ? -(editingTxn.amount + amount) : (editingTxn.amount + amount);
                }
                return { ...a, balance: a.balance + (formData.type === 'income' ? (editingTxn ? balanceChange : amount) : (editingTxn ? -balanceChange : -amount)) };
            }
            return a;
        });
        onUpdate({ ...data, transactions: updatedTxns, accounts: updatedAccounts });
        resetForm();
    };

    const deleteTxn = (txn) => {
        const updatedAccounts = accounts.map(a => a.id === txn.accountId ? { ...a, balance: a.balance + (txn.type === 'income' ? -txn.amount : txn.amount) } : a);
        onUpdate({ ...data, transactions: txns.filter(t => t.id !== txn.id), accounts: updatedAccounts });
    };

    const resetForm = () => { setFormData({ type: activeTab === 'income' || activeTab === 'expense' ? activeTab : 'expense', amount: '', category: cats.filter(c => c.type === activeTab)[0]?.id || 'food', description: '', date: getTodayKey(), accountId: '1' }); setEditingTxn(null); setShowForm(false); };
    const editTxn = (txn) => { setFormData({ type: txn.type, amount: txn.amount.toString(), category: txn.category, description: txn.description || '', date: txn.date, accountId: txn.accountId || '1' }); setEditingTxn(txn); setShowForm(true); };

    const openAddForm = () => {
        const defaultType = activeTab;
        const defaultCat = cats.filter(c => c.type === defaultType)[0]?.id || 'food';
        setFormData({ type: defaultType, amount: '', category: defaultCat, description: '', date: getTodayKey(), accountId: '1' });
        setShowForm(true);
    };

    return (
        <div>
            <div className="section-header">
                <div><h1 className="section-title" style={{ fontSize: 'var(--text-2xl)' }}>Finances</h1><p className="section-subtitle">Track your finances</p></div>
                <button className="btn btn-primary" onClick={openAddForm}><Plus size={16} /> Add</button>
            </div>

            {/* Stat cards with icons */}
            <div className="grid-5" style={{ marginBottom: 'var(--space-xl)' }}>
                <div className="card stat-card">
                    <div className="stat-card__icon stat-card__icon--accent"><Wallet size={18} /></div>
                    <div className="stat-card__label">Net Worth</div>
                    <div className="stat-card__value">{formatCurrency(stats.netWorth, sym)}</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-card__icon stat-card__icon--success"><TrendingUp size={18} /></div>
                    <div className="stat-card__label">Income</div>
                    <div className="stat-card__value" style={{ color: 'var(--success)' }}>{formatCurrency(stats.income, sym)}</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-card__icon stat-card__icon--danger"><TrendingDown size={18} /></div>
                    <div className="stat-card__label">Expenses</div>
                    <div className="stat-card__value" style={{ color: 'var(--danger)' }}>{formatCurrency(stats.expenses, sym)}</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-card__icon stat-card__icon--warning"><Landmark size={18} /></div>
                    <div className="stat-card__label">Debts</div>
                    <div className="stat-card__value">{formatCurrency(stats.debts, sym)}</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-card__icon stat-card__icon--info"><PiggyBank size={18} /></div>
                    <div className="stat-card__label">Savings</div>
                    <div className="stat-card__value">{formatCurrency(stats.savings, sym)}</div>
                </div>
            </div>

            {/* Subsection Tabs */}
            <div className="tabs" style={{ marginBottom: 'var(--space-lg)' }}>
                {LEDGER_TABS.map(tab => (
                    <button key={tab.id} className={`tab ${activeTab === tab.id ? 'tab--active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Transaction list for active tab */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 'var(--space-xl)', maxHeight: 400, overflowY: 'auto' }}>
                {filteredTxns.length === 0
                    ? <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>No entries yet. Click "Add" to get started.</div>
                    : filteredTxns.map(txn => {
                        const cat = cats.find(c => c.id === txn.category);
                        return (
                            <div key={txn.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: '12px var(--space-lg)', borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}>
                                <span style={{ fontSize: 18, width: 32, textAlign: 'center' }}>{cat?.icon || '📌'}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{txn.description || cat?.name}</div>
                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{new Date(txn.date).toLocaleDateString()}</div>
                                </div>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 600, color: txn.type === 'income' ? 'var(--success)' : txn.type === 'expense' ? 'var(--danger)' : 'var(--text-primary)' }}>
                                    {txn.type === 'income' ? '+' : txn.type === 'expense' ? '-' : ''}{formatCurrency(txn.amount, sym)}
                                </span>
                                <div style={{ display: 'flex', gap: 4 }}>
                                    <button className="btn-icon" onClick={() => editTxn(txn)}><Edit3 size={14} /></button>
                                    <button className="btn-icon" onClick={() => deleteTxn(txn)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                                </div>
                            </div>
                        );
                    })
                }
            </div>

            {/* Charts — only show on income/expense tabs */}
            {(activeTab === 'income' || activeTab === 'expense') && (
                <div className="grid-2" style={{ marginBottom: 'var(--space-xl)' }}>
                    <div className="card card--static" style={{ padding: 'var(--space-xl)' }}>
                        <h3 className="section-title" style={{ marginBottom: 'var(--space-md)' }}>Expense Breakdown</h3>
                        <div style={{ height: 220 }}>
                            {Object.keys(expenseByCategory).length > 0
                                ? <Doughnut data={doughnutData} options={{ ...chartOpts, cutout: '65%', scales: undefined }} />
                                : <div className="empty-state"><p className="empty-state__text">No expense data yet</p></div>}
                        </div>
                    </div>
                    <div className="card card--static" style={{ padding: 'var(--space-xl)' }}>
                        <h3 className="section-title" style={{ marginBottom: 'var(--space-md)' }}>Income vs Expenses</h3>
                        <div style={{ height: 220 }}><Line data={trendData} options={chartOpts} /></div>
                    </div>
                </div>
            )}

            {showForm && (
                <ModalPortal onClose={resetForm}>
                    <div className="modal">
                        <div className="modal__header"><h3 className="modal__title">{editingTxn ? 'Edit Entry' : 'New Entry'}</h3><button className="btn-icon" onClick={resetForm}><X size={18} /></button></div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                <div className="tabs" style={{ alignSelf: 'flex-start' }}>
                                    {LEDGER_TABS.map(tab => (
                                        <button key={tab.id} type="button" className={`tab ${formData.type === tab.id ? 'tab--active' : ''}`}
                                            onClick={() => {
                                                const defaultCat = cats.filter(c => c.type === tab.id)[0]?.id || 'food';
                                                setFormData(p => ({ ...p, type: tab.id, category: defaultCat }));
                                            }}>
                                            {tab.icon} {tab.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="input-group"><label className="input-label">Amount</label><input type="number" className="input-field" placeholder="0.00" step="0.01" min="0" value={formData.amount} onChange={e => setFormData(p => ({ ...p, amount: e.target.value }))} required autoFocus /></div>
                                <div className="input-group"><label className="input-label">Category</label><select className="input-field" value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}>{cats.filter(c => c.type === formData.type).map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select></div>
                                <div className="input-group"><label className="input-label">Description</label><input type="text" className="input-field" placeholder="What was this for?" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} /></div>
                                <div className="input-group"><label className="input-label">Date</label><input type="date" className="input-field" value={formData.date} onChange={e => setFormData(p => ({ ...p, date: e.target.value }))} /></div>
                            </div>
                            <div className="modal__footer"><button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button><button type="submit" className="btn btn-primary">{editingTxn ? 'Update' : 'Add Entry'}</button></div>
                        </form>
                    </div>
                </ModalPortal>
            )}
        </div>
    );
}
