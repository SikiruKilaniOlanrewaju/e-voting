import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const StudentDashboard = () => {
  const [positions, setPositions] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [votes, setVotes] = useState([]);
  const [events, setEvents] = useState([]);
  const [activeEvent, setActiveEvent] = useState(null);
  const [voteSummary, setVoteSummary] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);

  // Fetch student session and info
  useEffect(() => {
    const session = localStorage.getItem('student_session');
    if (!session) {
      window.location.href = '/login';
      return;
    }
    setStudent(JSON.parse(session));
  }, []);

  // Fetch events, positions, candidates, and votes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Fetch all voting events
      const { data: eventData } = await supabase.from('voting_events').select('*').order('start_time', { ascending: true });
      setEvents(eventData || []);
      // Find active event
      const now = new Date();
      const active = (eventData || []).find(ev => new Date(ev.start_time) <= now && new Date(ev.end_time) >= now);
      setActiveEvent(active || null);
      // Fetch positions
      const { data: posData } = await supabase.from('positions').select('*');
      setPositions(posData || []);
      // Fetch candidates
      const { data: candData } = await supabase.from('candidates').select('*');
      setCandidates(candData || []);
      // Fetch votes for this student
      if (student) {
        const { data: voteData } = await supabase.from('votes').select('*').eq('student_id', student.id);
        setVotes(voteData || []);
      }
      setLoading(false);
    };
    if (student) fetchData();
  }, [student]);

  // Build vote summary
  useEffect(() => {
    if (!positions.length || !votes.length) return;
    const summary = positions.map(pos => {
      const vote = votes.find(v => v.position_id === pos.id);
      if (!vote) return { position: pos.name, voted: false };
      const candidate = candidates.find(c => c.id === vote.candidate_id);
      return {
        position: pos.name,
        voted: true,
        candidate: candidate ? candidate.full_name : 'Unknown',
      };
    });
    setVoteSummary(summary);
  }, [positions, votes, candidates]);

  // Show results if voting ended
  useEffect(() => {
    if (!activeEvent && events.length) {
      // If no active event, check if the most recent event ended
      const now = new Date();
      const ended = events.find(ev => new Date(ev.end_time) < now);
      if (ended) setShowResults(true);
    }
  }, [activeEvent, events]);

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
      <h1>Student Dashboard</h1>
      {activeEvent ? (
        <>
          <h2>Active Voting Event: {activeEvent.name}</h2>
          {/* Voting UI here (not shown for brevity) */}
        </>
      ) : (
        <h2>No active voting event</h2>
      )}
      <section style={{ marginTop: 32 }}>
        <h3>Your Vote Summary</h3>
        <ul>
          {voteSummary.map((item, idx) => (
            <li key={idx}>
              {item.position}: {item.voted ? `Voted for ${item.candidate}` : 'Not voted'}
            </li>
          ))}
        </ul>
      </section>
      {showResults && (
        <section style={{ marginTop: 32 }}>
          <h3>Voting Results</h3>
          {/* Results UI here (to be implemented) */}
          <p>Results will be displayed here after voting ends.</p>
        </section>
      )}
    </div>
  );
};

export default StudentDashboard;
