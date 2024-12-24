import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Share2, Save } from 'lucide-react';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';

const ClientList = () => {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [updatedStages, setUpdatedStages] = useState({});

  // Fetch clients from Firestore
  useEffect(() => {
    const fetchClients = async () => {
      const clientsCollection = collection(db, 'clients');
      const clientSnapshot = await getDocs(clientsCollection);
      const clientList = clientSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClients(clientList);
    };

    fetchClients();
  }, []);

  // Select client and prepare for editing
  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setUpdatedStages(client.stages);
  };

  // Update payment details
  const handleStageUpdate = (stage, field, value) => {
    setUpdatedStages(prev => ({
      ...prev,
      [stage]: {
        ...prev[stage],
        [field]: parseFloat(value) || 0
      }
    }));
  };

  // Save updates to Firestore
  const handleSaveUpdates = async () => {
    if (!selectedClient) return;

    const clientRef = doc(db, 'clients', selectedClient.id);
    await updateDoc(clientRef, {
      stages: updatedStages
    });

    alert('Client payments updated successfully!');
    setSelectedClient(null);
  };

  // Generate Invoice
  const handleGenerateInvoice = () => {
    const invoice = `
Invoice for ${selectedClient.clientName}
LR No: ${selectedClient.lrNo}

Payment Details:
Down Payment: ${updatedStages.downPayment.paid}/${updatedStages.downPayment.total}
County Approval: ${updatedStages.countyApproval.paid}/${updatedStages.countyApproval.total}
Land Approvals: ${updatedStages.landApprovals.paid}/${updatedStages.landApprovals.total}
Title Payment: ${updatedStages.titlePayment.paid}/${updatedStages.titlePayment.total}

Total Balance Remaining: ${calculateClientBalance(updatedStages)}
    `;
    console.log(invoice);
  };

  // Calculate Total Balance
  const calculateClientBalance = (stages) => {
    return Object.values(stages).reduce((total, stage) => {
      return total + (stage.total - stage.paid);
    }, 0);
  };

  return (
    <div className="space-y-6 p-4">
      {/* Clients List */}
      <Card>
        <CardHeader>
          <CardTitle>Clients List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map(client => (
              <div
                key={client.id}
                className="border p-4 rounded-lg cursor-pointer hover:bg-gray-100"
                onClick={() => handleSelectClient(client)}
              >
                <h3 className="font-bold">{client.clientName}</h3>
                <p className="text-sm">LR No: {client.lrNo}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Client Details and Payment Update */}
      {selectedClient && (
        <Card>
          <CardHeader>
            <CardTitle>Update Payments - {selectedClient.clientName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(updatedStages).map(([stage, values]) => (
                <div key={stage} className="grid grid-cols-2 gap-4">
                  <span className="capitalize">{stage.replace(/([A-Z])/g, ' $1').trim()}:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Total Amount"
                      value={values.total || ''}
                      onChange={(e) => handleStageUpdate(stage, 'total', e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Paid Amount"
                      value={values.paid || ''}
                      onChange={(e) => handleStageUpdate(stage, 'paid', e.target.value)}
                    />
                  </div>
                </div>
              ))}

              <div className="flex gap-4 mt-4">
                <Button onClick={handleSaveUpdates}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Updates
                </Button>
                <Button variant="outline" onClick={handleGenerateInvoice}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Generate Invoice
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClientList;


