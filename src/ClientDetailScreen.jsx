import React, { useState, useEffect } from 'react';
import { db } from './Firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';

import './Invoice.css'; // Import the CSS file

const InvoiceManager = () => {
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({
    clientName: '',
    lrNo: '',
    stages: {
      downPayment: { total: 0, paid: 0 },
      countyApproval: { total: 0, paid: 0 },
      landApprovals: { total: 0, paid: 0 },
      titlePayment: { total: 0, paid: 0 }
    }
  });

  // Fetch clients from Firestore on load
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'clients'), (snapshot) => {
      const clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClients(clientsData);
    });
    return () => unsubscribe();
  }, []);

  const handleInputChange = (stage, field, value) => {
    setFormData(prev => ({
      ...prev,
      stages: {
        ...prev.stages,
        [stage]: {
          ...prev.stages[stage],
          [field]: parseFloat(value) || 0
        }
      }
    }));
  };

  const addClient = async () => {
    if (!formData.clientName || !formData.lrNo) return;
    try {
      await addDoc(collection(db, 'clients'), formData);
      setFormData({
        clientName: '',
        lrNo: '',
        stages: {
          downPayment: { total: 0, paid: 0 },
          countyApproval: { total: 0, paid: 0 },
          landApprovals: { total: 0, paid: 0 },
          titlePayment: { total: 0, paid: 0 }
        }
      });
    } catch (error) {
      console.error('Error adding client:', error);
    }
  };

  const updatePayment = async (clientId, stage, field, value) => {
    try {
      const clientRef = doc(db, 'clients', clientId);
      const client = clients.find(c => c.id === clientId);
      const updatedStages = {
        ...client.stages,
        [stage]: {
          ...client.stages[stage],
          [field]: parseFloat(value) || 0
        }
      };
      await updateDoc(clientRef, { stages: updatedStages });
    } catch (error) {
      console.error('Error updating payment:', error);
    }
  };

  const calculateTotalRevenue = () => {
    return clients.reduce((total, client) => {
      const clientTotal = Object.values(client.stages).reduce((sum, stage) => sum + stage.paid, 0);
      return total + clientTotal;
    }, 0);
  };

  const calculateClientBalance = (stages) => {
    return Object.values(stages).reduce((total, stage) => {
      return total + (stage.total - stage.paid);
    }, 0);
  };

  const shareInvoice = (client) => {
    const invoice = `
Invoice for ${client.clientName}
LR No: ${client.lrNo}

Payment Details:
Down Payment: ${client.stages.downPayment.paid}/${client.stages.downPayment.total}
County Approval: ${client.stages.countyApproval.paid}/${client.stages.countyApproval.total}
Land Approvals: ${client.stages.landApprovals.paid}/${client.stages.landApprovals.total}
Title Payment: ${client.stages.titlePayment.paid}/${client.stages.titlePayment.total}

Total Balance Remaining: ${calculateClientBalance(client.stages)}
    `;
    console.log(invoice);
  };

  return (
    <div className="invoice-manager">
      <div className="card">
        <div className="card-header">
          <div className="card-title">Add New Client</div>
        </div>
        <div className="card-content">
          <div className="input-container">
            <input
              className="input"
              placeholder="Client Name"
              value={formData.clientName}
              onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
            />
            <input
              className="input"
              placeholder="LR Number"
              value={formData.lrNo}
              onChange={(e) => setFormData(prev => ({ ...prev, lrNo: e.target.value }))}
            />
          </div>
          {Object.entries(formData.stages).map(([stage, values]) => (
            <div key={stage} className="input-container">
              <div className="capitalize">{stage.replace(/([A-Z])/g, ' $1').trim()}:</div>
              <div className="input-container">
                <input
                  type="number"
                  className="input"
                  placeholder="Total Amount"
                  value={values.total || ''}
                  onChange={(e) => handleInputChange(stage, 'total', e.target.value)}
                />
                <input
                  type="number"
                  className="input"
                  placeholder="Paid Amount"
                  value={values.paid || ''}
                  onChange={(e) => handleInputChange(stage, 'paid', e.target.value)}
                />
              </div>
            </div>
          ))}
          <button className="button" onClick={addClient}>Add Client</button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Client Invoices</div>
        </div>
        <div className="card-content">
          {clients.map(client => (
            <div key={client.id} className="client-item">
              <h3>{client.clientName}</h3>
              <p>LR No: {client.lrNo}</p>
              {client.stages && Object.entries(client.stages).map(([stage, values]) => (
                <div key={stage} className="stage-detail">
                  {stage}: {values.paid} / {values.total}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InvoiceManager;


