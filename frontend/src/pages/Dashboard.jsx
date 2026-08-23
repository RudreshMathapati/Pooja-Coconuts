import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import Header from '../components/layout/Header';
import CollectPaymentModal from '../components/common/CollectPaymentModal';
import { StatCardSkeleton } from '../components/common/Skeleton';
import { formatCurrency, formatDate, getStatusColorClass } from '../utils/formatters';
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Calendar,
  Users,
  Truck,
  Layers,
  ArrowUpRight,
  Plus,
  ArrowRight,
  Receipt
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await API.get('/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 pb-12">
      <Header onOpenCollectModal={() => setIsCollectModalOpen(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Enterprise Welcome Banner */}
        <div className="bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-1 rounded font-mono">
              ENTERPRISE BUSINESS CONSOLE
            </span>
            <h2 className="font-heading font-black text-2xl text-slate-900 dark:text-white uppercase tracking-tight">
              Pooja Coconuts Business Dashboard
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-xs">
              Live tracking of billing sales, inventory stock levels, customer dues, and dual purchases.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/sales/new')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded shadow transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Bill</span>
            </button>
          </div>
        </div>

        {/* 8 Primary KPI Metric Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Today Sales */}
            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-300 dark:border-slate-700 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Today's Sales</span>
                <div className="p-2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {formatCurrency(stats?.todaySales)}
              </p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                Direct billing sales today
              </p>
            </div>

            {/* Today Shop Purchase */}
            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-300 dark:border-slate-700 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Today's Purchase</span>
                <div className="p-2 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {formatCurrency(stats?.todayPurchase)}
              </p>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase">
                Stock Inventory additions
              </p>
            </div>

            {/* Today Estimated Profit */}
            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-300 dark:border-slate-700 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Today's Profit</span>
                <div className="p-2 rounded bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-400">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {formatCurrency(stats?.todayProfit)}
              </p>
              <p className="text-[10px] text-teal-600 dark:text-teal-400 font-bold uppercase">
                Net calculated margin
              </p>
            </div>

            {/* Today Collection */}
            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-300 dark:border-slate-700 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Today's Collection</span>
                <div className="p-2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {formatCurrency(stats?.todayCollection)}
              </p>
              <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase">
                Actual cash in hand collected
              </p>
            </div>

            {/* Pending Customer Payments */}
            <div
              onClick={() => navigate('/customers/dues')}
              className="p-4 bg-white dark:bg-slate-800 rounded-xl border-2 border-amber-300 dark:border-amber-700 shadow-sm space-y-2 cursor-pointer hover:bg-amber-50/50 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">Pending Customer Dues</span>
                <div className="p-2 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-amber-700 dark:text-amber-400 font-mono">
                {formatCurrency(stats?.pendingCustomerPayments)}
              </p>
              <p className="text-[10px] text-amber-800 dark:text-amber-300 font-bold uppercase flex items-center justify-between">
                <span>Receivable balance</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </p>
            </div>

            {/* Pending Supplier Payments */}
            <div
              onClick={() => navigate('/suppliers/dues')}
              className="p-4 bg-white dark:bg-slate-800 rounded-xl border-2 border-rose-300 dark:border-rose-700 shadow-sm space-y-2 cursor-pointer hover:bg-rose-50/50 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-rose-800 dark:text-rose-400 uppercase tracking-wider">Pending Supplier Dues</span>
                <div className="p-2 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400">
                  <Truck className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-rose-700 dark:text-rose-400 font-mono">
                {formatCurrency(stats?.pendingSupplierPayments)}
              </p>
              <p className="text-[10px] text-rose-800 dark:text-rose-300 font-bold uppercase flex items-center justify-between">
                <span>Shop supplier payable</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </p>
            </div>

            {/* Monthly Sales */}
            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-300 dark:border-slate-700 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Monthly Sales</span>
                <div className="p-2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {formatCurrency(stats?.monthlySales)}
              </p>
              <p className="text-[10px] text-slate-500 font-bold uppercase">
                Current month aggregate
              </p>
            </div>

            {/* Monthly Shop Purchase */}
            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-300 dark:border-slate-700 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Monthly Purchase</span>
                <div className="p-2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {formatCurrency(stats?.monthlyPurchase)}
              </p>
              <p className="text-[10px] text-slate-500 font-bold uppercase">
                Current month procurement
              </p>
            </div>

          </div>
        )}

        {/* Charts & Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Sales vs Purchase Trend Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl border-2 border-slate-300 dark:border-slate-700 shadow-sm space-y-4">
            <div>
              <h3 className="font-heading font-black text-lg text-slate-900 dark:text-white uppercase">
                Sales vs Purchase Trend (Last 7 Days)
              </h3>
              <p className="text-xs text-slate-500">
                Daily comparison between billing sales revenue and shop purchases
              </p>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.chartData || []}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="purGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.5} />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} fontWeight="bold" />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `₹${val/1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '6px', border: 'none', color: '#fff' }}
                    formatter={(val) => [`₹${val}`, '']}
                  />
                  <Area type="monotone" dataKey="sales" name="Sales" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#salesGrad)" />
                  <Area type="monotone" dataKey="purchase" name="Shop Purchase" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#purGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Selling Products Widget */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border-2 border-slate-300 dark:border-slate-700 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 border-b-2 border-slate-200 dark:border-slate-700 pb-2">
                <h3 className="font-heading font-black text-base text-slate-900 dark:text-white uppercase">
                  Top Selling Items
                </h3>
                <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded uppercase">
                  Fastest Moving
                </span>
              </div>

              <div className="space-y-2.5">
                {stats?.topProducts && stats.topProducts.length > 0 ? (
                  stats.topProducts.map((prod, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded bg-slate-800 text-white font-bold text-xs flex items-center justify-center font-mono">
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{prod._id}</p>
                          <p className="text-[10px] text-slate-500">{prod.totalQty} Units Sold</p>
                        </div>
                      </div>
                      <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(prod.totalRevenue)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center">No sales recorded yet</p>
                )}
              </div>
            </div>

            <button
              onClick={() => navigate('/inventory')}
              className="w-full mt-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded flex items-center justify-center gap-2 transition"
            >
              <span>Manage Inventory Stock</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Recent Bills & Purchases Tables Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Recent Sales Bills Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-300 dark:border-slate-700 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b-2 border-slate-200 dark:border-slate-700 pb-2">
              <div>
                <h3 className="font-heading font-black text-base text-slate-900 dark:text-white uppercase flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span>Recent Sales Bills</span>
                </h3>
              </div>
              <button
                onClick={() => navigate('/sales')}
                className="text-xs font-extrabold text-emerald-600 hover:underline flex items-center gap-1 uppercase"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto border-2 border-slate-400 dark:border-slate-600 rounded">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800 text-white text-[11px] font-bold uppercase tracking-wider divide-x divide-slate-700">
                    <th className="py-2.5 px-3">Bill #</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Total</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-200 dark:divide-slate-700 divide-x divide-slate-200 dark:divide-slate-700 text-xs font-medium">
                  {stats?.recentBills && stats.recentBills.length > 0 ? (
                    stats.recentBills.map((b) => (
                      <tr key={b._id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{b.billNumber}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{b.customerName}</td>
                        <td className="py-2.5 px-3 font-black font-mono">{formatCurrency(b.grandTotal)}</td>
                        <td className="py-2.5 px-3 font-bold">{b.paymentStatus}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="py-6 text-center text-slate-400">No sales bills generated yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Shop Purchases Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-300 dark:border-slate-700 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b-2 border-slate-200 dark:border-slate-700 pb-2">
              <div>
                <h3 className="font-heading font-black text-base text-slate-900 dark:text-white uppercase flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-blue-600" />
                  <span>Recent Shop Purchases</span>
                </h3>
              </div>
              <button
                onClick={() => navigate('/purchases/shop')}
                className="text-xs font-extrabold text-blue-600 hover:underline flex items-center gap-1 uppercase"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto border-2 border-slate-400 dark:border-slate-600 rounded">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800 text-white text-[11px] font-bold uppercase tracking-wider divide-x divide-slate-700">
                    <th className="py-2.5 px-3">Purchase #</th>
                    <th className="py-2.5 px-3">Supplier</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-200 dark:divide-slate-700 divide-x divide-slate-200 dark:divide-slate-700 text-xs font-medium">
                  {stats?.recentPurchases && stats.recentPurchases.length > 0 ? (
                    stats.recentPurchases.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">{p.billNumber}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{p.supplierName}</td>
                        <td className="py-2.5 px-3 font-black font-mono">{formatCurrency(p.totalAmount)}</td>
                        <td className="py-2.5 px-3 font-bold">{p.paymentStatus}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="py-6 text-center text-slate-400">No shop purchases recorded yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </main>

      {/* Collect Payment Modal */}
      <CollectPaymentModal
        isOpen={isCollectModalOpen}
        onClose={() => setIsCollectModalOpen(false)}
        onSuccess={() => fetchStats()}
      />
    </div>
  );
};

export default Dashboard;
