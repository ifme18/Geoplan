import React, { useState, useEffect } from 'react';
import { db } from './Firebase';
import { collection, onSnapshot, updateDoc, addDoc, doc, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import './Invoice.css';

// Helper functions remain the same
const calculateClientBalance = (paymentStages) => {
  return Object.values(paymentStages || {}).reduce((total, stage) => {
    return total + (stage.total || 0) - (stage.paid || 0);
  }, 0);
};

const calculateTotalPendingBalance = (clients) => {
  return clients.reduce((sum, client) => sum + calculateClientBalance(client.paymentStages), 0);
};

const calculateTotalPaid = (clients) => {
  return clients.reduce((sum, client) => {
    return sum + Object.values(client.paymentStages || {}).reduce((stageSum, stage) => stageSum + (stage.paid || 0), 0);
  }, 0);
};

const ClientDetailScreen = () => {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [formData, setFormData] = useState({
    clientName: '',
    lrNo: ''
  });
  const [totals, setTotals] = useState({ pending: 0, paid: 0 });

  // Fetch Clients and Calculate Totals
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'clients'), (snapshot) => {
      const clientsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClients(clientsData);

      setTotals({
        pending: calculateTotalPendingBalance(clientsData),
        paid: calculateTotalPaid(clientsData)
      });
    });

    return () => unsubscribe();
  }, []);

  // Fetch payment history when a client is selected
  useEffect(() => {
    if (!selectedClient) return;

    const paymentsQuery = query(
      collection(db, 'payments'),
      where('clientId', '==', selectedClient.id),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(paymentsQuery, (snapshot) => {
      const payments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPaymentHistory(payments);
    });

    return () => unsubscribe();
  }, [selectedClient]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const addClient = async () => {
    if (!formData.clientName || !formData.lrNo) {
      alert('Client Name and LR No are required!');
      return;
    }
    await addDoc(collection(db, 'clients'), {
      clientName: formData.clientName,
      lrNo: formData.lrNo,
      pendingBalance: 0,
      paymentStages: {
        Downpayment: { total: 0, paid: 0, isPaid: false },
        CountyApprovals: { total: 0, paid: 0, isPaid: false },
        LandApprovals: { total: 0, paid: 0, isPaid: false },
        TitlePayments: { total: 0, paid: 0, isPaid: false },
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    setFormData({ clientName: '', lrNo: '' });
  };

  // Modified update payment function to record payment history
  const updatePayment = async (clientId, stage, field, value) => {
    const clientRef = doc(db, 'clients', clientId);
    const client = clients.find(client => client.id === clientId);
    
    const updatedStages = {
      ...client.paymentStages,
      [stage]: {
        ...client.paymentStages?.[stage],
        [field]: Number(value) || 0
      }
    };

    const pendingBalance = calculateClientBalance(updatedStages);

    // Update client document
    await updateDoc(clientRef, { 
      paymentStages: updatedStages,
      pendingBalance,
      updatedAt: serverTimestamp()
    });

    // Record payment transaction if the field is 'paid' and the value has increased
    if (field === 'paid' && value > (client.paymentStages[stage]?.paid || 0)) {
      const paymentAmount = value - (client.paymentStages[stage]?.paid || 0);
      await addDoc(collection(db, 'payments'), {
        clientId,
        clientName: client.clientName,
        stage,
        amount: paymentAmount,
        timestamp: serverTimestamp(),
        remainingBalance: pendingBalance
      });
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleString();
  };

  return (
    <div className="client-detail-container">
      <h1>Client Management</h1>

      {/* Summary Tiles */}
      <div className="summary-tiles">
        <div className="tile pending-balance">
          <h3>Total Pending Balance</h3>
          <p>${totals.pending}</p>
        </div>
        <div className="tile total-paid">
          <h3>Total Paid</h3>
          <p>${totals.paid}</p>
        </div>
      </div>

      {/* Add Client Form */}
      <div className="client-form">
        <input
          type="text"
          name="clientName"
          placeholder="Client Name"
          value={formData.clientName}
          onChange={handleFormChange}
        />
        <input
          type="text"
          name="lrNo"
          placeholder="LR No"
          value={formData.lrNo}
          onChange={handleFormChange}
        />
        <button onClick={addClient}>Add Client</button>
      </div>

      {/* Clients List */}
      <div className="client-list">
        <h2>Clients</h2>
        {clients.map(client => (
          <div
            key={client.id}
            className={`client-card ${selectedClient?.id === client.id ? 'selected' : ''}`}
            onClick={() => setSelectedClient(client)}
          >
            <h3>{client.clientName}</h3>
            <p>LR No: {client.lrNo}</p>
            <p>Pending Balance: ${client.pendingBalance}</p>
          </div>
        ))}
      </div>

      {/* Selected Client Details */}
      {selectedClient && (
        <div className="client-details">
          <h2>{selectedClient.clientName} Details</h2>
          
          {/* Payment Stages */}
          {Object.entries(selectedClient.paymentStages || {}).map(([stage, values]) => (
            <div key={stage} className="stage-details">
              <h4>{stage.replace(/([A-Z])/g, ' $1').trim()}</h4>
              <div className="input-field">
                <label>Total Amount</label>
                <input
                  type="number"
                  value={values?.total || 0}
                  onChange={(e) => updatePayment(selectedClient.id, stage, 'total', e.target.value)}
                />
              </div>
              <div className="input-field">
                <label>Paid Amount</label>
                <input
                  type="number"
                  value={values?.paid || 0}
                  onChange={(e) => updatePayment(selectedClient.id, stage, 'paid', e.target.value)}
                />
              </div>
              <div className="input-field">
                <label>Is Paid</label>
                <input
                  type="checkbox"
                  checked={values?.isPaid || false}
                  onChange={(e) => updatePayment(selectedClient.id, stage, 'isPaid', e.target.checked)}
                />
              </div>
            </div>
          ))}

          {/* Payment History Section */}
          <div className="payment-history">
            <h3>Payment History</h3>
            <table className="payment-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Stage</th>
                  <th>Amount</th>
                  <th>Remaining Balance</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.map(payment => (
                  <tr key={payment.id}>
                    <td>{formatDate(payment.timestamp)}</td>
                    <td>{payment.stage}</td>
                    <td>${payment.amount}</td>
                    <td>${payment.remainingBalance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDetailScreen;





