import { useEffect, useState } from 'react';
import { socket } from './socket';
import { api, getStoredAuth, clearAuth } from './api';
import AuthPage from './AuthPage';
import FriendsPage from './FriendsPage';
import ConversationsPage from './ConversationsPage';
import ChatPage from './ChatPage';
import './App.css';

function App() {
  const [auth, setAuth] = useState(() => getStoredAuth());
  const [tab, setTab] = useState('conversations'); // 'conversations' | 'friends'
  const [activeConversation, setActiveConversation] = useState(null);

  useEffect(() => {
    if (!auth) return;
    socket.connect();
    return () => socket.disconnect();
  }, [auth]);

  const logout = () => {
    setActiveConversation(null);
    clearAuth();
    setAuth(null);
  };

  const openFriendChat = async (friend) => {
    const conversation = await api.createConversation([friend.userId]);
    setActiveConversation(conversation);
  };

  if (!auth) {
    return <AuthPage onAuthed={setAuth} />;
  }

  if (activeConversation) {
    return (
      <ChatPage
        conversation={activeConversation}
        username={auth.username}
        onBack={() => setActiveConversation(null)}
      />
    );
  }

  return (
    <div className="chat-screen">
      <header className="chat-header">
        <span className="chat-header-emoji">🐻</span>
        <h1>Bubble Chat</h1>
        <span className="chat-header-sub">
          <span className="status-dot" /> {auth.username}
        </span>
        <button className="logout-button" onClick={logout}>Log out</button>
      </header>

      <nav className="tab-bar">
        <button className={`tab ${tab === 'conversations' ? 'tab-active' : ''}`} onClick={() => setTab('conversations')}>
          Chats
        </button>
        <button className={`tab ${tab === 'friends' ? 'tab-active' : ''}`} onClick={() => setTab('friends')}>
          Friends
        </button>
      </nav>

      {tab === 'conversations' ? (
        <ConversationsPage onOpenConversation={setActiveConversation} />
      ) : (
        <FriendsPage onOpenChat={openFriendChat} />
      )}
    </div>
  );
}

export default App;
