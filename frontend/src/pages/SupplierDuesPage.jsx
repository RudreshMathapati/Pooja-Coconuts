import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';
import API from '../services/api';
import { formatCurrency, formatDate, getTodayDateString } from '../utils/formatters';
import { TableSkeleton } from '../components/common/Skeleton';
import { Search, Truck, DollarSign, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SupplierDuesPage = () => {
  const [purchaseType, setPurchaseType] = useState('Shop'); // 'Shop' or 'Home'
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Pay Supplier Modal states
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [amountPaid, setAmountPaid] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [notes, setNotes] = useState('');
  const [payLoading, setPayLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const navigate = useNavigate();

  const fetchDues = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/suppliers/dues?type=${purchaseType}`);
      setSuppliers(res.data || []);
    } catch (err) {
      console.error('Error fetching supplier dues', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDues();
  }, [purchaseType]);

  const handleOpenPay = (sup) => {
    setSelectedSupplier(sup);
    setAmountPaid('');
    setNotes('');
    setIsPayModalOpen(true);
  };

  const handlePaySupplierSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSupplier) return;
    const val = Number(amountPaid);
    if (!val || val <= 0) {
      setToast({ message: 'Enter a valid amount to pay', type: 'error' });
      return;
    }

    setPayLoading(true);
    try {
      await API.post('/payments/supplier', {
        supplierId: selectedSupplier._id,
        purchaseType,
        amountPaid: val,
        date,
        notes
      });
      setToast({ message: `Payment of ₹${val} recorded to ${selectedSupplier.name}!`, type: 'success' });
      setIsPayModalOpen(false);
      fetchDues();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to record supplier payment', type: 'error' });
    } finally {
      setPayLoading(false);
    }
  };

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.phone.includes(search)
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-12">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <div>
            <h1 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="w-6 h-6 text-rose-500" />
              <span>Supplier Outstanding Dues</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Payables ledger management for coconut farm vendors and copra suppliers.
            </p>
          </div>

          {/* Toggle Tabs: Shop Dues vs Home Dues */}
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setPurchaseType('Shop')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                purchaseType === 'Shop'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Shop Supplier Dues
            </button>
            <button
              onClick={() => setPurchaseType('Home')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                purchaseType === 'Home'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Home Supplier Dues
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Supplier / Party Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-900 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            />
          </div>
        </div>

        {/* Dues Table */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-6">
              <TableSkeleton rows={5} cols={5} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-900 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3.5 px-4">Party / Supplier Name</th>
                    <th className="py-3.5 px-4">Phone</th>
                    <th className="py-3.5 px-4">Total Purchased</th>
                    <th className="py-3.5 px-4">Amount Paid</th>
                    <th className="py-3.5 px-4">Pending Due</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filtered.length > 0 ? (
                    filtered.map((s) => {
                      const totalP = purchaseType === 'Shop' ? s.shopTotalPurchased : s.homeTotalPurchased;
                      const paidP = purchaseType === 'Shop' ? s.shopTotalPaid : s.homeTotalPaid;
                      const pendingP = purchaseType === 'Shop' ? s.shopPendingAmount : s.homePendingAmount;

                      return (
                        <tr key={s._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                            {s.name}
                            {s.address && <span className="block text-[10px] text-slate-400 font-normal">{s.address}</span>}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">{s.phone}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{formatCurrency(totalP)}</td>
                          <td className="py-3.5 px-4 text-emerald-600 font-bold">{formatCurrency(paidP)}</td>
                          <td className="py-3.5 px-4 font-extrabold text-rose-600 dark:text-rose-400 text-sm">{formatCurrency(pendingP)}</td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleOpenPay(s)}
                              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-[11px] shadow-sm transition inline-flex items-center gap-1"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>Pay Now</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        🎉 No pending supplier dues for {purchaseType} purchases!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      {/* Pay Supplier Modal */}
      <Modal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} title={`Settle ${purchaseType} Supplier Payment`} maxWidth="max-w-md">
        <form onSubmit={handlePaySupplierSubmit} className="space-y-4">
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl space-y-1">
            <p className="text-xs text-slate-400">Supplier Name</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedSupplier?.name}</p>
            <p className="text-xs text-rose-500 font-bold">
              Current {purchaseType} Due: {formatCurrency(purchaseType === 'Shop' ? selectedSupplier?.shopPendingAmount : selectedSupplier?.homePendingAmount)}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-sm rounded-xl border outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount Paid (₹) *</label>
            <input
              type="number"
              min="1"
              max={purchaseType === 'Shop' ? selectedSupplier?.shopPendingAmount : selectedSupplier?.homePendingAmount}
              placeholder="Enter amount paid to supplier"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-sm rounded-xl border font-bold text-rose-600 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Method</label>
            <input
              type="text"
              value="Cash"
              disabled
              className="w-full px-3 py-2 bg-slate-200 dark:bg-slate-900 text-sm rounded-xl border text-slate-500 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Remarks / Voucher Notes</label>
            <textarea
              rows="2"
              placeholder="e.g. Paid cash voucher"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-sm rounded-xl border outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={() => setIsPayModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-500">Cancel</button>
            <button type="submit" disabled={payLoading} className="px-5 py-2 text-xs font-bold text-white bg-rose-600 rounded-xl shadow">
              {payLoading ? 'Saving...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </div>
  );
};

export default SupplierDuesPage;
