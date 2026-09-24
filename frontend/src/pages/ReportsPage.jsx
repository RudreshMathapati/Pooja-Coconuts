import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import API from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { exportToExcel } from '../utils/excelExporter';
import { generateSalesReportPDF } from '../utils/pdfExporter';
import { TableSkeleton } from '../components/common/Skeleton';
import {
  FileSpreadsheet,
  FileText,
  Download,
  Filter,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Boxes,
  Calendar,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Receipt
} from 'lucide-react';

const getCurrentMonthString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const formatMonthDisplay = (monthStr) => {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-').map(Number);
  if (!year || !month) return monthStr;
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

const getMonthDateRangeLabel = (monthStr) => {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-').map(Number);
  if (!year || !month) return monthStr;
  const lastDay = new Date(year, month, 0).getDate();
  const monthName = new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  return `${monthName} (01/${String(month).padStart(2, '0')}/${year} to ${lastDay}/${String(month).padStart(2, '0')}/${year})`;
};

const ReportsPage = () => {
  const [reportType, setReportType] = useState('Sales');
  const [filter, setFilter] = useState('Monthly');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthString());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [reportData, setReportData] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/settings').then(res => setSettings(res.data)).catch(console.error);
  }, []);

  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    let newYear = year;
    let newMonth = month - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    setSelectedMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    let newYear = year;
    let newMonth = month + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    setSelectedMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      let url = `/reports?reportType=${reportType}&filter=${filter}`;
      if (filter === 'Monthly' && selectedMonth) {
        url += `&month=${selectedMonth}`;
      } else if (filter === 'Custom' && startDate && endDate) {
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
  }, [reportType, filter, startDate, endDate, selectedMonth]);

  const handleExport = () => {
    if (!reportData || !reportData.data) return;
    let exportRows = [];

    if (reportType === 'Sales' && Array.isArray(reportData.data)) {
      exportRows = reportData.data.map((sale, idx) => ({
        'S.No': idx + 1,
        'Date': formatDate(sale.date),
        'Bill Number': sale.billNumber,
        'Customer Name': sale.customerName,
        'Items Name': (sale.items || []).map(i => i.name).join(', '),
        'Quantity': (sale.items || []).map(i => `${i.quantity} ${i.unit || 'Pcs'}`).join(', '),
        'Total Amount (₹)': sale.grandTotal
      }));
    } else if (Array.isArray(reportData.data)) {
      exportRows = reportData.data;
    } else if (typeof reportData.data === 'object') {
      exportRows = [reportData.data];
    }

    const monthTag = filter === 'Monthly' ? `_${selectedMonth}` : '';
    exportToExcel(exportRows, `Pooja_Coconuts_${reportType}_Report${monthTag}`);
  };

  const handleDownloadPDF = () => {
    if (!reportData || !reportData.data || !Array.isArray(reportData.data)) return;
    let periodLabel = `${filter}`;
    if (filter === 'Monthly') {
      periodLabel = getMonthDateRangeLabel(selectedMonth);
    } else if (filter === 'Custom') {
      periodLabel = `${startDate} to ${endDate}`;
    }
    generateSalesReportPDF(reportData.data, periodLabel, settings);
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
              Generate sales, dual purchase, customer due, profit & loss, and collection reports with Excel & PDF table export.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {reportType === 'Sales' && (
              <button
                onClick={handleDownloadPDF}
                disabled={!reportData?.data || !Array.isArray(reportData.data) || reportData.data.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-40"
                title="Download entire sales table as PDF"
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Download PDF Table</span>
              </button>
            )}

            <button
              onClick={handleExport}
              disabled={!reportData?.data}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-40"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export to Excel (.xlsx)</span>
            </button>
          </div>
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

          {/* Interactive Month Selector Bar (Active on Monthly Filter) */}
          {filter === 'Monthly' && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-dashed border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/20 p-3 rounded-2xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Select Month:</span>
                </span>

                <div className="flex items-center bg-white dark:bg-slate-900 rounded-xl border border-emerald-300 dark:border-emerald-700 shadow-sm overflow-hidden">
                  <button
                    onClick={handlePrevMonth}
                    title="Previous Month"
                    className="p-1.5 px-2 hover:bg-emerald-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-3 py-1 bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                  />

                  <button
                    onClick={handleNextMonth}
                    title="Next Month"
                    className="p-1.5 px-2 hover:bg-emerald-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border-l border-slate-200 dark:border-slate-700 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {selectedMonth !== getCurrentMonthString() && (
                  <button
                    onClick={() => setSelectedMonth(getCurrentMonthString())}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-sm transition flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Current Month</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">Period:</span>
                <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-900 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-sm">
                  {getMonthDateRangeLabel(selectedMonth)}
                </span>
              </div>
            </div>
          )}

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
                  <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Profit & Loss Summary</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full font-mono">
                      {filter === 'Monthly' ? formatMonthDisplay(selectedMonth) : filter}
                    </span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl space-y-1">
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold uppercase">Total Sales Revenue</p>
                      <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(reportData?.data?.totalSalesRevenue)}</p>
                      <p className="text-xs text-slate-500">{reportData?.data?.salesCount || 0} Total Invoices</p>
                    </div>

                    <div className="p-5 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 rounded-2xl space-y-1">
                      <p className="text-xs text-blue-700 dark:text-blue-400 font-semibold uppercase">Cost of Sold Items (COGS)</p>
                      <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{formatCurrency(reportData?.data?.totalCostOfGoodsSold)}</p>
                      <p className="text-xs text-slate-500">Purchase cost of sold goods</p>
                    </div>

                    <div className="p-5 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-900/60 rounded-2xl space-y-1">
                      <p className="text-xs text-purple-700 dark:text-purple-400 font-semibold uppercase">Shop Purchases</p>
                      <p className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">{formatCurrency(reportData?.data?.totalShopPurchaseCost)}</p>
                      <p className="text-xs text-slate-500">{reportData?.data?.purchaseCount || 0} Inventory Invoices</p>
                    </div>

                    <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-1 shadow-lg">
                      <p className="text-xs text-emerald-400 font-semibold uppercase">Real Net Profit</p>
                      <p className="text-2xl font-extrabold text-emerald-400">{formatCurrency(reportData?.data?.netProfit)}</p>
                      <p className="text-xs text-slate-400">{reportData?.data?.marginPercent ? `${reportData.data.marginPercent}% gross margin` : 'Sales − Purchase Cost'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Dedicated Sales Table View (Date, Customer Name, Bill #, Items Name, Qty, Amount) */}
              {reportType === 'Sales' && (() => {
                const salesList = Array.isArray(reportData?.data) ? reportData.data : [];
                const totalSalesAmount = salesList.reduce((sum, r) => sum + (Number(r.grandTotal) || 0), 0);
                const totalInvoices = salesList.length;
                const totalUnits = salesList.reduce((sum, r) => sum + (r.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0), 0);
                const avgBill = totalInvoices > 0 ? Math.round(totalSalesAmount / totalInvoices) : 0;

                return (
                  <div className="space-y-6">
                    {/* Monthly Sales Performance KPI Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">
                            Total {filter === 'Monthly' ? 'Monthly' : filter} Sales
                          </span>
                          <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                          {formatCurrency(totalSalesAmount)}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {filter === 'Monthly' ? formatMonthDisplay(selectedMonth) : filter}
                        </p>
                      </div>

                      <div className="p-4 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 rounded-2xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-blue-700 dark:text-blue-400 font-bold uppercase tracking-wider">Total Invoices</span>
                          <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
                          {totalInvoices} Bills
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium">Billed to customers</p>
                      </div>

                      <div className="p-4 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 rounded-2xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">Total Quantity Sold</span>
                          <Boxes className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                          {totalUnits} Units
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium">Coconuts & products sold</p>
                      </div>

                      <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-1 shadow-md">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Average Bill Value</span>
                          <DollarSign className="w-4 h-4 text-emerald-400" />
                        </div>
                        <p className="text-2xl font-black text-emerald-400 font-mono">
                          {formatCurrency(avgBill)}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium">Revenue per customer bill</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
                        <div className="flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-emerald-600" />
                          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                            Monthly Sales Statement
                          </h3>
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full font-mono">
                            {filter === 'Monthly' ? formatMonthDisplay(selectedMonth) : (filter === 'Custom' ? `${startDate} to ${endDate}` : filter)}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-slate-500">
                          {filter === 'Monthly' ? getMonthDateRangeLabel(selectedMonth) : ''}
                        </span>
                      </div>

                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-2xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                          <th className="py-3 px-3 text-center w-12">S.No</th>
                          <th className="py-3 px-3 text-center w-28">Date</th>
                          <th className="py-3 px-3 text-center w-28">Bill #</th>
                          <th className="py-3 px-4 min-w-[160px]">Customer Name</th>
                          <th className="py-3 px-4 min-w-[200px]">Items Name</th>
                          <th className="py-3 px-3 text-center min-w-[100px]">Quantity</th>
                          <th className="py-3 px-4 text-right min-w-[120px]">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-xs">
                        {Array.isArray(reportData?.data) && reportData.data.length > 0 ? (
                          reportData.data.map((row, idx) => {
                            const items = row.items || [];
                            return (
                              <tr key={row._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition">
                                <td className="py-3 px-3 text-center font-bold text-slate-500">
                                  {idx + 1}
                                </td>
                                <td className="py-3 px-3 text-center font-mono text-slate-700 dark:text-slate-300">
                                  {formatDate(row.date)}
                                </td>
                                <td className="py-3 px-3 text-center font-mono font-black text-emerald-600 dark:text-emerald-400">
                                  {row.billNumber}
                                </td>
                                <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                                  {row.customerName}
                                </td>
                                <td className="py-3 px-4">
                                  {items.length > 0 ? (
                                    <div className="space-y-0.5">
                                      {items.map((it, i) => (
                                        <div key={i} className="font-semibold text-slate-800 dark:text-slate-200">
                                          • {it.name}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 italic">N/A</span>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  {items.length > 0 ? (
                                    <div className="space-y-0.5">
                                      {items.map((it, i) => (
                                        <div key={i} className="font-bold text-slate-700 dark:text-slate-300 font-mono">
                                          {it.quantity} {it.unit || 'Pcs'}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 font-mono">0</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-right font-black font-mono text-slate-900 dark:text-white text-sm">
                                  {formatCurrency(row.grandTotal)}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="7" className="py-12 text-center text-slate-400">
                              No sales bills found for the selected period
                            </td>
                          </tr>
                        )}
                      </tbody>
                      {Array.isArray(reportData?.data) && reportData.data.length > 0 && (
                        <tfoot>
                          <tr className="bg-slate-100 dark:bg-slate-900 font-extrabold text-xs text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-600">
                            <td colSpan="2" className="py-3 px-3 text-center">
                              TOTAL ({reportData.data.length} Bills)
                            </td>
                            <td colSpan="3"></td>
                            <td className="py-3 px-3 text-center font-mono font-black text-slate-800 dark:text-slate-200">
                              {reportData.data.reduce((sum, r) => sum + (r.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0), 0)} Units
                            </td>
                            <td className="py-3 px-4 text-right font-black font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                              {formatCurrency(reportData.data.reduce((sum, r) => sum + (Number(r.grandTotal) || 0), 0))}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

              {/* Purchase Tables (ShopPurchase / HomePurchase) */}
              {(reportType === 'ShopPurchase' || reportType === 'HomePurchase') && (
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
