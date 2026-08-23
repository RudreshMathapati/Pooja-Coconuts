import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import API from '../services/api';
import { formatCurrency, formatDate, getStatusColorClass } from '../utils/formatters';
import { generateInvoicePDF } from '../utils/pdfExporter';
import { TableSkeleton } from '../components/common/Skeleton';
import Modal from '../components/common/Modal';
import { Search, Download, Send, Plus, Eye, Receipt } from 'lucide-react';

const SalesHistoryPage = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [settings, setSettings] = useState(null);

  const navigate = useNavigate();

  const fetchSales = async () => {
    try {
      setLoading(true);
      const res = await API.get('/sales');
      setSales(res.data || []);
    } catch (err) {
      console.error('Error fetching sales history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
    API.get('/settings').then(res => setSettings(res.data)).catch(console.error);
  }, []);

  // Ensure latest created bill is always on top
  const sortedSales = [...sales].sort((a, b) => {
    const timeA = new Date(a.createdAt || a.date).getTime();
    const timeB = new Date(b.createdAt || b.date).getTime();
    if (timeB !== timeA) return timeB - timeA;
    return (b.billNumber || '').localeCompare(a.billNumber || '', undefined, { numeric: true, sensitivity: 'base' });
  });

  // Filtering
  const filteredSales = sortedSales.filter(s => {
    const matchesSearch =
      s.billNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.customerName.toLowerCase().includes(search.toLowerCase()) ||
      (s.customerPhone && s.customerPhone.includes(search));
    const matchesStatus = statusFilter ? s.paymentStatus === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const handleWhatsAppSend = (sale) => {
    if (!sale.customerPhone) return;
    const shopTitle = settings?.shopName || 'M/s. POOJA COCONUT & GENERAL MERCHANT';
    const kannadaTitle = settings?.kannadaName || 'ಮೇ. ಪೂಜಾ ಕೋಕೋನಟ್';
    const address = settings?.address || 'Basava Gunj, BASAVAKALYAN-585 327. Dst. Bidar. (K.S)';
    const cellPhone = settings?.phone || '9449458675';
    const gstinVal = settings?.gstin || '29AIDPM4039Q1ZN';
    const disclaimer = settings?.disclaimerText || 'ಸೂಚನೆ : ಮಾರಾಟದ ತೆಂಗು ಮತ್ತು ಎಳನೀರು ವಾಪಾಸ ತೆಗೆದುಕೊಳ್ಳುವುದಿಲ್ಲ';

    const cleanPhone = sale.customerPhone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const itemSummaryText = (sale.items || []).map(i => `• ${i.name}: ${i.quantity} ${i.unit || 'Pcs'} @ ₹${i.rate} = ₹${i.total}`).join('\n');
    
    let host = settings?.invoiceBaseUrl;
    if (!host || host.includes('localhost')) {
      host = `http://${window.location.hostname || 'localhost'}`;
    }
    const cleanHost = host.replace(/\/$/, '');
    const pdfUrl = `${cleanHost}/invoices/${sale.billNumber}.pdf`;

    const message = `*|| Shri Sangameshwar Prasanna ||*\n*${shopTitle}*\n(${kannadaTitle})\n${address}\nCell: ${cellPhone} | GSTIN: ${gstinVal}\n----------------------------------------\n*CASH/CREDIT BILL No:* *${sale.billNumber}*\nDate: ${formatDate(sale.date)}\nShri (Customer): ${sale.customerName}\n----------------------------------------\n*COCONUTS / PARTICULAR ITEMS:*\n${itemSummaryText}\n----------------------------------------\n*SUBTOTAL:* ₹${sale.subtotal}\n*GRAND TOTAL:* ₹${sale.grandTotal}\n*AMOUNT PAID:* ₹${sale.amountPaid}\n*PENDING DUE:* ₹${sale.pendingAmount}\n----------------------------------------\n*Download Official PDF Invoice:*\n${pdfUrl}\n----------------------------------------\n*${disclaimer}*\nThank you for doing business with us!`;

    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-12">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <div>
            <h1 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-6 h-6 text-emerald-500" />
              <span>Sales Billing History</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Complete archive of customer sales invoices and receipt ledgers.
            </p>
          </div>

          <button
            onClick={() => navigate('/sales/new')}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Bill</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Bill #, Customer Name, Phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-900 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-900 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
            >
              <option value="">All Payment Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Partial">Partial</option>
            </select>
          </div>
        </div>

        {/* Table List */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-6">
              <TableSkeleton rows={6} cols={6} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-900 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3.5 px-4">Bill #</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Phone</th>
                    <th className="py-3.5 px-4">Grand Total</th>
                    <th className="py-3.5 px-4">Paid / Due</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filteredSales.length > 0 ? (
                    filteredSales.map((sale) => (
                      <tr key={sale._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {sale.billNumber}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-600 dark:text-slate-300">
                          {formatDate(sale.date)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          {sale.customerName}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono">
                          {sale.customerPhone || '-'}
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white">
                          {formatCurrency(sale.grandTotal)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-[11px]">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Paid: {formatCurrency(sale.amountPaid)}</span>
                            {sale.pendingAmount > 0 && (
                              <span className="block text-amber-600 dark:text-amber-400 font-bold">Due: {formatCurrency(sale.pendingAmount)}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusColorClass(sale.paymentStatus)}`}>
                            {sale.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedSale(sale)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                              title="View Invoice Detail"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => generateInvoicePDF(sale, settings)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition"
                              title="Download PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>

                            {sale.customerPhone && (
                              <button
                                onClick={() => handleWhatsAppSend(sale)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950 transition"
                                title="Send WhatsApp Invoice"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">
                        No sales bills matching search criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      {/* View Bill Details Modal */}
      {selectedSale && (
        <Modal
          isOpen={!!selectedSale}
          onClose={() => setSelectedSale(null)}
          title={`Bill Invoice #${selectedSale.billNumber}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-white">{selectedSale.customerName}</p>
                <p className="text-slate-500">Phone: {selectedSale.customerPhone || 'N/A'}</p>
                {selectedSale.gstNumber && <p className="text-slate-500 font-mono">GSTIN: {selectedSale.gstNumber}</p>}
              </div>
              <div className="text-right">
                <p className="text-slate-500">Date: {formatDate(selectedSale.date)}</p>
                <span className={`inline-block px-2.5 py-0.5 mt-1 rounded-full text-[10px] font-bold border ${getStatusColorClass(selectedSale.paymentStatus)}`}>
                  {selectedSale.paymentStatus}
                </span>
              </div>
            </div>

            {/* Item Rows */}
            <div className="space-y-2">
              <p className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">Item Particulars</p>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 dark:bg-slate-900 font-semibold text-slate-500 text-[10px]">
                    <tr>
                      <th className="py-2 px-3">Item</th>
                      <th className="py-2 px-3">Qty</th>
                      <th className="py-2 px-3">Rate</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(selectedSale.items || []).map((i, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">{i.name}</td>
                        <td className="py-2 px-3">{i.quantity} {i.unit || 'Pcs'}</td>
                        <td className="py-2 px-3">₹{i.rate}</td>
                        <td className="py-2 px-3 text-right font-bold">₹{i.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Amounts Summary */}
            <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl space-y-1.5 text-slate-700 dark:text-slate-300">
              <div className="flex justify-between"><span>Subtotal:</span> <span>₹{selectedSale.subtotal}</span></div>
              {selectedSale.gstAmount > 0 && <div className="flex justify-between"><span>GST:</span> <span>₹{selectedSale.gstAmount}</span></div>}
              <div className="flex justify-between font-extrabold text-sm text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
                <span>Grand Total:</span> <span className="text-emerald-600">₹{selectedSale.grandTotal}</span>
              </div>
              <div className="flex justify-between text-emerald-600"><span>Paid:</span> <span>₹{selectedSale.amountPaid}</span></div>
              <div className="flex justify-between text-amber-600 font-bold"><span>Pending Due:</span> <span>₹{selectedSale.pendingAmount}</span></div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => generateInvoicePDF(selectedSale, settings)}
                className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF Invoice</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SalesHistoryPage;
