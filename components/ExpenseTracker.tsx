
import React, { useState, useEffect, useRef } from 'react';

interface Transaction {
  id: number;
  date: string;
  income: number;
  expenditure: number;
  category: string;
  desc: string;
  rem: string;
  user: string;
}

const ExpenseTracker: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentType, setCurrentType] = useState<'income' | 'expense'>('expense');
  const [currentUser, setCurrentUser] = useState<string>('Family');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [monthFilter, setMonthFilter] = useState('');

  // Form refs
  const dateRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);
  const descRef = useRef<HTMLInputElement>(null);
  const remRef = useRef<HTMLInputElement>(null);

  // Chart refs
  const expenseModeChartRef = useRef<any>(null);
  const monthlyTrendChartRef = useRef<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('familyExpenseData');
    if (stored) {
      setTransactions(JSON.parse(stored));
    } else {
      const dummy = [
        { id: 1, date: '2023-10-24', income: 5000, expenditure: 0, category: 'Cash', desc: 'Salary Advance', rem: 'Dad', user: 'Dad' },
        { id: 2, date: '2023-10-25', income: 0, expenditure: 1250.50, category: 'Card', desc: 'Supermarket Grocery', rem: 'Weekly supplies', user: 'Mom' },
        { id: 3, date: '2023-10-26', income: 0, expenditure: 450, category: 'Cash', desc: 'Fuel', rem: 'Full tank', user: 'Dad' },
        { id: 4, date: '2023-09-15', income: 0, expenditure: 3200, category: 'Card', desc: 'School Fees', rem: 'Term 3', user: 'Mom' },
      ];
      setTransactions(dummy);
      localStorage.setItem('familyExpenseData', JSON.stringify(dummy));
    }
  }, []);

  useEffect(() => {
    if (showAnalytics) {
      renderCharts();
    }
  }, [showAnalytics, transactions, currentUser]);

  const save = (updated: Transaction[]) => {
    setTransactions(updated);
    localStorage.setItem('familyExpenseData', JSON.stringify(updated));
  };

  const renderCharts = () => {
    // Basic Chart.js initialization logic
    const labels: string[] = [];
    const monthKeys: string[] = [];
    const today = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      labels.push(d.toLocaleString('default', { month: 'short', year: '2-digit' }));
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      monthKeys.push(`${y}-${m}`);
    }

    let monthlyData: Record<string, { inc: number; exp: number }> = {};
    monthKeys.forEach(k => (monthlyData[k] = { inc: 0, exp: 0 }));
    let cash = 0, card = 0;

    transactions.forEach(t => {
      if (currentUser !== 'Family' && t.user !== currentUser) return;
      if (t.expenditure > 0) {
        if (t.category === 'Card') card += Number(t.expenditure);
        else cash += Number(t.expenditure);
      }
      const mKey = t.date.substring(0, 7);
      if (monthlyData[mKey]) {
        monthlyData[mKey].inc += Number(t.income);
        monthlyData[mKey].exp += Number(t.expenditure);
      }
    });

    const ctx1 = (document.getElementById('chartExpenseMode') as HTMLCanvasElement)?.getContext('2d');
    if (ctx1) {
      if (expenseModeChartRef.current) expenseModeChartRef.current.destroy();
      expenseModeChartRef.current = new (window as any).Chart(ctx1, {
        type: 'doughnut',
        data: {
          labels: ['Cash', 'Card'],
          datasets: [{
            data: [cash, card],
            backgroundColor: ['#facc15', '#c084fc'],
            borderWidth: 0
          }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }

    const ctx2 = (document.getElementById('chartMonthlyTrend') as HTMLCanvasElement)?.getContext('2d');
    if (ctx2) {
      if (monthlyTrendChartRef.current) monthlyTrendChartRef.current.destroy();
      monthlyTrendChartRef.current = new (window as any).Chart(ctx2, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            { label: 'Income', data: monthKeys.map(k => monthlyData[k].inc), backgroundColor: '#22c55e', borderRadius: 4 },
            { label: 'Expense', data: monthKeys.map(k => monthlyData[k].exp), backgroundColor: '#ef4444', borderRadius: 4 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true, grid: { display: false } },
            x: { grid: { display: false } }
          }
        }
      });
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const date = dateRef.current?.value || '';
    const amount = parseFloat(amountRef.current?.value || '0');
    const desc = descRef.current?.value || '';
    const rem = remRef.current?.value || '';
    let category = categoryRef.current?.value || 'Cash';

    let inc = 0, exp = 0;
    if (currentType === 'income') {
      inc = amount;
      category = "-";
    } else {
      exp = amount;
    }

    let updated;
    if (editingId) {
      updated = transactions.map(t =>
        t.id === editingId ? { ...t, date, income: inc, expenditure: exp, category, desc, rem, user: currentUser } : t
      );
      cancelEdit();
    } else {
      const newEntry = { id: Date.now(), date, income: inc, expenditure: exp, category, desc, rem, user: currentUser };
      updated = [newEntry, ...transactions];
      if (amountRef.current) amountRef.current.value = '';
      if (descRef.current) descRef.current.value = '';
      if (remRef.current) remRef.current.value = '';
    }
    save(updated);
    if (window.innerWidth < 1024 && !editingId) setIsSidePanelOpen(false);
  };

  const editTransaction = (id: number) => {
    const item = transactions.find(t => t.id === id);
    if (!item) return;
    setEditingId(id);
    if (dateRef.current) dateRef.current.value = item.date;
    if (descRef.current) descRef.current.value = item.desc;
    if (remRef.current) remRef.current.value = item.rem;
    if (amountRef.current) amountRef.current.value = (item.income > 0 ? item.income : item.expenditure).toString();
    
    if (item.income > 0) {
      setCurrentType('income');
    } else {
      setCurrentType('expense');
      if (categoryRef.current && item.category !== '-') categoryRef.current.value = item.category;
    }
    setIsSidePanelOpen(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setCurrentType('expense');
    if (amountRef.current) amountRef.current.value = '';
    if (descRef.current) descRef.current.value = '';
    if (remRef.current) remRef.current.value = '';
  };

  const deleteTransaction = (id: number) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      const updated = transactions.filter(t => t.id !== id);
      if (editingId === id) cancelEdit();
      save(updated);
    }
  };

  const filtered = transactions.filter(t => {
    if (currentUser !== 'Family' && t.user !== currentUser) return false;
    const searchMatch = !searchQuery || [t.desc, t.rem, t.date].some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const monthMatch = !monthFilter || t.date.substring(0, 7) === monthFilter;
    return searchMatch && monthMatch;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totals = filtered.reduce((acc, t) => {
    acc.inc += Number(t.income);
    acc.exp += Number(t.expenditure);
    if (t.expenditure > 0) {
      if (t.category === 'Card') acc.card += Number(t.expenditure);
      else acc.cash += Number(t.expenditure);
    }
    return acc;
  }, { inc: 0, exp: 0, cash: 0, card: 0 });

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      {/* Sub Header */}
      <header className="bg-white shadow-sm flex-none h-16 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="bg-green-500 text-white p-1.5 rounded-lg">
            <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 hidden sm:block">Family Expenses</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition" onClick={() => setShowAnalytics(true)}>
            <span className="material-symbols-outlined">pie_chart</span>
          </button>
          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full transition text-sm font-medium">
              <span className="material-symbols-outlined text-lg">person</span>
              <span>{currentUser}</span>
            </button>
            <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg border rounded-lg hidden group-hover:block z-50">
              {['Family', 'Dad', 'Mom', 'Kids'].map(u => (
                <button key={u} className="w-full text-left px-4 py-2 hover:bg-green-50 text-sm" onClick={() => setCurrentUser(u)}>{u}</button>
              ))}
            </div>
          </div>
          <button className="p-2 text-gray-500 hover:text-green-600 transition" onClick={() => setShowSettings(true)}>
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar / Form */}
        <aside className={`lg:w-1/3 xl:w-1/4 bg-white border-r border-gray-200 h-full overflow-y-auto z-40 fixed lg:relative inset-y-0 left-0 transform transition-transform duration-300 ${isSidePanelOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="p-6 bg-gradient-to-br from-green-50 to-white min-h-full">
            <div className="flex justify-between items-center mb-4 lg:hidden">
              <h2 className="font-bold">Add Entry</h2>
              <button onClick={() => setIsSidePanelOpen(false)}><span className="material-symbols-outlined">close</span></button>
            </div>
            
            <div className="bg-green-600 rounded-2xl p-5 text-white shadow-lg mb-6">
              <p className="text-green-100 text-sm opacity-80">{monthFilter ? 'Monthly Balance' : 'Net Balance'}</p>
              <h3 className="text-3xl font-bold">Rs. {(totals.inc - totals.exp).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
              <div className="grid grid-cols-2 mt-4 pt-4 border-t border-white/20">
                <div><p className="text-xs opacity-70">INCOME</p><p className="font-bold">Rs. {totals.inc.toLocaleString()}</p></div>
                <div className="text-right"><p className="text-xs opacity-70">EXPENSE</p><p className="font-bold">Rs. {totals.exp.toLocaleString()}</p></div>
              </div>
            </div>

            <div className={`bg-white rounded-xl border p-5 shadow-sm ${editingId ? 'ring-2 ring-blue-500' : ''}`}>
              <div className="flex justify-between mb-4">
                <h3 className="font-bold flex items-center gap-2">
                  <span className={`material-symbols-outlined ${editingId ? 'text-blue-500' : 'text-green-500'}`}>{editingId ? 'edit' : 'add_circle'}</span>
                  {editingId ? 'Edit Entry' : 'New Entry'}
                </h3>
                {editingId && <button className="text-xs text-red-500" onClick={cancelEdit}>Cancel</button>}
              </div>
              <form className="space-y-4" onSubmit={handleFormSubmit}>
                <div><label className="text-xs font-medium text-gray-500">Date</label><input ref={dateRef} type="date" required className="w-full border rounded-lg p-2 text-sm" defaultValue={new Date().toISOString().split('T')[0]} /></div>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button type="button" onClick={() => setCurrentType('income')} className={`flex-1 py-1.5 text-sm rounded-md font-medium transition ${currentType === 'income' ? 'bg-white shadow text-green-700' : 'text-gray-500'}`}>Income</button>
                  <button type="button" onClick={() => setCurrentType('expense')} className={`flex-1 py-1.5 text-sm rounded-md font-medium transition ${currentType === 'expense' ? 'bg-white shadow text-red-700' : 'text-gray-500'}`}>Expense</button>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">{currentType === 'income' ? 'Amount' : 'Expenditure'}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-400 text-sm">Rs.</span>
                    <input ref={amountRef} type="number" step="0.01" required placeholder="0.00" className="w-full border rounded-lg pl-10 pr-3 py-2 text-sm font-mono" />
                  </div>
                </div>
                {currentType === 'expense' && (
                  <div>
                    <label className="text-xs font-medium text-gray-500">Mode</label>
                    <select ref={categoryRef} className="w-full border rounded-lg p-2 text-sm">
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                    </select>
                  </div>
                )}
                <div><label className="text-xs font-medium text-gray-500">Description</label><input ref={descRef} type="text" required className="w-full border rounded-lg p-2 text-sm" /></div>
                <div><label className="text-xs font-medium text-gray-500">Remarks</label><input ref={remRef} type="text" className="w-full border rounded-lg p-2 text-sm" /></div>
                <button type="submit" className={`w-full py-2.5 text-white rounded-lg font-bold transition ${editingId ? 'bg-blue-600' : 'bg-green-600'}`}>
                  {editingId ? 'Update Entry' : 'Save Entry'}
                </button>
              </form>
            </div>
          </div>
        </aside>

        {/* Table Content */}
        <main className="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6">
          <div className="flex flex-wrap gap-4 mb-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <button className="lg:hidden p-2 bg-white border rounded" onClick={() => setIsSidePanelOpen(true)}><span className="material-symbols-outlined">menu</span></button>
              <h2 className="font-bold text-gray-700">Transactions ({filtered.length})</h2>
            </div>
            <div className="flex items-center gap-2">
              <input type="month" className="border rounded p-1.5 text-sm" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} />
              <input type="text" placeholder="Search..." className="border rounded p-1.5 text-sm w-32 sm:w-48" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">Income</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">Expense</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Desc</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50 group">
                    <td className="px-4 py-3 text-sm">{new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}</td>
                    <td className="px-4 py-3 text-sm text-right font-mono text-green-600">{t.income > 0 ? t.income.toFixed(2) : '-'}</td>
                    <td className="px-4 py-3 text-sm text-right font-mono text-red-600">{t.expenditure > 0 ? t.expenditure.toFixed(2) : '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${t.category === 'Card' ? 'bg-purple-100 text-purple-700' : (t.category === '-' ? 'text-gray-400' : 'bg-yellow-100 text-yellow-700')}`}>{t.category}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-gray-800">{t.desc}</div>
                      <div className="text-xs text-gray-400">{t.rem}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{t.user}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1 text-blue-500 hover:bg-blue-50 rounded" onClick={() => editTransaction(t.id)}><span className="material-symbols-outlined text-lg">edit</span></button>
                        <button className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded" onClick={() => deleteTransaction(t.id)}><span className="material-symbols-outlined text-lg">delete</span></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Analytics Modal */}
      {showAnalytics && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
            <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2"><span className="material-symbols-outlined">pie_chart</span> Analytics</h3>
              <button onClick={() => setShowAnalytics(false)}><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50">
              <div className="bg-white p-4 rounded-xl border h-80"><h4 className="font-bold mb-4 text-center">Expense Modes</h4><canvas id="chartExpenseMode"></canvas></div>
              <div className="bg-white p-4 rounded-xl border h-80"><h4 className="font-bold mb-4 text-center">Monthly Trend</h4><canvas id="chartMonthlyTrend"></canvas></div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-green-600 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold">Settings & Data</h3>
              <button onClick={() => setShowSettings(false)}><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-bold text-sm mb-2 uppercase text-gray-500">Danger Zone</h4>
                <button className="w-full text-red-600 border border-red-200 py-2 rounded-lg hover:bg-red-50" onClick={() => { if(confirm('Clear all data?')) save([]); setShowSettings(false); }}>Reset All Data</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseTracker;
