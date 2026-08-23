import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import API from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { exportToExcel } from '../utils/excelExporter';
import { TableSkeleton } from '../components/common/Skeleton';
import {
  FileSpreadsheet,
  Download,
  Filter,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Boxes,
  Calendar,
  Sparkles
} from 'lucide-react';

const ReportsPage = () => {
  const [reportType, setReportType] = useState('Sales');
  const [filter, setFilter] = useState('Monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      let url = `/reports?reportType=${reportType}&filter=${filter}`;
      if (filter === 'Custom' && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      const res = await API.get(url);
      setReportData(res.data);
    } catch (err) {
      console.error('Failed to load reports data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [reportType, filter, startDate, endDate]);

  const handleExport = () => {
    if (!reportData || !reportData.data) return;
    let exportRows = [];

    if (Array.isArray(reportData.data)) {
      exportRows = reportData.data;
    } else if (typeof reportData.data === 'object') {
      exportRows = [reportData.data];
    }

    exportToExcel(exportRows, `Pooja_Coconuts_${reportType}_Report`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-12">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Business Intelligence & Accounting</span>
            </div>
            <h1 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-white mt-1">
              Business Reports & Analytics
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Generate sales, dual purchase, customer due, profit & loss, and collection reports with Excel export.
            </p>
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export to Excel (.xlsx)</span>
          </button>
        </div>

        {/* Filters Toolbar */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
          
          {/* Report Category Selection */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'Sales', label: 'Sales Report', icon: TrendingUp },
              { id: 'ShopPurchase', label: 'Shop Purchases', icon: ShoppingBag },
              { id: 'HomePurchase', label: 'Home Expenses', icon: ShoppingBag },
              { id: 'OutstandingCustomers', label: 'Outstanding Customers', icon: Users },
              { id: 'OutstandingSuppliers', label: 'Outstanding Suppliers', icon: Users },
              { id: 'Profit', label: 'Profit & Loss', icon: DollarSign },
              { id: 'Inventory', label: 'Inventory Log', icon: Boxes },
              { id: 'TopLeastProducts', label: 'Top / Least Products', icon: Sparkles },
            ].map(r => {
              const Icon = r.icon;
              return (
                <button
                  key={r.id}
                  onClick={() => setReportType(r.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                    reportType === r.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{r.label}</span>
                </button>
              );
            })}
          </div>

          {/* Date Filter Range Preset Selector */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/80">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-emerald-500" />
              <span>Date Filter:</span>
            </span>

            {['Today', 'Yesterday', 'Weekly', 'Monthly', 'Yearly', 'Custom'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  filter === f
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                {f}
              </button>
            ))}

            {filter === 'Custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900 text-xs rounded-xl border"
                />
                <span className="text-xs text-slate-400">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900 text-xs rounded-xl border"
                />
              </div>
            )}
          </div>

        </div>

        {/* Dynamic Report Content View */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 p-6 shadow-sm">
          {loading ? (
            <TableSkeleton rows={6} cols={5} />
          ) : (
            <div>
              {/* Profit & Loss Report View */}
              {reportType === 'Profit' && (
                <div className="space-y-6">
                  <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white">
                    Profit & Loss Summary ({filter})
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl space-y-1">
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold uppercase">Total Sales Revenue</p>
                      <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(reportData?.data?.totalSalesRevenue)}</p>
                      <p className="text-xs text-slate-500">{reportData?.data?.salesCount} Total Invoices Issued</p>
                    </div>

                    <div className="p-6 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 rounded-2xl space-y-1">
                      <p className="text-xs text-blue-700 dark:text-blue-400 font-semibold uppercase">Total Shop Procurement Cost</p>
                      <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{formatCurrency(reportData?.data?.totalShopPurchaseCost)}</p>
                      <p className="text-xs text-slate-500">{reportData?.data?.purchaseCount} Stock Procurements</p>
                    </div>

                    <div className="p-6 bg-slate-900 text-white rounded-2xl space-y-1 shadow-lg">
                      <p className="text-xs text-emerald-400 font-semibold uppercase">Calculated Net Profit</p>
                      <p className="text-3xl font-extrabold text-emerald-400">{formatCurrency(reportData?.data?.netProfit)}</p>
                      <p className="text-xs text-slate-400">Net business gross margin</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Default Table View for Sales, Purchases, Dues */}
              {(reportType === 'Sales' || reportType === 'ShopPurchase' || reportType === 'HomePurchase') && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-900 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <th className="py-3 px-4">Bill #</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Party / Name</th>
                        <th className="py-3 px-4">Total Amount</th>
                        <th className="py-3 px-4">Paid Amount</th>
                        <th className="py-3 px-4">Pending Due</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {Array.isArray(reportData?.data) && reportData.data.length > 0 ? (
                        reportData.data.map((row) => (
                          <tr key={row._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                            <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">{row.billNumber}</td>
                            <td className="py-3 px-4">{formatDate(row.date)}</td>
                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{row.customerName || row.supplierName}</td>
                            <td className="py-3 px-4 font-extrabold">{formatCurrency(row.grandTotal || row.totalAmount)}</td>
                            <td className="py-3 px-4 text-emerald-600 font-bold">{formatCurrency(row.amountPaid)}</td>
                            <td className="py-3 px-4 text-amber-600 font-bold">{formatCurrency(row.pendingAmount)}</td>
                            <td className="py-3 px-4 font-semibold">{row.paymentStatus}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="py-12 text-center text-slate-400">No records found for selected period</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Outstanding Customers Report */}
              {reportType === 'OutstandingCustomers' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-900 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <th className="py-3 px-4">Customer Name</th>
                        <th className="py-3 px-4">Phone</th>
                        <th className="py-3 px-4">Total Purchased</th>
                        <th className="py-3 px-4">Total Paid</th>
                        <th className="py-3 px-4">Pending Due Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {Array.isArray(reportData?.data) && reportData.data.length > 0 ? (
                        reportData.data.map((c) => (
                          <tr key={c._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{c.name}</td>
                            <td className="py-3 px-4 font-mono">{c.phone}</td>
                            <td className="py-3 px-4 font-bold">{formatCurrency(c.totalPurchased)}</td>
                            <td className="py-3 px-4 text-emerald-600 font-bold">{formatCurrency(c.totalPaid)}</td>
                            <td className="py-3 px-4 text-amber-600 font-extrabold text-sm">{formatCurrency(c.pendingAmount)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="5" className="py-8 text-center text-slate-400">No outstanding customer dues</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Top & Least Products */}
              {reportType === 'TopLeastProducts' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-bold text-sm text-emerald-600 mb-3 uppercase tracking-wider">Top Selling Coconut Items</h4>
                    <div className="space-y-2">
                      {reportData?.data?.topProducts?.map((p, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl flex justify-between items-center text-xs">
                          <span className="font-bold">{p._id}</span>
                          <span className="font-mono text-emerald-600 font-extrabold">{p.totalQuantitySold} Units Sold</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-rose-600 mb-3 uppercase tracking-wider">Slow Moving Coconut Items</h4>
                    <div className="space-y-2">
                      {reportData?.data?.leastProducts?.map((p, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl flex justify-between items-center text-xs">
                          <span className="font-bold">{p._id}</span>
                          <span className="font-mono text-slate-500 font-extrabold">{p.totalQuantitySold} Units Sold</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default ReportsPage;
