import React, { useState, useEffect } from 'react';
import { collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './Firebase';

import { jsPDF } from 'jspdf';
import { Download, Plus } from 'lucide-react';
import './ClientScreen.css';

const ClientDetailScreen = ({ clientId }) => {
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDate, setDepositDate] = useState('');

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const docRef = doc(db, 'clients', clientId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setClientData(docSnap.data());
        } else {
          setError('Client not found');
        }
      } catch (err) {
        setError('Error loading client data');
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [clientId]);

  const handleDeposit = async () => {
    if (!selectedStage) return;

    const amount = parseFloat(depositAmount);
    const stageData = clientData.paymentStages[selectedStage.name];
    const remainingBalance = stageData.amount - (stageData.paidAmount || 0);

    if (amount > 0 && amount <= remainingBalance) {
      const newPaidAmount = (stageData.paidAmount || 0) + amount;
      const newRemainingBalance = clientData.pendingBalance - amount;

      try {
        const clientRef = doc(db, 'clients', clientId);
        await updateDoc(clientRef, {
          [`paymentStages.${selectedStage.name}.paidAmount`]: newPaidAmount,
          [`paymentStages.${selectedStage.name}.depositDate`]: depositDate,
          pendingBalance: newRemainingBalance,
        });

        setClientData((prev) => ({
          ...prev,
          paymentStages: {
            ...prev.paymentStages,
            [selectedStage.name]: {
              ...prev.paymentStages[selectedStage.name],
              paidAmount: newPaidAmount,
              depositDate: depositDate,
            },
          },
          pendingBalance: newRemainingBalance,
        }));

        setIsDepositDialogOpen(false);
        setDepositAmount('');
        setDepositDate('');
        setSelectedStage(null);
      } catch (err) {
        console.error('Error updating deposit:', err);
      }
    }
  };

  const generateInvoicePDF = async () => {
    const doc = new jsPDF();
    const primaryColor = '#16a34a';

    doc.setFillColor(primaryColor);
    doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('Your Company Name', 140, 20, null, null, 'right');

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Name: ${clientData.name}`, 15, 70);
    doc.text(`LR No: ${clientData.lrNo}`, 15, 75);

    doc.save(`Invoice_${clientData.name}.pdf`);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="client-detail-container">
      <div className="card">
        <div className="card-header">
          <h1>Client Details</h1>
        </div>
        <div className="card-content">
          <div className="client-info">
            <h2>Client Information</h2>
            <p>Name: {clientData.name}</p>
            <p>LR No: {clientData.lrNo}</p>
          </div>

          <div className="remaining-balance">
            Overall Remaining Balance: KES {clientData.pendingBalance.toFixed(2)}
          </div>

          <div className="payment-stages">
            <h2>Payment Stages</h2>
            {Object.entries(clientData.paymentStages).map(([stageName, stageData]) => {
              const paidAmount = stageData.paidAmount || 0;
              const remainingBalance = stageData.amount - paidAmount;

              return (
                <div key={stageName} className="payment-stage-card">
                  <h3>{stageName}</h3>
                  <p>Total Amount: KES {stageData.amount.toFixed(2)}</p>
                  <p>Paid Amount: KES {paidAmount.toFixed(2)}</p>
                  <p>Remaining Balance: KES {remainingBalance.toFixed(2)}</p>
                  <p>Last Deposit: {stageData.depositDate || 'N/A'}</p>
                  <button
                    className="deposit-btn"
                    onClick={() => {
                      setSelectedStage({ name: stageName, remainingBalance });
                      setIsDepositDialogOpen(true);
                    }}
                  >
                    <Plus /> Deposit
                  </button>
                </div>
              );
            })}
          </div>

          <button className="invoice-btn" onClick={generateInvoicePDF}>
            <Download /> Generate Invoice
          </button>
        </div>
      </div>

      {isDepositDialogOpen && (
        <div className="deposit-dialog">
          <h2>Make a Deposit for {selectedStage?.name}</h2>
          <label>Deposit Amount:</label>
          <input
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
          />
          <label>Deposit Date:</label>
          <input
            type="date"
            value={depositDate}
            onChange={(e) => setDepositDate(e.target.value)}
          />
          <button onClick={handleDeposit}>Make Deposit</button>
          <button onClick={() => setIsDepositDialogOpen(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default ClientDetailScreen;



