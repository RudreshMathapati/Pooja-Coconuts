import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';
import API from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { TableSkeleton } from '../components/common/Skeleton';
import { Search, Plus, Truck } from 'lucide-react';

const SupplierListPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [address, setAddress] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await API.get('/suppliers');
      setSuppliers(res.data || []);
    } catch (err) {
      console.error('Error fetching suppliers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setToast({ message: 'Name and Phone are required!', type: 'error' });
      return;
    }

    setFormLoading(true);
    try {
      await API.post('/suppliers', { name, phone, gstNumber, address });
      setToast({ message: 'Supplier profile created successfully!', type: 'success' });
      setIsAddModalOpen(false);
      setName('');
      setPhone('');
      setGstNumber('');
      setAddress('');
      fetchSuppliers();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to create supplier', type: 'error' });
    } finally {
      setFormLoading(false);
    }
  };

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.phone.includes(search)
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-12">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <div>
            <h1 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="w-6 h-6 text-blue-500" />
              <span>Supplier & Farm Vendor Directory</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Registered coconut farmers, copra processors, and wholesale suppliers.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Supplier</span>
          </button>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Supplier Name or Mobile Number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-900 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>

        {/* Suppliers Table */}
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
                    <th className="py-3.5 px-4">Supplier Name</th>
                    <th className="py-3.5 px-4">Phone Number</th>
                    <th className="py-3.5 px-4">GST Number</th>
                    <th className="py-3.5 px-4">Shop Total Purchased</th>
                    <th className="py-3.5 px-4">Shop Pending Due</th>
                    <th className="py-3.5 px-4">Home Pending Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filtered.length > 0 ? (
                    filtered.map((s) => (
                      <tr key={s._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          {s.name}
                          {s.address && <p className="text-[10px] text-slate-400 font-normal">{s.address}</p>}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">{s.phone}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-500">{s.gstNumber || '-'}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{formatCurrency(s.shopTotalPurchased)}</td>
                        <td className="py-3.5 px-4 font-extrabold text-rose-600 dark:text-rose-400">{formatCurrency(s.shopPendingAmount)}</td>
                        <td className="py-3.5 px-4 font-bold text-purple-600 dark:text-purple-400">{formatCurrency(s.homePendingAmount)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">No suppliers found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      {/* Add Supplier Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Supplier Profile" maxWidth="max-w-md">
        <form onSubmit={handleCreateSupplier} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Supplier Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Karnataka Farm Plantation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-sm rounded-xl border outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number *</label>
            <input
              type="text"
              required
              placeholder="10 digit phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-sm rounded-xl border outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">GST Number (Optional)</label>
            <input
              type="text"
              placeholder="29ABCDE1234F1Z5"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-sm rounded-xl border outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Address / Yard Location</label>
            <textarea
              rows="2"
              placeholder="Farm or yard location"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-sm rounded-xl border outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-500">Cancel</button>
            <button type="submit" disabled={formLoading} className="px-5 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl shadow">
              {formLoading ? 'Saving...' : 'Create Supplier'}
            </button>
          </div>
        </form>
      </Modal>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </div>
  );
};

export default SupplierListPage;
