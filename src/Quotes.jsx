import React, { useState } from 'react';
import './Quotation.css';
import { jsPDF } from 'jspdf';  // To generate a PDF document
import { useRef } from 'react';  // To reference file input elements

export default function QuotationScreen() {
  const [recipient, setRecipient] = useState('');
  const [signatory, setSignatory] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [items, setItems] = useState([
    { item: '', description: '', quantity: 1, unitCost: 0, amount: 0 }
  ]);
  const [totals, setTotals] = useState({
    totalAmount: 0,
    vatAmount: 0,
    totalAmountWithVat: 0
  });
  const [logo, setLogo] = useState(null);  // For logo upload
  const [signature, setSignature] = useState(null);  // For digital signature upload
  
  // References for file uploads
  const logoRef = useRef();
  const signatureRef = useRef();

  const updateAmount = (index, updatedItem) => {
    const newItems = [...items];
    newItems[index] = { ...updatedItem, amount: updatedItem.quantity * updatedItem.unitCost };
    setItems(newItems);
    calculateTotalAmount(newItems);
  };

  const calculateTotalAmount = (currentItems) => {
    const total = currentItems.reduce((sum, item) => sum + item.amount, 0);
    const vat = total * 0.16;
    setTotals({
      totalAmount: total,
      vatAmount: vat,
      totalAmountWithVat: total + vat
    });
  };

  const addNewItem = () => {
    setItems([...items, { item: '', description: '', quantity: 1, unitCost: 0, amount: 0 }]);
  };

  const handleGeneratePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
  
    // Helper function to center text
    const centerText = (text, y) => {
      const textWidth = doc.getStringUnitWidth(text) * doc.internal.getFontSize() / doc.internal.scaleFactor;
      return (pageWidth - textWidth) / 2;
    };
  
    // Add Logo
    if (logo) {
      const imgData = URL.createObjectURL(logo);
      doc.addImage(imgData, 'PNG', margin, margin, 40, 40);
    }
  
    // Title Section with professional formatting
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("QUOTATION", centerText("QUOTATION", 35), 35);
    
    // Quotation details box
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(margin, 45, pageWidth - 2 * margin, 35, 3, 3, 'FD');
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    
    // Left side details
    doc.text(`Recipient:`, margin + 5, 55);
    doc.setFont("helvetica", "bold");
    doc.text(recipient, margin + 35, 55);
    
    doc.setFont("helvetica", "normal");
    doc.text(`Payment Terms:`, margin + 5, 65);
    doc.setFont("helvetica", "bold");
    doc.text(paymentTerms, margin + 45, 65);
    
    // Right side details
    const rightCol = pageWidth - margin - 60;
    doc.setFont("helvetica", "normal");
    doc.text(`Date:`, rightCol, 55);
    doc.setFont("helvetica", "bold");
    doc.text(new Date().toLocaleDateString(), rightCol + 20, 55);
    
    doc.setFont("helvetica", "normal");
    doc.text(`Quotation No:`, rightCol, 65);
    doc.setFont("helvetica", "bold");
    doc.text(`QT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`, rightCol + 40, 65);
  
    // Items table
    const startY = 90;
    doc.setFillColor(41, 128, 185);
    doc.setTextColor(255, 255, 255);
    doc.rect(margin, startY, pageWidth - 2 * margin, 10, 'F');
    
    // Table headers
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    const headers = [
      { text: "Item", x: margin + 5 },
      { text: "Description", x: margin + 40 },
      { text: "Quantity", x: margin + 100 },
      { text: "Unit Cost (Ksh)", x: margin + 130 },
      { text: "Amount (Ksh)", x: pageWidth - margin - 30 }
    ];
    
    headers.forEach(header => {
      doc.text(header.text, header.x, startY + 7);
    });
  
    // Table content
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    let yOffset = startY + 15;
    
    items.forEach((item, index) => {
      // Alternate row backgrounds
      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, yOffset - 5, pageWidth - 2 * margin, 10, 'F');
      }
      
      doc.text(item.item, margin + 5, yOffset);
      doc.text(item.description, margin + 40, yOffset);
      doc.text(item.quantity.toString(), margin + 100, yOffset);
      doc.text(item.unitCost.toFixed(2), margin + 130, yOffset);
      doc.text(item.amount.toFixed(2), pageWidth - margin - 30, yOffset);
      yOffset += 10;
    });
  
    // Totals section with box
    const totalsY = yOffset + 10;
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(pageWidth - margin - 80, totalsY, 80, 40, 3, 3, 'FD');
    
    doc.setFont("helvetica", "bold");
    doc.text(`Subtotal:`, pageWidth - margin - 75, totalsY + 10);
    doc.text(`VAT (16%):`, pageWidth - margin - 75, totalsY + 20);
    doc.text(`Total:`, pageWidth - margin - 75, totalsY + 30);
    
    // Align amounts to right
    doc.text(`${totals.totalAmount.toFixed(2)}`, pageWidth - margin - 10, totalsY + 10, { align: 'right' });
    doc.text(`${totals.vatAmount.toFixed(2)}`, pageWidth - margin - 10, totalsY + 20, { align: 'right' });
    doc.text(`${totals.totalAmountWithVat.toFixed(2)}`, pageWidth - margin - 10, totalsY + 30, { align: 'right' });
  
    // Terms and conditions
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Terms & Conditions", margin, totalsY + 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const terms = [
      "1. This quotation is valid for 30 days from the date of issue.",
      "2. Payment terms as specified above.",
      "3. Prices are subject to change without prior notice.",
    ];
    terms.forEach((term, index) => {
      doc.text(term, margin, totalsY + 20 + (index * 8));
    });
  
    // Signature section
    if (signature) {
      const sigImgData = URL.createObjectURL(signature);
      doc.addImage(sigImgData, 'PNG', margin, totalsY + 50, 50, 20);
    }
    doc.setFontSize(10);
    doc.text("_______________________", margin, totalsY + 75);
    doc.text("Authorized Signature", margin, totalsY + 82);
  
    // Professional footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      "Thank you for your business. For any queries, please contact us.",
      centerText("Thank you for your business. For any queries, please contact us.", doc.internal.pageSize.height - 15),
      doc.internal.pageSize.height - 15
    );
  
    doc.save('quotation.pdf');
  };

  // Handle file uploads
  const handleLogoUpload = (e) => {
    setLogo(e.target.files[0]);
  };

  const handleSignatureUpload = (e) => {
    setSignature(e.target.files[0]);
  };

  return (
    <div className="quotation-screen">
      <div className="header">
        <h1>Create Quotation</h1>
      </div>
      
      <div className="card">
        <div className="card-header">
          <h2>Quotation Details</h2>
        </div>
        <div className="card-content">
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Recipient Name"
            className="input-field"
          />
          
          <input
            type="text"
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
            placeholder="Payment Terms"
            className="input-field"
          />
          
          <input
            type="file"
            accept="image/*"
            ref={logoRef}
            onChange={handleLogoUpload}
            className="file-input"
          />
          <input
            type="file"
            accept="image/*"
            ref={signatureRef}
            onChange={handleSignatureUpload}
            className="file-input"
          />

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Unit Cost (Ksh)</th>
                  <th>Amount (Ksh)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        type="text"
                        value={item.item}
                        onChange={(e) => updateAmount(index, { ...item, item: e.target.value })}
                        className="input-field"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateAmount(index, { ...item, description: e.target.value })}
                        className="input-field"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateAmount(index, { ...item, quantity: Number(e.target.value) })}
                        className="input-field"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.unitCost}
                        onChange={(e) => updateAmount(index, { ...item, unitCost: Number(e.target.value) })}
                        className="input-field"
                      />
                    </td>
                    <td className="text-right">
                      {item.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="totals">
            <p><strong>Total:</strong> Ksh {totals.totalAmount.toFixed(2)}</p>
            <p><strong>VAT (16%):</strong> Ksh {totals.vatAmount.toFixed(2)}</p>
            <p><strong>Total with VAT:</strong> Ksh {totals.totalAmountWithVat.toFixed(2)}</p>
          </div>

          <button onClick={addNewItem} className="btn primary-btn">
            Add New Item
          </button>

          <input
            type="text"
            value={signatory}
            onChange={(e) => setSignatory(e.target.value)}
            placeholder="Signatory Name"
            className="input-field"
          />

          <div className="button-group">
            <button onClick={handleGeneratePDF} className="btn primary-btn">Download Quotation</button>
            <button onClick={handleGeneratePDF} className="btn primary-btn">Share Quotation</button>
          </div>
        </div>
      </div>
    </div>
  );
}


