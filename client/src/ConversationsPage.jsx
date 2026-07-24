import { useEffect, useState } from 'react';
import { api } from './api';

function ConversationsPage({ onOpenConversation }) {
  const [conversations, setConversations] = useState([]);
  const [friends, setFriends] = useState([]);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [error, setError] = useState('');

  const refresh = async () => {
    const res = await api.getConversations();
    setConversations(res.conversations);
  };

  useEffect(() => {
    refresh();
  }, []);

  const openNewGroup = async () => {
    setError('');
    setShowNewGroup(true);
    const res = await api.getFriends();
    setFriends(res.friends);
  };

  const toggleSelected = (userId) => {
    setSelectedIds((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  };

  const createGroup = async () => {
    if (selectedIds.length < 2 || !groupName.trim()) return;
    setError('');
    try {
      const conversation = await api.createConversation(selectedIds, groupName.trim());
      setShowNewGroup(false);
      setGroupName('');
      setSelectedIds([]);
      refresh();
      onOpenConversation(conversation);
    } catch (err) {
      setError(err.message);
    }
  };

  const labelFor = (c) => {
    if (c.isGroup) return c.name;
    return c.members.find((m) => m.username)?.username || 'Chat';
  };

  return (
    <div className="list-screen">
      <section className="list-section">
        <div className="list-section-header">
          <h2>Chats</h2>
          <button className="pill-button" onClick={openNewGroup}>+ New group</button>
        </div>

        {conversations.length === 0 && (
          <p className="list-item-sub">No chats yet — go to Friends and start one.</p>
        )}
        {conversations.map((c) => (
          <button key={c.id} className="list-item list-item-button" onClick={() => onOpenConversation(c)}>
            <span>{c.isGroup ? `👥 ${labelFor(c)}` : labelFor(c)}</span>
            <span className="list-item-sub">{c.lastMessage?.text || 'Say hi!'}</span>
          </button>
        ))}
      </section>

      {showNewGroup && (
        <section className="list-section">
          <h2>New group chat</h2>
          <input
            className="join-input"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Group name"
          />
          <div style={{ marginTop: 12 }}>
            {friends.length === 0 && <p className="list-item-sub">Add some friends first.</p>}
            {friends.map((f) => (
              <label key={f.userId} className="list-item">
                <span>{f.username}</span>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(f.userId)}
                  onChange={() => toggleSelected(f.userId)}
                />
              </label>
            ))}
          </div>
          {error && <p style={{ color: '#e0555f', fontSize: 13 }}>{error}</p>}
          <div className="request-actions" style={{ marginTop: 12 }}>
            <button
              className="pill-button"
              disabled={selectedIds.length < 2 || !groupName.trim()}
              onClick={createGroup}
            >
              Create group
            </button>
            <button className="pill-button pill-button-ghost" onClick={() => setShowNewGroup(false)}>Cancel</button>
          </div>
        </section>
      )}
    </div>
  );
}

export default ConversationsPage;
