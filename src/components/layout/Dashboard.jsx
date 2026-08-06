// cmd-agent[run-1-51vb] edit.implement: edit Dashboard: abhinav-7391-was-here
import { formatCurrency, getTodayKey } from '../../utils/storage';
import { Wallet, CheckSquare, Target, Heart, ArrowUpRight, ArrowRight, Clock } from 'lucide-react';
import useAnimatedValue from '../../hooks/useAnimatedValue';

export default function Dashboard({ data, settings, onNavigate }) {
    const { finance, tasks, health, goals } = data;
    const sym = settings?.currencySymbol || '$';
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    const totalBalance = (finance?.accounts || []).reduce((s, a) => s + a.balance, 0);
    const thisMonth = today.toISOString().slice(0, 7);
    const monthIncome = (finance?.transactions || []).filter(t => t.type === 'income' && t.date?.startsWith(thisMonth)).reduce((s, t) => s + t.amount, 0);
    const activeTasks = (tasks?.items || []).filter(t => !t.completed).length;
    const todayCompleted = (tasks?.items || []).filter(t => t.completedAt?.startsWith(getTodayKey())).length;
    const habitsTotal = (goals?.habits || []).length;
    const habitsDone = (goals?.habits || []).filter(h => (goals?.streaks?.[h.id]?.dates || []).includes(getTodayKey())).length;
    const activeGoals = (goals?.items || []).filter(g => !g.completed).length;
    const recentEntries = (health?.entries || []).slice(-7);
    const rawAvgMood = recentEntries.length ? recentEntries.reduce((s, e) => s + (e.mood || 0), 0) / recentEntries.length : 0;
    const todayWater = recentEntries.find(e => e.date === getTodayKey())?.water || 0;

    const recentTxns = (finance?.transactions || []).slice(-5).reverse();
    const upcomingTasks = (tasks?.items || []).filter(t => !t.completed).sort((a, b) => (a.dueDate || '9999') > (b.dueDate || '9999') ? 1 : -1).slice(0, 5);
    const cats = finance?.categories || [];
    const hour = today.getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

    // Animated counter values
    const animBalance = useAnimatedValue(totalBalance, 1200, 2);
    const animIncome = useAnimatedValue(monthIncome, 1000, 2);
    const animTasks = useAnimatedValue(activeTasks, 800);
    const animCompleted = useAnimatedValue(todayCompleted, 800);
    const animHabitsDone = useAnimatedValue(habitsDone, 800);
    const animHabitsTotal = useAnimatedValue(habitsTotal, 800);
    const animGoals = useAnimatedValue(activeGoals, 800);
    const animMood = useAnimatedValue(rawAvgMood, 1000, 1);
    const animWater = useAnimatedValue(todayWater, 800);

    return (
        <div>
            <div className="section-header">
                <div>
                    <h1 className="section-title" style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, letterSpacing: '-0.02em' }}>
                        <span style={{
                            background: 'linear-gradient(135deg, var(--accent-light), #40c4ff, #a855f7, var(--accent-light))',
                            backgroundSize: '300% 100%',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            animation: 'gradient-shift 6s ease-in-out infinite',
                        }}>{greeting}</span>
                        <span style={{ color: 'var(--text-primary)', marginLeft: 8 }}>👋</span>
                    </h1>
                    <p className="section-subtitle">{dateStr}</p>
                </div>
            </div>
            <style>{`
                @keyframes gradient-shift {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
            `}</style>

            {/* Stats Row */}
            <div className="grid-4" style={{ marginBottom: 'var(--space-xl)' }}>
                <div className="card stat-card card-tilt" onClick={() => onNavigate('finance')} style={{ cursor: 'pointer' }}>
                    <div className="stat-card__icon stat-card__icon--accent"><Wallet size={18} /></div>
                    <div className="stat-card__label">Net Balance</div>
                    <div className="stat-card__value">{sym}{animBalance}</div>
                    <div className="stat-card__subtitle"><ArrowUpRight size={12} /> {sym}{animIncome} this month</div>
                </div>

                <div className="card stat-card card-tilt" onClick={() => onNavigate('tasks')} style={{ cursor: 'pointer' }}>
                    <div className="stat-card__icon stat-card__icon--info"><CheckSquare size={18} /></div>
                    <div className="stat-card__label">Active Tasks</div>
                    <div className="stat-card__value">{animTasks}</div>
                    <div className="stat-card__subtitle"><ArrowUpRight size={12} /> {animCompleted} completed today</div>
                </div>

                <div className="card stat-card card-tilt" onClick={() => onNavigate('goals')} style={{ cursor: 'pointer' }}>
                    <div className="stat-card__icon stat-card__icon--warning"><Target size={18} /></div>
                    <div className="stat-card__label">Habits Today</div>
                    <div className="stat-card__value">{animHabitsDone}/{animHabitsTotal}</div>
                    <div className="stat-card__subtitle"><Target size={12} /> {animGoals} active goals</div>
                </div>

                <div className="card stat-card card-tilt" onClick={() => onNavigate('health')} style={{ cursor: 'pointer' }}>
                    <div className="stat-card__icon stat-card__icon--success"><Heart size={18} /></div>
                    <div className="stat-card__label">Health Score</div>
                    <div className="stat-card__value">{recentEntries.length ? animMood : '--'}</div>
                    <div className="stat-card__subtitle"><span style={{ fontSize: 13 }}>💧</span> {animWater} glasses</div>
                </div>
            </div>

            {/* Bottom row */}
            <div className="grid-2">
                {/* Recent Transactions */}
                <div className="card card--static" style={{ padding: 'var(--space-xl)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
                        <div>
                            <h3 className="section-title">Recent Transactions</h3>
                            <p className="section-subtitle">Your latest financial activity</p>
                        </div>
                        <button className="btn btn-secondary" onClick={() => onNavigate('finance')} style={{ fontSize: 'var(--text-xs)', padding: '6px 12px' }}>View All</button>
                    </div>
                    {recentTxns.length === 0
                        ? <div className="empty-state"><div className="empty-state__icon">💰</div><p className="empty-state__text">No transactions yet. Start tracking your finances!</p></div>
                        : <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                            {recentTxns.map(tx => (
                                <div key={tx.id} className="list-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.02)', transition: 'all 0.15s', cursor: 'default' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: tx.type === 'income' ? 'var(--success)' : 'var(--danger)', boxShadow: tx.type === 'income' ? '0 0 6px rgba(34,197,94,0.4)' : '0 0 6px rgba(239,68,68,0.4)' }} />
                                        <div>
                                            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{tx.description || cats.find(c => c.id === tx.category)?.name || 'Transaction'}</div>
                                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{tx.date && new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                                        </div>
                                    </div>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 600, color: tx.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, sym)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    }
                </div>

                {/* Upcoming Tasks */}
                <div className="card card--static" style={{ padding: 'var(--space-xl)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
                        <div>
                            <h3 className="section-title">Upcoming Tasks</h3>
                            <p className="section-subtitle">What's next on your plate</p>
                        </div>
                        <button className="btn btn-secondary" onClick={() => onNavigate('tasks')} style={{ fontSize: 'var(--text-xs)', padding: '6px 12px' }}>View All</button>
                    </div>
                    {upcomingTasks.length === 0
                        ? <div className="empty-state"><div className="empty-state__icon">✅</div><p className="empty-state__text">All clear! No pending tasks.</p></div>
                        : <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                            {upcomingTasks.map(task => {
                                const overdue = task.dueDate && new Date(task.dueDate) < today;
                                return (
                                    <div key={task.id} className="list-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.02)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: task.priority === 'high' ? 'var(--danger)' : task.priority === 'medium' ? 'var(--warning)' : 'var(--accent-light)' }} />
                                            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{task.title}</span>
                                        </div>
                                        {task.dueDate && (
                                            <span style={{ fontSize: 'var(--text-xs)', color: overdue ? 'var(--danger)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Clock size={11} /> {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    }
                </div>
            </div>
        </div>
    );
}
