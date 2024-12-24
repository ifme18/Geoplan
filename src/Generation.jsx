import React, { useState } from 'react';
import { PlusCircle, MinusCircle, Download, Upload } from 'lucide-react';
import { jsPDF } from "jspdf";
import './Gen.css'

const Generation = () => {
  const [invoice, setInvoice] = useState({
    from: '',
    to: '',
    invoiceNumber: '',
    date: '',
    dueDate: '',
    items: [{ description: '', quantity: 1, rate: 0 }],
    tax: 0,
    notes: '',
    logo: null,
    signature: null
  });

  const handleFileUpload = (event, type) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setInvoice({ ...invoice, [type]: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const addItem = () => {
    setInvoice({
      ...invoice,
      items: [...invoice.items, { description: '', quantity: 1, rate: 0 }]
    });
  };

  const removeItem = (index) => {
    const newItems = invoice.items.filter((_, i) => i !== index);
    setInvoice({ ...invoice, items: newItems });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...invoice.items];
    newItems[index][field] = value;
    setInvoice({ ...invoice, items: newItems });
  };

  const calculateSubtotal = () => {
    return invoice.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const taxAmount = (subtotal * invoice.tax) / 100;
    return subtotal + taxAmount;
  };

  const generateInvoicePDF = () => {
    const doc = new jsPDF();
    
    // Set custom colors
    const primaryColor = '#2563eb';
    const secondaryColor = '#64748b';
    
    // Add background header
    doc.setFillColor(primaryColor);
    doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');
    
    // Add Logo if exists
    if (invoice.logo) {
      doc.addImage(invoice.logo, 'JPEG', 15, 10, 30, 30);
    }
    
    // Add "INVOICE" text in white
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 140, 25, null, null, 'right');
    
    // Reset text color for rest of content
    doc.setTextColor(0, 0, 0);
    
    // Add invoice details section
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Bill From:', 15, 60);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.from, 15, 65);
    
    doc.setFont('helvetica', 'normal');
    doc.text('Bill To:', 15, 80);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.to, 15, 85);
    
    // Add invoice metadata in right column
    doc.setFont('helvetica', 'normal');
    doc.text('Invoice Number:', 120, 60);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.invoiceNumber, 160, 60);
    
    doc.setFont('helvetica', 'normal');
    doc.text('Date:', 120, 70);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.date, 160, 70);
    
    doc.setFont('helvetica', 'normal');
    doc.text('Due Date:', 120, 80);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.dueDate, 160, 80);
    
    // Add items table
    const tableTop = 100;
    const tableHeaders = ['Item Description', 'Qty', 'Rate', 'Amount'];
    const columnWidths = [100, 20, 30, 30];
    const startX = 15;
    
    // Draw table header
    doc.setFillColor(primaryColor);
    doc.rect(startX, tableTop, doc.internal.pageSize.width - 30, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    
    let currentX = startX + 5;
    tableHeaders.forEach((header, i) => {
      doc.text(header, currentX, tableTop + 6);
      currentX += columnWidths[i];
    });
    
    // Draw table rows
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    let yPosition = tableTop + 15;
    
    invoice.items.forEach((item, index) => {
      const amount = (item.quantity * item.rate).toFixed(2);
      currentX = startX + 5;
      
      // Add zebra striping
      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(startX, yPosition - 5, doc.internal.pageSize.width - 30, 10, 'F');
      }
      
      doc.text(item.description, currentX, yPosition);
      doc.text(item.quantity.toString(), currentX + columnWidths[0], yPosition);
      doc.text(item.rate.toFixed(2), currentX + columnWidths[0] + columnWidths[1], yPosition);
      doc.text(amount, currentX + columnWidths[0] + columnWidths[1] + columnWidths[2], yPosition);
      
      yPosition += 10;
    });
    
    // Add summary section
    yPosition += 10;
    const summaryX = 120;
    
    doc.setDrawColor(secondaryColor);
    doc.setLineWidth(0.1);
    doc.line(summaryX, yPosition, doc.internal.pageSize.width - 15, yPosition);
    
    yPosition += 10;
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', summaryX, yPosition);
    doc.text(`$${calculateSubtotal().toFixed(2)}`, doc.internal.pageSize.width - 25, yPosition, null, null, 'right');
    
    yPosition += 10;
    doc.text(`Tax (${invoice.tax}%):`, summaryX, yPosition);
    doc.text(`$${(calculateSubtotal() * invoice.tax / 100).toFixed(2)}`, doc.internal.pageSize.width - 25, yPosition, null, null, 'right');
    
    yPosition += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Total:', summaryX, yPosition);
    doc.text(`$${calculateTotal().toFixed(2)}`, doc.internal.pageSize.width - 25, yPosition, null, null, 'right');
    
    // Add notes section
    if (invoice.notes) {
      yPosition += 30;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', 15, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(invoice.notes, 15, yPosition + 10);
    }
    
    // Add signature if exists
    if (invoice.signature) {
      yPosition += 30;
      doc.addImage(invoice.signature, 'JPEG', 15, yPosition, 40, 20);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Authorized Signature', 15, yPosition + 25);
    }
    
    // Add footer
    const footerY = doc.internal.pageSize.height - 20;
    doc.setFillColor(primaryColor);
    doc.rect(0, footerY, doc.internal.pageSize.width, 20, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text('Thank you for your business', doc.internal.pageSize.width / 2, footerY + 12, null, null, 'center');
    
    // Download the PDF
    doc.save(`${invoice.invoiceNumber}.pdf`);
  };

  return (
    <div className="invoice-container">
      <div className="invoice-card">
        <div className="header">
          <div className="title">Invoice Generator</div>
          <div className="upload-logo">
            {invoice.logo ? (
              <div className="logo-preview">
                <img src={invoice.logo} alt="Company Logo" className="logo-img" />
                <button
                  className="remove-logo-btn"
                  onClick={() => setInvoice({ ...invoice, logo: null })}
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="upload-area">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'logo')}
                  id="logo-upload"
                  className="hidden"
                />
                <label htmlFor="logo-upload" className="upload-label">
                  <Upload className="upload-icon" />
                  <div>Upload Logo</div>
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="grid">
          <div className="field">
            <label>Bill From</label>
            <input
              type="text"
              value={invoice.from}
              onChange={e => setInvoice({ ...invoice, from: e.target.value })}
              placeholder="Your Business"
            />
          </div>
          <div className="field">
            <label>Bill To</label>
            <input
              type="text"
              value={invoice.to}
              onChange={e => setInvoice({ ...invoice, to: e.target.value })}
              placeholder="Client's Business"
            />
          </div>
        </div>

        <div className="grid">
          <div className="field">
            <label>Invoice Number</label>
            <input
              type="text"
              value={invoice.invoiceNumber}
              onChange={e => setInvoice({ ...invoice, invoiceNumber: e.target.value })}
              placeholder="INV-001"
            />
          </div>
          <div className="field">
            <label>Date</label>
            <input
              type="date"
              value={invoice.date}
              onChange={e => setInvoice({ ...invoice, date: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Due Date</label>
            <input
              type="date"
              value={invoice.dueDate}
              onChange={e => setInvoice({ ...invoice, dueDate: e.target.value })}
            />
          </div>
        </div>

        <div className="items-section">
          <div className="items-header">
            <div>Items</div>
            <button onClick={addItem} className="add-item-btn">
              <PlusCircle className="icon" /> Add Item
            </button>
          </div>

          {invoice.items.map((item, index) => (
            <div key={index} className="item-row">
              <input
                type="text"
                placeholder="Description"
                value={item.description}
                onChange={e => updateItem(index, 'description', e.target.value)}
              />
              <input
                type="number"
                placeholder="Quantity"
                value={item.quantity}
                onChange={e => updateItem(index, 'quantity', parseFloat(e.target.value))}
              />
              <input
                type="number"
                placeholder="Rate"
                value={item.rate}
                onChange={e => updateItem(index, 'rate', parseFloat(e.target.value))}
              />
              <div className="item-total">${(item.quantity * item.rate).toFixed(2)}</div>
              <button className="remove-item-btn" onClick={() => removeItem(index)}>
                <MinusCircle className="icon" />
              </button>
            </div>
          ))}
        </div>

        <div className="grid">
          <div className="field">
            <label>Notes</label>
            <input
              type="text"
              value={invoice.notes}
              onChange={e => setInvoice({ ...invoice, notes: e.target.value })}
              placeholder="Payment terms, notes, etc."
            />
          </div>
          <div className="field">
  <label>Tax Rate (%)</label>
  <input
    type="number"
    value={invoice.tax}
    onChange={e => setInvoice({ ...invoice, tax: parseFloat(e.target.value) || 0 })}
    placeholder="0"
  />
</div>

        </div>

        <div className="summary">
          <div>
            <span>Subtotal:</span>
            <span>${calculateSubtotal().toFixed(2)}</span>
          </div>
          <div>
            <span>Tax ({invoice.tax}%):</span>
            <span>${(calculateSubtotal() * invoice.tax / 100).toFixed(2)}</span>
          </div>
          <div className="total">
            <span>Total:</span>
            <span>${calculateTotal().toFixed(2)}</span>
          </div>
        </div>

        <div className="signature-section">
          {invoice.signature ? (
            <div className="signature-preview">
              <img src={invoice.signature} alt="Signature" className="signature-img" />
              <button
                className="remove-signature-btn"
                onClick={() => setInvoice({ ...invoice, signature: null })}
              >
                ×
              </button>
            </div>
          ) : (
            <div className="upload-area">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'signature')}
                id="signature-upload"
                className="hidden"
              />
              <label htmlFor="signature-upload" className="upload-label">
                <Upload className="upload-icon" />
                <div>Upload Signature</div>
              </label>
            </div>
          )}
        </div>

        <button className="generate-btn" onClick={generateInvoicePDF}>
          <Download className="icon" />
          Generate Invoice
        </button>
      </div>
    </div>
  );
};

export default Generation;


