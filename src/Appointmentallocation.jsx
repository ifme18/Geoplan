import React, { useState, useEffect } from 'react';
import { db } from './Firebase';
import { getDocs, collection, addDoc, updateDoc, doc } from 'firebase/firestore'; // Ensure you import necessary Firestore functions

function Appointment() {
  // State for Form Inputs
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [phone, setPhone] = useState('');

  // State for Appointments List
  const [appointments, setAppointments] = useState([]);

  // Fetch Appointments from Firestore
  useEffect(() => {
    const fetchAppointments = async () => {
      const querySnapshot = await getDocs(collection(db, 'events'));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAppointments(data);
    };

    fetchAppointments();
  }, []);

  // Add Appointment to Firestore
  const handleAddAppointment = async () => {
    if (!title || !notes || !dateTime || !phone) {
      alert('All fields are required!');
      return;
    }

    try {
      await addDoc(collection(db, 'events'), {
        title,
        notes,
        dateTime, // Store the dateTime directly in Firebase format
        phone,
        completed: false, // Set completed as false by default
      });
      alert('Appointment added to Firestore!');
      setTitle('');
      setNotes('');
      setDateTime('');
      setPhone('');
    } catch (e) {
      console.error('Error adding appointment:', e);
    }
  };

  // Helper function to convert Firebase Timestamp to a readable date
  const formatDate = (timestamp) => {
    if (!timestamp) return ''; // Handle cases where there's no timestamp

    const date = new Date(timestamp.seconds * 1000); // Convert Firebase timestamp to JS Date
    return date.toLocaleString(); // Return the formatted date string
  };

  // Handle checkbox change and update completed status in Firestore
  const handleCheckboxChange = async (id, completed) => {
    try {
      const appointmentRef = doc(db, 'events', id);
      await updateDoc(appointmentRef, { completed: !completed });
      // Update the local state to reflect the change
      setAppointments(appointments.map(appointment => 
        appointment.id === id ? { ...appointment, completed: !completed } : appointment
      ));
    } catch (e) {
      console.error('Error updating appointment:', e);
    }
  };

  return (
    <div style={styles.container}>
      <h1>📅 Appointment Manager</h1>

      {/* Appointment Form */}
      <div style={styles.form}>
        <h2>Add Appointment</h2>
        <input
          type="text"
          placeholder="Event Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={styles.input}
        />
        <textarea
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={styles.textarea}
        />
        <input
          type="datetime-local"
          value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}
          style={styles.input}
        />
        <input
          type="text"
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={styles.input}
        />
        <button onClick={handleAddAppointment} style={styles.button}>Add to Firestore</button>
      </div>

      {/* Appointment List */}
      <div style={styles.list}>
        <h2>Upcoming Appointments</h2>
        {appointments.length > 0 ? (
          <ul>
            {appointments.map((appointment) => (
              <li key={appointment.id} style={appointment.completed ? styles.completedItem : styles.notCompletedItem}>
                <strong>{appointment.title}</strong><br />
                {appointment.notes} <br />
                📅 {formatDate(appointment.dateTime)} <br />
                📞 {appointment.phone} <br />
                <label>
                  <input 
                    type="checkbox" 
                    checked={appointment.completed} 
                    onChange={() => handleCheckboxChange(appointment.id, appointment.completed)} 
                  />
                  {appointment.completed ? (
                    <span style={styles.completed}>Completed</span>
                  ) : (
                    <span style={styles.notCompleted}>Not Completed</span>
                  )}
                </label>
              </li>
            ))}
          </ul>
        ) : (
          <p>No upcoming appointments.</p>
        )}
      </div>
    </div>
  );
}

// Basic Inline Styles
const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
  },
  form: {
    marginBottom: '30px',
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
  },
  input: {
    display: 'block',
    margin: '10px 0',
    padding: '8px',
    width: '100%',
  },
  textarea: {
    display: 'block',
    margin: '10px 0',
    padding: '8px',
    width: '100%',
    height: '80px',
  },
  button: {
    marginRight: '10px',
    marginTop: '10px',
    padding: '8px 12px',
    background: 'green',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  list: {
    padding: '20px',
    borderTop: '1px solid #ddd',
  },
  listItem: {
    marginBottom: '10px',
    padding: '10px',
    border: '1px solid #eee',
    borderRadius: '4px',
    background: '#fafafa',
  },
  completed: {
    color: 'green',
    fontWeight: 'bold',
  },
  notCompleted: {
    color: 'red',
    fontWeight: 'bold',
  },
  completedItem: {
    marginBottom: '10px',
    padding: '10px',
    border: '1px solid #eee',
    borderRadius: '4px',
    background: 'purple', // Color for completed items
    color: 'white',
  },
  notCompletedItem: {
    marginBottom: '10px',
    padding: '10px',
    border: '1px solid #eee',
    borderRadius: '4px',
    background: 'lightblue', // Color for not completed items
    color: 'black',
  }
};

export default Appointment;



