import React from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth.js';
import { setAuth } from '../state/auth.js';

export default function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await login({ email, password });
      setAuth(res);
      nav('/');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>Login</div>
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 10 }}>
          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Email</div>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
        </div>
        <div style={{ marginBottom: 10 }}>
          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Password</div>
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" type="password" />
        </div>

        {error ? <div className="error" style={{ marginBottom: 10 }}>{error.message}</div> : null}

        <button disabled={loading} type="submit">{loading ? 'Logging in…' : 'Login'}</button>
      </form>

      <div className="muted" style={{ marginTop: 10, fontSize: 12 }}>
        Uses <code>POST /api/auth/login</code> and stores <code>accessToken</code> in localStorage.
      </div>
    </div>
  );
}
