import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  updateDoc, 
  addDoc, 
  doc, 
  serverTimestamp, 
  query, 
  where, 
  orderBy,
  runTransaction
} from 'firebase/firestore';
import { db } from './Firebase';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Invoice.css';

// Helper Functions
const calculateClientBalance = (paymentStages) => {
  return Object.values(paymentStages || {}).reduce((total, stage) => {
    return total + (stage.total || 0) - (stage.paid || 0);
  }, 0);
};

const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  return new Date(timestamp.seconds * 1000).toLocaleString();
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

const PAYMENT_STAGES = ['Downpayment', 'CountyApprovals', 'LandApprovals', 'TitlePayments'];
const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Check', 'Mobile Money'];

// Validation Functions
const validateClient = (clientData) => {
  if (!clientData.clientName?.trim()) {
    throw new Error('Client name is required');
  }
  if (!clientData.lrNo?.trim()) {
    throw new Error('LR number is required');
  }
  
  Object.entries(clientData)
    .filter(([key]) => key !== 'clientName' && key !== 'lrNo')
    .forEach(([key, value]) => {
      if (value < 0) {
        throw new Error(`${key} amount cannot be negative`);
      }
    });
};

const validatePayment = (paymentData, clientData) => {
  if (!paymentData.stage) {
    throw new Error('Payment stage is required');
  }
  if (!paymentData.amount || paymentData.amount <= 0) {
    throw new Error('Valid payment amount is required');
  }

  if (paymentData.stage && clientData?.paymentStages?.[paymentData.stage]) {
    const stage = clientData.paymentStages[paymentData.stage];
    const remainingAmount = (stage.total || 0) - (stage.paid || 0);
    if (paymentData.amount > remainingAmount) {
      throw new Error(`Payment amount exceeds remaining balance of ${formatCurrency(remainingAmount)}`);
    }
  }
};

const ClientDetailScreen = () => {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [showAddClientDialog, setShowAddClientDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newClientData, setNewClientData] = useState({
    clientName: '',
    lrNo: '',
    Downpayment: 0,
    CountyApprovals: 0,
    LandApprovals: 0,
    TitlePayments: 0,
  });
  const [newPayment, setNewPayment] = useState({
    stage: '',
    amount: '',
    paymentMethod: 'Cash',
    notes: '',
  });

  // Fetch Clients
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'clients'), 
      (snapshot) => {
        const clientsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setClients(clientsData);
      },
      (error) => {
        console.error('Error fetching clients:', error);
        toast.error('Failed to load clients. Please refresh the page.');
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch Payment History
  useEffect(() => {
    if (!selectedClient) return;

    const paymentsQuery = query(
      collection(db, 'payments'),
      where('clientId', '==', selectedClient.id),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(
      paymentsQuery,
      (snapshot) => {
        const payments = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPaymentHistory(payments);
      },
      (error) => {
        console.error('Error fetching payment history:', error);
        toast.error('Failed to load payment history');
      }
    );

    return () => unsubscribe();
  }, [selectedClient]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setNewClientData(prev => ({ ...prev, [name]: value }));
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setNewPayment(prev => ({ ...prev, [name]: value }));
  };

  const handleAddClient = async () => {
    setIsLoading(true);
    try {
      validateClient(newClientData);

      const paymentStages = {
        Downpayment: { 
          total: Number(newClientData.Downpayment) || 0, 
          paid: 0, 
          isPaid: false,
          lastUpdated: serverTimestamp()
        },
        CountyApprovals: { 
          total: Number(newClientData.CountyApprovals) || 0, 
          paid: 0, 
          isPaid: false,
          lastUpdated: serverTimestamp()
        },
        LandApprovals: { 
          total: Number(newClientData.LandApprovals) || 0, 
          paid: 0, 
          isPaid: false,
          lastUpdated: serverTimestamp()
        },
        TitlePayments: { 
          total: Number(newClientData.TitlePayments) || 0, 
          paid: 0, 
          isPaid: false,
          lastUpdated: serverTimestamp()
        },
      };

      const pendingBalance = calculateClientBalance(paymentStages);

      const docRef = await addDoc(collection(db, 'clients'), {
        clientName: newClientData.clientName,
        lrNo: newClientData.lrNo,
        paymentStages,
        pendingBalance,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'payments'), {
        clientId: docRef.id,
        clientName: newClientData.clientName,
        stage: 'Initial Setup',
        amount: 0,
        timestamp: serverTimestamp(),
        remainingBalance: pendingBalance,
        previousBalance: pendingBalance,
        notes: 'Client account created',
      });

      setNewClientData({
        clientName: '',
        lrNo: '',
        Downpayment: 0,
        CountyApprovals: 0,
        LandApprovals: 0,
        TitlePayments: 0,
      });
      setShowAddClientDialog(false);
      toast.success('Client added successfully!');
    } catch (error) {
      console.error('Error adding client:', error);
      toast.error(error.message || 'Failed to add client. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPayment = async () => {
    setIsLoading(true);
    try {
      validatePayment(newPayment, selectedClient);
      
      const paymentAmount = Number(newPayment.amount);
      
      await runTransaction(db, async (transaction) => {
        const clientRef = doc(db, 'clients', selectedClient.id);
        
        const updatedStages = {
          ...selectedClient.paymentStages,
          [newPayment.stage]: {
            ...selectedClient.paymentStages[newPayment.stage],
            paid: (selectedClient.paymentStages[newPayment.stage]?.paid || 0) + paymentAmount,
            lastUpdated: serverTimestamp()
          }
        };

        updatedStages[newPayment.stage].isPaid = 
          updatedStages[newPayment.stage].paid >= updatedStages[newPayment.stage].total;

        const pendingBalance = calculateClientBalance(updatedStages);

        transaction.update(clientRef, {
          paymentStages: updatedStages,
          pendingBalance,
          updatedAt: serverTimestamp(),
        });

        const paymentRef = doc(collection(db, 'payments'));
        transaction.set(paymentRef, {
          clientId: selectedClient.id,
          clientName: selectedClient.clientName,
          stage: newPayment.stage,
          amount: paymentAmount,
          timestamp: serverTimestamp(),
          remainingBalance: pendingBalance,
          previousBalance: selectedClient.pendingBalance,
          paymentMethod: newPayment.paymentMethod,
          notes: newPayment.notes,
        });
      });

      setNewPayment({
        stage: '',
        amount: '',
        paymentMethod: 'Cash',
        notes: '',
      });
      setShowPaymentDialog(false);
      toast.success('Payment added successfully!');
    } catch (error) {
      console.error('Error adding payment:', error);
      toast.error(error.message || 'Failed to add payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="client-detail-container">
      <ToastContainer position="top-right" autoClose={5000} />
      <h1>Client Management</h1>

      <button 
        onClick={() => setShowAddClientDialog(true)}
        className="add-client-button"
        disabled={isLoading}
      >
        Add New Client
      </button>

      {/* Add Client Dialog */}
      {showAddClientDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h3>Add New Client</h3>
            <input
              type="text"
              name="clientName"
              placeholder="Client Name"
              value={newClientData.clientName}
              onChange={handleFormChange}
              required
              disabled={isLoading}
            />
            <input
              type="text"
              name="lrNo"
              placeholder="LR No"
              value={newClientData.lrNo}
              onChange={handleFormChange}
              required
              disabled={isLoading}
            />
            <h4>Stage Payments</h4>
            {PAYMENT_STAGES.map((stage) => (
              <div key={stage} className="payment-input-group">
                <label htmlFor={stage}>{stage}</label>
                <input
                  id={stage}
                  type="number"
                  name={stage}
                  placeholder={`${stage} Amount`}
                  value={newClientData[stage]}
                  onChange={handleFormChange}
                  min="0"
                  disabled={isLoading}
                />
              </div>
            ))}
            <div className="dialog-buttons">
              <button onClick={handleAddClient} disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Client'}
              </button>
              <button onClick={() => setShowAddClientDialog(false)} disabled={isLoading}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Dialog */}
      {showPaymentDialog && selectedClient && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h3>Add New Payment</h3>
            <div className="payment-form">
              <div className="form-group">
                <label>Payment Stage:</label>
                <select
                  name="stage"
                  value={newPayment.stage}
                  onChange={handlePaymentChange}
                  required
                  disabled={isLoading}
                >
                  <option value="">Select Stage</option>
                  {PAYMENT_STAGES.map((stage) => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Amount:</label>
                <input
                  type="number"
                  name="amount"
                  value={newPayment.amount}
                  onChange={handlePaymentChange}
                  min="0"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="form-group">
                <label>Payment Method:</label>
                <select
                  name="paymentMethod"
                  value={newPayment.paymentMethod}
                  onChange={handlePaymentChange}
                  disabled={isLoading}
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Notes:</label>
                <textarea
                  name="notes"
                  value={newPayment.notes}
                  onChange={handlePaymentChange}
                  rows="3"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="dialog-buttons">
              <button onClick={handleAddPayment} disabled={isLoading}>
                {isLoading ? 'Processing...' : 'Add Payment'}
              </button>
              <button onClick={() => setShowPaymentDialog(false)} disabled={isLoading}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client List */}
      <div className="client-list">
        {clients.map((client) => (
          <div
            key={client.id}
            className={`client-card ${selectedClient?.id === client.id ? 'selected' : ''}`}
            onClick={() => setSelectedClient(client)}
          >
            <h3>{client.clientName}</h3>
            <p>LR No: {client.lrNo}</p>
            <p>Pending Balance: {formatCurrency(client.pendingBalance)}</p>
          </div>
        ))}
      </div>

      {/* Selected Client Details */}
      {selectedClient && (
        <div className="client-details">
          <h2>{selectedClient.clientName} Details</h2>
          <p className="client-info">LR No: {selectedClient.lrNo}</p>
          <p className="client-info">
            Total Balance: {formatCurrency(selectedClient.pendingBalance)}
          </p>
          
          <button 
            className="add-payment-button"
            onClick={() => setShowPaymentDialog(true)}
            disabled={isLoading}
          >
            Add New Payment
          </button>
          
          <div className="payment-stages">
            {PAYMENT_STAGES.map((stage) => {
              const values = selectedClient.paymentStages?.[stage];
              return (
                <div key={stage} className="stage-details">
                  <h4>{stage}</h4><div className="payment-info">
                    <div className="amount-details">
                      <div>Total Amount: {formatCurrency(values?.total || 0)}</div>
                      <div>Paid Amount: {formatCurrency(values?.paid || 0)}</div>
                    </div>
                    <div className="payment-status">
                      <span className={values?.isPaid ? 'status-paid' : 'status-pending'}>
                        {values?.isPaid ? '✓ Paid' : `Remaining: ${formatCurrency((values?.total || 0) - (values?.paid || 0))}`}
                      </span>
                      <div className="last-updated">
                        Last updated: {formatDate(values?.lastUpdated)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="payment-history">
            <h3>Payment History</h3>
            {paymentHistory.length === 0 ? (
              <p className="no-history">No payment history available</p>
            ) : (
              <div className="history-list">
                {paymentHistory.map((payment) => (
                  <div key={payment.id} className="history-item">
                    <div className="payment-date">
                      {formatDate(payment.timestamp)}
                    </div>
                    <div className="payment-details">
                      <span className="payment-stage">{payment.stage}</span>
                      <span className="payment-amount">
                        {formatCurrency(payment.amount)}
                      </span>
                    </div>
                    <div className="payment-info">
                      <div className="balance-change">
                        Previous Balance: {formatCurrency(payment.previousBalance)} →{' '}
                        New Balance: {formatCurrency(payment.remainingBalance)}
                      </div>
                      {payment.notes && (
                        <div className="payment-notes">{payment.notes}</div>
                      )}
                      {payment.paymentMethod && (
                        <div className="payment-method">
                          Payment Method: {payment.paymentMethod}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDetailScreen;




