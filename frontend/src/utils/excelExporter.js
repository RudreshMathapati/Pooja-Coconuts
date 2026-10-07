import * as XLSX from 'xlsx';
import { getTodayDateString, formatDate } from './formatters';

export const exportToExcel = (dataArray, fileName = 'Report_Data') => {
  if (!dataArray || dataArray.length === 0) return;

  const worksheet = XLSX.utils.json_to_sheet(dataArray);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'DataSheet');

  XLSX.writeFile(workbook, `${fileName}_${getTodayDateString()}.xlsx`);
};

export const exportDatabaseBackupToExcel = (backup) => {
  const workbook = XLSX.utils.book_new();
  const {
    sales = [],
    purchases = [],
    customers = [],
    suppliers = [],
    products = [],
    customerPayments = [],
    supplierPayments = []
  } = backup || {};

  // 1. Sales Bills Sheet
  const salesRows = sales.map(s => ({
    'Bill Number': s.billNumber || '',
    'Date': formatDate(s.date),
    'Customer Name': s.customerName || '',
    'Customer Phone': s.customerPhone || '',
    'GST Number': s.gstNumber || '',
    'Items Count': (s.items || []).length,
    'Subtotal (Rs)': s.subtotal || 0,
    'GST %': s.gstPercent || 0,
    'GST Amount (Rs)': s.gstAmount || 0,
    'Grand Total (Rs)': s.grandTotal || 0,
    'Amount Paid (Rs)': s.amountPaid || 0,
    'Pending Due (Rs)': s.pendingAmount || 0,
    'Payment Status': s.paymentStatus || '',
    'Payment Method': s.paymentMethod || 'Cash',
    'Notes': s.notes || ''
  }));
  const wsSales = XLSX.utils.json_to_sheet(salesRows.length ? salesRows : [{ 'Info': 'No sales records found' }]);
  XLSX.utils.book_append_sheet(workbook, wsSales, 'Sales Bills');

  // 2. Sale Items Detailed Sheet
  const saleItemRows = [];
  sales.forEach(s => {
    (s.items || []).forEach(item => {
      saleItemRows.push({
        'Bill Number': s.billNumber || '',
        'Date': formatDate(s.date),
        'Customer Name': s.customerName || '',
        'Item Name': item.name || '',
        'Quantity': item.quantity || 0,
        'Unit': item.unit || 'Pcs',
        'Rate (Rs)': item.rate || 0,
        'Total (Rs)': item.total || 0
      });
    });
  });
  const wsSaleItems = XLSX.utils.json_to_sheet(saleItemRows.length ? saleItemRows : [{ 'Info': 'No sale items found' }]);
  XLSX.utils.book_append_sheet(workbook, wsSaleItems, 'Sale Items Detailed');

  // 3. Purchases Sheet
  const purchaseRows = purchases.map(p => ({
    'Bill Number': p.billNumber || '',
    'Type': p.purchaseType || 'Shop',
    'Date': formatDate(p.date),
    'Supplier Name': p.supplierName || '',
    'Supplier Phone': p.supplierPhone || '',
    'Items Count': (p.items || []).length,
    'Total Amount (Rs)': p.totalAmount || 0,
    'Amount Paid (Rs)': p.amountPaid || 0,
    'Pending Due (Rs)': p.pendingAmount || 0,
    'Payment Status': p.paymentStatus || '',
    'Remarks': p.remarks || ''
  }));
  const wsPurchases = XLSX.utils.json_to_sheet(purchaseRows.length ? purchaseRows : [{ 'Info': 'No purchase records found' }]);
  XLSX.utils.book_append_sheet(workbook, wsPurchases, 'Purchases');

  // 4. Purchase Items Detailed Sheet
  const purchaseItemRows = [];
  purchases.forEach(p => {
    (p.items || []).forEach(item => {
      purchaseItemRows.push({
        'Bill Number': p.billNumber || '',
        'Type': p.purchaseType || 'Shop',
        'Date': formatDate(p.date),
        'Supplier Name': p.supplierName || '',
        'Item Name': item.name || '',
        'Quantity': item.quantity || 0,
        'Unit': item.unit || 'Pcs',
        'Cost Rate (Rs)': item.rate || 0,
        'Total (Rs)': item.total || 0
      });
    });
  });
  const wsPurchaseItems = XLSX.utils.json_to_sheet(purchaseItemRows.length ? purchaseItemRows : [{ 'Info': 'No purchase items found' }]);
  XLSX.utils.book_append_sheet(workbook, wsPurchaseItems, 'Purchase Items Detailed');

  // 5. Customers Sheet
  const customerRows = customers.map(c => ({
    'Customer Name': c.name || '',
    'Phone': c.phone || '',
    'GST Number': c.gstNumber || '',
    'Address': c.address || '',
    'Total Purchased (Rs)': c.totalPurchased || 0,
    'Total Paid (Rs)': c.totalPaid || 0,
    'Pending Due (Rs)': c.pendingAmount || 0,
    'Last Purchase Date': formatDate(c.lastPurchaseDate)
  }));
  const wsCustomers = XLSX.utils.json_to_sheet(customerRows.length ? customerRows : [{ 'Info': 'No customers found' }]);
  XLSX.utils.book_append_sheet(workbook, wsCustomers, 'Customers');

  // 6. Suppliers Sheet
  const supplierRows = suppliers.map(s => ({
    'Supplier Name': s.name || '',
    'Phone': s.phone || '',
    'GST Number': s.gstNumber || '',
    'Address': s.address || '',
    'Shop Total Purchased (Rs)': s.shopTotalPurchased || 0,
    'Shop Total Paid (Rs)': s.shopTotalPaid || 0,
    'Shop Pending Due (Rs)': s.shopPendingAmount || 0,
    'Home Total Purchased (Rs)': s.homeTotalPurchased || 0,
    'Home Total Paid (Rs)': s.homeTotalPaid || 0,
    'Home Pending Due (Rs)': s.homePendingAmount || 0
  }));
  const wsSuppliers = XLSX.utils.json_to_sheet(supplierRows.length ? supplierRows : [{ 'Info': 'No suppliers found' }]);
  XLSX.utils.book_append_sheet(workbook, wsSuppliers, 'Suppliers');

  // 7. Products / Inventory Sheet
  const productRows = products.map(prod => ({
    'Product Name': prod.name || '',
    'Category': prod.category || '',
    'Unit': prod.unit || 'Pcs',
    'Current Stock': prod.stock || 0,
    'Min Stock Alert': prod.minStockAlert || 100,
    'Selling Rate (Rs)': prod.rate || 0,
    'Purchase Cost (Rs)': prod.purchaseRate || 0,
    'Description': prod.description || ''
  }));
  const wsProducts = XLSX.utils.json_to_sheet(productRows.length ? productRows : [{ 'Info': 'No products found' }]);
  XLSX.utils.book_append_sheet(workbook, wsProducts, 'Products Inventory');

  // 8. Customer Payments Sheet
  const custPayRows = customerPayments.map(cp => ({
    'Customer Name': cp.customerName || '',
    'Date': formatDate(cp.date),
    'Amount Received (Rs)': cp.amountReceived || 0,
    'Payment Method': cp.paymentMethod || 'Cash',
    'Notes': cp.notes || ''
  }));
  const wsCustPay = XLSX.utils.json_to_sheet(custPayRows.length ? custPayRows : [{ 'Info': 'No customer payments recorded' }]);
  XLSX.utils.book_append_sheet(workbook, wsCustPay, 'Customer Payments');

  // 9. Supplier Payments Sheet
  const suppPayRows = supplierPayments.map(sp => ({
    'Supplier Name': sp.supplierName || '',
    'Purchase Type': sp.purchaseType || 'Shop',
    'Date': formatDate(sp.date),
    'Amount Paid (Rs)': sp.amountPaid || 0,
    'Payment Method': sp.paymentMethod || 'Cash',
    'Notes': sp.notes || ''
  }));
  const wsSuppPay = XLSX.utils.json_to_sheet(suppPayRows.length ? suppPayRows : [{ 'Info': 'No supplier payments recorded' }]);
  XLSX.utils.book_append_sheet(workbook, wsSuppPay, 'Supplier Payments');

  const fileDate = getTodayDateString();
  const timeStr = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  XLSX.writeFile(workbook, `Pooja_Coconuts_Full_Backup_${fileDate}_${timeStr}.xlsx`);
};

