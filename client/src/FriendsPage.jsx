import { useEffect, useState } from 'react';
import { api } from './api';

function FriendsPage({ onOpenChat }) {
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [addUsername, setAddUsername] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const refresh = async () => {
    const [friendsRes, requestsRes] = await Promise.all([api.getFriends(), api.getFriendRequests()]);
    setFriends(friendsRes.friends);
    setIncoming(requestsRes.incoming);
    setOutgoing(requestsRes.outgoing);
  };

  useEffect(() => {
    refresh();
  }, []);

  const sendRequest = async () => {
    if (!addUsername.trim()) return;
    setError('');
    setInfo('');
    try {
      await api.sendFriendRequest(addUsername.trim());
      setInfo(`Friend request sent to ${addUsername.trim()}`);
      setAddUsername('');
      refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const respond = async (requestId, accept) => {
    await (accept ? api.acceptFriendRequest(requestId) : api.declineFriendRequest(requestId));
    refresh();
  };

  return (
    <div className="list-screen">
      <section className="list-section">
        <h2>Add a friend</h2>
        <div className="add-friend-row">
          <input
            className="join-input"
            value={addUsername}
            onChange={(e) => setAddUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendRequest()}
            placeholder="Their username"
          />
          <button className="send-button" onClick={sendRequest} disabled={!addUsername.trim()}>➤</button>
        </div>
        {error && <p style={{ color: '#e0555f', fontSize: 13 }}>{error}</p>}
        {info && <p style={{ color: 'var(--primary-dark)', fontSize: 13 }}>{info}</p>}
      </section>

      {incoming.length > 0 && (
        <section className="list-section">
          <h2>Friend requests</h2>
          {incoming.map((r) => (
            <div key={r.requestId} className="list-item">
              <span>{r.username}</span>
              <div className="request-actions">
                <button className="pill-button" onClick={() => respond(r.requestId, true)}>Accept</button>
                <button className="pill-button pill-button-ghost" onClick={() => respond(r.requestId, false)}>Decline</button>
              </div>
            </div>
          ))}
        </section>
      )}

      {outgoing.length > 0 && (
        <section className="list-section">
          <h2>Pending</h2>
          {outgoing.map((r) => (
            <div key={r.requestId} className="list-item">
              <span>{r.username}</span>
              <span className="list-item-sub">Waiting…</span>
            </div>
          ))}
        </section>
      )}

      <section className="list-section">
        <h2>Friends</h2>
        {friends.length === 0 && <p className="list-item-sub">No friends yet — add one above!</p>}
        {friends.map((f) => (
          <button key={f.userId} className="list-item list-item-button" onClick={() => onOpenChat(f)}>
            <span>{f.username}</span>
            <span className="list-item-sub">Chat →</span>
          </button>
        ))}
      </section>
    </div>
  );
}

export default FriendsPage;
