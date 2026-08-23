import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from './formatters';

// Helper to convert number to Indian Currency Words
const numberToWordsINR = (amount) => {
  const num = Math.floor(Math.abs(Number(amount) || 0));
  if (num === 0) return 'Rupees Zero Only';

  const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const twoDigits = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertLessThanOneThousand = (n) => {
    let str = '';
    if (n >= 100) {
      str += singleDigits[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 10 && n <= 19) {
      str += twoDigits[n - 10] + ' ';
    } else if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      if (n % 10 > 0) {
        str += singleDigits[n % 10] + ' ';
      }
    } else if (n > 0) {
      str += singleDigits[n] + ' ';
    }
    return str;
  };

  let word = '';
  const crore = Math.floor(num / 10000000);
  let remainder = num % 10000000;

  const lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;

  const thousand = Math.floor(remainder / 1000);
  remainder = remainder % 1000;

  if (crore > 0) {
    word += convertLessThanOneThousand(crore) + 'Crore ';
  }
  if (lakh > 0) {
    word += convertLessThanOneThousand(lakh) + 'Lakh ';
  }
  if (thousand > 0) {
    word += convertLessThanOneThousand(thousand) + 'Thousand ';
  }
  if (remainder > 0) {
    word += convertLessThanOneThousand(remainder);
  }

  return `Rupees ${word.trim()} Only`;
};

// Helper for Indian Currency number formatting
const formatINR = (val) => {
  const n = Number(val) || 0;
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Generate Clean, Modern & Professional Invoice PDF
export const createInvoicePDFDoc = (sale, settings) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const shopTitle = settings?.shopName || 'M/s. POOJA COCONUT & GENERAL MERCHANT';
  const tagline = settings?.tagline || 'WHOLESALE DEALERS IN ALL VARIETIES OF COCONUTS';
  const address = settings?.address || 'Basava Gunj, BASAVAKALYAN - 585 327. Dst. Bidar (Karnataka)';
  const phone = settings?.phone || '9449458675';
  const gstin = settings?.gstin || '29AIDPM4039Q1ZN';

  // 1. Pure White Background & Clean Double Border
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 210, 297, 'F');

  // Outer solid border
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.6);
  doc.rect(10, 10, 190, 277);

  // Inner subtle frame line
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.rect(11.5, 11.5, 187, 274);

  // 2. Top Bar: GSTIN, Invocation, Phone
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`GSTIN: ${gstin}`, 14, 16.5);

  doc.setFont('helvetica', 'bolditalic');
  doc.setTextColor(185, 28, 28); // Deep crimson for invocation
  doc.setFontSize(9);
  doc.text('|| Shri Sangameshwar Prasanna ||', 105, 16.5, { align: 'center' });

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`Cell: ${phone}`, 196, 16.5, { align: 'right' });

  // 3. TAX INVOICE / CASH BILL Badge
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(65, 19.5, 80, 5.5, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('TAX INVOICE / CASH BILL (Original)', 105, 23.3, { align: 'center' });

  // 4. Shop Name & Details
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(shopTitle, 105, 32.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(tagline.toUpperCase(), 105, 37.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(address, 105, 42.5, { align: 'center' });

  // Divider Line
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(11.5, 45.5, 198.5, 45.5);

  // 5. Bill & Customer Metadata Box
  doc.setFillColor(248, 250, 252);
  doc.rect(11.5, 45.5, 187, 24.5, 'F');
  doc.line(11.5, 70, 198.5, 70);
  doc.line(115, 45.5, 115, 70); // Vertical Divider

  // Customer Information (Left Side)
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('BILLED TO / CUSTOMER:', 15, 50.5);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(sale.customerName || 'Cash Customer', 15, 56);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Phone: ${sale.customerPhone || 'N/A'}`, 15, 61);
  if (sale.gstNumber) {
    doc.text(`Customer GSTIN: ${sale.gstNumber}`, 15, 66);
  }

  // Invoice Details (Right Side)
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('INVOICE PARTICULARS:', 119, 50.5);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Bill No :', 119, 56);
  doc.text(sale.billNumber || '-', 145, 56);

  doc.setFont('helvetica', 'normal');
  doc.text('Date     :', 119, 61);
  doc.text(formatDate(sale.date), 145, 61);

  doc.text('Status  :', 119, 66);
  const statusStr = (sale.paymentStatus || 'Paid').toUpperCase();
  doc.setFont('helvetica', 'bold');
  if (statusStr === 'PAID') {
    doc.setTextColor(16, 185, 129);
  } else if (statusStr === 'PARTIAL') {
    doc.setTextColor(59, 130, 246);
  } else {
    doc.setTextColor(239, 68, 68);
  }
  doc.text(statusStr, 145, 66);

  // 6. Items Table (AutoTable)
  const tableRows = (sale.items || []).map((item, index) => {
    return [
      String(index + 1),
      item.name || 'Coconut Item',
      `${item.quantity} ${item.unit || 'Pcs'}`,
      `Rs. ${formatINR(item.rate)}`,
      `Rs. ${formatINR(item.total)}`
    ];
  });

  autoTable(doc, {
    startY: 72,
    head: [
      [
        { content: '#', styles: { halign: 'center' } },
        { content: 'PARTICULARS / ITEM DESCRIPTION', styles: { halign: 'left' } },
        { content: 'QTY & UNIT', styles: { halign: 'center' } },
        { content: 'RATE', styles: { halign: 'right' } },
        { content: 'AMOUNT', styles: { halign: 'right' } }
      ]
    ],
    body: tableRows,
    theme: 'grid',
    margin: { left: 11.5, right: 11.5 },
    styles: {
      fillColor: [255, 255, 255],
      textColor: [15, 23, 42],
      lineColor: [203, 213, 225],
      lineWidth: 0.3,
      fontSize: 8.5,
      cellPadding: 2.5
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      lineWidth: 0.3
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 87, halign: 'left' },
      2: { cellWidth: 26, halign: 'center' },
      3: { cellWidth: 28, halign: 'right' },
      4: { cellWidth: 36, halign: 'right' }
    }
  });

  const tableEndY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 120;
  const summaryY = tableEndY + 3;

  // 7. Amount In Words & Payment Summary (Left Side)
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('AMOUNT IN WORDS:', 15, summaryY + 4);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(numberToWordsINR(sale.grandTotal), 15, summaryY + 9, { maxWidth: 92 });

  // Payment Breakdown Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, summaryY + 14, 95, 14, 1, 1, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(`Amount Paid  : Rs. ${formatINR(sale.amountPaid)}`, 17, summaryY + 19.5);

  doc.setTextColor(sale.pendingAmount > 0 ? 239 : 100, sale.pendingAmount > 0 ? 68 : 116, sale.pendingAmount > 0 ? 68 : 139);
  doc.text(`Pending Due  : Rs. ${formatINR(sale.pendingAmount)}`, 17, summaryY + 25);

  // 8. Totals Breakdown Card (Right Side)
  const hasGst = Boolean(sale.gstPercent && sale.gstPercent > 0);
  const cardHeight = hasGst ? 28 : 22;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(114, summaryY, 82, cardHeight, 1.5, 1.5, 'FD');

  let currentRightY = summaryY + 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Subtotal:', 117, currentRightY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Rs. ${formatINR(sale.subtotal || sale.grandTotal)}`, 193, currentRightY, { align: 'right' });

  if (hasGst) {
    currentRightY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`GST (${sale.gstPercent}%):`, 117, currentRightY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Rs. ${formatINR(sale.gstAmount)}`, 193, currentRightY, { align: 'right' });
  }

  // Grand Total Highlight Banner
  const totalBannerY = currentRightY + 2.5;
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(115.5, totalBannerY, 79, 8, 1, 1, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('GRAND TOTAL', 119, totalBannerY + 5.5);
  doc.text(`Rs. ${formatINR(sale.grandTotal)}`, 192, totalBannerY + 5.5, { align: 'right' });

  // 9. Terms & Signatures (Fixed at Bottom Section)
  const footerY = Math.max(summaryY + cardHeight + 10, 238);

  // Horizontal Divider Line
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(11.5, footerY, 198.5, footerY);

  // Terms & Conditions (Left)
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('TERMS & CONDITIONS:', 15, footerY + 5);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('1. Sold coconuts & tender coconuts will not be taken back or exchanged.', 15, footerY + 9.5);
  doc.text('2. Discrepancy, if any, in count or rate must be notified on delivery.', 15, footerY + 13.5);
  doc.text('3. Subject to Basavakalyan jurisdiction only.', 15, footerY + 17.5);

  // Authorized Signatory (Right)
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('For M/s. POOJA COCONUT & GENERAL MERCHANT', 195, footerY + 5, { align: 'right' });

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Signatory', 195, footerY + 22, { align: 'right' });

  // Bottom Center Watermark Note
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text('Thank you for your business!  *  This is a computer generated invoice.', 105, 281, { align: 'center' });

  return doc;
};

// Download PDF to local disk (Only called when clicking "Generate PDF")
export const generateInvoicePDF = (sale, settings) => {
  const doc = createInvoicePDFDoc(sale, settings);
  doc.save(`${sale.billNumber}_Invoice.pdf`);
};
