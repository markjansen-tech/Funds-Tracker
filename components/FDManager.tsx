
import React, { useState, useEffect, useRef } from 'react';

interface FDRecord {
  depositor: string;
  bank: string;
  accNo: string;
  amount: string;
  rate: string;
  period: string;
  interest: string;
  maturity: string;
  tax: string;
}

const FDManager: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [fdData, setFdData] = useState<FDRecord[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });
  const [error, setError] = useState(false);

  // Form refs
  const depositorRef = useRef<HTMLInputElement>(null);
  const bankRef = useRef<HTMLInputElement>(null);
  const accNoRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const rateRef = useRef<HTMLInputElement>(null);
  const periodRef = useRef<HTMLInputElement>(null);
  const interestRef = useRef<HTMLInputElement>(null);
  const maturityRef = useRef<HTMLInputElement>(null);
  const taxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('fdData');
    if (stored) {
      setFdData(JSON.parse(stored));
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.user === '123' && loginForm.pass === '123') {
      setIsLoggedIn(true);
      setError(false);
    } else {
      setError(true);
      setLoginForm({ ...loginForm, pass: '' });
    }
  };

  const saveRecord = () => {
    const newRecord: FDRecord = {
      depositor: depositorRef.current?.value || '',
      bank: bankRef.current?.value || 'BOC',
      accNo: accNoRef.current?.value || '',
      amount: amountRef.current?.value || '0',
      rate: rateRef.current?.value || '0',
      period: periodRef.current?.value || '',
      interest: interestRef.current?.value || '0',
      maturity: maturityRef.current?.value || '',
      tax: taxRef.current?.value || '0'
    };

    let updated;
    if (editingIndex === null) {
      updated = [...fdData, newRecord];
    } else {
      updated = fdData.map((r, i) => i === editingIndex ? newRecord : r);
      setEditingIndex(null);
    }

    setFdData(updated);
    localStorage.setItem('fdData', JSON.stringify(updated));
    clearForm();
  };

  const clearForm = () => {
    setEditingIndex(null);
    if (depositorRef.current) depositorRef.current.value = '';
    if (bankRef.current) bankRef.current.value = 'BOC';
    if (accNoRef.current) accNoRef.current.value = '';
    if (amountRef.current) amountRef.current.value = '';
    if (rateRef.current) rateRef.current.value = '';
    if (periodRef.current) periodRef.current.value = '';
    if (interestRef.current) interestRef.current.value = '';
    if (maturityRef.current) maturityRef.current.value = '';
    if (taxRef.current) taxRef.current.value = '';
  };

  const editRecord = (index: number) => {
    const r = fdData[index];
    setEditingIndex(index);
    if (depositorRef.current) depositorRef.current.value = r.depositor;
    if (bankRef.current) bankRef.current.value = r.bank;
    if (accNoRef.current) accNoRef.current.value = r.accNo;
    if (amountRef.current) amountRef.current.value = r.amount;
    if (rateRef.current) rateRef.current.value = r.rate;
    if (periodRef.current) periodRef.current.value = r.period;
    if (interestRef.current) interestRef.current.value = r.interest;
    if (maturityRef.current) maturityRef.current.value = r.maturity;
    if (taxRef.current) taxRef.current.value = r.tax;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteRecord = (index: number) => {
    if (confirm('Delete this record?')) {
      const updated = fdData.filter((_, i) => i !== index);
      setFdData(updated);
      localStorage.setItem('fdData', JSON.stringify(updated));
    }
  };

  const downloadCSV = () => {
    if (fdData.length === 0) return alert('No data to export');
    const headers = ["Deposits", "Bank", "Account No", "Amount", "Rate %", "Period", "Interest Due", "Maturity", "W.H. TAX"];
    const csvRows = [headers.join(',')];
    fdData.forEach(item => {
      csvRows.push([`"${item.depositor}"`, item.bank, `"${item.accNo}"`, item.amount, item.rate, item.period, item.interest, item.maturity, item.tax].join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fd_portfolio_backup.csv';
    a.click();
  };

  const totals = fdData.reduce((acc, r) => {
    acc.amount += parseFloat(r.amount || '0');
    acc.interest += parseFloat(r.interest || '0');
    acc.tax += parseFloat(r.tax || '0');
    return acc;
  }, { amount: 0, interest: 0, tax: 0 });

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
          <h2 className="text-2xl font-bold text-center mb-6">🔐 FD Portfolio Login</h2>
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-bold mb-1">Username</label>
              <input className="w-full border rounded p-2" type="text" value={loginForm.user} onChange={e => setLoginForm({...loginForm, user: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Password</label>
              <input className="w-full border rounded p-2" type="password" value={loginForm.pass} onChange={e => setLoginForm({...loginForm, pass: e.target.value})} />
            </div>
            <button className="w-full bg-green-600 text-white font-bold py-2 rounded hover:bg-green-700">Login</button>
            {error && <p className="text-red-500 text-xs text-center">Invalid credentials. Try 123/123</p>}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-4 sm:p-6 no-scrollbar">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-blue-600">account_balance</span>
        FD Portfolio Manager
      </h2>

      <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
        <h3 className="font-bold text-lg mb-4">{editingIndex !== null ? 'Update FD Record' : 'Add New FD Record'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div><label className="text-xs font-bold text-gray-500">Depositor</label><input ref={depositorRef} className="w-full border rounded p-2 text-sm" placeholder="e.g. Madu FD" /></div>
          <div><label className="text-xs font-bold text-gray-500">Bank</label><input ref={bankRef} className="w-full border rounded p-2 text-sm" defaultValue="BOC" /></div>
          <div><label className="text-xs font-bold text-gray-500">Account No</label><input ref={accNoRef} className="w-full border rounded p-2 text-sm" /></div>
          <div><label className="text-xs font-bold text-gray-500">Amount</label><input ref={amountRef} type="number" step="0.01" className="w-full border rounded p-2 text-sm" /></div>
          <div><label className="text-xs font-bold text-gray-500">Rate %</label><input ref={rateRef} type="number" step="0.01" className="w-full border rounded p-2 text-sm" /></div>
          <div><label className="text-xs font-bold text-gray-500">Period</label><input ref={periodRef} className="w-full border rounded p-2 text-sm" placeholder="03 M" /></div>
          <div><label className="text-xs font-bold text-gray-500">Interest Due</label><input ref={interestRef} type="number" step="0.01" className="w-full border rounded p-2 text-sm" /></div>
          <div><label className="text-xs font-bold text-gray-500">Maturity</label><input ref={maturityRef} className="w-full border rounded p-2 text-sm" placeholder="DD-MM-YYYY" /></div>
          <div><label className="text-xs font-bold text-gray-500">W.H. Tax</label><input ref={taxRef} type="number" step="0.01" className="w-full border rounded p-2 text-sm" /></div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <button className={`px-6 py-2 rounded text-white font-bold ${editingIndex !== null ? 'bg-yellow-500' : 'bg-green-600'}`} onClick={saveRecord}>
            {editingIndex !== null ? 'Update Record' : 'Save Record'}
          </button>
          <button className="px-6 py-2 rounded border border-gray-300 font-bold hover:bg-gray-100" onClick={clearForm}>Clear</button>
          <button className="px-6 py-2 rounded bg-purple-100 text-purple-700 font-bold hover:bg-purple-200" onClick={downloadCSV}>Export CSV</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead className="bg-green-500 text-white">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Depositor</th>
              <th className="px-4 py-3">Bank</th>
              <th className="px-4 py-3">Account No</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">Rate %</th>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3 text-right">Interest</th>
              <th className="px-4 py-3 text-right">Maturity</th>
              <th className="px-4 py-3 text-right">Tax</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {fdData.map((r, i) => (
              <tr key={i} className="hover:bg-gray-50 group">
                <td className="px-4 py-3 text-xs text-gray-400">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{r.depositor}</td>
                <td className="px-4 py-3">{r.bank}</td>
                <td className="px-4 py-3 text-sm font-mono">{r.accNo}</td>
                <td className="px-4 py-3 text-right font-mono">{parseFloat(r.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-3 text-right">{r.rate}</td>
                <td className="px-4 py-3">{r.period}</td>
                <td className="px-4 py-3 text-right font-mono">{parseFloat(r.interest).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-3 text-right text-sm">{r.maturity}</td>
                <td className="px-4 py-3 text-right font-mono">{parseFloat(r.tax).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center gap-1">
                    <button className="p-1 hover:bg-yellow-50 text-yellow-600 rounded" onClick={() => editRecord(i)}><span className="material-symbols-outlined text-lg">edit</span></button>
                    <button className="p-1 hover:bg-red-50 text-red-400 rounded" onClick={() => deleteRecord(i)}><span className="material-symbols-outlined text-lg">delete</span></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 font-bold border-t-2 border-gray-800">
            <tr>
              <td colSpan={4} className="px-4 py-3 text-right">TOTAL</td>
              <td className="px-4 py-3 text-right font-mono border-y-2 border-gray-800">{totals.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td></td>
              <td></td>
              <td className="px-4 py-3 text-right font-mono border-y-2 border-gray-800">{totals.interest.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td></td>
              <td className="px-4 py-3 text-right font-mono border-y-2 border-gray-800">{totals.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default FDManager;
