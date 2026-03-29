import { useEffect, useState } from 'react';

const API_BASE = 'http://localhost:8080/api';

export default function App() {
  const [health, setHealth] = useState('checking');
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((r) => r.json())
      .then((d) => setHealth(d.status || 'unknown'))
      .catch(() => setHealth('offline'));

    fetch(`${API_BASE}/events`)
      .then((r) => r.json())
      .then((d) => setEvents(Array.isArray(d) ? d : []))
      .catch(() => setEvents([]));
  }, []);

  return (
    <div className="page">
      <header className="top">
        <h1>Tunnel Traffic MVP</h1>
        <span className={`badge ${health}`}>backend: {health}</span>
      </header>

      <section className="card">
        <h2>Realtime Monitor (placeholder)</h2>
        <div className="video-placeholder">Video stream area</div>
      </section>

      <section className="card">
        <h2>Recent Events</h2>
        {events.length === 0 ? (
          <p>No events yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Level</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td>{e.id}</td>
                  <td>{e.type}</td>
                  <td>{e.level}</td>
                  <td>{e.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
