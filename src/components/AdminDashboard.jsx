import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AdminDashboard = () => {
  // Admin session check
  useEffect(() => {
    const adminSession = localStorage.getItem('admin_session');
    if (!adminSession) {
      window.location.href = '/admin-login';
    }
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('admin_session');
    window.location.href = '/admin-login';
  };
  // Student Registration
  const [studentMatric, setStudentMatric] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentMsg, setStudentMsg] = useState('');
  const [students, setStudents] = useState([]);
  // Fetch all students for export
  useEffect(() => {
    const fetchStudents = async () => {
      const { data, error } = await supabase.from('students').select('*');
      if (!error) setStudents(data || []);
    };
    fetchStudents();
  }, [studentMsg]);
  // Export students as CSV
  const handleExportStudents = () => {
    if (!students.length) return;
    downloadStudentSample(students);
  };

  // Download sample CSV for student import
  const downloadStudentSample = (data = []) => {
    const header = ['Matric Number', 'Full Name', 'Email'];
    const sampleRows = data.length
      ? data.map(s => [s.matric_no, s.full_name, s.email])
      : [['MAT123456', 'John Doe', 'john.doe@email.com']];
    const csvContent = [header, ...sampleRows]
      .map(e => e.map(v => '"' + (v || '') + '"').join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students_sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import students from CSV
  const handleImportStudents = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return alert('CSV must have at least one student.');
    const [, ...rows] = lines;
    // Robust CSV parsing (handles quoted commas)
    const parseCSVRow = (row) => {
      const regex = /(?:"([^"]*)"|([^,]+))/g;
      const result = [];
      let match;
      let lastIndex = 0;
      while ((match = regex.exec(row)) !== null) {
        if (match[1] !== undefined) {
          result.push(match[1]);
        } else if (match[2] !== undefined) {
          result.push(match[2]);
        }
        lastIndex = regex.lastIndex;
        if (row[lastIndex] === ',') regex.lastIndex++;
      }
      return result.map(s => s.trim());
    };
    const studentsToAdd = rows.map(row => {
      const [matric_no, full_name, email] = parseCSVRow(row);
      return { matric_no, full_name, email };
    });
    // Filter out incomplete rows and duplicates
    const validStudents = studentsToAdd.filter(s => s.matric_no && s.full_name && s.email);
    if (!validStudents.length) return alert('No valid students found in CSV.');
    // Remove duplicates by matric_no
    const uniqueStudents = Array.from(new Map(validStudents.map(s => [s.matric_no, s])).values());
    const { error } = await supabase.from('students').insert(uniqueStudents);
    if (error) {
      alert('Error importing students.');
    } else {
      setStudentMsg('Students imported!');
    }
    e.target.value = '';
  };

  // Voting Event
  const [eventName, setEventName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [eventMessage, setEventMessage] = useState('');

  // Position
  const [positionName, setPositionName] = useState('');
  const [positionDesc, setPositionDesc] = useState('');
  const [positions, setPositions] = useState([]);
  const [posMessage, setPosMessage] = useState('');

  // Candidate
  const [fullName, setFullName] = useState('');
  const [positionId, setPositionId] = useState('');
  const [bio, setBio] = useState('');
  const [photo, setPhoto] = useState(null);
  const [message, setMessage] = useState('');

  // Fetch positions for dropdown
  useEffect(() => {
    const fetchPositions = async () => {
      const { data, error } = await supabase.from('positions').select('*').order('created_at', { ascending: false });
      if (!error) setPositions(data || []);
    };
    fetchPositions();
  }, [posMessage]);

  // Student registration
  const handleRegisterStudent = async (e) => {
    e.preventDefault();
    setStudentMsg('');
    if (!studentMatric || !studentName || !studentEmail) return setStudentMsg('All fields required.');
    const { error } = await supabase.from('students').insert([
      { matric_no: studentMatric, full_name: studentName, email: studentEmail }
    ]);
    if (error) {
      setStudentMsg('Error registering student.');
    } else {
      setStudentMsg('Student registered!');
      setStudentMatric('');
      setStudentName('');
      setStudentEmail('');
    }
  };

  // Voting event creation
  const handleAddEvent = async (e) => {
    e.preventDefault();
    setEventMessage('');
    if (!eventName || !startTime || !endTime) return setEventMessage('All fields required.');
    const { error } = await supabase.from('voting_events').insert([
      { name: eventName, start_time: startTime, end_time: endTime }
    ]);
    if (error) {
      setEventMessage('Error adding event.');
    } else {
      setEventMessage('Voting event added!');
      setEventName('');
      setStartTime('');
      setEndTime('');
    }
  };

  // Position creation
  const handleAddPosition = async (e) => {
    e.preventDefault();
    setPosMessage('');
    if (!positionName) return setPosMessage('Position name required.');
    const { error } = await supabase.from('positions').insert([
      { name: positionName, description: positionDesc }
    ]);
    if (error) {
      setPosMessage('Error adding position.');
    } else {
      setPosMessage('Position added!');
      setPositionName('');
      setPositionDesc('');
    }
  };

  // Candidate photo change
  const handlePhotoChange = (e) => {
    setPhoto(e.target.files[0]);
  };

  // Candidate creation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    let photo_url = '';
    if (photo) {
      const fileExt = photo.name.split('.').pop();
      const fileName = `${fullName.replace(/\s+/g, '_')}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('candidate-photos')
        .upload(fileName, photo);
      if (uploadError) {
        setMessage('Photo upload failed: ' + uploadError.message);
        return;
      }
      photo_url = supabase.storage.from('candidate-photos').getPublicUrl(fileName).data.publicUrl;
    }
    const { error } = await supabase.from('candidates').insert([
      { full_name: fullName, position_id: positionId, bio, photo_url }
    ]);
    if (error) {
      setMessage('Error adding candidate.');
    } else {
      setMessage('Candidate added successfully!');
      setFullName('');
      setPositionId('');
      setBio('');
      setPhoto(null);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout} style={{ padding: '6px 16px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Logout</button>
      </div>
      {/* Student Registration & Export */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Register Student</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => downloadStudentSample()} style={{ padding: '4px 12px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }} type="button">
              Download Sample CSV
            </button>
            <button onClick={handleExportStudents} style={{ padding: '4px 12px', background: '#2980b9', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }} type="button">
              Export Students CSV
            </button>
            <label style={{ padding: '4px 12px', background: '#f39c12', color: '#fff', borderRadius: 4, cursor: 'pointer', margin: 0 }}>
              Import CSV
              <input type="file" accept=".csv" onChange={handleImportStudents} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
        <form onSubmit={handleRegisterStudent} style={{ display: 'flex', flexDirection: 'column', gap: 8 }} autoComplete="off">
          <input
            type="text"
            placeholder="Matric Number"
            value={studentMatric}
            onChange={(e) => setStudentMatric(e.target.value.replace(/[^A-Za-z0-9]/g, ''))}
            required
            autoComplete="off"
          />
          <input
            type="text"
            placeholder="Full Name"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            required
            autoComplete="off"
          />
          <input
            type="email"
            placeholder="Email"
            value={studentEmail}
            onChange={(e) => setStudentEmail(e.target.value)}
            required
            autoComplete="off"
          />
          <button type="submit">Register Student</button>
        </form>
        {studentMsg && (
          <p
            style={{
              color: studentMsg.toLowerCase().includes('error') ? 'red' : 'green',
              marginTop: 4,
              fontWeight: studentMsg.toLowerCase().includes('error') ? 600 : 500,
              letterSpacing: 0.2,
            }}
            aria-live="polite"
          >
            {studentMsg}
          </p>
        )}
      </section>

      {/* Voting Event Management */}
      <section style={{ marginBottom: 32 }}>
        <h2>Add Voting Event</h2>
        <form onSubmit={handleAddEvent} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            type="text"
            placeholder="Event Name"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            required
          />
          <label>
            Start Time
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </label>
          <label>
            End Time
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </label>
          <button type="submit">Add Voting Event</button>
        </form>
        {eventMessage && <p>{eventMessage}</p>}
      </section>

      {/* Position Management */}
      <section style={{ marginBottom: 32 }}>
        <h2>Add Position</h2>
        <form onSubmit={handleAddPosition} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            type="text"
            placeholder="Position Name"
            value={positionName}
            onChange={(e) => setPositionName(e.target.value)}
            required
          />
          <textarea
            placeholder="Description (optional)"
            value={positionDesc}
            onChange={(e) => setPositionDesc(e.target.value)}
          />
          <button type="submit">Add Position</button>
        </form>
        {posMessage && <p>{posMessage}</p>}
      </section>

      {/* Candidate Management */}
      <section>
        <h2>Add Candidate</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <select
            value={positionId}
            onChange={(e) => setPositionId(e.target.value)}
            required
          >
            <option value="">Select Position</option>
            {positions.map((pos) => (
              <option key={pos.id} value={pos.id}>{pos.name}</option>
            ))}
          </select>
          <textarea
            placeholder="Bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
          <input type="file" accept="image/*" onChange={handlePhotoChange} required />
          <button type="submit">Add Candidate</button>
        </form>
        {message && <p>{message}</p>}
      </section>
    </div>
  );
};

export default AdminDashboard;
