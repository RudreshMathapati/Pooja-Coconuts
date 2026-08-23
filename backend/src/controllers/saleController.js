const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const InventoryLog = require('../models/InventoryLog');
const Setting = require('../models/Setting');
const { generateServerInvoicePDF } = require('../utils/pdfGeneratorServer');
const os = require('os');

// Helper to get local network IP address for clickable WhatsApp links
const getLocalIp = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

// Helper to generate sequential bill number PC-0001
const getNextBillNumber = async () => {
  const settings = await Setting.findOne();
  const prefix = settings ? settings.invoicePrefix : 'PC-';

  const lastSale = await Sale.findOne().sort({ createdAt: -1 });
  if (!lastSale || !lastSale.billNumber) {
    return `${prefix}0001`;
  }

  const numPart = lastSale.billNumber.replace(prefix, '');
  const nextNum = parseInt(numPart, 10) + 1;
  if (isNaN(nextNum)) {
    return `${prefix}${Date.now().toString().slice(-4)}`;
  }
  return `${prefix}${nextNum.toString().padStart(4, '0')}`;
};

// @desc    Get next bill number
// @route   GET /api/sales/next-bill-number
const fetchNextBillNumber = async (req, res, next) => {
  try {
    const nextBillNo = await getNextBillNumber();
    res.json({ billNumber: nextBillNo });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all sales
// @route   GET /api/sales
const getSales = async (req, res, next) => {
  try {
    const { startDate, endDate, customerId, status } = req.query;
    let query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (customerId) {
      query.customer = customerId;
    }
    if (status) {
      query.paymentStatus = status;
    }

    const sales = await Sale.find(query).sort({ createdAt: -1, date: -1, _id: -1 });
    res.json(sales);
  } catch (err) {
    next(err);
  }
};

// @desc    Get single sale bill detail
// @route   GET /api/sales/:id
const getSaleById = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale bill not found' });
    }
    res.json(sale);
  } catch (err) {
    next(err);
  }
};

// @desc    Create new Sale Bill
// @route   POST /api/sales
const createSale = async (req, res, next) => {
  try {
    const {
      billNumber: customBillNo,
      customerName,
      customerPhone,
      gstNumber,
      items,
      subtotal,
      gstPercent,
      gstAmount,
      grandTotal,
      amountPaid,
      paymentStatus,
      notes,
      date
    } = req.body;

    if (!customerName || !items || items.length === 0) {
      return res.status(400).json({ message: 'Customer name and at least one item are required' });
    }

    // 1. Generate or validate Bill Number
    let billNumber = customBillNo;
    if (!billNumber) {
      billNumber = await getNextBillNumber();
    } else {
      const existing = await Sale.findOne({ billNumber });
      if (existing) {
        billNumber = await getNextBillNumber();
      }
    }

    // 2. Calculate paid & pending amounts
    const paidVal = paymentStatus === 'Paid' ? grandTotal : (Number(amountPaid) || 0);
    const pendingVal = Math.max(0, grandTotal - paidVal);
    const finalStatus = pendingVal === 0 ? 'Paid' : (paidVal === 0 ? 'Pending' : 'Partial');

    // 3. Customer Lookup or Auto Creation
    let customerObj = null;
    if (customerPhone && customerPhone.trim()) {
      customerObj = await Customer.findOne({ phone: customerPhone.trim() });
      if (!customerObj) {
        customerObj = await Customer.create({
          name: customerName.trim(),
          phone: customerPhone.trim(),
          gstNumber: gstNumber || ''
        });
      }
    } else {
      customerObj = await Customer.findOne({ name: customerName.trim() });
    }

    // Update customer stats if found/created
    if (customerObj) {
      customerObj.totalPurchased += grandTotal;
      customerObj.totalPaid += paidVal;
      customerObj.pendingAmount += pendingVal;
      customerObj.lastPurchaseDate = date ? new Date(date) : new Date();
      await customerObj.save();
    }

    // 4. Save Sale Document
    const sale = await Sale.create({
      billNumber,
      customer: customerObj ? customerObj._id : null,
      customerName: customerName.trim(),
      customerPhone: customerPhone ? customerPhone.trim() : '',
      gstNumber: gstNumber || '',
      items,
      subtotal,
      gstPercent: gstPercent || 0,
      gstAmount: gstAmount || 0,
      grandTotal,
      amountPaid: paidVal,
      pendingAmount: pendingVal,
      paymentStatus: finalStatus,
      paymentMethod: 'Cash',
      notes: notes || '',
      date: date ? new Date(date) : new Date()
    });

    // 5. Update Inventory & Log Stock Movements
    for (const item of items) {
      if (item.product) {
        const prod = await Product.findById(item.product);
        if (prod) {
          const prevStock = prod.stock;
          prod.stock = Math.max(0, prod.stock - item.quantity);
          await prod.save();

          await InventoryLog.create({
            product: prod._id,
            productName: prod.name,
            changeType: 'STOCK_SOLD_SALE',
            quantity: -item.quantity,
            previousStock: prevStock,
            newStock: prod.stock,
            referenceId: sale.billNumber,
            date: sale.date,
            remarks: `Sold in Bill #${sale.billNumber}`
          });
        }
      }
    }

    // 6. Generate Server PDF Invoice File & WhatsApp Link
    const settings = await Setting.findOne();
    let whatsappUrl = null;
    let pdfUrl = null;

    try {
      const pdfFilename = generateServerInvoicePDF(sale, settings);
      let baseUrl = settings?.invoiceBaseUrl;
      if (!baseUrl || baseUrl.includes('localhost')) {
        const hostIp = process.env.PUBLIC_HOST || getLocalIp();
        baseUrl = `http://${hostIp}`;
      }
      pdfUrl = `${baseUrl.replace(/\/$/, '')}/invoices/${pdfFilename}`;
    } catch (pdfErr) {
      console.error('Failed to generate server PDF invoice', pdfErr);
    }

    if (customerPhone && customerPhone.trim()) {
      const shopTitle = settings ? settings.shopName : 'M/s. POOJA COCONUT & GENERAL MERCHANT';
      const kannadaTitle = settings ? settings.kannadaName : 'ಮೇ. ಪೂಜಾ ಕೋಕೋನಟ್';
      const address = settings ? settings.address : 'Basava Gunj, BASAVAKALYAN-585 327. Dst. Bidar. (K.S)';
      const cellPhone = settings ? settings.phone : '9449458675';
      const gstinVal = settings ? settings.gstin : '29AIDPM4039Q1ZN';
      const disclaimer = settings ? settings.disclaimerText : 'ಸೂಚನೆ : ಮಾರಾಟದ ತೆಂಗು ಮತ್ತು ಎಳನೀರು ವಾಪಾಸ ತೆಗೆದುಕೊಳ್ಳುವುದಿಲ್ಲ';

      const cleanPhone = customerPhone.replace(/\D/g, '');
      const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      
      const itemRowsText = items.map(i => `• ${i.name}: ${i.quantity} ${i.unit || 'Pcs'} @ ₹${i.rate} = ₹${i.total}`).join('\n');

      const finalPdfUrl = pdfUrl || `http://${getLocalIp()}:5000/invoices/${sale.billNumber}.pdf`;

      const message = `*|| Shri Sangameshwar Prasanna ||*\n*${shopTitle}*\n(${kannadaTitle})\n${address}\nCell: ${cellPhone} | GSTIN: ${gstinVal}\n----------------------------------------\n*CASH/CREDIT BILL No:* *${sale.billNumber}*\nDate: ${new Date(sale.date).toLocaleDateString('en-IN')}\nShri (Customer): ${sale.customerName}\n----------------------------------------\n*COCONUTS / PARTICULAR ITEMS:*\n${itemRowsText}\n----------------------------------------\n*SUBTOTAL:* ₹${sale.subtotal}\n*GRAND TOTAL:* ₹${sale.grandTotal}\n*AMOUNT PAID:* ₹${sale.amountPaid}\n*PENDING DUE:* ₹${sale.pendingAmount}\n----------------------------------------\n*Download Official PDF Invoice:*\n${finalPdfUrl}\n----------------------------------------\n*${disclaimer}*\nThank you for your business!`;
      
      whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    }

    res.status(201).json({
      sale,
      pdfUrl,
      whatsappUrl
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  fetchNextBillNumber,
  getSales,
  getSaleById,
  createSale
};
