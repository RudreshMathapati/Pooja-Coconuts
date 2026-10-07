import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Toast from '../components/common/Toast';
import API from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { exportDatabaseBackupToExcel } from '../utils/excelExporter';
import { Settings, Save, Store, Send, Shield, Moon, Sun, Trash2, AlertTriangle, KeyRound, Eye, EyeOff, FileSpreadsheet, Download, X } from 'lucide-react';

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    shopName: 'Pooja Coconuts',
    tagline: 'Wholesale & Retail Coconut Merchants',
    ownerName: 'Shop Owner',
    phone: '+91 98765 43210',
    address: 'APMC Market Yard, Block B-12',
    gstin: '29ABCDE1234F1Z5',
    enableWhatsApp: true,
    invoicePrefix: 'PC-',
    invoiceBaseUrl: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const { isDark, toggleTheme } = useTheme();

  // Change Password state
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });

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

  const handleConfirmResetAndBackup = async () => {
    setShowResetModal(false);
    setResetting(true);
    try {
      setToast({ message: 'Generating Excel backup of all database records...', type: 'info' });
      
      // 1. Fetch full database backup
      const backupRes = await API.get('/settings/backup-all');
      const backupData = backupRes.data?.data;
      
      // 2. Generate and download Excel (.xlsx) file
      exportDatabaseBackupToExcel(backupData);
      setToast({ message: 'Excel backup downloaded! Resetting database now...', type: 'info' });

      // Small pause to allow browser download to start
      await new Promise(res => setTimeout(res, 800));

      // 3. Clear database records
      const resetRes = await API.post('/settings/reset-database');
      setToast({ 
        message: resetRes.data.message || 'Database reset complete! Full backup has been saved to your downloads.', 
        type: 'success' 
      });
    } catch (err) {
      setToast({ 
        message: err.response?.data?.message || 'Failed to complete backup and database reset', 
        type: 'error' 
      });
    } finally {
      setResetting(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setToast({ message: 'New passwords do not match', type: 'error' });
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setToast({ message: 'New password must be at least 6 characters', type: 'error' });
      return;
    }
    setPwLoading(true);
    try {
      const res = await API.put('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword
      });
      setToast({ message: res.data.message || 'Password changed successfully!', type: 'success' });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to change password', type: 'error' });
    } finally {
      setPwLoading(false);
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

            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Public Invoice Base URL / Live Render Backend URL
              </label>
              <input
                type="text"
                value={settings.invoiceBaseUrl || ''}
                onChange={(e) => handleChange('invoiceBaseUrl', e.target.value)}
                placeholder="e.g. https://pooja-coconuts-backend.onrender.com"
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 text-sm rounded-xl border border-slate-200 dark:border-slate-700 outline-none font-mono text-emerald-600 dark:text-emerald-400 font-semibold"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Used in customer WhatsApp messages for downloading official PDF invoices. When hosted on Render, enter your Render backend Web Service URL (e.g. <span className="font-mono text-slate-700 dark:text-slate-300">https://your-service.onrender.com</span>).
              </p>
            </div>
          </div>

          {/* Database Reset Danger Zone */}
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-bold text-xs text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Clear All Business Database Records</span>
                </p>
                <p className="text-[11px] text-rose-600/80 dark:text-rose-300/80">
                  Deletes all sales bills, purchases, products, customers, suppliers, and dues. An Excel backup is automatically downloaded before deleting.
                </p>
              </div>
              <button
                type="button"
                disabled={resetting}
                onClick={() => setShowResetModal(true)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow transition disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap self-start sm:self-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{resetting ? 'Exporting & Wiping DB...' : 'Reset Database Data'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Change Password — separate form */}
        <form onSubmit={handleChangePassword} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 p-6 sm:p-8 shadow-sm space-y-5">
          <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/80 pb-2">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>Login &amp; Security — Change Password</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
              <div className="relative">
                <input
                  type={showPw.current ? 'text' : 'password'}
                  required
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
                  placeholder="Current password"
                  className="w-full px-3 pr-9 py-2 bg-slate-100 dark:bg-slate-900 text-sm rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
                />
                <button type="button" onClick={() => setShowPw(p => ({ ...p, current: !p.current }))} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw.current ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showPw.newPw ? 'text' : 'password'}
                  required
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                  placeholder="Min 6 characters"
                  className="w-full px-3 pr-9 py-2 bg-slate-100 dark:bg-slate-900 text-sm rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
                />
                <button type="button" onClick={() => setShowPw(p => ({ ...p, newPw: !p.newPw }))} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw.newPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showPw.confirm ? 'text' : 'password'}
                  required
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  placeholder="Repeat new password"
                  className="w-full px-3 pr-9 py-2 bg-slate-100 dark:bg-slate-900 text-sm rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
                />
                <button type="button" onClick={() => setShowPw(p => ({ ...p, confirm: !p.confirm }))} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw.confirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={pwLoading}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              <span>{pwLoading ? 'Updating...' : 'Update Password'}</span>
            </button>
          </div>
        </form>

        {/* Reset Database Confirmation Modal with Auto-Excel Backup */}
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 sm:p-8 space-y-6">
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-600 flex-shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading font-extrabold text-xl text-slate-900 dark:text-white">
                    Reset All Business Data?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Please read carefully before proceeding. This operation wipes all database records.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Notice Box about Excel Backup */}
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Automatic Complete Excel Backup (.xlsx)</span>
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300/90 leading-relaxed">
                  Before resetting, an Excel spreadsheet containing separate sheets for <strong>Sales Bills, Detailed Items, Purchases, Customers, Suppliers, Products Inventory, and Payment Ledgers</strong> will be generated and saved directly to your Downloads folder.
                </p>
              </div>

              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl">
                <p className="text-[11px] text-rose-700 dark:text-rose-300 font-medium leading-relaxed">
                  ⚠️ <strong>Warning:</strong> All sales, customer dues, supplier records, and inventory stock in the active system will be cleared to zero. Once completed, this cannot be undone without manually restoring from your Excel file.
                </p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700/60 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmResetAndBackup}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Excel Backup & Reset Database</span>
                </button>
              </div>

            </div>
          </div>
        )}

      </main>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </div>
  );
};

export default SettingsPage;
