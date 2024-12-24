import React, { useState, useEffect } from 'react';
import { db } from './Firebase';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';

function Appointment() {
  // State for Form Inputs
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dateTime, setDateTime] = useState('');

  // State for Appointments List
  const [appointments, setAppointments] = useState([]);

  // Fetch Appointments from Firestore
  useEffect(() => {
    const fetchAppointments = async () => {
      const querySnapshot = await getDocs(collection(db, 'events'));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAppointments(data);
    };

    fetchAppointments();
  }, []);

  // Add Appointment to Firestore
  const handleAddAppointment = async () => {
    if (!title || !notes || !dateTime) {
      alert('All fields are required!');
      return;
    }

    try {
      await addDoc(collection(db, 'events'), {
        title,
        notes,
        dateTime,
      });
      alert('Appointment added to Firestore!');
      setTitle('');
      setNotes('');
      setDateTime('');
    } catch (e) {
      console.error('Error adding appointment:', e);
    }
  };

  // Google Calendar Integration
  const googleLogin = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/calendar.events',
    onSuccess: (tokenResponse) => {
      console.log('Google Login Successful:', tokenResponse);
      addToGoogleCalendar(tokenResponse.access_token);
    },
    onError: (error) => console.error('Login Failed:', error),
  });

  const addToGoogleCalendar = async (accessToken) => {
    const event = {
      summary: title,
      description: notes,
      start: {
        dateTime: new Date(dateTime).toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: new Date(new Date(dateTime).getTime() + 3600000).toISOString(),
        timeZone: 'UTC',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
        ],
      },
    };

    try {
      await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
      alert('Event added to Google Calendar!');
    } catch (error) {
      console.error('Failed to add event to Google Calendar:', error);
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
        <button onClick={handleAddAppointment} style={styles.button}>Add to Firestore</button>
        <button onClick={googleLogin} style={styles.button}>Add to Google Calendar</button>
      </div>

      {/* Appointment List */}
      <div style={styles.list}>
        <h2>Upcoming Appointments</h2>
        {appointments.length > 0 ? (
          <ul>
            {appointments.map((appointment) => (
              <li key={appointment.id} style={styles.listItem}>
                <strong>{appointment.title}</strong><br />
                {appointment.notes} <br />
                📅 {appointment.dateTime}
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
};

export default Appointment;
