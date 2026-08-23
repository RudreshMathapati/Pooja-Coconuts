import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Toast from '../components/common/Toast';
import API from '../services/api';
import { formatCurrency, formatDate, getStatusColorClass, getTodayDateString } from '../utils/formatters';
import { TableSkeleton } from '../components/common/Skeleton';
import { Home, Plus, Trash2, Save, Search, AlertTriangle, ShieldCheck } from 'lucide-react';

const createEmptyRow = () => ({
  name: 'Pure Copra Oil for Family',
  unit: 'Litre',
  quantity: 20,
  rate: 220,
  total: 4400
});

const HomePurchasePage = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form States
  const [billNumber, setBillNumber] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [paymentStatus, setPaymentStatus] = useState('Paid');
  const [amountPaidInput, setAmountPaidInput] = useState('');
  const [remarks, setRemarks] = useState('');

  // Suppliers options
  const [suppliersList, setSuppliersList] = useState([]);

  // Multi item rows - Direct on-screen entry
  const [items, setItems] = useState([createEmptyRow()]);

  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const res = await API.get('/purchases?type=Home');
      setPurchases(res.data || []);
    } catch (err) {
      console.error('Failed to load home purchases', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
    API.get('/suppliers').then(res => setSuppliersList(res.data || [])).catch(console.error);
    setBillNumber(`HOME-${Date.now().toString().slice(-5)}`);
  }, []);

  const handleSupplierSelect = (nameInput) => {
    setSupplierName(nameInput);
    const found = suppliersList.find(s => s.name.toLowerCase() === nameInput.toLowerCase());
    if (found) {
      setSupplierPhone(found.phone);
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    const item = { ...newItems[index] };

    if (field === 'quantity') {
      item.quantity = Math.max(1, Number(value) || 0);
      item.total = item.quantity * item.rate;
    } else if (field === 'rate') {
      item.rate = Math.max(0, Number(value) || 0);
      item.total = item.quantity * item.rate;
    } else if (field === 'name') {
      item.name = value;
    } else if (field === 'unit') {
      item.unit = value;
    }

    newItems[index] = item;
    setItems(newItems);
  };

  const addItemRow = () => {
    setItems([...items, { name: '', unit: 'Pcs', quantity: 1, rate: 0, total: 0 }]);
  };

  const removeItemRow = (idx) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const totalAmount = items.reduce((sum, i) => sum + (Number(i.total) || 0), 0);
  const actualAmountPaid = paymentStatus === 'Paid' ? totalAmount : (paymentStatus === 'Pending' ? 0 : Number(amountPaidInput) || 0);
  const pendingAmount = Math.max(0, totalAmount - actualAmountPaid);

  const handleSubmitPurchase = async (e) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      setToast({ message: 'Supplier / Party Name is required!', type: 'error' });
      return;
    }

    const validItems = items.filter(i => i.name && i.name.trim().length > 0);
    if (validItems.length === 0) {
      setToast({ message: 'Please enter at least 1 item for home expense!', type: 'error' });
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        purchaseType: 'Home',
        billNumber: billNumber.trim() || `HOME-${Date.now().toString().slice(-6)}`,
        supplierName: supplierName.trim(),
        supplierPhone: supplierPhone.trim(),
        items: validItems,
        totalAmount,
        amountPaid: actualAmountPaid,
        paymentStatus: pendingAmount === 0 ? 'Paid' : (actualAmountPaid === 0 ? 'Pending' : 'Partial'),
        remarks,
        date
      };

      await API.post('/purchases', payload);
      setToast({ message: 'Home expense saved! (Isolated: 0 effect on shop inventory stock or sales profits)', type: 'success' });
      
      // Reset Form
      setSupplierName('');
      setSupplierPhone('');
      setRemarks('');
      setAmountPaidInput('');
      setBillNumber(`HOME-${Date.now().toString().slice(-5)}`);
      setItems([createEmptyRow()]);

      fetchPurchases();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to record home purchase', type: 'error' });
    } finally {
      setFormLoading(false);
    }
  };

  const filtered = purchases.filter(p =>
    p.billNumber.toLowerCase().includes(search.toLowerCase()) ||
    p.supplierName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 pb-16">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Direct Home Expense Entry Form - No Extra Modal Button */}
        <form onSubmit={handleSubmitPurchase} className="bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-xl p-6 shadow-md space-y-5">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-300 dark:border-slate-700 pb-3 gap-2">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-950 px-2.5 py-1 rounded font-mono">
                ISOLATED HOUSEHOLD EXPENSE FORM
              </span>
              <h1 className="font-heading font-black text-2xl text-slate-900 dark:text-white uppercase tracking-tight mt-1">
                Record Home Purchase / Household Expense
              </h1>
              <p className="text-xs text-slate-500">
                Direct entry form. Strictly personal family expenses. Zero impact on shop stock or business profit calculations.
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs uppercase font-extrabold text-slate-500 block">EXPENSE ID #</span>
              <input
                type="text"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                className="text-right font-mono font-black text-lg text-purple-700 dark:text-purple-400 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded border border-slate-300 dark:border-slate-700 outline-none w-40"
              />
            </div>
          </div>

          {/* Supplier & Date Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900 p-4 border border-slate-300 dark:border-slate-700 rounded-lg">
            
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Purchase Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-xs rounded border border-slate-300 dark:border-slate-600 font-medium focus:ring-1 focus:ring-purple-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Supplier / Vendor / Party *
              </label>
              <input
                type="text"
                placeholder="e.g. Local Dairy / Oil Press"
                value={supplierName}
                onChange={(e) => handleSupplierSelect(e.target.value)}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-xs rounded border border-slate-300 dark:border-slate-600 font-bold focus:ring-1 focus:ring-purple-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Supplier Phone
              </label>
              <input
                type="text"
                placeholder="Mobile #"
                value={supplierPhone}
                onChange={(e) => setSupplierPhone(e.target.value)}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-xs rounded border border-slate-300 dark:border-slate-600 font-mono focus:ring-1 focus:ring-purple-500 outline-none"
              />
            </div>

          </div>

          {/* Item Table Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Home Expense Particulars Table
              </span>
              <button
                type="button"
                onClick={addItemRow}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] rounded shadow-sm flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Item Row</span>
              </button>
            </div>

            <div className="overflow-x-auto border-2 border-slate-400 dark:border-slate-600 rounded">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800 text-white text-[11px] font-bold uppercase tracking-wider divide-x divide-slate-700">
                    <th className="py-2.5 px-3 w-12 text-center">S.No</th>
                    <th className="py-2.5 px-3 min-w-[240px]">Home Expense Description</th>
                    <th className="py-2.5 px-3 w-24 text-center">Unit</th>
                    <th className="py-2.5 px-3 w-28 text-center">Qty</th>
                    <th className="py-2.5 px-3 w-28 text-center">Rate (₹)</th>
                    <th className="py-2.5 px-3 w-32 text-right">Total Amount (₹)</th>
                    <th className="py-2.5 px-3 w-10 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-200 dark:divide-slate-700 divide-x divide-slate-200 dark:divide-slate-700 text-xs">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/80">
                      
                      <td className="py-2 px-2 text-center font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900">
                        {idx + 1}
                      </td>

                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          placeholder="e.g. Copra oil for family"
                          value={item.name}
                          onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs font-bold text-slate-900 dark:text-white outline-none"
                        />
                      </td>

                      <td className="py-1.5 px-2 text-center">
                        <input
                          type="text"
                          placeholder="Pcs/Litre/KG"
                          value={item.unit}
                          onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                          className="w-full px-1 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs text-center font-semibold font-mono outline-none"
                        />
                      </td>

                      <td className="py-1.5 px-2 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full px-1 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs text-center font-extrabold outline-none"
                        />
                      </td>

                      <td className="py-1.5 px-2 text-center">
                        <input
                          type="number"
                          min="0"
                          value={item.rate}
                          onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                          className="w-full px-1 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs text-center font-extrabold text-purple-600 outline-none"
                        />
                      </td>

                      <td className="py-2 px-3 text-right font-extrabold text-slate-900 dark:text-white text-sm bg-slate-50 dark:bg-slate-900">
                        {formatCurrency(item.total)}
                      </td>

                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          disabled={items.length <= 1}
                          className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Summary & Payment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t-2 border-slate-300 dark:border-slate-700">
            
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Payment Status *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Paid', 'Pending', 'Partial'].map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setPaymentStatus(st)}
                      className={`py-1.5 px-2 rounded text-xs font-bold border transition ${
                        paymentStatus === st
                          ? 'bg-purple-600 text-white border-purple-600 shadow'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {paymentStatus === 'Partial' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Amount Paid Now (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={totalAmount}
                    value={amountPaidInput}
                    onChange={(e) => setAmountPaidInput(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 text-xs rounded border border-slate-300 font-bold outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Remarks / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Family kitchen copra oil"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 text-xs rounded border border-slate-300 outline-none"
                />
              </div>
            </div>

            {/* Total Summary */}
            <div className="border-2 border-slate-400 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-900 p-4 space-y-2 font-mono text-xs">
              <div className="flex justify-between text-slate-700 dark:text-slate-300">
                <span>Subtotal ({items.length} items):</span>
                <span className="font-bold">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="pt-2 border-t-2 border-slate-400 dark:border-slate-600 flex justify-between text-sm font-black text-slate-900 dark:text-white">
                <span>TOTAL EXPENSE:</span>
                <span className="text-purple-600 dark:text-purple-400">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-600">
                <span>AMOUNT PAID:</span>
                <span>{formatCurrency(actualAmountPaid)}</span>
              </div>
              <div className="flex justify-between font-black text-rose-600 pt-1 border-t border-slate-300">
                <span>SUPPLIER DUE:</span>
                <span>{formatCurrency(pendingAmount)}</span>
              </div>
            </div>

          </div>

          {/* Submit Action */}
          <div className="flex justify-end pt-3 border-t-2 border-slate-300 dark:border-slate-700">
            <button
              type="submit"
              disabled={formLoading}
              className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded shadow-md transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{formLoading ? 'Saving Expense...' : 'Save Home Purchase (Isolated)'}</span>
            </button>
          </div>

        </form>

        {/* History Section Below */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-300 dark:border-slate-700 p-6 shadow-md space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-200 dark:border-slate-700 pb-3">
            <h3 className="font-heading font-black text-lg text-slate-900 dark:text-white uppercase flex items-center gap-2">
              <Home className="w-5 h-5 text-purple-600" />
              <span>Home Purchases History</span>
            </h3>

            <div className="relative max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search Expense ID or Supplier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-900 text-xs rounded border border-slate-300 dark:border-slate-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border-2 border-slate-400 dark:border-slate-600 rounded">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white text-[11px] font-bold uppercase tracking-wider divide-x divide-slate-700">
                  <th className="py-2.5 px-3">Expense ID #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Supplier / Vendor</th>
                  <th className="py-2.5 px-3">Total Amount</th>
                  <th className="py-2.5 px-3">Paid / Due</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-200 dark:divide-slate-700 divide-x divide-slate-200 dark:divide-slate-700 text-xs font-medium">
                {filtered.length > 0 ? (
                  filtered.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                      <td className="py-2.5 px-3 font-mono font-bold text-purple-600 dark:text-purple-400">{p.billNumber}</td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-bold">{formatDate(p.date)}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                        {p.supplierName}
                        {p.supplierPhone && <span className="block text-[10px] text-slate-400 font-normal">{p.supplierPhone}</span>}
                      </td>
                      <td className="py-2.5 px-3 font-black font-mono">{formatCurrency(p.totalAmount)}</td>
                      <td className="py-2.5 px-3 font-mono">
                        <span className="text-emerald-600 font-bold">Paid: {formatCurrency(p.amountPaid)}</span>
                        {p.pendingAmount > 0 && <span className="block text-rose-600 font-bold">Due: {formatCurrency(p.pendingAmount)}</span>}
                      </td>
                      <td className="py-2.5 px-3 font-bold">{p.paymentStatus}</td>
                      <td className="py-2.5 px-3 text-slate-500">{p.remarks || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">No home purchases recorded yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>

      </main>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </div>
  );
};

export default HomePurchasePage;
