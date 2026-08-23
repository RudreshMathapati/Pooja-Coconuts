import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import API from '../../services/api';
import { formatCurrency, getTodayDateString } from '../../utils/formatters';
import { AlertCircle } from 'lucide-react';

const CollectPaymentModal = ({ isOpen, onClose, customer = null, onSuccess }) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customers, setCustomers] = useState([]);
  const [amountReceived, setAmountReceived] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      setAmountReceived('');
      setNotes('');
      setDate(getTodayDateString());

      if (customer) {
        setSelectedCustomerId(customer._id);
      } else {
        // Fetch all customers with pending dues > 0
        API.get('/customers/dues').then(res => {
          const duesOnly = (res.data || []).filter(c => c.pendingAmount > 0);
          setCustomers(duesOnly);
          if (duesOnly.length > 0) {
            setSelectedCustomerId(duesOnly[0]._id);
          }
        }).catch(console.error);
      }
    }
  }, [isOpen, customer]);

  const activeCustomer = customer || customers.find(c => c._id === selectedCustomerId);
  const isZeroDue = !activeCustomer || !activeCustomer.pendingAmount || activeCustomer.pendingAmount <= 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeCustomer) {
      setError('Please select a customer');
      return;
    }

    if (isZeroDue) {
      setError('Cannot collect payment. This customer has ₹0 outstanding balance.');
      return;
    }

    const val = Number(amountReceived);
    if (!val || val <= 0) {
      setError('Please enter a valid amount greater than zero');
      return;
    }

    if (val > activeCustomer.pendingAmount) {
      setError(`Amount cannot exceed total pending due (${formatCurrency(activeCustomer.pendingAmount)})`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await API.post('/payments/customer', {
        customerId: activeCustomer._id,
        amountReceived: val,
        date,
        notes
      });
      if (onSuccess) onSuccess('Payment collected successfully!');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Collect Customer Payment" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs rounded-xl border border-rose-200 dark:border-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Customer Select or Fixed */}
        {!customer ? (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Customer with Outstanding Dues *
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-sm rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {customers.length === 0 ? (
                <option value="">No customers with pending dues</option>
              ) : (
                customers.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.phone}) - Due: {formatCurrency(c.pendingAmount)}
                  </option>
                ))
              )}
            </select>
          </div>
        ) : (
          <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">Customer Name</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{activeCustomer?.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Phone: {activeCustomer?.phone}</p>
          </div>
        )}

        {/* Pending Due Badge */}
        {activeCustomer && (
          <div className={`flex items-center justify-between p-3 rounded-xl border ${
            isZeroDue
              ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60'
          }`}>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Total Pending Balance:</span>
            <span className={`text-sm font-extrabold ${isZeroDue ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
              {formatCurrency(activeCustomer.pendingAmount || 0)}
            </span>
          </div>
        )}

        {/* Zero Dues Warning Banner */}
        {isZeroDue && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>This customer has ₹0 outstanding balance. No payment can be collected.</span>
          </div>
        )}

        {/* Payment Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Payment Date *
          </label>
          <input
            type="date"
            value={date}
            disabled={isZeroDue}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-sm rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none disabled:opacity-50"
            required
          />
        </div>

        {/* Amount Received */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Amount Received (₹) *
          </label>
          <input
            type="number"
            min="1"
            max={activeCustomer?.pendingAmount || 0}
            disabled={isZeroDue}
            placeholder={isZeroDue ? '0' : 'e.g. 5000'}
            value={amountReceived}
            onChange={(e) => setAmountReceived(e.target.value)}
            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-sm rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none font-semibold text-emerald-600 dark:text-emerald-400 disabled:opacity-50"
            required
          />
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Payment Method
          </label>
          <input
            type="text"
            value="Cash"
            disabled
            className="w-full px-3 py-2 bg-slate-200/70 dark:bg-slate-800/50 text-sm rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 cursor-not-allowed font-medium"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Remarks / Notes (Optional)
          </label>
          <textarea
            rows="2"
            disabled={isZeroDue}
            placeholder="e.g. Cash collected at counter"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-sm rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none resize-none disabled:opacity-50"
          />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || isZeroDue}
            className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-md transition"
          >
            {loading ? 'Recording...' : 'Collect Payment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CollectPaymentModal;
