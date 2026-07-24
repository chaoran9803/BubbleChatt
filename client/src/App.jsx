import { useState, useEffect } from 'react';
import { socket } from './socket';

function App() {
  const [username, setUsername] = useState('');
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

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

  const sendMessage = () => {
    if (!input.trim()) return;
    socket.emit('chat message', { text: input, username });
    setInput('');
  };

  if (!joined) {
    return (
      <div>
        <h1>Bubble Chat</h1>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Pick a username"
        />
        <button onClick={() => username.trim() && setJoined(true)}>Join</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Bubble Chat</h1>
      <ul>
        {messages.map((m) =>
          m.type === 'system' ? (
            <li key={m.id}><em>{m.text}</em></li>
          ) : (
            <li key={m.id}><strong>{m.username}:</strong> {m.text}</li>
          )
        )}
      </ul>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        placeholder="Type a message..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default App;