import { useState } from 'react';
import { api, storeAuth } from './api';

function AuthPage({ onAuthed }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!username.trim() || !password) return;
    setLoading(true);
    setError('');
    try {
      const result = mode === 'login'
        ? await api.login(username.trim(), password)
        : await api.signup(username.trim(), password);
      storeAuth(result);
      onAuthed(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="join-screen">
      <div className="join-card">
        <div className="join-mascot">🐻</div>
        <h1>Bubble Chat</h1>
        <p className="join-subtitle">
          {mode === 'login' ? 'Log in to chat with your friends' : 'Create an account to get started'}
        </p>

        <input
          className="join-input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          autoComplete="username"
        />
        <input
          className="join-input"
          style={{ marginTop: 10 }}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />

        {error && <p style={{ color: '#e0555f', fontSize: 13, marginTop: 10 }}>{error}</p>}

        <button
          className="join-button"
          disabled={!username.trim() || !password || loading}
          onClick={submit}
        >
          {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
        </button>

        <p className="join-subtitle" style={{ marginTop: 18, marginBottom: 0 }}>
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setError('');
              setMode(mode === 'login' ? 'signup' : 'login');
            }}
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </a>
        </p>
      </div>
    </div>
  );
}

export default AuthPage;
