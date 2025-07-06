import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const StudentDashboard = () => {
  const [positions, setPositions] = useState([]);
  const [candidates, setCandidates] = useState({}); // { positionId: [candidates] }
  const [votes, setVotes] = useState({}); // { positionId: candidateId }
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [student, setStudent] = useState(null);

  // Session check on mount
  useEffect(() => {
    const stored = localStorage.getItem('student');
    if (stored) {
      setStudent(JSON.parse(stored));
    } else {
      window.location.href = '/login';
    }
  }, []);
  // Logout handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('student');
    window.location.href = '/login';
  };

  // Simulate student session (replace with real session logic)
  useEffect(() => {
    // TODO: Replace with real session/user fetch
    const stored = localStorage.getItem('student');
    if (stored) setStudent(JSON.parse(stored));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Fetch positions
      const { data: posData } = await supabase.from('positions').select('*').order('created_at', { ascending: false });
      setPositions(posData || []);
      // Fetch candidates for each position
      let candObj = {};
      for (const pos of posData || []) {
        const { data: cands } = await supabase.from('candidates').select('*').eq('position_id', pos.id);
        candObj[pos.id] = cands || [];
      }
      setCandidates(candObj);
      // Fetch votes for this student
      if (student) {
        const { data: voteData } = await supabase.from('votes').select('*').eq('student_id', student.id);
        let voteObj = {};
        (voteData || []).forEach(v => { voteObj[v.position_id] = v.candidate_id; });
        setVotes(voteObj);
      }
      setLoading(false);
    };
    fetchData();
  }, [student]);

  const handleVote = async (positionId, candidateId) => {
    if (!student) return setMessage('Not logged in.');
    setMessage('');
    // Prevent double voting
    if (votes[positionId]) return setMessage('You have already voted for this position.');
    const { error } = await supabase.from('votes').insert([
      {
        student_id: student.id,
        candidate_id: candidateId,
        position_id: positionId,
        voting_event_id: null // TODO: set current event id if needed
      }
    ]);
    if (error) {
      setMessage('Error submitting vote.');
    } else {
      setVotes({ ...votes, [positionId]: candidateId });
      setMessage('Vote submitted!');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Student Dashboard</h1>
        <button onClick={handleLogout} style={{ padding: '6px 16px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Logout</button>
      </div>
      {message && <p>{message}</p>}
      {positions.map((pos) => (
        <section key={pos.id} style={{ marginBottom: 32, border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
          <h2>{pos.name}</h2>
          <p>{pos.description}</p>
          {votes[pos.id] ? (
            <p style={{ color: 'green' }}>You voted for: <b>{(candidates[pos.id].find(c => c.id === votes[pos.id]) || {}).full_name || 'Unknown'}</b></p>
          ) : (
            <>
              {candidates[pos.id].length === 0 && <p>No candidates for this position.</p>}
              {candidates[pos.id].map(cand => (
                <div key={cand.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  {cand.photo_url && <img src={cand.photo_url} alt={cand.full_name} style={{ width: 48, height: 48, borderRadius: '50%', marginRight: 12 }} />}
                  <div style={{ flex: 1 }}>
                    <b>{cand.full_name}</b>
                    <div style={{ fontSize: 13 }}>{cand.bio}</div>
                  </div>
                  <button onClick={() => handleVote(pos.id, cand.id)} disabled={!!votes[pos.id]}>Vote</button>
                </div>
              ))}
            </>
          )}
        </section>
      ))}
    </div>
  );
};

export default StudentDashboard;
