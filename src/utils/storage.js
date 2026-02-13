import { supabase } from '../lib/supabase';

const DATA_KEYS = {
    finance: 'nexus_finance',
    tasks: 'nexus_tasks',
    health: 'nexus_health',
    goals: 'nexus_goals',
    settings: 'nexus_settings'
};

function getDefaultData() {
    return {
        finance: {
            accounts: [
                { id: '1', name: 'Main Account', balance: 0, type: 'checking', currency: 'USD' }
            ],
            transactions: [],
            budgets: [],
            categories: [
                { id: 'salary', name: 'Salary', type: 'income', icon: '💰' },
                { id: 'freelance', name: 'Freelance', type: 'income', icon: '💻' },
                { id: 'investment_income', name: 'Investment Returns', type: 'income', icon: '📈' },
                { id: 'food', name: 'Food & Dining', type: 'expense', icon: '🍕' },
                { id: 'transport', name: 'Transport', type: 'expense', icon: '🚗' },
                { id: 'shopping', name: 'Shopping', type: 'expense', icon: '🛍️' },
                { id: 'bills', name: 'Bills & Utilities', type: 'expense', icon: '📄' },
                { id: 'health', name: 'Healthcare', type: 'expense', icon: '🏥' },
                { id: 'entertainment', name: 'Entertainment', type: 'expense', icon: '🎮' },
                { id: 'education', name: 'Education', type: 'expense', icon: '📚' },
                { id: 'rent', name: 'Rent/Mortgage', type: 'expense', icon: '🏠' },
                { id: 'other', name: 'Other', type: 'expense', icon: '📌' },
                { id: 'loan', name: 'Loan Payment', type: 'debt', icon: '🏦' },
                { id: 'credit_card', name: 'Credit Card', type: 'debt', icon: '💳' },
                { id: 'emi', name: 'EMI', type: 'debt', icon: '📋' },
                { id: 'stocks', name: 'Stocks', type: 'investment', icon: '📊' },
                { id: 'mutual_fund', name: 'Mutual Funds', type: 'investment', icon: '🏛️' },
                { id: 'crypto', name: 'Crypto', type: 'investment', icon: '🪙' },
                { id: 'fd', name: 'Fixed Deposit', type: 'savings', icon: '🔒' },
                { id: 'emergency', name: 'Emergency Fund', type: 'savings', icon: '🛡️' },
                { id: 'general_savings', name: 'General Savings', type: 'savings', icon: '💎' }
            ]
        },
        tasks: {
            projects: [
                { id: 'default', name: 'Personal', color: '#00f0ff' }
            ],
            items: [],
            pomodoroSessions: []
        },
        health: {
            entries: [],
            metrics: {
                weight: { unit: 'kg', goal: null },
                water: { unit: 'glasses', dailyGoal: 8 },
                sleep: { unit: 'hours', dailyGoal: 8 },
                steps: { unit: 'steps', dailyGoal: 10000 }
            }
        },
        goals: {
            items: [],
            habits: [],
            streaks: {}
        },
        settings: {
            theme: 'dark',
            currency: 'USD',
            currencySymbol: '$',
            dateFormat: 'MM/dd/yyyy',
            autoLockMinutes: 15,
            accentColor: 'indigo',
            fontSize: 'default',
            sidebarPosition: 'left',
            animations: 'on'
        }
    };
}

export async function loadData(module) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return getDefaultData()[module];

    const { data, error } = await supabase
        .from('user_data')
        .select('data')
        .eq('user_id', user.id)
        .eq('module', module)
        .single();

    if (error || !data) {
        return getDefaultData()[module];
    }

    return data.data; // The JSON blob
}

export async function saveData(module, dataToSave) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
        .from('user_data')
        .upsert({
            user_id: user.id,
            module: module,
            data: dataToSave,
            updated_at: new Date()
        }, { onConflict: 'user_id, module' });
}

// Helper to load ALL modules at once (e.g. for Export)
export async function exportAllData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
        .from('user_data')
        .select('module, data')
        .eq('user_id', user.id);

    const allData = {};
    if (data) {
        data.forEach(row => {
            allData[row.module] = row.data;
        });
    }

    return {
        version: '2.0.0', // Cloud version
        exportedAt: new Date().toISOString(),
        data: allData
    };
}

// Helper for Import
export async function importData(jsonData) {
    if (!jsonData || !jsonData.data) return false;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const updates = Object.entries(jsonData.data).map(([module, data]) => ({
        user_id: user.id,
        module,
        data,
        updated_at: new Date()
    }));

    const { error } = await supabase
        .from('user_data')
        .upsert(updates, { onConflict: 'user_id, module' });

    return !error;
}

export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function formatCurrency(amount, symbol = '$') {
    const num = parseFloat(amount) || 0;
    const isNegative = num < 0;
    const formatted = Math.abs(num).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    return `${isNegative ? '-' : ''}${symbol}${formatted}`;
}

export function getTodayKey() {
    return new Date().toISOString().split('T')[0];
}

