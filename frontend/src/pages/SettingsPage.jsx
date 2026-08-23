import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Toast from '../components/common/Toast';
import API from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { Settings, Save, Store, Send, Shield, Moon, Sun, Trash2, AlertTriangle } from 'lucide-react';

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    shopName: 'Pooja Coconuts',
    tagline: 'Wholesale & Retail Coconut Merchants',
    ownerName: 'Shop Owner',
    phone: '+91 98765 43210',
    address: 'APMC Market Yard, Block B-12',
    gstin: '29ABCDE1234F1Z5',
    enableWhatsApp: true,
    invoicePrefix: 'PC-'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    API.get('/settings').then(res => {
      setSettings(res.data || {});
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleChange = (field, val) => {
    setSettings(prev => ({ ...prev, [field]: val }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.put('/settings', settings);
      setToast({ message: 'Shop configuration & WhatsApp settings saved!', type: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to update settings', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetDatabase = async () => {
    if (!window.confirm('⚠️ WARNING: Are you sure you want to delete ALL business data (products, customers, suppliers, sales bills, purchases, dues)? This action cannot be undone!')) {
      return;
    }

    setResetting(true);
    try {
      const res = await API.post('/settings/reset-database');
      setToast({ message: res.data.message || 'Database reset complete!', type: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to reset database', type: 'error' });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-12">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Banner Header */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center justify-between">
          <div>
            <h1 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="w-6 h-6 text-emerald-500" />
              <span>System Settings & Configuration</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configure store branding, WhatsApp invoice integration, and invoice numbering.
            </p>
          </div>
        </div>

        {/* Settings Form */}
        <form onSubmit={handleSave} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 p-6 sm:p-8 shadow-sm space-y-6">
          
          {/* Shop Profile Details */}
          <div className="space-y-4">
            <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/80 pb-2">
              <Store className="w-4 h-4 text-emerald-500" />
              <span>Shop Profile & Invoice Header</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Business Shop Name *</label>
                <input
                  type="text"
                  required
                  value={settings.shopName || ''}
                  onChange={(e) => handleChange('shopName', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 text-sm rounded-xl border border-slate-200 dark:border-slate-700 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tagline / Business Subtitle</label>
                <input
                  type="text"
                  value={settings.tagline || ''}
                  onChange={(e) => handleChange('tagline', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 text-sm rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Phone Number</label>
                <input
                  type="text"
                  value={settings.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 text-sm rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">GSTIN Tax Registration Number</label>
                <input
                  type="text"
                  value={settings.gstin || ''}
                  onChange={(e) => handleChange('gstin', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 text-sm rounded-xl border border-slate-200 dark:border-slate-700 outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Store & Yard Address</label>
              <textarea
                rows="2"
                value={settings.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 text-sm rounded-xl border border-slate-200 dark:border-slate-700 outline-none resize-none"
              />
            </div>
          </div>

          {/* WhatsApp & Invoice Config */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700/80">
            <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/80 pb-2">
              <Send className="w-4 h-4 text-green-500" />
              <span>WhatsApp Integration & Invoice Settings</span>
            </h3>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div>
                <p className="font-bold text-xs text-slate-900 dark:text-white">Enable Direct WhatsApp Invoice Sharing</p>
                <p className="text-[11px] text-slate-500">Allows owner to send formatted invoice summaries to customer phone via WhatsApp Web / App.</p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(settings.enableWhatsApp)}
                onChange={(e) => handleChange('enableWhatsApp', e.target.checked)}
                className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Invoice Bill Prefix</label>
                <input
                  type="text"
                  value={settings.invoicePrefix || 'PC-'}
                  onChange={(e) => handleChange('invoicePrefix', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 text-sm rounded-xl border border-slate-200 dark:border-slate-700 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">UI Visual Theme Mode</label>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 text-xs rounded-xl border border-slate-200 dark:border-slate-700 font-bold flex items-center justify-between"
                >
                  <span>Current Theme: {isDark ? 'Dark Mode' : 'Light Mode'}</span>
                  {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Database Reset Danger Zone */}
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-xs text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Clear All Business Database Records</span>
                </p>
                <p className="text-[11px] text-rose-600/80 dark:text-rose-300/80">
                  Deletes all sales bills, purchases, products, customers, suppliers, and dues. Wipes test data clean.
                </p>
              </div>
              <button
                type="button"
                disabled={resetting}
                onClick={handleResetDatabase}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{resetting ? 'Wiping DB...' : 'Reset Database Data'}</span>
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-700/80">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Configuration...' : 'Save Settings'}</span>
            </button>
          </div>

        </form>

      </main>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </div>
  );
};

export default SettingsPage;
