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
import './Invoice.css';

// Helper Functions
const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  return new Date(timestamp.seconds * 1000).toLocaleString();
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount || 0);
};

const PAYMENT_STAGES = ['Downpayment', 'CountyApprovals', 'LandApprovals', 'TitlePayments'];
const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Check', 'Mobile Money'];

// Custom Alert Component
const Alert = ({ message, type, onClose }) => (
  message && (
    <div className={`alert alert-${type}`}>
      {message}
      <button className="alert-close" onClick={onClose}>×</button>
    </div>
  )
);

// Validation Functions
const validateClient = (clientData) => {
  if (!clientData.clientName?.trim()) throw new Error('Client name is required');
  if (!clientData.lrNo?.trim()) throw new Error('LR number is required');
  
  Object.entries(clientData).filter(([key]) => key !== 'clientName' && key !== 'lrNo').forEach(([key, value]) => {
    const numValue = Number(value);
    if (isNaN(numValue) || numValue < 0) {
      throw new Error(`${key} amount must be a valid positive number`);
    }
  });
};

const validatePayment = (paymentData, clientData) => {
  if (!clientData) throw new Error('Client data is required');
  if (!paymentData.stage) throw new Error('Payment stage is required');
  const amount = Number(paymentData.amount);
  if (isNaN(amount) || amount <= 0) throw new Error('Valid payment amount is required');

  const stage = clientData.paymentStages?.[paymentData.stage];
  if (!stage) throw new Error('Invalid payment stage');

  const remainingAmount = stage.total - (stage.paid || 0);
  if (amount > remainingAmount) {
    throw new Error(`Payment amount exceeds remaining balance of ${formatCurrency(remainingAmount)} for this stage`);
  }
};

const ClientDetailScreen = () => {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [showAddClientDialog, setShowAddClientDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ message: '', type: '' });
  const [newClientData, setNewClientData] = useState({ 
    clientName: '', 
    lrNo: '', 
    ...Object.fromEntries(PAYMENT_STAGES.map(stage => [stage, '0']))
  });
  const [newPayment, setNewPayment] = useState({
    stage: '', 
    amount: '', 
    paymentMethod: 'Cash', 
    notes: ''
  });

  const showAlert = (message, type = 'error') => {
    setAlert({ message, type });
    setTimeout(() => setAlert({ message: '', type: '' }), 5000);
  };

  // Fetch Clients in Real-Time
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'clients'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      error => {
        console.error('Error fetching clients:', error);
        showAlert('Failed to fetch clients due to an error.');
      }
    );

    return () => unsubscribe(); // Cleanup on component unmount
  }, []);

  // Fetch Payment History for Selected Client in Real-Time
  useEffect(() => {
    if (!selectedClient) return;
    const unsubscribe = onSnapshot(
      query(collection(db, 'payments'), where('clientId', '==', selectedClient.id), orderBy('timestamp', 'desc')),
      (snapshot) => {
        setPaymentHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      error => {
        console.error('Error fetching payment history:', error);
        showAlert('Failed to fetch payment history.');
      }
    );

    // Update selectedClient's payment stages in real-time
    const clientUnsubscribe = onSnapshot(
      doc(db, 'clients', selectedClient.id),
      (doc) => {
        if (doc.exists()) {
          setSelectedClient(prev => ({ ...prev, ...doc.data() }));
        }
      },
      error => {
        console.error('Error updating selected client:', error);
        showAlert('Failed to update client details.');
      }
    );

    return () => {
      unsubscribe();
      clientUnsubscribe(); // Cleanup for both listeners on component unmount or when client changes
    };
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
      const paymentStages = PAYMENT_STAGES.reduce((acc, stage) => ({
        ...acc, 
        [stage]: { 
          total: Number(newClientData[stage]) || 0, 
          paid: 0, 
          isPaid: false, 
          lastUpdated: serverTimestamp() 
        }
      }), {});

      const clientRef = await addDoc(collection(db, 'clients'), {
        ...newClientData,
        clientName: newClientData.clientName.trim(),
        lrNo: newClientData.lrNo.trim(),
        paymentStages,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log('New client added with id:', clientRef.id);

      await addDoc(collection(db, 'payments'), {
        clientId: clientRef.id,
        clientName: newClientData.clientName.trim(),
        stage: 'Initial Setup',
        amount: 0,
        timestamp: serverTimestamp(),
        notes: 'Client account created',
      });

      setNewClientData({ clientName: '', lrNo: '', ...Object.fromEntries(PAYMENT_STAGES.map(stage => [stage, '0'])) });
      setShowAddClientDialog(false);
      showAlert('Client added successfully!', 'success');
    } catch (error) {
      console.error('Error adding client:', error);
      showAlert(error.message || 'Failed to add client. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPayment = async () => {
    setIsLoading(true);
    try {
      if (!selectedClient) throw new Error('No client selected');
      validatePayment(newPayment, selectedClient);

      console.log('Attempting to update Firestore with payment:', newPayment);

      await runTransaction(db, async (transaction) => {
        const clientRef = doc(db, 'clients', selectedClient.id);
        const clientSnap = await transaction.get(clientRef);
        if (!clientSnap.exists()) throw new Error('Client not found');

        const currentClientData = clientSnap.data();
        const stageData = currentClientData.paymentStages[newPayment.stage];
        const newPaymentAmount = Number(newPayment.amount);
        const newPaidAmount = (stageData.paid || 0) + newPaymentAmount;

        const updatedStage = {
          ...stageData,
          paid: newPaidAmount,
          isPaid: newPaidAmount >= stageData.total,
          lastUpdated: serverTimestamp()
        };

        // Update only the specific payment stage in Firebase
        await transaction.update(clientRef, {
          [`paymentStages.${newPayment.stage}`]: updatedStage,
          updatedAt: serverTimestamp()
        });

        // Add payment record to 'payments' collection
        const paymentRef = doc(collection(db, 'payments'));
        await transaction.set(paymentRef, {
          clientId: selectedClient.id,
          clientName: currentClientData.clientName,
          stage: newPayment.stage,
          amount: newPaymentAmount,
          timestamp: serverTimestamp(),
          paymentMethod: newPayment.paymentMethod,
          notes: newPayment.notes,
        });

        console.log('Payment added successfully to Firestore');
      });

      setNewPayment({ stage: '', amount: '', paymentMethod: 'Cash', notes: '' });
      setShowPaymentDialog(false);
      showAlert('Payment added successfully!', 'success');
      // No need to manually update state here since we have real-time listeners
    } catch (error) {
      console.error('Error adding payment:', error);
      showAlert(error.message || 'Failed to add payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderClientList = () => clients.map(client => (
    <div 
      key={client.id} 
      className={`client-card ${selectedClient?.id === client.id ? 'selected' : ''}`} 
      onClick={() => setSelectedClient(client)}
    >
      <h3>{client.clientName}</h3>
      <p>LR No: {client.lrNo}</p>
    </div>
  ));

  const renderClientDetails = () => {
    if (!selectedClient) return null;
    return (
      <div className="client-details">
        <h2>{selectedClient.clientName} Details</h2>
        <p className="client-info">LR No: {selectedClient.lrNo}</p>
        <button 
          className="add-payment-button" 
          onClick={() => setShowPaymentDialog(true)} 
          disabled={isLoading}
        >
          Add New Payment
        </button>
        <div className="payment-stages">
          {PAYMENT_STAGES.map(stage => (
            <div key={stage} className="stage-details">
              <h4>{stage}</h4>
              <div className="payment-info">
                <div className="amount-details">
                  <div>Total Amount: {formatCurrency(selectedClient.paymentStages[stage]?.total || 0)}</div>
                  <div>Paid Amount: {formatCurrency(selectedClient.paymentStages[stage]?.paid || 0)}</div>
                </div>
                <div className="payment-status">
                  <span className={selectedClient.paymentStages[stage]?.isPaid ? 'status-paid' : 'status-pending'}>
                    {selectedClient.paymentStages[stage]?.isPaid ? '✓ Paid' : `Remaining: ${formatCurrency((selectedClient.paymentStages[stage]?.total || 0) - (selectedClient.paymentStages[stage]?.paid || 0))}`}
                  </span>
                  <div className="last-updated">
                    Last updated: {formatDate(selectedClient.paymentStages[stage]?.lastUpdated)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="payment-history">
          <h3>Payment History</h3>
          {paymentHistory.length === 0 ? (
            <p className="no-history">No payment history available</p>
          ) : (
            paymentHistory.map(payment => (
              <div key={payment.id} className="history-item">
                <div className="payment-date">{formatDate(payment.timestamp)}</div>
                <div className="payment-details">
                  <span className="payment-stage">{payment.stage}</span>
                  <span className="payment-amount">{formatCurrency(payment.amount)}</span>
                </div>
                <div className="payment-info">
                  {payment.notes && <div className="payment-notes">{payment.notes}</div>}
                  {payment.paymentMethod && <div className="payment-method">Payment Method: {payment.paymentMethod}</div>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="client-detail-container">
      <Alert message={alert.message} type={alert.type} onClose={() => setAlert({ message: '', type: '' })} />
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
            <input type="text" name="clientName" placeholder="Client Name" value={newClientData.clientName} onChange={handleFormChange} required disabled={isLoading} />
            <input type="text" name="lrNo" placeholder="LR No" value={newClientData.lrNo} onChange={handleFormChange} required disabled={isLoading} />
            <h4>Stage Payments</h4>
            {PAYMENT_STAGES.map(stage => (
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
              <button onClick={handleAddClient} disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Client'}</button>
              <button onClick={() => setShowAddClientDialog(false)} disabled={isLoading}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Dialog */}
      {showPaymentDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h3>Add New Payment</h3>
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
                {PAYMENT_STAGES.map(stage => (
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
                {PAYMENT_METHODS.map(method => (
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
            <div className="dialog-buttons">
              <button onClick={handleAddPayment} disabled={isLoading || !newPayment.stage || !newPayment.amount}>
                {isLoading ? 'Processing...' : 'Add Payment'}
              </button>
              <button onClick={() => setShowPaymentDialog(false)} disabled={isLoading}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="client-list">
        {renderClientList()}
      </div>
      {renderClientDetails()}
    </div>
  );
};

export default ClientDetailScreen;




