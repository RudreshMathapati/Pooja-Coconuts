import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import CollectPaymentModal from '../components/common/CollectPaymentModal';
import Toast from '../components/common/Toast';
import API from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { TableSkeleton } from '../components/common/Skeleton';
import { Search, UserCheck, History, ArrowUpRight, Plus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CustomerDuesPage = () => {
  const [dues, setDues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const navigate = useNavigate();

  const fetchDues = async () => {
    try {
      setLoading(true);
      const res = await API.get('/customers/dues');
      setDues(res.data || []);
    } catch (err) {
      console.error('Error fetching customer dues', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDues();
  }, []);

  const filteredDues = dues.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const totalOutstanding = dues.reduce((sum, c) => sum + c.pendingAmount, 0);

  const handleOpenCollect = (cust) => {
    setSelectedCustomer(cust);
    setIsCollectModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-12">
      <Header onOpenCollectModal={() => { setSelectedCustomer(null); setIsCollectModalOpen(true); }} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Banner Summary Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-600 via-amber-700 to-slate-900 p-6 rounded-3xl text-white shadow-xl">
          <div className="space-y-1">
            <span className="px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-200 text-xs font-semibold">
              Pending Debtors Management
            </span>
            <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-white mt-1">
              Customer Outstanding Payments
            </h1>
            <p className="text-xs text-amber-100">
              Track active customer pending balances and collect ledger payments.
            </p>
          </div>

          <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-right space-y-0.5 min-w-[200px]">
            <p className="text-xs text-amber-200 uppercase tracking-wider font-semibold">Total Outstanding Balance</p>
            <p className="text-2xl font-extrabold text-white">{formatCurrency(totalOutstanding)}</p>
            <p className="text-[10px] text-amber-300 font-mono">{dues.length} Active Debtors</p>
          </div>
        </div>

        {/* Search & Action Toolbar */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Customer Name or Phone Number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-900 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <button
            onClick={() => { setSelectedCustomer(null); setIsCollectModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition"
          >
            <UserCheck className="w-4 h-4" />
            <span>Collect Payment</span>
          </button>
        </div>

        {/* Outstanding Dues Table */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-6">
              <TableSkeleton rows={5} cols={6} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-900 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3.5 px-4">Customer Name</th>
                    <th className="py-3.5 px-4">Phone</th>
                    <th className="py-3.5 px-4">Total Purchased</th>
                    <th className="py-3.5 px-4">Total Paid</th>
                    <th className="py-3.5 px-4">Pending Amount</th>
                    <th className="py-3.5 px-4">Last Purchase Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filteredDues.length > 0 ? (
                    filteredDues.map((cust) => (
                      <tr key={cust._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          {cust.name}
                          {cust.address && <p className="text-[10px] text-slate-400 font-normal">{cust.address}</p>}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                          {cust.phone}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                          {formatCurrency(cust.totalPurchased)}
                        </td>
                        <td className="py-3.5 px-4 text-emerald-600 dark:text-emerald-400 font-bold">
                          {formatCurrency(cust.totalPaid)}
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-amber-600 dark:text-amber-400 text-sm">
                          {formatCurrency(cust.pendingAmount)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-medium">
                          {formatDate(cust.lastPurchaseDate)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenCollect(cust)}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-[11px] shadow-sm flex items-center gap-1 transition"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Collect Payment</span>
                            </button>

                            <button
                              onClick={() => navigate(`/customers/${cust._id}`)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
                              title="View Customer History"
                            >
                              <History className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400">
                        🎉 No pending customer dues found! All customer accounts are fully paid.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      <CollectPaymentModal
        isOpen={isCollectModalOpen}
        onClose={() => setIsCollectModalOpen(false)}
        customer={selectedCustomer}
        onSuccess={(msg) => {
          setToast({ message: msg, type: 'success' });
          fetchDues();
        }}
      />

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  );
};

export default CustomerDuesPage;
