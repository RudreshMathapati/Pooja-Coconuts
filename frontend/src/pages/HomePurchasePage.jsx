import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Toast from '../components/common/Toast';
import API from '../services/api';
import { formatCurrency, formatDate, getStatusColorClass, getTodayDateString } from '../utils/formatters';
import { TableSkeleton } from '../components/common/Skeleton';
import PurchaseBillModal from '../components/common/PurchaseBillModal';
import { Home, Plus, Trash2, Save, Search, AlertTriangle, ShieldCheck, Eye } from 'lucide-react';

const createEmptyRow = () => ({
  name: '',
  unit: 'Pcs',
  quantity: '',
  rate: '',
  total: 0
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

  // Dynamic Quantity-based & Flat Additional Charges: [{ name, quantity, rate, amount }]
  const [additionalCharges, setAdditionalCharges] = useState([]);

  // Suppliers options
  const [suppliersList, setSuppliersList] = useState([]);

  // Multi item rows - 4 blank input rows by default
  const [items, setItems] = useState([
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow()
  ]);

  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [settings, setSettings] = useState(null);

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
    API.get('/settings').then(res => setSettings(res.data)).catch(console.error);
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
      item.quantity = value === '' ? '' : Math.max(0, Number(value) || 0);
    } else if (field === 'rate') {
      item.rate = value === '' ? '' : Math.max(0, Number(value) || 0);
    } else if (field === 'name') {
      item.name = value;
    } else if (field === 'unit') {
      item.unit = value;
    }

    const q = Number(item.quantity) || 0;
    const r = Number(item.rate) || 0;
    item.total = q * r;

    newItems[index] = item;
    setItems(newItems);
  };

  const addItemRow = () => {
    setItems([...items, createEmptyRow()]);
  };

  const removeItemRow = (idx) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  // Additional charges dynamic handlers
  const totalItemsQuantity = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);

  const handleAddCharge = (presetName = '') => {
    setAdditionalCharges(prev => [
      ...prev,
      {
        name: presetName,
        quantity: totalItemsQuantity > 0 ? totalItemsQuantity : '',
        rate: '',
        amount: 0
      }
    ]);
  };

  const handleRemoveCharge = (index) => {
    setAdditionalCharges(prev => prev.filter((_, i) => i !== index));
  };

  const handleChargeChange = (index, field, value) => {
    const updated = [...additionalCharges];
    const row = { ...updated[index] };

    if (field === 'name') {
      row.name = value;
    } else if (field === 'quantity') {
      row.quantity = value === '' ? '' : Math.max(0, Number(value) || 0);
      const q = Number(row.quantity) || 0;
      const r = Number(row.rate) || 0;
      row.amount = Math.round(q * r * 100) / 100;
    } else if (field === 'rate') {
      row.rate = value;
      const q = Number(row.quantity) || 0;
      const r = Number(value) || 0;
      row.amount = Math.round(q * r * 100) / 100;
    } else if (field === 'amount') {
      row.amount = value === '' ? '' : Math.max(0, Number(value) || 0);
    }

    updated[index] = row;
    setAdditionalCharges(updated);
  };

  const additionalChargesTotal = additionalCharges.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const itemsSubtotal = items.reduce((sum, i) => sum + (Number(i.total) || 0), 0);
  const totalAmount = itemsSubtotal + additionalChargesTotal;
  const actualAmountPaid = paymentStatus === 'Paid' ? totalAmount : (paymentStatus === 'Pending' ? 0 : Number(amountPaidInput) || 0);
  const pendingAmount = Math.max(0, totalAmount - actualAmountPaid);

  const handleSubmitPurchase = async (e) => {
    e.preventDefault();
    if (!billNumber || !billNumber.trim()) {
      setToast({ message: 'Expense Bill Number is compulsory! (Enter "NO" or click Set NO button if supplier gave no bill)', type: 'error' });
      return;
    }

    if (!supplierName.trim()) {
      setToast({ message: 'Supplier / Party Name is required!', type: 'error' });
      return;
    }

    const validItems = items.filter(i => i.name && i.name.trim().length > 0 && Number(i.quantity) > 0);
    if (validItems.length === 0) {
      setToast({ message: 'Please enter at least 1 item with description and quantity (> 0)!', type: 'error' });
      return;
    }

    if (actualAmountPaid > totalAmount) {
      setToast({ message: `Paid amount (₹${actualAmountPaid}) cannot exceed total bill amount (₹${totalAmount})!`, type: 'error' });
      return;
    }

    const sanitizedItems = validItems.map(i => ({
      name: i.name.trim(),
      unit: i.unit || 'Pcs',
      quantity: Number(i.quantity) || 0,
      rate: Number(i.rate) || 0,
      total: (Number(i.quantity) || 0) * (Number(i.rate) || 0)
    }));

    const validCharges = additionalCharges
      .filter(c => c.name && c.name.trim().length > 0 && Number(c.amount) > 0)
      .map(c => ({
        name: c.name.trim(),
        quantity: Number(c.quantity) > 0 ? Number(c.quantity) : 1,
        rate: Number(c.rate) >= 0 ? Number(c.rate) : 0,
        amount: Number(c.amount) || 0
      }));

    setFormLoading(true);
    try {
      const payload = {
        purchaseType: 'Home',
        billNumber: billNumber.trim(),
        supplierName: supplierName.trim(),
        supplierPhone: supplierPhone.trim(),
        items: sanitizedItems,
        itemsSubtotal,
        additionalCharges: validCharges,
        additionalChargesTotal,
        totalAmount,
        amountPaid: actualAmountPaid,
        paymentStatus: pendingAmount === 0 ? 'Paid' : (actualAmountPaid === 0 ? 'Pending' : 'Partial'),
        remarks,
        date
      };

      const res = await API.post('/purchases', payload);
      setToast({ message: 'Home expense saved! (Isolated: 0 effect on shop inventory stock or sales profits)', type: 'success' });
      
      // Auto open official purchase bill voucher for review & printing
      if (res.data) {
        setSelectedPurchase(res.data);
      }

      // Reset Form with 4 blank input rows
      setSupplierName('');
      setSupplierPhone('');
      setRemarks('');
      setAmountPaidInput('');
      setBillNumber('');
      setAdditionalCharges([]);
      setItems([
        createEmptyRow(),
        createEmptyRow(),
        createEmptyRow(),
        createEmptyRow()
      ]);

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
              <div className="flex items-center justify-end gap-1.5 mb-1">
                <span className="text-xs uppercase font-extrabold text-slate-700 dark:text-slate-300">
                  EXPENSE BILL # <span className="text-rose-500 font-black">*</span>
                </span>
                <button
                  type="button"
                  onClick={() => setBillNumber('NO')}
                  className="text-[10px] font-extrabold bg-amber-100 hover:bg-amber-200 dark:bg-amber-950 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-300 transition"
                  title="If vendor gave no bill, click to enter 'NO'"
                >
                  Set "NO"
                </button>
              </div>
              <input
                type="text"
                required
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                placeholder="Bill No (or NO) *"
                className="text-right font-mono font-bold text-sm text-purple-700 dark:text-purple-400 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 outline-none w-48 placeholder:text-slate-400 placeholder:font-normal placeholder:text-xs"
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
                Home Expense Particulars Table (4 Rows Default)
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
                    <th className="py-2.5 px-3 w-28 text-center">Unit</th>
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
                          placeholder={`Row #${idx + 1} e.g. Copra oil for family`}
                          value={item.name}
                          onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs font-bold text-slate-900 dark:text-white outline-none"
                        />
                      </td>

                      {/* Locked Unit Dropdown: Owner cannot type or delete characters */}
                      <td className="py-1.5 px-2 text-center">
                        <select
                          value={item.unit || 'Pcs'}
                          onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                          className="w-full px-1.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs text-center font-bold font-mono text-slate-800 dark:text-slate-200 outline-none cursor-pointer focus:ring-1 focus:ring-purple-500"
                        >
                          <option value="Pcs">Pcs</option>
                          <option value="Bags">Bags</option>
                          <option value="KG">KG</option>
                          <option value="Quintal">Quintal</option>
                          <option value="Litre">Litre</option>
                        </select>
                      </td>

                      <td className="py-1.5 px-2 text-center">
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={item.quantity}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full px-1 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs text-center font-extrabold outline-none"
                        />
                      </td>

                      <td className="py-1.5 px-2 text-center">
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={item.rate}
                          onFocus={(e) => e.target.select()}
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

          {/* Dynamic Quantity-Based Additional Charges Section */}
          <div className="bg-purple-50/70 dark:bg-purple-950/30 border-2 border-purple-200 dark:border-purple-900/60 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-200/80 dark:border-purple-800/60 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300 font-bold text-[10px] uppercase font-mono tracking-wider">
                    + EXTRA EXPENSES & CHARGES
                  </span>
                  <h3 className="font-heading font-black text-xs sm:text-sm text-slate-900 dark:text-white uppercase tracking-wide">
                    Additional Charges (Grading, Counting, Transport, etc.)
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Quantity × Price/Rate (e.g. 300 coconuts × ₹0.145 grading) or direct flat amount.
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Charges Total</span>
                <span className="text-purple-700 dark:text-purple-400 font-black font-mono text-base">
                  +{formatCurrency(additionalChargesTotal)}
                </span>
              </div>
            </div>

            {/* Quick 1-Click Preset Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mr-1">Quick Add:</span>
              <button
                type="button"
                onClick={() => handleAddCharge('Grading')}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 rounded-lg text-xs font-bold transition shadow-sm"
              >
                + Grading
              </button>
              <button
                type="button"
                onClick={() => handleAddCharge('Counting')}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 rounded-lg text-xs font-bold transition shadow-sm"
              >
                + Counting
              </button>
              <button
                type="button"
                onClick={() => handleAddCharge('Transport / Freight')}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 rounded-lg text-xs font-bold transition shadow-sm"
              >
                + Transport
              </button>
              <button
                type="button"
                onClick={() => handleAddCharge('Packaging / Bags')}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 rounded-lg text-xs font-bold transition shadow-sm"
              >
                + Packaging
              </button>
              <button
                type="button"
                onClick={() => handleAddCharge('Loading / Unloading')}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 rounded-lg text-xs font-bold transition shadow-sm"
              >
                + Labour
              </button>
              <button
                type="button"
                onClick={() => handleAddCharge('')}
                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Custom Charge Row</span>
              </button>
            </div>

            {/* Additional Charges Table */}
            {additionalCharges.length > 0 ? (
              <div className="overflow-x-auto border border-purple-200 dark:border-purple-800/80 rounded-lg bg-white dark:bg-slate-800 shadow-sm mt-2">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-purple-900 text-white text-[10px] font-bold uppercase tracking-wider divide-x divide-purple-800">
                      <th className="py-2 px-2.5 w-10 text-center">#</th>
                      <th className="py-2 px-3 min-w-[200px]">Charge Name (e.g. Grading, Transport)</th>
                      <th className="py-2 px-3 w-28 text-center">Quantity</th>
                      <th className="py-2 px-3 w-32 text-center">Rate / Price (₹)</th>
                      <th className="py-2 px-3 w-32 text-right">Total (₹)</th>
                      <th className="py-2 px-2.5 w-10 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100 dark:divide-slate-700 text-xs">
                    {additionalCharges.map((ch, idx) => (
                      <tr key={idx} className="hover:bg-purple-50/50 dark:hover:bg-slate-700/40">
                        <td className="py-1.5 px-2 text-center font-bold text-slate-500 bg-slate-50 dark:bg-slate-900/50">
                          {idx + 1}
                        </td>

                        {/* Charge Name */}
                        <td className="py-1 px-2">
                          <input
                            type="text"
                            placeholder="e.g. Grading / Counting / Transport"
                            value={ch.name}
                            onChange={(e) => handleChargeChange(idx, 'name', e.target.value)}
                            className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-purple-500"
                          />
                        </td>

                        {/* Quantity */}
                        <td className="py-1 px-2 text-center">
                          <input
                            type="number"
                            min="0"
                            placeholder="Qty (e.g. 300)"
                            value={ch.quantity}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => handleChargeChange(idx, 'quantity', e.target.value)}
                            className="w-full px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs text-center font-mono font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-purple-500"
                          />
                        </td>

                        {/* Rate / Unit Price (Fine decimal support like 0.145) */}
                        <td className="py-1 px-2 text-center">
                          <input
                            type="text"
                            placeholder="Rate (e.g. 0.145)"
                            value={ch.rate}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => handleChargeChange(idx, 'rate', e.target.value)}
                            className="w-full px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs text-center font-mono font-bold text-purple-700 dark:text-purple-300 outline-none focus:ring-1 focus:ring-purple-500"
                          />
                        </td>

                        {/* Calculated or Flat Amount */}
                        <td className="py-1 px-2 text-right">
                          <div className="flex items-center justify-end gap-1 font-mono">
                            <span className="text-[10px] text-slate-400 font-sans">₹</span>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              placeholder="0.00"
                              value={ch.amount}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => handleChargeChange(idx, 'amount', e.target.value)}
                              className="w-24 px-1.5 py-1 bg-purple-50 dark:bg-slate-900 border border-purple-300 dark:border-purple-700 rounded text-xs text-right font-black text-purple-800 dark:text-purple-200 outline-none"
                            />
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-1 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveCharge(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-3 px-4 bg-white/60 dark:bg-slate-800/60 border border-dashed border-purple-200 dark:border-purple-800/80 rounded-lg text-center text-xs text-slate-500">
                No extra charges added. Click any quick button above like <b className="text-purple-700 dark:text-purple-400">+ Grading</b> or <b className="text-purple-700 dark:text-purple-400">+ Counting</b> to add quantity-based charges (e.g. 300 coconuts @ ₹0.145).
              </div>
            )}
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
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                      Amount Paid Now (₹)
                    </label>
                    <span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400">
                      Max: {formatCurrency(totalAmount)}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={totalAmount}
                    placeholder="0"
                    value={amountPaidInput}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val > totalAmount) {
                        setAmountPaidInput(totalAmount);
                      } else {
                        setAmountPaidInput(e.target.value);
                      }
                    }}
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
                <span>Items Subtotal:</span>
                <span className="font-bold">{formatCurrency(itemsSubtotal)}</span>
              </div>

              {additionalChargesTotal > 0 && (
                <div className="space-y-1 py-1 border-t border-dashed border-purple-200 dark:border-purple-800 text-[11px]">
                  <div className="flex justify-between font-bold text-purple-700 dark:text-purple-400">
                    <span>+ Extra Charges ({additionalCharges.filter(c => c.name && Number(c.amount) > 0).length}):</span>
                    <span>+{formatCurrency(additionalChargesTotal)}</span>
                  </div>
                  {additionalCharges.filter(c => c.name && Number(c.amount) > 0).map((ch, chIdx) => (
                    <div key={chIdx} className="flex justify-between text-slate-500 pl-2">
                      <span>
                        • {ch.name} {Number(ch.quantity) > 0 && Number(ch.rate) > 0 ? `(${ch.quantity} @ ₹${ch.rate})` : ''}:
                      </span>
                      <span>+{formatCurrency(ch.amount)}</span>
                    </div>
                  ))}
                </div>
              )}

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
                  <th className="py-2.5 px-3 text-center w-28">Bill Action</th>
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
                      <td className="py-2.5 px-3 font-black font-mono">
                        <div>{formatCurrency(p.totalAmount)}</div>
                        {p.additionalChargesTotal > 0 && (
                          <div className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold font-sans">
                            (incl. {formatCurrency(p.additionalChargesTotal)} extra)
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        <span className="text-emerald-600 font-bold">Paid: {formatCurrency(p.amountPaid)}</span>
                        {p.pendingAmount > 0 && <span className="block text-rose-600 font-bold">Due: {formatCurrency(p.pendingAmount)}</span>}
                      </td>
                      <td className="py-2.5 px-3 font-bold">{p.paymentStatus}</td>
                      <td className="py-2.5 px-3 text-slate-500">{p.remarks || '-'}</td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedPurchase(p)}
                          className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 dark:bg-purple-950 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded font-bold text-xs flex items-center justify-center gap-1 mx-auto transition"
                          title="View Official Purchase Bill"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Bill</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400">No home purchases recorded yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>

      </main>

      {/* Official Purchase Bill Viewer & Printable Voucher Modal */}
      <PurchaseBillModal
        isOpen={!!selectedPurchase}
        onClose={() => setSelectedPurchase(null)}
        purchase={selectedPurchase}
        settings={settings}
      />

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </div>
  );
};

export default HomePurchasePage;
