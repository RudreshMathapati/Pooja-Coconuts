import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';
import API from '../services/api';
import { formatCurrency, formatDate, getStatusColorClass, getTodayDateString } from '../utils/formatters';
import { exportToExcel } from '../utils/excelExporter';
import {
  ArrowLeft,
  Phone,
  Truck,
  ShoppingCart,
  TrendingDown,
  FileSpreadsheet,
  DollarSign,
  Receipt,
  CheckCircle2,
  MapPin,
  Hash,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const SupplierDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('SHOP');
  const [expandedPurchase, setExpandedPurchase] = useState(null);

  // Pay supplier modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(getTodayDateString());
  const [payNotes, setPayNotes] = useState('');
  const [payLoading, setPayLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const fetchSupplierDetails = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/suppliers/${id}`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load supplier details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplierDetails();
  }, [id]);

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    const val = Number(payAmount);
    if (!val || val <= 0) {
      setToast({ message: 'Enter a valid payment amount', type: 'error' });
      return;
    }
    setPayLoading(true);
    try {
      await API.post('/payments/supplier', {
        supplierId: id,
        purchaseType: activeTab === 'SHOP' ? 'Shop' : 'Home',
        amountPaid: val,
        date: payDate,
        notes: payNotes
      });
      setToast({ message: `Payment of ${formatCurrency(val)} recorded successfully!`, type: 'success' });
      setIsPayModalOpen(false);
      setPayAmount('');
      setPayNotes('');
      fetchSupplierDetails();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to record payment', type: 'error' });
    } finally {
      setPayLoading(false);
    }
  };

  const handleExportExcel = () => {
    const ledger = activeTab === 'SHOP' ? data?.shopLedger : data?.homeLedger;
    if (!ledger || ledger.length === 0) return;
    const rows = ledger.map(entry => ({
      'Date': formatDate(entry.date),
      'Type': entry.type === 'PURCHASE' ? 'Purchase' : 'Payment Made',
      'Bill / Reference': entry.billNumber || '-',
      'Purchase Amount (Rs)': entry.type === 'PURCHASE' ? entry.amount : '',
      'Payment Made (Rs)': entry.type === 'PAYMENT' ? entry.amount : '',
      'Remaining Due After (Rs)': entry.runningBalance,
      'Notes / Remarks': entry.type === 'PURCHASE' ? (entry.remarks || '') : (entry.notes || '')
    }));
    exportToExcel(rows, `${data?.supplier?.name}_${activeTab}_Ledger`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-12">
        <Header />
        <main className="max-w-7xl mx-auto px-6 py-12">
          <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-2xl w-48" />
            <div className="h-36 bg-slate-200 dark:bg-slate-700 rounded-3xl" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-28 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
              <div className="h-28 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
            </div>
            <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-3xl" />
          </div>
        </main>
      </div>
    );
  }

  const {
    supplier,
    shopLedger = [],
    homeLedger = [],
    shopSummary = {},
    homeSummary = {}
  } = data || {};

  const activeLedger = activeTab === 'SHOP' ? shopLedger : homeLedger;
  const activeSummary = activeTab === 'SHOP' ? shopSummary : homeSummary;
  const pendingDue = activeSummary.pendingAmount || 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-12">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Back */}
        <button
          onClick={() => navigate('/suppliers')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Supplier Directory</span>
        </button>

        {/* Supplier Header Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300 font-extrabold text-2xl flex items-center justify-center flex-shrink-0">
                {supplier?.name ? supplier.name[0].toUpperCase() : 'S'}
              </div>
              <div className="space-y-1.5">
                <h1 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-white">
                  {supplier?.name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-blue-400" />
                    {supplier?.phone}
                  </span>
                  {supplier?.gstNumber && (
                    <span className="flex items-center gap-1 font-mono bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-[10px]">
                      <Hash className="w-3 h-3" /> GSTIN: {supplier.gstNumber}
                    </span>
                  )}
                  {supplier?.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      {supplier.address}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 text-right space-y-0.5 min-w-[150px]">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                  {activeTab === 'SHOP' ? 'Shop' : 'Home'} Pending Due
                </p>
                <p className={`text-xl font-extrabold ${pendingDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {formatCurrency(pendingDue)}
                </p>
              </div>
              <button
                onClick={() => setIsPayModalOpen(true)}
                disabled={pendingDue <= 0}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition"
              >
                <DollarSign className="w-4 h-4" />
                <span>{pendingDue > 0 ? 'Pay Now' : 'No Dues'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Shop / Home Toggle Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Shop */}
          <button
            onClick={() => setActiveTab('SHOP')}
            className={`p-5 rounded-2xl border text-left transition-all duration-200 ${
              activeTab === 'SHOP'
                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/25 scale-[1.01]'
                : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700/80 hover:border-blue-300 dark:hover:border-blue-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`flex items-center gap-2 font-bold text-sm ${activeTab === 'SHOP' ? 'text-blue-100' : 'text-blue-600 dark:text-blue-400'}`}>
                <ShoppingCart className="w-4 h-4" />
                Shop Purchases
              </div>
              {activeTab === 'SHOP' && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
            </div>
            <div className="grid grid-cols-3 gap-2 text-left">
              {[
                { label: 'Purchased', val: shopSummary.totalPurchased, active_col: 'text-white', inactive_col: 'text-slate-900 dark:text-white' },
                { label: 'Paid', val: shopSummary.totalPaid, active_col: 'text-blue-100', inactive_col: 'text-emerald-600 dark:text-emerald-400' },
                { label: 'Due Left', val: shopSummary.pendingAmount, active_col: 'text-white', inactive_col: 'text-rose-600 dark:text-rose-400' }
              ].map(({ label, val, active_col, inactive_col }) => (
                <div key={label}>
                  <p className={`text-[10px] font-semibold uppercase ${activeTab === 'SHOP' ? 'text-blue-200' : 'text-slate-400'}`}>{label}</p>
                  <p className={`text-base font-extrabold ${activeTab === 'SHOP' ? active_col : inactive_col}`}>{formatCurrency(val || 0)}</p>
                </div>
              ))}
            </div>
          </button>

          {/* Home */}
          <button
            onClick={() => setActiveTab('HOME')}
            className={`p-5 rounded-2xl border text-left transition-all duration-200 ${
              activeTab === 'HOME'
                ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-500/25 scale-[1.01]'
                : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700/80 hover:border-purple-300 dark:hover:border-purple-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`flex items-center gap-2 font-bold text-sm ${activeTab === 'HOME' ? 'text-purple-100' : 'text-purple-600 dark:text-purple-400'}`}>
                <TrendingDown className="w-4 h-4" />
                Home Expenses
              </div>
              {activeTab === 'HOME' && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
            </div>
            <div className="grid grid-cols-3 gap-2 text-left">
              {[
                { label: 'Purchased', val: homeSummary.totalPurchased, active_col: 'text-white', inactive_col: 'text-slate-900 dark:text-white' },
                { label: 'Paid', val: homeSummary.totalPaid, active_col: 'text-purple-100', inactive_col: 'text-emerald-600 dark:text-emerald-400' },
                { label: 'Due Left', val: homeSummary.pendingAmount, active_col: 'text-white', inactive_col: 'text-rose-600 dark:text-rose-400' }
              ].map(({ label, val, active_col, inactive_col }) => (
                <div key={label}>
                  <p className={`text-[10px] font-semibold uppercase ${activeTab === 'HOME' ? 'text-purple-200' : 'text-slate-400'}`}>{label}</p>
                  <p className={`text-base font-extrabold ${activeTab === 'HOME' ? active_col : inactive_col}`}>{formatCurrency(val || 0)}</p>
                </div>
              ))}
            </div>
          </button>
        </div>

        {/* Ledger Table */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden">

          {/* Ledger Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-slate-100 dark:border-slate-700/80">
            <div>
              <h2 className="font-heading font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className={`w-4 h-4 ${activeTab === 'SHOP' ? 'text-blue-500' : 'text-purple-500'}`} />
                <span>{activeTab === 'SHOP' ? 'Shop' : 'Home'} Ledger — Full Transaction History</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Purchases increase due · Payments reduce due · Running balance shown after each entry (oldest first)
              </p>
            </div>
            <button
              onClick={handleExportExcel}
              disabled={activeLedger.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition disabled:opacity-40"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>Export Excel</span>
            </button>
          </div>

          {activeLedger.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Truck className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold">No {activeTab === 'SHOP' ? 'shop' : 'home'} transactions yet</p>
              <p className="text-xs mt-1">Record a purchase or payment to see the ledger.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4 w-8">#</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Transaction Type</th>
                    <th className="py-3 px-4">Bill # / Notes</th>
                    <th className="py-3 px-4 text-right text-blue-600 dark:text-blue-400">Purchase ↑ Due</th>
                    <th className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400">Payment ↓ Due</th>
                    <th className="py-3 px-4 text-right font-extrabold text-slate-700 dark:text-slate-200">Remaining Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {activeLedger.map((entry, idx) => {
                    const isPurchase = entry.type === 'PURCHASE';
                    const key = entry._id?.toString() || `entry-${idx}`;
                    const isExpanded = expandedPurchase === key;

                    return (
                      <React.Fragment key={key}>
                        <tr className={`text-xs transition-colors ${
                          isPurchase
                            ? 'bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/30'
                            : 'bg-emerald-50/30 dark:bg-emerald-950/10 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/25'
                        }`}>
                          {/* # */}
                          <td className="py-3.5 px-4 text-slate-400 font-mono text-[10px]">{idx + 1}</td>

                          {/* Date */}
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                            {formatDate(entry.date)}
                          </td>

                          {/* Type Badge */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              {isPurchase ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold rounded-full text-[10px] whitespace-nowrap">
                                  <ShoppingCart className="w-3 h-3" /> Purchase
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold rounded-full text-[10px] whitespace-nowrap">
                                  <CheckCircle2 className="w-3 h-3" /> Payment Made
                                </span>
                              )}
                              {isPurchase && entry.items && entry.items.length > 0 && (
                                <button
                                  onClick={() => setExpandedPurchase(isExpanded ? null : key)}
                                  className="flex items-center gap-0.5 text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium transition"
                                >
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                  {entry.items.length} item{entry.items.length !== 1 ? 's' : ''}
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Bill / Notes */}
                          <td className="py-3.5 px-4 max-w-[180px]">
                            {isPurchase ? (
                              <div>
                                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">
                                  {entry.billNumber && entry.billNumber !== '-' ? entry.billNumber : '—'}
                                </span>
                                {entry.remarks && (
                                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">{entry.remarks}</p>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[10px] italic">{entry.notes || '—'}</span>
                            )}
                          </td>

                          {/* Purchase Amt */}
                          <td className="py-3.5 px-4 text-right">
                            {isPurchase ? (
                              <span className="font-extrabold text-blue-700 dark:text-blue-300 text-sm">
                                +{formatCurrency(entry.amount)}
                              </span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                            )}
                          </td>

                          {/* Payment Amt */}
                          <td className="py-3.5 px-4 text-right">
                            {!isPurchase ? (
                              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                                -{formatCurrency(entry.amount)}
                              </span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                            )}
                          </td>

                          {/* Running Balance */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex flex-col items-end">
                              <span className={`font-extrabold text-sm ${
                                entry.runningBalance > 0
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-emerald-600 dark:text-emerald-400'
                              }`}>
                                {formatCurrency(entry.runningBalance)}
                              </span>
                              {entry.runningBalance <= 0 && (
                                <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider">✓ Cleared</span>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expandable Purchase Items */}
                        {isPurchase && isExpanded && entry.items && entry.items.length > 0 && (
                          <tr className={`${activeTab === 'SHOP' ? 'bg-blue-50/80 dark:bg-blue-950/30' : 'bg-purple-50/80 dark:bg-purple-950/30'}`}>
                            <td colSpan={7} className="px-8 py-3">
                              <div className="rounded-xl bg-white dark:bg-slate-800 border border-blue-100 dark:border-blue-900/40 overflow-hidden shadow-sm">
                                <div className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider ${activeTab === 'SHOP' ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400' : 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400'}`}>
                                  Items in this purchase (Bill: {entry.billNumber || '—'})
                                </div>
                                <table className="w-full text-left text-xs">
                                  <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] text-slate-400 font-semibold">
                                      <th className="py-2 px-4">Item Name</th>
                                      <th className="py-2 px-4">Qty</th>
                                      <th className="py-2 px-4">Unit</th>
                                      <th className="py-2 px-4 text-right">Rate (₹)</th>
                                      <th className="py-2 px-4 text-right">Total (₹)</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {entry.items.map((item, itemIdx) => (
                                      <tr key={itemIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">{item.name}</td>
                                        <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">{item.quantity}</td>
                                        <td className="py-2.5 px-4 text-slate-500">{item.unit || 'Pcs'}</td>
                                        <td className="py-2.5 px-4 text-right text-slate-600 dark:text-slate-300">{(item.rate || 0).toLocaleString('en-IN')}</td>
                                        <td className="py-2.5 px-4 text-right font-bold text-slate-900 dark:text-white">{(item.total || 0).toLocaleString('en-IN')}</td>
                                      </tr>
                                    ))}
                                    <tr className="bg-slate-50 dark:bg-slate-900">
                                      <td colSpan={4} className="py-2 px-4 text-right text-[11px] font-bold text-slate-500 uppercase">Total</td>
                                      <td className="py-2 px-4 text-right font-extrabold text-slate-900 dark:text-white">
                                        {formatCurrency(entry.amount)}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>

                {/* Summary Footer */}
                <tfoot>
                  <tr className="bg-slate-100 dark:bg-slate-900 border-t-2 border-slate-200 dark:border-slate-700">
                    <td colSpan={4} className="py-3.5 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Total — {activeSummary.purchaseCount || 0} purchases &amp; {activeSummary.paymentCount || 0} payments
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-blue-700 dark:text-blue-300 text-sm">
                      +{formatCurrency(activeSummary.totalPurchased || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                      -{formatCurrency(activeSummary.totalPaid || 0)}
                    </td>
                    <td className={`py-3.5 px-4 text-right font-extrabold text-base ${pendingDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {formatCurrency(pendingDue)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

      </main>

      {/* Pay Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title={`Record ${activeTab === 'SHOP' ? 'Shop' : 'Home'} Payment — ${supplier?.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handlePaySubmit} className="space-y-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1">
            <p className="text-xs text-slate-400">Supplier</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{supplier?.name}</p>
            <p className="text-xs text-rose-500 font-bold">
              Current {activeTab === 'SHOP' ? 'Shop' : 'Home'} Due: {formatCurrency(pendingDue)}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Date *</label>
            <input
              type="date"
              required
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-sm rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount Paid (₹) *</label>
            <input
              type="number"
              required
              min="1"
              max={pendingDue}
              placeholder="e.g. 50000"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-sm rounded-xl border border-slate-200 dark:border-slate-700 outline-none font-bold text-rose-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Remarks / Voucher Notes</label>
            <textarea
              rows="2"
              placeholder="e.g. Cash paid at farm, voucher #V-001"
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-sm rounded-xl border border-slate-200 dark:border-slate-700 outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={() => setIsPayModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700">
              Cancel
            </button>
            <button type="submit" disabled={payLoading} className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow transition disabled:opacity-60">
              {payLoading ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </div>
  );
};

export default SupplierDetailPage;
