import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';
import API from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { TableSkeleton } from '../components/common/Skeleton';
import { 
  Boxes, 
  Plus, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  Sliders, 
  History, 
  Search, 
  ShoppingBag, 
  TrendingUp, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight,
  RefreshCw,
  Info
} from 'lucide-react';

const InventoryPage = () => {
  const [products, setProducts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' | 'logs'
  const [search, setSearch] = useState('');
  const [logFilter, setLogFilter] = useState('ALL'); // 'ALL' | 'STOCK_ADD_PURCHASE' | 'STOCK_SOLD_SALE' | 'MANUAL_ADJUSTMENT'

  // Modals & Form States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Coconut');
  const [unit, setUnit] = useState('Pcs');
  const [rate, setRate] = useState('');
  const [purchaseRate, setPurchaseRate] = useState('');
  const [stock, setStock] = useState('0');
  const [minStockAlert, setMinStockAlert] = useState('100');
  const [description, setDescription] = useState('');

  const [newStockInput, setNewStockInput] = useState('');
  const [adjustReasonType, setAdjustReasonType] = useState('Audit');
  const [adjustRemarks, setAdjustRemarks] = useState('');

  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await API.get('/products');
      setProducts(res.data || []);
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setLogsLoading(true);
      const res = await API.get('/products/logs?limit=100');
      setLogs(res.data || []);
    } catch (err) {
      console.error('Failed to load inventory logs', err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchLogs();
  }, []);

  const handleOpenAdd = () => {
    setSelectedProduct(null);
    setName('');
    setCategory('Coconut');
    setUnit('Pcs');
    setRate('');
    setPurchaseRate('');
    setStock('0');
    setMinStockAlert('100');
    setDescription('');
    setIsProductModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setSelectedProduct(p);
    setName(p.name);
    setCategory(p.category || 'Coconut');
    setUnit(p.unit || 'Pcs');
    setRate(p.rate);
    setPurchaseRate(p.purchaseRate || 0);
    setStock(p.stock);
    setMinStockAlert(p.minStockAlert || 100);
    setDescription(p.description || '');
    setIsProductModalOpen(true);
  };

  const handleOpenAdjust = (p) => {
    setSelectedProduct(p);
    setNewStockInput(p.stock);
    setAdjustReasonType('Audit');
    setAdjustRemarks('Physical inventory stock verification count');
    setIsAdjustModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!name.trim() || !rate) {
      setToast({ message: 'Product Name and Selling Rate are required!', type: 'error' });
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        name,
        category,
        unit,
        rate: Number(rate),
        purchaseRate: Number(purchaseRate) || 0,
        stock: Number(stock) || 0,
        minStockAlert: Number(minStockAlert) || 100,
        description
      };

      if (selectedProduct) {
        await API.put(`/products/${selectedProduct._id}`, payload);
        setToast({ message: 'Product & Selling Rate updated successfully!', type: 'success' });
      } else {
        await API.post('/products', payload);
        setToast({ message: 'Product added to stock catalog!', type: 'success' });
      }

      setIsProductModalOpen(false);
      fetchProducts();
      fetchLogs();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to save product', type: 'error' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleSaveAdjustStock = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setFormLoading(true);
    try {
      const finalRemark = `[${adjustReasonType}] ${adjustRemarks || 'Stock adjustment'}`;
      await API.post(`/products/${selectedProduct._id}/adjust-stock`, {
        newStock: Number(newStockInput),
        remarks: finalRemark
      });
      setToast({ message: `Stock for ${selectedProduct.name} updated to ${newStockInput}!`, type: 'success' });
      setIsAdjustModalOpen(false);
      fetchProducts();
      fetchLogs();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to adjust stock', type: 'error' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProduct = async (p) => {
    if (!window.confirm(`Are you sure you want to delete ${p.name}? This will remove it from the catalog.`)) return;
    try {
      await API.delete(`/products/${p._id}`);
      setToast({ message: 'Product removed from catalog', type: 'success' });
      fetchProducts();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to delete product', type: 'error' });
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredLogs = logs.filter(log => {
    if (logFilter !== 'ALL' && log.changeType !== logFilter) return false;
    if (!search) return true;
    return (
      (log.productName && log.productName.toLowerCase().includes(search.toLowerCase())) ||
      (log.referenceId && log.referenceId.toLowerCase().includes(search.toLowerCase())) ||
      (log.remarks && log.remarks.toLowerCase().includes(search.toLowerCase()))
    );
  });

  // Calculate high level metrics
  const totalStockUnits = products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
  const totalPurchaseValuation = products.reduce((sum, p) => sum + ((Number(p.stock) || 0) * (Number(p.purchaseRate) || 0)), 0);
  const lowStockItems = products.filter(p => Number(p.stock) <= (Number(p.minStockAlert) || 100));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-12">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Banner Header with Automated Inventory Notice */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-900 text-white p-6 sm:p-7 rounded-3xl border border-emerald-500/20 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="space-y-1.5 z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg text-[11px] font-semibold tracking-wide border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Auto-Synced with Shop Purchase & Sales</span>
            </div>
            <h1 className="font-heading font-black text-2xl sm:text-3xl tracking-tight text-white flex items-center gap-2">
              <Boxes className="w-7 h-7 text-emerald-400" />
              <span>Live Inventory & Rates</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Stock automatically increases when you add a <strong>Shop Purchase</strong> bill, and decreases when creating customer sale bills.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 z-10">
            <Link
              to="/shop-purchase"
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl shadow-lg transition active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>+ Record Shop Purchase</span>
            </Link>
            
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/10 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Item / Set Rate</span>
            </button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Products</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{products.length}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Active Catalog Items</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <Boxes className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total In-Stock Units</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalStockUnits.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Available for billing</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Stock Valuation (Cost)</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(totalPurchaseValuation)}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">At Purchase Price</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Low Stock Alerts</p>
              <p className={`text-2xl font-black mt-1 ${lowStockItems.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                {lowStockItems.length}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">{lowStockItems.length > 0 ? 'Needs replenishment' : 'All stocks healthy'}</p>
            </div>
            <div className={`p-3 rounded-2xl ${lowStockItems.length > 0 ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Tab Navigation & Controls */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full md:w-auto bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('stock')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'stock'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Boxes className="w-4 h-4" />
              <span>Current Stock & Rates ({products.length})</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('logs');
                fetchLogs();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'logs'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Movement History / Logs</span>
            </button>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {activeTab === 'logs' && (
              <select
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-900 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none font-semibold"
              >
                <option value="ALL">All Movements</option>
                <option value="STOCK_ADD_PURCHASE">Shop Purchases (Stock In)</option>
                <option value="STOCK_SOLD_SALE">Sales / Billing (Stock Out)</option>
                <option value="MANUAL_ADJUSTMENT">Adjustments / Audits</option>
              </select>
            )}

            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={activeTab === 'stock' ? 'Search items...' : 'Search logs / bill #...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-900 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>
        </div>

        {/* Tab 1: Current Stock & Rates */}
        {activeTab === 'stock' && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-6">
                <TableSkeleton rows={5} cols={6} />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-900/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <th className="py-3.5 px-4">Item Name</th>
                      <th className="py-3.5 px-4">Unit</th>
                      <th className="py-3.5 px-4">Selling Rate (Sale)</th>
                      <th className="py-3.5 px-4">Purchase Cost (Party)</th>
                      <th className="py-3.5 px-4">Live In-Stock</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((p) => {
                        const isLowStock = p.stock <= (p.minStockAlert || 100);
                        const isOutOfStock = p.stock <= 0;
                        return (
                          <tr key={p._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                            <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                              {p.name}
                              {p.description && <span className="block text-[10px] text-slate-400 font-normal">{p.description}</span>}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-500 font-semibold">{p.unit}</td>
                            <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400 text-sm">
                              {formatCurrency(p.rate)}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-slate-500">
                              {formatCurrency(p.purchaseRate)}
                            </td>
                            <td className="py-3.5 px-4 font-black text-sm">
                              <span className={isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-600' : 'text-slate-900 dark:text-white'}>
                                {p.stock.toLocaleString()} {p.unit}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {isOutOfStock ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg text-[10px] font-bold border border-rose-200 dark:border-rose-900">
                                  Out of Stock
                                </span>
                              ) : isLowStock ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg text-[10px] font-bold border border-amber-200 dark:border-amber-900">
                                  <AlertTriangle className="w-3 h-3" /> Low Stock
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-bold border border-emerald-200 dark:border-emerald-900">
                                  In Stock
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenAdjust(p)}
                                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition"
                                  title="Adjust Stock (Damage / Spoilage / Count Audit)"
                                >
                                  <Sliders className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => handleOpenEdit(p)}
                                  className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition"
                                  title="Edit Selling Rate & Thresholds"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => handleDeleteProduct(p)}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                                  title="Delete Product"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-slate-400">
                          <Boxes className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          <p>No products found matching your search</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Movement Logs & History */}
        {activeTab === 'logs' && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-500" />
                <span className="font-bold text-sm text-slate-900 dark:text-white">Audit Trail & Movement History</span>
              </div>
              <button
                onClick={fetchLogs}
                className="p-1.5 text-slate-400 hover:text-emerald-500 rounded-lg transition"
                title="Refresh Logs"
              >
                <RefreshCw className={`w-4 h-4 ${logsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {logsLoading ? (
              <div className="p-6">
                <TableSkeleton rows={5} cols={6} />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-900/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <th className="py-3.5 px-4">Date & Time</th>
                      <th className="py-3.5 px-4">Product Name</th>
                      <th className="py-3.5 px-4">Activity Type</th>
                      <th className="py-3.5 px-4">Quantity Change</th>
                      <th className="py-3.5 px-4">Stock Balance (Before &rarr; After)</th>
                      <th className="py-3.5 px-4">Details / Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {filteredLogs.length > 0 ? (
                      filteredLogs.map((log) => {
                        const isAdd = log.changeType === 'STOCK_ADD_PURCHASE';
                        const isSale = log.changeType === 'STOCK_SOLD_SALE';
                        return (
                          <tr key={log._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                            <td className="py-3.5 px-4 text-slate-500 font-mono">
                              {formatDate(log.date || log.createdAt)}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                              {log.productName}
                            </td>
                            <td className="py-3.5 px-4">
                              {isAdd ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-bold border border-emerald-200 dark:border-emerald-900">
                                  <ArrowUpRight className="w-3 h-3" /> Shop Purchase
                                </span>
                              ) : isSale ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-bold border border-blue-200 dark:border-blue-900">
                                  <ArrowDownRight className="w-3 h-3" /> Customer Sale
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-lg text-[10px] font-bold border border-purple-200 dark:border-purple-900">
                                  <Sliders className="w-3 h-3" /> Manual Adjustment
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-black text-sm">
                              <span className={log.quantity > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                                {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-500 font-semibold">
                              {log.previousStock} &rarr; <span className="font-bold text-slate-900 dark:text-white">{log.newStock}</span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                              <span className="font-medium">{log.remarks || log.referenceId || '-'}</span>
                              {log.referenceId && (
                                <span className="block text-[10px] font-mono text-slate-400">Ref: {log.referenceId}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-slate-400">
                          <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          <p>No movement history records found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Add / Edit Product Modal */}
      <Modal 
        isOpen={isProductModalOpen} 
        onClose={() => setIsProductModalOpen(false)} 
        title={selectedProduct ? `Edit ${selectedProduct.name}` : 'Add Product to Catalog'} 
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            <span>
              <strong>Note:</strong> Regular stock inflow is automatically added when you enter bills in <strong>Shop Purchase</strong>. Use this to configure selling prices or catalog details.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Product Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Tender Coconut Large (Grade A)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-800 text-xs rounded-xl border border-slate-200 dark:border-slate-700 outline-none font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-xs rounded-xl border border-slate-200 dark:border-slate-700 outline-none font-semibold text-slate-900 dark:text-white"
              >
                <option value="Pcs">Pcs</option>
                <option value="Bags">Bags</option>
                <option value="KG">KG</option>
                <option value="Quintal">Quintal</option>
                <option value="Litre">Litre</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Min Low-Stock Alert</label>
              <input
                type="number"
                min="1"
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(e.target.value)}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-xs rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">Selling Rate (₹) *</label>
              <input
                type="number"
                required
                min="0"
                placeholder="45"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-800 text-xs rounded-xl border border-slate-200 dark:border-slate-700 font-black text-emerald-600 dark:text-emerald-400 outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Price charged to customer</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Purchase Cost (₹)</label>
              <input
                type="number"
                min="0"
                placeholder="32"
                value={purchaseRate}
                onChange={(e) => setPurchaseRate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-800 text-xs rounded-xl border border-slate-200 dark:border-slate-700 outline-none font-semibold text-slate-600 dark:text-slate-300"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Auto-updated from purchases</span>
            </div>
          </div>

          {!selectedProduct && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Opening Stock Quantity</label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-xs rounded-xl border border-slate-200 dark:border-slate-700 font-bold outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Only for initial setup; subsequent stock is added via Shop Purchase</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button 
              type="button" 
              onClick={() => setIsProductModalOpen(false)} 
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={formLoading} 
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow transition"
            >
              {formLoading ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Manual Stock Adjust / Damage Spoilage Modal */}
      <Modal 
        isOpen={isAdjustModalOpen} 
        onClose={() => setIsAdjustModalOpen(false)} 
        title={`Adjust Stock Quantity - ${selectedProduct?.name}`} 
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveAdjustStock} className="space-y-4">
          <div className="p-3.5 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Current In-Stock:</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">{selectedProduct?.stock} {selectedProduct?.unit}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Selling Rate:</p>
              <p className="text-sm font-bold text-emerald-600">{formatCurrency(selectedProduct?.rate)}</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Adjustment Reason</label>
            <select
              value={adjustReasonType}
              onChange={(e) => {
                setAdjustReasonType(e.target.value);
                if (e.target.value === 'Spoilage/Damage') setAdjustRemarks('Spoiled / damaged coconuts discarded');
                else if (e.target.value === 'Audit') setAdjustRemarks('Physical stock verification count');
                else setAdjustRemarks('');
              }}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-xs rounded-xl border border-slate-200 dark:border-slate-700 font-semibold outline-none"
            >
              <option value="Audit">Physical Count Audit</option>
              <option value="Spoilage/Damage">Damage / Spoilage / Breakage</option>
              <option value="Correction">Data Correction</option>
              <option value="Other">Other Reason</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">New Verified In-Stock Quantity *</label>
            <input
              type="number"
              min="0"
              required
              value={newStockInput}
              onChange={(e) => setNewStockInput(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-base rounded-xl border border-slate-200 dark:border-slate-700 font-black text-emerald-600 outline-none"
            />
            {selectedProduct && (
              <span className="text-[11px] text-slate-400 mt-1 block">
                Difference: <strong className={Number(newStockInput) - selectedProduct.stock >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  {Number(newStockInput) - selectedProduct.stock > 0 ? `+${Number(newStockInput) - selectedProduct.stock}` : Number(newStockInput) - selectedProduct.stock} {selectedProduct.unit}
                </strong>
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Remarks / Note</label>
            <input
              type="text"
              placeholder="e.g. 50 coconuts were broken/spoiled"
              value={adjustRemarks}
              onChange={(e) => setAdjustRemarks(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-xs rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button 
              type="button" 
              onClick={() => setIsAdjustModalOpen(false)} 
              className="px-4 py-2 text-xs font-semibold text-slate-500"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={formLoading} 
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow transition"
            >
              {formLoading ? 'Saving...' : 'Update Stock'}
            </button>
          </div>
        </form>
      </Modal>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </div>
  );
};

export default InventoryPage;
