import React, { useRef } from 'react';
import Modal from './Modal';
import { formatCurrency, formatDate, getStatusColorClass } from '../../utils/formatters';
import { Printer, Download, X, ShoppingBag, Home, CheckCircle2, Clock } from 'lucide-react';

const PurchaseBillModal = ({ isOpen, onClose, purchase, settings = null }) => {
  const printRef = useRef(null);

  if (!isOpen || !purchase) return null;

  const isHome = purchase.purchaseType === 'Home';
  const shopName = settings?.shopName || 'M/s. POOJA COCONUT & GENERAL MERCHANT';
  const kannadaName = settings?.kannadaName || 'ಮೇ. ಪೂಜಾ ಕೋಕೋನಟ್';
  const address = settings?.address || 'Basava Gunj, BASAVAKALYAN-585 327. Dst. Bidar. (K.S)';
  const phone = settings?.phone || '9449458675';
  const gstin = settings?.gstin || '29AIDPM4039Q1ZN';

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=850,height=900');
    if (!printWindow) {
      alert('Please allow popups to print the purchase bill');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Purchase Voucher #${purchase.billNumber || 'NO'}</title>
          <style>
            @page { size: A4; margin: 12mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 15px; font-size: 12px; }
            .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; }
            .header h1 { margin: 0; font-size: 18px; text-transform: uppercase; font-weight: 800; color: #0f172a; }
            .header h2 { margin: 2px 0; font-size: 14px; font-weight: bold; }
            .header p { margin: 2px 0; font-size: 11px; color: #475569; }
            .title-badge { display: inline-block; background: #0f172a; color: white; padding: 3px 10px; font-weight: bold; font-size: 11px; border-radius: 4px; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
            .meta-grid { display: flex; justify-content: space-between; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; margin-bottom: 10px; }
            .meta-col { flex: 1; }
            .meta-col.right { text-align: right; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
            .table th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 11px; text-transform: uppercase; text-align: left; }
            .table td { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 11px; }
            .table td.num { text-align: right; }
            .table td.center { text-align: center; }
            .summary-table { width: 45%; margin-left: auto; border-collapse: collapse; margin-top: 8px; }
            .summary-table td { padding: 4px 6px; font-size: 11px; border-bottom: 1px solid #e2e8f0; }
            .summary-table td.total { font-weight: 800; font-size: 13px; border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; }
            .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 11px; color: #475569; }
            .signature { margin-top: 40px; border-top: 1px dashed #64748b; width: 160px; text-align: center; padding-top: 4px; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const chargesList = Array.isArray(purchase.additionalCharges) ? purchase.additionalCharges : [];
  const itemsList = Array.isArray(purchase.items) ? purchase.items : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isHome ? `Home Expense Voucher — Bill #${purchase.billNumber || 'NO'}` : `Purchase Bill Voucher — Bill #${purchase.billNumber || 'NO'}`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        
        {/* Printable Area */}
        <div ref={printRef} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-4 border border-slate-300 dark:border-slate-700 rounded-xl space-y-4 text-xs font-sans">
          
          {/* Voucher Header */}
          <div className="text-center border-b-2 border-slate-900 dark:border-slate-600 pb-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
              || Shri Sangameshwar Prasanna ||
            </div>
            <h1 className="font-heading font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight">
              {shopName}
            </h1>
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {kannadaName}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {address}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Cell: {phone} {gstin ? `| GSTIN: ${gstin}` : ''}
            </p>
            
            <div className="mt-2">
              <span className={`inline-block px-3 py-1 rounded text-[11px] font-black uppercase tracking-wider font-mono ${
                isHome
                  ? 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 border border-purple-300'
                  : 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300 border border-blue-300'
              }`}>
                {isHome ? 'HOUSEHOLD EXPENSE PURCHASE VOUCHER' : 'OFFICIAL STOCK PROCUREMENT VOUCHER'}
              </span>
            </div>
          </div>

          {/* Supplier & Bill Metadata */}
          <div className="grid grid-cols-2 gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Supplier / Party:</span>
              <p className="font-extrabold text-sm text-slate-900 dark:text-white">
                {purchase.supplierName}
              </p>
              {purchase.supplierPhone && (
                <p className="text-xs text-slate-500 font-mono">Phone: {purchase.supplierPhone}</p>
              )}
            </div>

            <div className="text-right">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Voucher Details:</span>
              <p className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                Bill #: <span className="text-blue-600 dark:text-blue-400 font-black">{purchase.billNumber || 'NO'}</span>
              </p>
              <p className="text-xs text-slate-500">Date: {formatDate(purchase.date)}</p>
              <div className="mt-1">
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${getStatusColorClass(purchase.paymentStatus)}`}>
                  {purchase.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Items Particulars Table */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
              1. Purchased Items Particulars
            </span>
            <div className="border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] font-extrabold uppercase text-slate-600 dark:text-slate-300 divide-x divide-slate-200 dark:divide-slate-700">
                  <tr>
                    <th className="py-1.5 px-2.5 w-10 text-center">#</th>
                    <th className="py-1.5 px-3">Description</th>
                    <th className="py-1.5 px-3 w-20 text-center">Unit</th>
                    <th className="py-1.5 px-3 w-20 text-right">Qty</th>
                    <th className="py-1.5 px-3 w-24 text-right">Rate (₹)</th>
                    <th className="py-1.5 px-3 w-28 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 divide-x divide-slate-200 dark:divide-slate-800 font-mono text-xs">
                  {itemsList.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-1.5 px-2.5 text-center text-slate-500 font-bold">{idx + 1}</td>
                      <td className="py-1.5 px-3 font-sans font-bold text-slate-900 dark:text-white">{item.name}</td>
                      <td className="py-1.5 px-3 text-center text-slate-500 font-sans">{item.unit || 'Pcs'}</td>
                      <td className="py-1.5 px-3 text-right font-bold">{item.quantity}</td>
                      <td className="py-1.5 px-3 text-right">{item.rate}</td>
                      <td className="py-1.5 px-3 text-right font-black text-slate-900 dark:text-white">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 dark:bg-slate-800/70 font-bold">
                    <td colSpan="5" className="py-1.5 px-3 text-right uppercase text-[10px] font-extrabold font-sans text-slate-600 dark:text-slate-300">
                      Items Subtotal:
                    </td>
                    <td className="py-1.5 px-3 text-right font-black text-slate-900 dark:text-white">
                      {formatCurrency(purchase.itemsSubtotal || itemsList.reduce((s, i) => s + (Number(i.total) || 0), 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Additional Quantity-based Charges Table (If any) */}
          {chargesList.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                2. Additional Charges Breakdown (Grading, Freight, Labour, etc.)
              </span>
              <div className="border border-blue-200 dark:border-blue-900 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-blue-50 dark:bg-blue-950/60 text-[10px] font-extrabold uppercase text-blue-900 dark:text-blue-300 divide-x divide-blue-200 dark:divide-blue-900">
                    <tr>
                      <th className="py-1.5 px-2.5 w-10 text-center">#</th>
                      <th className="py-1.5 px-3">Charge Name</th>
                      <th className="py-1.5 px-3 w-24 text-right">Quantity</th>
                      <th className="py-1.5 px-3 w-24 text-right">Rate (₹)</th>
                      <th className="py-1.5 px-3 w-28 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-100 dark:divide-blue-900/60 divide-x divide-blue-100 dark:divide-blue-900/60 font-mono text-xs">
                    {chargesList.map((ch, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/40">
                        <td className="py-1.5 px-2.5 text-center text-slate-500 font-bold">{idx + 1}</td>
                        <td className="py-1.5 px-3 font-sans font-bold text-slate-800 dark:text-slate-200">{ch.name}</td>
                        <td className="py-1.5 px-3 text-right">{ch.quantity > 0 ? ch.quantity : '-'}</td>
                        <td className="py-1.5 px-3 text-right">{ch.rate > 0 ? `₹${ch.rate}` : '-'}</td>
                        <td className="py-1.5 px-3 text-right font-black text-blue-700 dark:text-blue-400">
                          +{formatCurrency(ch.amount)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-blue-50/70 dark:bg-blue-950/40 font-bold">
                      <td colSpan="4" className="py-1.5 px-3 text-right uppercase text-[10px] font-extrabold font-sans text-blue-900 dark:text-blue-300">
                        Extra Charges Total:
                      </td>
                      <td className="py-1.5 px-3 text-right font-black text-blue-700 dark:text-blue-400">
                        +{formatCurrency(purchase.additionalChargesTotal || chargesList.reduce((s, c) => s + (Number(c.amount) || 0), 0))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Accounting Totals Block */}
          <div className="flex justify-end pt-2">
            <div className="w-full sm:w-72 bg-slate-100 dark:bg-slate-800/80 p-3 rounded-lg border border-slate-300 dark:border-slate-700 space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400 font-sans">
                <span>Items Subtotal:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {formatCurrency(purchase.itemsSubtotal || itemsList.reduce((s, i) => s + (Number(i.total) || 0), 0))}
                </span>
              </div>

              {(purchase.additionalChargesTotal > 0 || chargesList.length > 0) && (
                <div className="flex justify-between text-blue-600 dark:text-blue-400 font-sans">
                  <span>Extra Charges:</span>
                  <span className="font-bold font-mono">
                    +{formatCurrency(purchase.additionalChargesTotal || chargesList.reduce((s, c) => s + (Number(c.amount) || 0), 0))}
                  </span>
                </div>
              )}

              <div className="pt-1.5 border-t-2 border-slate-400 dark:border-slate-600 flex justify-between text-sm font-black text-slate-900 dark:text-white font-sans">
                <span>GRAND TOTAL:</span>
                <span className="text-blue-600 dark:text-blue-400 font-mono">
                  {formatCurrency(purchase.totalAmount)}
                </span>
              </div>

              <div className="flex justify-between text-emerald-600 font-bold font-sans">
                <span>PAID:</span>
                <span className="font-mono">{formatCurrency(purchase.amountPaid)}</span>
              </div>

              <div className="flex justify-between text-rose-600 font-black font-sans pt-1 border-t border-slate-300 dark:border-slate-700">
                <span>PENDING DUE:</span>
                <span className="font-mono">{formatCurrency(purchase.pendingAmount)}</span>
              </div>
            </div>
          </div>

          {/* Remarks */}
          {purchase.remarks && (
            <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2.5 rounded border border-slate-200 dark:border-slate-700">
              <span className="font-bold uppercase text-[10px] text-slate-500 block">Remarks:</span>
              <span>{purchase.remarks}</span>
            </div>
          )}

          {/* Signatures */}
          <div className="pt-6 flex justify-between text-slate-500 text-[10px]">
            <div className="text-center">
              <div className="h-8"></div>
              <div className="border-t border-slate-400 w-32 pt-1 font-bold">Supplier's Signature</div>
            </div>
            <div className="text-center">
              <div className="h-8"></div>
              <div className="border-t border-slate-400 w-32 pt-1 font-bold">Authorized Signatory</div>
            </div>
          </div>

        </div>

        {/* Modal Action Buttons */}
        <div className="flex justify-end items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg text-xs font-bold transition"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print Purchase Voucher</span>
          </button>
        </div>

      </div>
    </Modal>
  );
};

export default PurchaseBillModal;
