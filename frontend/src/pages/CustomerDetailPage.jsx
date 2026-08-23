import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import CollectPaymentModal from '../components/common/CollectPaymentModal';
import API from '../services/api';
import { formatCurrency, formatDate, formatDateTime, getStatusColorClass } from '../utils/formatters';
import { generateInvoicePDF } from '../utils/pdfExporter';
import { exportToExcel } from '../utils/excelExporter';
import {
  ArrowLeft,
  Phone,
  UserCheck,
  Receipt,
  Download,
  Calendar,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const CustomerDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [settings, setSettings] = useState(null);
  const [activeTab, setActiveTab] = useState('BILLS'); // 'BILLS' or 'PAYMENTS'

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/customers/${id}`);
      setCustomerData(res.data);
    } catch (err) {
      console.error('Failed to load customer profile', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerDetails();
    API.get('/settings').then(res => setSettings(res.data)).catch(console.error);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-12">
        <Header />
        <main className="max-w-7xl mx-auto px-6 py-12 text-center text-slate-400">
          Loading customer ledger history...
        </main>
      </div>
    );
  }

  const { customer, bills = [], payments = [] } = customerData || {};

  const handleExportExcel = () => {
    const billRows = (bills || []).map(b => ({
      'Bill Number': b.billNumber,
      'Date': formatDate(b.date),
      'Grand Total (Rs)': b.grandTotal,
      'Amount Paid (Rs)': b.amountPaid,
      'Pending Amount (Rs)': b.pendingAmount,
      'Payment Status': b.paymentStatus
    }));
    exportToExcel(billRows, `${customer?.name}_Ledger_History`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-12">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Back navigation */}
        <button
          onClick={() => navigate('/customers')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customer Directory</span>
        </button>

        {/* Customer Header Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 font-extrabold text-xl flex items-center justify-center">
                {customer?.name ? customer.name[0] : 'C'}
              </div>
              <div>
                <h1 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-white">
                  {customer?.name}
                </h1>
                <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{customer?.phone}</span>
                  {customer?.gstNumber && <span className="font-mono bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-[10px]">GSTIN: {customer.gstNumber}</span>}
                </p>
              </div>
            </div>
            {customer?.address && (
              <p className="text-xs text-slate-400 pl-1">Address: {customer.address}</p>
            )}
          </div>

          {/* Action & Dues Badge */}
          <div className="flex items-center gap-4">
            <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 text-right space-y-0.5 min-w-[160px]">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Pending Due Balance</p>
              <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
                {formatCurrency(customer?.pendingAmount)}
              </p>
            </div>

            <button
              onClick={() => setIsCollectModalOpen(true)}
              disabled={!customer?.pendingAmount || customer?.pendingAmount <= 0}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition"
            >
              <UserCheck className="w-4 h-4" />
              <span>{customer?.pendingAmount > 0 ? 'Collect Payment' : 'No Dues Pending'}</span>
            </button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Purchased Value</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{formatCurrency(customer?.totalPurchased)}</p>
            <p className="text-[11px] text-slate-400">{bills.length} Total Sales Invoices</p>
          </div>

          <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Amount Paid</p>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(customer?.totalPaid)}</p>
            <p className="text-[11px] text-emerald-500 font-medium">{payments.length} Payments Collected</p>
          </div>

          <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase">Outstanding Balance</p>
            <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{formatCurrency(customer?.pendingAmount)}</p>
            <p className="text-[11px] text-amber-500 font-medium">Last Purchase: {formatDate(customer?.lastPurchaseDate)}</p>
          </div>
        </div>

        {/* Tabs & Export Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('BILLS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'BILLS'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300'
              }`}
            >
              Sales Bills ({bills.length})
            </button>
            <button
              onClick={() => setActiveTab('PAYMENTS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'PAYMENTS'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300'
              }`}
            >
              Payment Audit History ({payments.length})
            </button>
          </div>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Export Excel Ledger</span>
          </button>
        </div>

        {/* Tab 1: Sales Bills List */}
        {activeTab === 'BILLS' && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-900 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3.5 px-4">Bill #</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Grand Total</th>
                    <th className="py-3.5 px-4">Amount Paid</th>
                    <th className="py-3.5 px-4">Pending Due</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {bills.length > 0 ? (
                    bills.map((b) => (
                      <tr key={b._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">{b.billNumber}</td>
                        <td className="py-3.5 px-4 font-medium text-slate-600 dark:text-slate-300">{formatDate(b.date)}</td>
                        <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white">{formatCurrency(b.grandTotal)}</td>
                        <td className="py-3.5 px-4 text-emerald-600 font-bold">{formatCurrency(b.amountPaid)}</td>
                        <td className="py-3.5 px-4 text-amber-600 font-bold">{formatCurrency(b.pendingAmount)}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusColorClass(b.paymentStatus)}`}>
                            {b.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => generateInvoicePDF(b, settings)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-lg transition"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400">No sales bills found for this customer</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Payments History List */}
        {activeTab === 'PAYMENTS' && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-900 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3.5 px-4">Receipt Date</th>
                    <th className="py-3.5 px-4">Amount Received</th>
                    <th className="py-3.5 px-4">Payment Method</th>
                    <th className="py-3.5 px-4">Remarks / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {payments.length > 0 ? (
                    payments.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                        <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">{formatDateTime(p.date)}</td>
                        <td className="py-3.5 px-4 font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">{formatCurrency(p.amountReceived)}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-300">{p.paymentMethod || 'Cash'}</td>
                        <td className="py-3.5 px-4 text-slate-500">{p.notes || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-slate-400">No payment receipts logged yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      <CollectPaymentModal
        isOpen={isCollectModalOpen}
        onClose={() => setIsCollectModalOpen(false)}
        customer={customer}
        onSuccess={() => fetchCustomerDetails()}
      />
    </div>
  );
};

export default CustomerDetailPage;
