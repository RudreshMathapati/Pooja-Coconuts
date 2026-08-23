import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import API from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Search, Users, Truck, Receipt, ShoppingBag, Boxes } from 'lucide-react';

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
              Search across customer records, suppliers, sales bills (`PC-0001`), purchases, and product stock catalog.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2 max-w-2xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Enter customer name, phone number, bill number, product..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-900 text-sm rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              Search Everywhere
            </button>
          </form>
        </div>

        {/* Results Container */}
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Searching business database...</div>
        ) : results ? (
          <div className="space-y-6">
            
            {/* Customers Section */}
            {results.customers?.length > 0 && (
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-3">
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-500" />
                  <span>Matching Customers ({results.customers.length})</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {results.customers.map(c => (
                    <div
                      key={c._id}
                      onClick={() => navigate(`/customers/${c._id}`)}
                      className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 cursor-pointer hover:border-emerald-500 transition space-y-1"
                    >
                      <p className="font-bold text-sm text-slate-900 dark:text-white">{c.name}</p>
                      <p className="text-xs text-slate-500">Phone: {c.phone}</p>
                      <p className="text-xs font-bold text-amber-600">Pending Due: {formatCurrency(c.pendingAmount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sales Bills Section */}
            {results.sales?.length > 0 && (
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-3">
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-500" />
                  <span>Matching Sales Invoices ({results.sales.length})</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {results.sales.map(s => (
                    <div
                      key={s._id}
                      onClick={() => navigate('/sales')}
                      className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 cursor-pointer hover:border-emerald-500 transition space-y-1"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-emerald-600">{s.billNumber}</span>
                        <span className="text-[10px] text-slate-400">{formatDate(s.date)}</span>
                      </div>
                      <p className="font-bold text-xs text-slate-900 dark:text-white">{s.customerName}</p>
                      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Total: {formatCurrency(s.grandTotal)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Products Section */}
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
                      <p className="font-bold text-xs text-slate-900 dark:text-white">{p.name}</p>
                      <p className="text-xs text-emerald-600 font-bold">Rate: ₹{p.rate} / {p.unit}</p>
                      <p className="text-xs text-slate-500">In Stock: {p.stock} {p.unit}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suppliers Section */}
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
                      <p className="font-bold text-xs text-slate-900 dark:text-white">{sup.name}</p>
                      <p className="text-xs text-slate-500">Phone: {sup.phone}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.customers?.length === 0 && results.sales?.length === 0 && results.products?.length === 0 && results.suppliers?.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-sm">
                No matching records found for "{query}". Try searching with a different term.
              </div>
            )}

          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 text-sm">
            Enter a search term above to scan the entire enterprise database.
          </div>
        )}

      </main>
    </div>
  );
};

export default SearchPage;
