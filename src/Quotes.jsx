import React, { useState, useEffect } from 'react';
import './Quotation.css';
import { jsPDF } from 'jspdf';
import { useRef } from 'react';

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
  const [logo, setLogo] = useState(null);
  const [signature, setSignature] = useState(null);
  const [quotationName, setQuotationName] = useState('');
  const [savedQuotations, setSavedQuotations] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  
  // References for file uploads
  const logoRef = useRef();
  const signatureRef = useRef();

  // Load saved quotations from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('savedQuotations');
    if (savedData) {
      setSavedQuotations(JSON.parse(savedData));
    }
  }, []);

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

  const removeItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
    calculateTotalAmount(newItems);
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

  // Save quotation to localStorage
  const saveQuotation = () => {
    if (!quotationName.trim()) {
      alert("Please enter a name for this quotation");
      return;
    }

    // Prepare logo and signature as base64 if they exist
    const prepareImageData = async () => {
      let logoData = null;
      let signatureData = null;

      if (logo) {
        logoData = await fileToBase64(logo);
      }
      if (signature) {
        signatureData = await fileToBase64(signature);
      }

      const quotationData = {
        id: Date.now().toString(),
        name: quotationName,
        recipient,
        signatory,
        paymentTerms,
        items,
        totals,
        logo: logoData,
        signature: signatureData,
        date: new Date().toISOString()
      };

      const updatedQuotations = [...savedQuotations, quotationData];
      setSavedQuotations(updatedQuotations);
      localStorage.setItem('savedQuotations', JSON.stringify(updatedQuotations));
      
      setShowSaveModal(false);
      setQuotationName('');
      alert("Quotation saved successfully!");
    };

    prepareImageData();
  };

  // Helper function to convert File to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // Load a saved quotation
  const loadQuotation = async (quotation) => {
    setRecipient(quotation.recipient);
    setSignatory(quotation.signatory);
    setPaymentTerms(quotation.paymentTerms);
    setItems(quotation.items);
    setTotals(quotation.totals);

    // Convert base64 back to File objects if they exist
    if (quotation.logo) {
      const logoFile = await base64toFile(quotation.logo, 'logo.png', 'image/png');
      setLogo(logoFile);
    }
    if (quotation.signature) {
      const signatureFile = await base64toFile(quotation.signature, 'signature.png', 'image/png');
      setSignature(signatureFile);
    }

    setShowLoadModal(false);
  };

  // Helper function to convert base64 to File
  const base64toFile = async (dataUrl, filename, mimeType) => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: mimeType });
  };

  // Delete a saved quotation
  const deleteQuotation = (id) => {
    if (window.confirm("Are you sure you want to delete this quotation?")) {
      const updatedQuotations = savedQuotations.filter(q => q.id !== id);
      setSavedQuotations(updatedQuotations);
      localStorage.setItem('savedQuotations', JSON.stringify(updatedQuotations));
    }
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
        <div className="header-buttons">
          <button onClick={() => setShowSaveModal(true)} className="btn secondary-btn">Save Quotation</button>
          <button onClick={() => setShowLoadModal(true)} className="btn secondary-btn">Load Quotation</button>
        </div>
      </div>
      
      <div className="card">
        <div className="card-header">
          <h2>Quotation Details</h2>
        </div>
        <div className="card-content">
          <div className="form-row">
            <div className="form-group">
              <label>Recipient Name</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Recipient Name"
                className="input-field"
              />
            </div>
            
            <div className="form-group">
              <label>Payment Terms</label>
              <input
                type="text"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="Payment Terms"
                className="input-field"
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Company Logo</label>
              <input
                type="file"
                accept="image/*"
                ref={logoRef}
                onChange={handleLogoUpload}
                className="file-input"
              />
              {logo && <div className="preview-image">{logo.name}</div>}
            </div>
            
            <div className="form-group">
              <label>Signature</label>
              <input
                type="file"
                accept="image/*"
                ref={signatureRef}
                onChange={handleSignatureUpload}
                className="file-input"
              />
              {signature && <div className="preview-image">{signature.name}</div>}
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Unit Cost (Ksh)</th>
                  <th>Amount (Ksh)</th>
                  <th>Action</th>
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
                        min="1"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.unitCost}
                        onChange={(e) => updateAmount(index, { ...item, unitCost: Number(e.target.value) })}
                        className="input-field"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="text-right">
                      {item.amount.toFixed(2)}
                    </td>
                    <td>
                      {items.length > 1 && (
                        <button 
                          onClick={() => removeItem(index)} 
                          className="btn delete-btn"
                        >
                          Remove
                        </button>
                      )}
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

          <div className="form-group">
            <label>Signatory Name</label>
            <input
              type="text"
              value={signatory}
              onChange={(e) => setSignatory(e.target.value)}
              placeholder="Signatory Name"
              className="input-field"
            />
          </div>

          <div className="button-group">
            <button onClick={handleGeneratePDF} className="btn primary-btn">Download Quotation</button>
            <button onClick={handleGeneratePDF} className="btn primary-btn">Share Quotation</button>
          </div>
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Save Quotation</h2>
              <span className="close" onClick={() => setShowSaveModal(false)}>&times;</span>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Quotation Name</label>
                <input
                  type="text"
                  value={quotationName}
                  onChange={(e) => setQuotationName(e.target.value)}
                  placeholder="Enter a name for this quotation"
                  className="input-field"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowSaveModal(false)} className="btn secondary-btn">Cancel</button>
              <button onClick={saveQuotation} className="btn primary-btn">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Load Modal */}
      {showLoadModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Load Quotation</h2>
              <span className="close" onClick={() => setShowLoadModal(false)}>&times;</span>
            </div>
            <div className="modal-body">
              {savedQuotations.length === 0 ? (
                <p>No saved quotations found.</p>
              ) : (
                <div className="saved-quotations">
                  {savedQuotations.map((quote) => (
                    <div key={quote.id} className="saved-quotation-item">
                      <div className="quotation-details">
                        <h3>{quote.name}</h3>
                        <p>Recipient: {quote.recipient}</p>
                        <p>Date: {new Date(quote.date).toLocaleDateString()}</p>
                        <p>Total: Ksh {quote.totals.totalAmountWithVat.toFixed(2)}</p>
                      </div>
                      <div className="quotation-actions">
                        <button onClick={() => loadQuotation(quote)} className="btn primary-btn">Load</button>
                        <button onClick={() => deleteQuotation(quote.id)} className="btn delete-btn">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowLoadModal(false)} className="btn secondary-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

