import React from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../api/auth.js';
import { setAuth } from '../state/auth.js';

export default function RegisterPage() {
  const nav = useNavigate();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await register({ email, password, firstName, lastName });
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
      <div style={{ fontWeight: 700, marginBottom: 10 }}>Register</div>
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 10 }}>
          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>First name</div>
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="first name" />
        </div>
        <div style={{ marginBottom: 10 }}>
          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Last name</div>
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="last name" />
        </div>
        <div style={{ marginBottom: 10 }}>
          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Email</div>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
        </div>
        <div style={{ marginBottom: 10 }}>
          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Password</div>
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" type="password" />
        </div>

        {error ? <div className="error" style={{ marginBottom: 10 }}>{error.message}</div> : null}

        <button disabled={loading} type="submit">{loading ? 'Creating…' : 'Create account'}</button>
      </form>

      <div className="muted" style={{ marginTop: 10, fontSize: 12 }}>
        Uses <code>POST /api/auth/register</code>.
      </div>
    </div>
  );
}
