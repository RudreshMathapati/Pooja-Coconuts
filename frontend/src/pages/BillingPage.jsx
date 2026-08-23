import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Toast from '../components/common/Toast';
import API from '../services/api';
import { formatCurrency, getTodayDateString } from '../utils/formatters';
import { generateInvoicePDF } from '../utils/pdfExporter';
import {
  Plus,
  Trash2,
  Save,
  Send,
  FileText,
  User,
  Phone,
  Calendar,
  Search,
  ChevronDown
} from 'lucide-react';

const createEmptyRow = () => ({
  product: '',
  name: '',
  unit: 'Pcs',
  quantity: 1,
  rate: 0,
  total: 0
});

const BillingPage = () => {
  const [billNumber, setBillNumber] = useState('PC-0001');
  const [date, setDate] = useState(getTodayDateString());
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Products catalog for autocomplete search
  const [products, setProducts] = useState([]);
  const [customersList, setCustomersList] = useState([]);

  // Active suggestions dropdown row index
  const [activeSearchRow, setActiveSearchRow] = useState(null);

  // Initialize with 4 crisp invoice bill rows
  const [items, setItems] = useState([
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow()
  ]);

  // Pricing & Payment Calculations
  const [gstPercent, setGstPercent] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState('Paid'); // 'Paid', 'Pending', or 'Partial'
  const [amountPaidInput, setAmountPaidInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [settings, setSettings] = useState(null);

  const navigate = useNavigate();

  // Load initial Bill #, Products, Customers and Settings
  useEffect(() => {
    API.get('/sales/next-bill-number').then(res => {
      setBillNumber(res.data.billNumber);
    }).catch(console.error);

    API.get('/products').then(res => {
      setProducts(res.data || []);
    }).catch(console.error);

    API.get('/customers').then(res => {
      setCustomersList(res.data || []);
    }).catch(console.error);

    API.get('/settings').then(res => {
      setSettings(res.data);
    }).catch(console.error);
  }, []);

  // Handle Customer Selection Autocomplete
  const handleCustomerSelect = (nameInput) => {
    setCustomerName(nameInput);
    const found = customersList.find(c => c.name.toLowerCase() === nameInput.toLowerCase());
    if (found) {
      setCustomerPhone(found.phone);
      if (found.gstNumber) setGstNumber(found.gstNumber);
    }
  };

  // Item Row Operations
  const handleItemNameChange = (index, value) => {
    const newItems = [...items];
    newItems[index].name = value;
    setActiveSearchRow(index);

    // If exact match found in inventory, auto fill details
    const foundProd = products.find(p => p.name.toLowerCase() === value.toLowerCase());
    if (foundProd) {
      newItems[index].product = foundProd._id;
      newItems[index].unit = foundProd.unit;
      newItems[index].rate = foundProd.rate;
      newItems[index].total = newItems[index].quantity * foundProd.rate;
    }

    setItems(newItems);
  };

  const handleSelectProductSuggestion = (index, selectedProd) => {
    const newItems = [...items];
    newItems[index].product = selectedProd._id;
    newItems[index].name = selectedProd.name;
    newItems[index].unit = selectedProd.unit;
    newItems[index].rate = selectedProd.rate;
    newItems[index].total = (newItems[index].quantity || 1) * selectedProd.rate;
    setItems(newItems);
    setActiveSearchRow(null);
  };

  const handleItemQuantityRateChange = (index, field, value) => {
    const newItems = [...items];
    const item = { ...newItems[index] };

    if (field === 'quantity') {
      item.quantity = value === '' ? '' : Math.max(0, Number(value) || 0);
    } else if (field === 'rate') {
      item.rate = value === '' ? '' : Math.max(0, Number(value) || 0);
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

  const removeItemRow = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  // Filter filled items
  const activeFilledItems = items.filter(i => i.name && i.name.trim().length > 0);

  // Calculations
  const subtotal = items.reduce((sum, i) => sum + (Number(i.total) || 0), 0);
  const gstAmount = Math.round((subtotal * (Number(gstPercent) || 0)) / 100);
  const grandTotal = subtotal + gstAmount;

  const actualAmountPaid = paymentStatus === 'Paid'
    ? grandTotal
    : (paymentStatus === 'Pending' ? 0 : Number(amountPaidInput) || 0);

  const pendingAmount = Math.max(0, grandTotal - actualAmountPaid);

  // Submit Sale Invoice
  const handleSaveBill = async (actionType = 'SAVE') => {
    if (!customerName.trim()) {
      setToast({ message: 'Customer Name is required!', type: 'error' });
      return;
    }

    const validItemsToSave = items.filter(i => i.name && i.name.trim().length > 0 && i.quantity > 0);

    if (validItemsToSave.length === 0) {
      setToast({ message: 'Please type/select item name for at least 1 bill row!', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        billNumber,
        date,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        gstNumber: gstNumber.trim(),
        items: validItemsToSave,
        subtotal,
        gstPercent: Number(gstPercent) || 0,
        gstAmount,
        grandTotal,
        amountPaid: actualAmountPaid,
        paymentStatus: pendingAmount === 0 ? 'Paid' : (actualAmountPaid === 0 ? 'Pending' : 'Partial'),
        notes
      };

      const res = await API.post('/sales', payload);
      const { sale, whatsappUrl } = res.data;

      setToast({ message: `Bill #${sale.billNumber} created successfully!`, type: 'success' });

      if (actionType === 'PDF') {
        generateInvoicePDF(sale, settings);
      }

      if (actionType === 'WHATSAPP' && whatsappUrl) {
        // Open WhatsApp Web directly (without downloading PDF to disk)
        window.open(whatsappUrl, '_blank');
      }

      setTimeout(() => {
        navigate('/sales');
      }, 1000);
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to save bill', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 pb-16" onClick={() => setActiveSearchRow(null)}>
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Invoice Page Container - Clean Crisp Enterprise Format */}
        <div className="bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 shadow-lg rounded-xl p-6 sm:p-8 space-y-6">
          
          {/* Header Banner Section matching physical bill pad */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-300 dark:border-slate-700 pb-4 gap-4">
            <div>
              <p className="text-[11px] font-bold text-rose-700 dark:text-rose-400 italic">|| Shri Sangameshwar Prasanna ||</p>
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase font-sans">
                M/s. POOJA COCONUT & GENERAL MERCHANT
              </h1>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Basava Gunj, BASAVAKALYAN-585 327. Dst. Bidar. (K.S)
              </p>
              <p className="text-xs text-slate-500 font-mono">Cell: 9449458675 | GSTIN: 29AIDPM4039Q1ZN</p>
            </div>

            <div className="text-right sm:text-right border-l-2 border-slate-300 dark:border-slate-700 pl-4">
              <span className="text-xs uppercase font-extrabold text-slate-500 block">CASH/CREDIT BILL</span>
              <span className="text-xl font-mono font-black text-black-700 dark:text-rose-400">{billNumber}</span>
            </div>
          </div>

          {/* Customer & Bill Details Table Header */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900 p-4 border border-slate-300 dark:border-slate-700 rounded-lg">
            
            {/* Bill Date */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Bill Date *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 bg-white dark:bg-slate-800 text-xs rounded border border-slate-300 dark:border-slate-600 font-medium focus:ring-1 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>
            </div>

            {/* Customer Name */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Customer Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Type customer name"
                  value={customerName}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 bg-white dark:bg-slate-800 text-xs rounded border border-slate-300 dark:border-slate-600 font-bold focus:ring-1 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>
            </div>

            {/* Customer Phone */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Customer Phone
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Mobile #"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 bg-white dark:bg-slate-800 text-xs rounded border border-slate-300 dark:border-slate-600 font-mono focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* GSTIN (Optional) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                GSTIN (Optional)
              </label>
              <input
                type="text"
                placeholder="29ABCDE1234F1Z5"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 text-xs rounded border border-slate-300 dark:border-slate-600 font-mono focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>

          </div>

          {/* EXACT TABLE FORMAT BILLING GRID */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Item Particulars Table (4 Rows Standard)
              </span>
              <button
                type="button"
                onClick={addItemRow}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white font-bold text-[11px] rounded shadow-sm flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Row</span>
              </button>
            </div>

            {/* Table Container with Strict Grid Borders */}
            <div className="overflow-visible border-2 border-slate-400 dark:border-slate-600 rounded">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800 text-white text-[11px] font-bold uppercase tracking-wider divide-x divide-slate-700">
                    <th className="py-2.5 px-3 w-12 text-center">S.No</th>
                    <th className="py-2.5 px-3 min-w-[280px]">Item Description (Type to Search Inventory)</th>
                    <th className="py-2.5 px-3 w-24 text-center">Unit</th>
                    <th className="py-2.5 px-3 w-24 text-center">Qty</th>
                    <th className="py-2.5 px-3 w-28 text-center">Rate (₹)</th>
                    <th className="py-2.5 px-3 w-32 text-right">Amount (₹)</th>
                    <th className="py-2.5 px-3 w-10 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-200 dark:divide-slate-700 divide-x divide-slate-200 dark:divide-slate-700 text-xs">
                  {items.map((item, idx) => {
                    const matchingSuggestions = products.filter(p =>
                      p.name.toLowerCase().includes((item.name || '').toLowerCase())
                    );

                    return (
                      <tr key={idx} className="relative hover:bg-slate-50 dark:hover:bg-slate-800/80">
                        
                        {/* S.No */}
                        <td className="py-2 px-2 text-center font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900">
                          {idx + 1}
                        </td>
                        
                        {/* Item Name Particulars */}
                        <td className="py-1.5 px-2 relative">
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              placeholder={`Row #${idx + 1} item description...`}
                              value={item.name}
                              onFocus={(e) => {
                                e.stopPropagation();
                                setActiveSearchRow(idx);
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveSearchRow(idx);
                              }}
                              onChange={(e) => handleItemNameChange(idx, e.target.value)}
                              className="w-full pl-7 pr-7 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          </div>

                          {/* Autocomplete Dropdown */}
                          {activeSearchRow === idx && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute left-2 right-2 top-10 z-50 bg-white dark:bg-slate-800 border-2 border-slate-400 dark:border-slate-600 rounded shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700"
                            >
                              <div className="px-3 py-1 bg-slate-800 text-[10px] uppercase font-bold text-white">
                                Inventory Items ({matchingSuggestions.length})
                              </div>
                              {matchingSuggestions.length > 0 ? (
                                matchingSuggestions.map((prod) => (
                                  <div
                                    key={prod._id}
                                    onClick={() => handleSelectProductSuggestion(idx, prod)}
                                    className="px-3 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-950 cursor-pointer flex items-center justify-between"
                                  >
                                    <div>
                                      <p className="font-bold text-xs text-slate-900 dark:text-white">{prod.name}</p>
                                      <p className="text-[10px] text-slate-500">Stock: {prod.stock} {prod.unit}</p>
                                    </div>
                                    <span className="text-xs font-extrabold text-emerald-600">
                                      ₹{prod.rate} / {prod.unit}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <div className="px-3 py-2 text-[11px] text-slate-400 text-center">
                                  No inventory match. Item will save as custom text.
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Unit */}
                        <td className="py-1.5 px-2 text-center">
                          <input
                            type="text"
                            value={item.unit || 'Pcs'}
                            onChange={(e) => handleItemQuantityRateChange(idx, 'unit', e.target.value)}
                            className="w-full px-1 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs text-center font-semibold font-mono focus:outline-none"
                          />
                        </td>

                        {/* Qty */}
                        <td className="py-1.5 px-2 text-center">
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={item.quantity}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => handleItemQuantityRateChange(idx, 'quantity', e.target.value)}
                            className="w-full px-1 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs text-center font-extrabold focus:outline-none"
                          />
                        </td>

                        {/* Rate */}
                        <td className="py-1.5 px-2 text-center">
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={item.rate}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => handleItemQuantityRateChange(idx, 'rate', e.target.value)}
                            className="w-full px-1 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs text-center font-extrabold text-emerald-600 focus:outline-none"
                          />
                        </td>

                        {/* Total Amount */}
                        <td className="py-2 px-3 text-right font-extrabold text-slate-900 dark:text-white text-sm bg-slate-50 dark:bg-slate-900">
                          {formatCurrency(item.total)}
                        </td>

                        {/* Action Delete */}
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            disabled={items.length <= 1}
                            className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-20"
                            title="Delete row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>



          {/* Bottom Accounting Summary - Standard Invoice Format */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t-2 border-slate-300 dark:border-slate-700">
            
            {/* Payment Details */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Payment Status *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('Paid')}
                    className={`py-1.5 px-2 rounded text-xs font-bold border ${
                      paymentStatus === 'Paid' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    Paid (Full)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('Pending')}
                    className={`py-1.5 px-2 rounded text-xs font-bold border ${
                      paymentStatus === 'Pending' ? 'bg-amber-600 text-white border-amber-600' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    Pending (Credit)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('Partial')}
                    className={`py-1.5 px-2 rounded text-xs font-bold border ${
                      paymentStatus === 'Partial' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    Partial Paid
                  </button>
                </div>
              </div>

              {paymentStatus === 'Partial' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Amount Paid Today (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={grandTotal}
                    value={amountPaidInput}
                    onChange={(e) => setAmountPaidInput(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 text-xs rounded border border-slate-300 font-bold outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Payment Mode
                </label>
                <input
                  type="text"
                  value="Cash"
                  disabled
                  className="w-full px-2 py-1.5 bg-slate-200 dark:bg-slate-900 text-xs rounded border border-slate-300 font-bold text-slate-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Bill Remarks / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Counter cash sale"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 text-xs rounded border border-slate-300 outline-none"
                />
              </div>
            </div>

            {/* Calculations Total Summary Table */}
            <div className="border-2 border-slate-400 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-900 p-4 space-y-2 font-mono text-xs">
              <div className="flex justify-between text-slate-700 dark:text-slate-300">
                <span>Subtotal ({activeFilledItems.length} items):</span>
                <span className="font-bold">{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span>GST Tax (%):</span>
                <input
                  type="number"
                  min="0"
                  max="28"
                  value={gstPercent}
                  onChange={(e) => setGstPercent(e.target.value)}
                  className="w-16 px-1 py-0.5 text-right bg-white dark:bg-slate-800 border border-slate-300 rounded font-bold"
                />
              </div>

              {gstAmount > 0 && (
                <div className="flex justify-between text-slate-700 dark:text-slate-300">
                  <span>GST Tax Amount:</span>
                  <span className="font-bold">{formatCurrency(gstAmount)}</span>
                </div>
              )}

              <div className="pt-2 border-t-2 border-slate-400 dark:border-slate-600 flex justify-between text-sm font-black text-slate-900 dark:text-white">
                <span>GRAND TOTAL:</span>
                <span className="text-emerald-700 dark:text-emerald-400">{formatCurrency(grandTotal)}</span>
              </div>

              <div className="flex justify-between font-bold text-emerald-600">
                <span>AMOUNT PAID:</span>
                <span>{formatCurrency(actualAmountPaid)}</span>
              </div>

              <div className="flex justify-between font-black text-amber-600 pt-1 border-t border-slate-300 dark:border-slate-700">
                <span>CUSTOMER DUE:</span>
                <span>{formatCurrency(pendingAmount)}</span>
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-slate-300 dark:border-slate-700">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSaveBill('SAVE')}
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded shadow transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Save Bill</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleSaveBill('WHATSAPP')}
              className="flex items-center gap-1.5 px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded shadow transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>Save & Send WhatsApp</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleSaveBill('PDF')}
              className="flex items-center gap-2 px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded shadow transition disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              <span>Generate PDF</span>
            </button>
          </div>

        </div>

      </main>

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  );
};

export default BillingPage;
