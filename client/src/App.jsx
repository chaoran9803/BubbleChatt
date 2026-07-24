import { useState, useEffect, useRef } from 'react';
import { socket } from './socket';
import './App.css';

const AVATAR_COLORS = ['#ff8fab', '#ffb26b', '#ffd23f', '#8ac926', '#06c755', '#4ea8de', '#a06cd5'];

function colorForName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function App() {
  const [username, setUsername] = useState('');
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const listEndRef = useRef(null);

  useEffect(() => {
    if (!joined) return;

    socket.connect();
    socket.emit('join', username);

    socket.on('chat message', (msg) => {
      setMessages((prev) => [...prev, { type: 'chat', ...msg }]);
    });

    socket.on('system message', (text) => {
      setMessages((prev) => [...prev, { type: 'system', id: Date.now(), text }]);
    });

    return () => {
      socket.off('chat message');
      socket.off('system message');
      socket.disconnect();
    };
  }, [joined]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    socket.emit('chat message', { text: input, username });
    setInput('');
  };

  if (!joined) {
    return (
      <div className="join-screen">
        <div className="join-card">
          <div className="join-mascot">🐻</div>
          <h1>Bubble Chat</h1>
          <p className="join-subtitle">Pick a cute name and hop in!</p>
          <input
            className="join-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && username.trim() && setJoined(true)}
            placeholder="Pick a username"
          />
          <button
            className="join-button"
            disabled={!username.trim()}
            onClick={() => username.trim() && setJoined(true)}
          >
            Join the chat 💬
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-screen">
      <header className="chat-header">
        <span className="chat-header-emoji">🐻</span>
        <h1>Bubble Chat</h1>
        <span className="chat-header-sub">
          <span className="status-dot" /> {username}
        </span>
      </header>

      <div className="message-list">
        {messages.map((m) => {
          if (m.type === 'system') {
            return (
              <div key={m.id} className="system-message">
                {m.text}
              </div>
            );
          }
          const isMe = m.username === username;
          return (
            <div key={m.id} className={`message-row ${isMe ? 'me' : 'other'}`}>
              <div className="avatar" style={{ background: colorForName(m.username) }}>
                {m.username?.[0]?.toUpperCase()}
              </div>
              <div className="message-group">
                {!isMe && <p className="message-username">{m.username}</p>}
                <div className="bubble">{m.text}</div>
              </div>
            </div>
          );
        })}
        <div ref={listEndRef} />
      </div>

      <div className="composer">
        <input
          className="composer-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
        />
        <button className="send-button" onClick={sendMessage} disabled={!input.trim()}>
          ➤
        </button>
      </div>
    </div>
  );
}

export default App;
