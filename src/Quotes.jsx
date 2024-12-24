import React, { useState } from 'react';
import './Quotation.css'

export default function QuotationScreen() {
  const [recipient, setRecipient] = useState('');
  const [signatory, setSignatory] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [items, setItems] = useState([
    {
      item: '',
      description: '',
      quantity: 1,
      unitCost: 0,
      amount: 0
    }
  ]);

  const [totals, setTotals] = useState({
    totalAmount: 0,
    vatAmount: 0,
    totalAmountWithVat: 0
  });

  const updateAmount = (index, updatedItem) => {
    const newItems = [...items];
    newItems[index] = {
      ...updatedItem,
      amount: updatedItem.quantity * updatedItem.unitCost
    };
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
    setItems([...items, {
      item: '',
      description: '',
      quantity: 1,
      unitCost: 0,
      amount: 0
    }]);
  };

  const handleGeneratePDF = () => {
    console.log('Generating PDF...');
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
            <button onClick={handleGeneratePDF} className="btn primary-btn">Save Quotation</button>
            <button onClick={handleGeneratePDF} className="btn primary-btn">Share Quotation</button>
          </div>
        </div>
      </div>
    </div>
  );
}

