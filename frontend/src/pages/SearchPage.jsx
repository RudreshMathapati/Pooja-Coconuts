import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import API from '../services/api';
import { formatCurrency, formatDate, getStatusColorClass } from '../utils/formatters';
import {
  Search,
  Users,
  Truck,
  Receipt,
  ShoppingBag,
  Boxes,
  Phone,
  MapPin,
  CreditCard,
  TrendingUp,
  DollarSign,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Wallet
} from 'lucide-react';

// ─── Customer Full Profile Card ────────────────────────────────────────────────
const CustomerProfileCard = ({ customer }) => {
  const [billsOpen, setBillsOpen] = useState(true);
  const [paymentsOpen, setPaymentsOpen] = useState(false);
  const navigate = useNavigate();

  const bills = customer.bills || [];
  const payments = customer.payments || [];

  const totalBilled = bills.reduce((s, b) => s + (Number(b.grandTotal) || 0), 0);
  const totalPaid = payments.reduce((s, p) => s + (Number(p.amountReceived) || 0), 0);
  const pending = customer.pendingAmount || 0;

  const statusBadge = (status) => {
    const cls = {
      Paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      Partial: 'bg-blue-100 text-blue-700 border-blue-200',
      Pending: 'bg-amber-100 text-amber-700 border-amber-200'
    }[status] || 'bg-slate-100 text-slate-600 border-slate-200';
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cls}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-emerald-200/70 dark:border-emerald-800/50 shadow-md overflow-hidden">
      
      {/* Customer Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-white">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-black">
              {customer.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h3 className="font-extrabold text-lg leading-tight">{customer.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5 text-emerald-100 text-xs">
                <Phone className="w-3 h-3" />
                <span>{customer.phone}</span>
              </div>
              {customer.address && (
                <div className="flex items-center gap-1.5 mt-0.5 text-emerald-100 text-xs">
                  <MapPin className="w-3 h-3" />
                  <span>{customer.address}</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => navigate(`/customers/${customer._id}`)}
            className="shrink-0 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold transition border border-white/30"
          >
            Full Profile →
          </button>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-white/15 rounded-2xl p-3 text-center">
            <p className="text-[10px] text-emerald-100 uppercase font-semibold tracking-wider">Total Bills</p>
            <p className="text-xl font-black mt-0.5">{bills.length}</p>
            <p className="text-[10px] text-emerald-200">Invoices</p>
          </div>
          <div className="bg-white/15 rounded-2xl p-3 text-center">
            <p className="text-[10px] text-emerald-100 uppercase font-semibold tracking-wider">Total Billed</p>
            <p className="text-xl font-black mt-0.5 font-mono">{formatCurrency(totalBilled)}</p>
            <p className="text-[10px] text-emerald-200">Lifetime</p>
          </div>
          <div className={`rounded-2xl p-3 text-center ${pending > 0 ? 'bg-amber-500/30' : 'bg-white/15'}`}>
            <p className="text-[10px] text-emerald-100 uppercase font-semibold tracking-wider">Pending Due</p>
            <p className={`text-xl font-black mt-0.5 font-mono ${pending > 0 ? 'text-amber-200' : ''}`}>
              {formatCurrency(pending)}
            </p>
            <p className="text-[10px] text-emerald-200">{pending > 0 ? 'Outstanding' : 'Cleared ✓'}</p>
          </div>
        </div>
      </div>

      {/* Bills Table */}
      <div className="border-t border-slate-100 dark:border-slate-700/60">
        <button
          onClick={() => setBillsOpen(!billsOpen)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition"
        >
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-sm text-slate-800 dark:text-white">
              All Sales Bills ({bills.length})
            </span>
          </div>
          {billsOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {billsOpen && (
          <div className="px-5 pb-4">
            {bills.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 dark:bg-slate-950 text-white text-[11px] font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-3 text-center">#</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Bill No</th>
                      <th className="py-2.5 px-3">Items</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3 text-right">Paid</th>
                      <th className="py-2.5 px-3 text-right">Due</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {bills.map((bill, idx) => (
                      <tr key={bill._id} className="hover:bg-emerald-50/50 dark:hover:bg-slate-700/30 transition">
                        <td className="py-2.5 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">{formatDate(bill.date)}</td>
                        <td className="py-2.5 px-3 font-mono font-black text-emerald-600 dark:text-emerald-400">{bill.billNumber}</td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 max-w-[160px]">
                          {(bill.items || []).map(i => i.name).join(', ') || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white font-mono">
                          {formatCurrency(bill.grandTotal)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-600 font-bold font-mono">
                          {formatCurrency(bill.amountPaid)}
                        </td>
                        <td className={`py-2.5 px-3 text-right font-bold font-mono ${(bill.pendingAmount || 0) > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                          {formatCurrency(bill.pendingAmount || 0)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {statusBadge(bill.paymentStatus)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 dark:bg-slate-900 text-xs font-extrabold border-t-2 border-slate-300 dark:border-slate-600">
                      <td colSpan={4} className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                        TOTAL — {bills.length} Bills
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-900 dark:text-white">
                        {formatCurrency(bills.reduce((s, b) => s + (b.grandTotal || 0), 0))}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-600">
                        {formatCurrency(bills.reduce((s, b) => s + (b.amountPaid || 0), 0))}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-600">
                        {formatCurrency(bills.reduce((s, b) => s + (b.pendingAmount || 0), 0))}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs italic">No bills found for this customer.</div>
            )}
          </div>
        )}
      </div>

      {/* Payment History */}
      {payments.length > 0 && (
        <div className="border-t border-slate-100 dark:border-slate-700/60">
          <button
            onClick={() => setPaymentsOpen(!paymentsOpen)}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition"
          >
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-sm text-slate-800 dark:text-white">
                Payment History ({payments.length} payments)
              </span>
            </div>
            {paymentsOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {paymentsOpen && (
            <div className="px-5 pb-4">
              <div className="space-y-2">
                {payments.map((p) => (
                  <div key={p._id} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-white">
                          Payment Received
                        </p>
                        <p className="text-[10px] text-slate-500">{formatDate(p.date)} · {p.paymentMethod}</p>
                        {p.notes && <p className="text-[10px] text-slate-400 italic">{p.notes}</p>}
                      </div>
                    </div>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                      +{formatCurrency(p.amountReceived)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main SearchPage ────────────────────────────────────────────────────────────
const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';

  const [query, setQuery] = useState(queryParam);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 2) return;
    try {
      setLoading(true);
      const res = await API.get(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      setResults(res.data);
    } catch (err) {
      console.error('Global search error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (queryParam) {
      setQuery(queryParam);
      handleSearch(queryParam);
    }
  }, [queryParam]);

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch(query);
  };

  const hasResults = results && (
    results.customers?.length > 0 ||
    results.sales?.length > 0 ||
    results.products?.length > 0 ||
    results.suppliers?.length > 0 ||
    results.purchases?.length > 0
  );

  const statusBadge = (status) => {
    const cls = {
      Paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      Partial: 'bg-blue-100 text-blue-700 border-blue-200',
      Pending: 'bg-amber-100 text-amber-700 border-amber-200'
    }[status] || 'bg-slate-100 text-slate-600 border-slate-200';
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cls}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-12">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Search Header Form */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
          <div>
            <h1 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-white flex items-center gap-2">
              <Search className="w-6 h-6 text-emerald-500" />
              <span>Global Enterprise Search</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Search by <strong>customer name</strong> or <strong>phone number</strong> to see their full profile — all bills, payments &amp; dues. Also searches bill numbers, products, and suppliers.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2 max-w-2xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search customer name, phone, bill no., product..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-900 text-sm rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              Search
            </button>
          </form>
        </div>

        {/* Results Container */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 text-sm">Searching business database...</p>
          </div>
        ) : hasResults ? (
          <div className="space-y-6">

            {/* ── Customer Full Profiles ────────────────────────────────── */}
            {results.customers?.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  <h2 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white">
                    Customer Profiles ({results.customers.length})
                  </h2>
                  <span className="text-xs text-slate-500 font-medium">— Full bill &amp; payment history</span>
                </div>
                {results.customers.map(customer => (
                  <CustomerProfileCard key={customer._id} customer={customer} />
                ))}
              </div>
            )}

            {/* ── Standalone Sales Bills (not linked to matched customers) */}
            {results.sales?.length > 0 && (
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-3">
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-500" />
                  <span>Other Matching Sales Invoices ({results.sales.length})</span>
                </h3>
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                        <th className="py-2.5 px-3">Bill #</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Customer</th>
                        <th className="py-2.5 px-3">Items</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                      {results.sales.map(s => (
                        <tr key={s._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition">
                          <td className="py-2.5 px-3 font-mono font-black text-emerald-600 dark:text-emerald-400">{s.billNumber}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">{formatDate(s.date)}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{s.customerName}</td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 max-w-[180px]">
                            {(s.items || []).map(i => i.name).join(', ') || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold font-mono">{formatCurrency(s.grandTotal)}</td>
                          <td className="py-2.5 px-3 text-center">{statusBadge(s.paymentStatus)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Products ─────────────────────────────────────────────── */}
            {results.products?.length > 0 && (
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-3">
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-emerald-500" />
                  <span>Matching Coconut Products ({results.products.length})</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {results.products.map(p => (
                    <div
                      key={p._id}
                      onClick={() => navigate('/inventory')}
                      className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 cursor-pointer hover:border-emerald-500 transition space-y-1"
                    >
                      <p className="font-bold text-sm text-slate-900 dark:text-white">{p.name}</p>
                      <p className="text-xs text-emerald-600 font-bold">Rate: ₹{p.rate} / {p.unit}</p>
                      <p className="text-xs text-slate-500">In Stock: {p.stock} {p.unit}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Suppliers ─────────────────────────────────────────────── */}
            {results.suppliers?.length > 0 && (
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-3">
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-500" />
                  <span>Matching Suppliers ({results.suppliers.length})</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {results.suppliers.map(sup => (
                    <div
                      key={sup._id}
                      onClick={() => navigate('/suppliers')}
                      className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 cursor-pointer hover:border-emerald-500 transition space-y-1"
                    >
                      <p className="font-bold text-sm text-slate-900 dark:text-white">{sup.name}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {sup.phone}
                      </p>
                      {sup.pendingAmount > 0 && (
                        <p className="text-xs font-bold text-amber-600">Due: {formatCurrency(sup.pendingAmount)}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Purchases ─────────────────────────────────────────────── */}
            {results.purchases?.length > 0 && (
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-3">
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-500" />
                  <span>Matching Purchase Invoices ({results.purchases.length})</span>
                </h3>
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                        <th className="py-2.5 px-3">Bill #</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Supplier</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                      {results.purchases.map(p => (
                        <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition">
                          <td className="py-2.5 px-3 font-mono font-black text-emerald-600 dark:text-emerald-400">{p.billNumber}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">{formatDate(p.date)}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{p.supplierName || p.customerName}</td>
                          <td className="py-2.5 px-3 text-right font-bold font-mono">{formatCurrency(p.totalAmount || p.grandTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        ) : results ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <AlertCircle className="w-10 h-10 text-slate-300" />
            <p className="text-slate-500 text-sm font-medium">
              No records found for &ldquo;<span className="text-slate-700 dark:text-slate-300 font-bold">{query}</span>&rdquo;.
            </p>
            <p className="text-xs text-slate-400">Try a different name, phone number, or bill number.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center py-16 gap-3">
            <Search className="w-10 h-10 text-slate-200 dark:text-slate-700" />
            <p className="text-slate-400 text-sm">Enter a search term above to scan the entire database.</p>
            <p className="text-xs text-slate-400">
              Tip: Search a customer's name or phone number to see all their invoices &amp; payment history.
            </p>
          </div>
        )}

      </main>
    </div>
  );
};

export default SearchPage;
