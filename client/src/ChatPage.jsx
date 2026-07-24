import { useEffect, useRef, useState } from 'react';
import { socket } from './socket';
import { api } from './api';

const AVATAR_COLORS = ['#ff8fab', '#ffb26b', '#ffd23f', '#8ac926', '#06c755', '#4ea8de', '#a06cd5'];

function colorForName(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function conversationTitle(conversation) {
  if (conversation.isGroup) return conversation.name;
  return conversation.members.find((m) => m.username)?.username || 'Chat';
}

function ChatPage({ conversation, username, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const listEndRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    api.getMessages(conversation.id).then((res) => {
      if (!cancelled) setMessages(res.messages);
    });

    socket.emit('join conversation', conversation.id);

    const onChatMessage = (msg) => {
      if (msg.conversationId !== conversation.id) return;
      setMessages((prev) => [...prev, msg]);
    };
    socket.on('chat message', onChatMessage);

    return () => {
      cancelled = true;
      socket.off('chat message', onChatMessage);
    };
  }, [conversation.id]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    socket.emit('chat message', { conversationId: conversation.id, text: input });
    setInput('');
  };

  return (
    <div className="chat-screen">
      <header className="chat-header">
        <button className="back-button" onClick={onBack} aria-label="Back">←</button>
        <span className="chat-header-emoji">{conversation.isGroup ? '👥' : '🐻'}</span>
        <h1>{conversationTitle(conversation)}</h1>
      </header>

      <div className="message-list">
        {messages.map((m) => {
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

export default ChatPage;
