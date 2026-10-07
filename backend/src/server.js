const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const { seedInitialData } = require('./utils/seedData');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

const app = express();

// Ensure public/invoices folder exists
const invoicesDir = path.join(__dirname, '../public/invoices');
if (!fs.existsSync(invoicesDir)) {
  fs.mkdirSync(invoicesDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());

// Explicit PDF Invoices Route Handler with On-Demand Generation for Render
app.get('/invoices/:filename', async (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(invoicesDir, filename);
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/pdf');
    return res.sendFile(filePath);
  }

  // Fallback: If missing on disk (e.g. Render restarted/ephemeral container), regenerate from DB on the fly
  try {
    const billNumber = filename.replace(/\.pdf$/i, '');
    const Sale = require('./models/Sale');
    const Setting = require('./models/Setting');
    const { generateServerInvoicePDF } = require('./utils/pdfGeneratorServer');

    const sale = await Sale.findOne({ billNumber });
    if (sale) {
      const settings = await Setting.findOne();
      generateServerInvoicePDF(sale, settings);
      if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', 'application/pdf');
        return res.sendFile(filePath);
      }
    }
  } catch (err) {
    console.error('Error generating on-demand PDF invoice on Render:', err);
  }

  res.status(404).send(`PDF Invoice ${filename} not found.`);
});

// Serve Static PDF Invoices
app.use('/invoices', express.static(invoicesDir));

// Connect Database & Run Initial Seed Data
connectDB().then(async () => {
  await seedInitialData();
});

// Root & Health check endpoints
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'Pooja Coconuts ERP Backend API is running successfully.' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Pooja Coconuts ERP Backend API is running clean.' });
});

// Register API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/suppliers', require('./routes/supplierRoutes'));
app.use('/api/sales', require('./routes/saleRoutes'));
app.use('/api/purchases', require('./routes/purchaseRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/settings', require('./routes/settingRoutes'));

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`POOJA COCONUTS ERP BACKEND SERVER ACTIVE`);
  console.log(`Running on Port: ${PORT}`);
  console.log(`PDF Invoices directory: ${invoicesDir}`);
  console.log(`====================================================`);
});
