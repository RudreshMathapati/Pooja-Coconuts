import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ShoppingBag, Home, UserCheck } from 'lucide-react';

const Header = ({ onOpenCollectModal }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white dark:bg-slate-800 border-b-2 border-slate-300 dark:border-slate-700 px-6 py-3 flex items-center justify-between gap-4 shadow-sm">
      {/* Global Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search Customer, Supplier, Bill # (PC-0001), Product..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-1.5 bg-slate-100 dark:bg-slate-900 text-xs rounded border border-slate-300 dark:border-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
        />
      </form>

      {/* Quick Action Buttons Header */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/sales/new')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Bill</span>
        </button>

        <button
          onClick={() => navigate('/purchases/shop')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded text-xs font-bold border border-slate-300 dark:border-slate-600 transition"
        >
          <ShoppingBag className="w-3.5 h-3.5 text-blue-500" />
          <span className="hidden sm:inline">Shop Purchase</span>
        </button>

        <button
          onClick={() => navigate('/purchases/home')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded text-xs font-bold border border-slate-300 dark:border-slate-600 transition"
        >
          <Home className="w-3.5 h-3.5 text-purple-500" />
          <span className="hidden sm:inline">Home Purchase</span>
        </button>

        {onOpenCollectModal && (
          <button
            onClick={onOpenCollectModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold shadow-sm transition"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Collect Payment</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
