import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import { Input, Banner, Button } from '../../components/ui/index.jsx';
import { AuthLayout } from '../../components/layout/Layouts.jsx';
import { COLLEGE } from '../../utils/constants.js';

export default function LoginPage() {
  const { login, college } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from?.pathname || '/dashboard';

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const collegeName = college?.name || COLLEGE.name;
  const collegeShort= college?.short|| COLLEGE.short;
  const domain      = college?.domain|| COLLEGE.domain;

  async function handleSubmit(e) {
    e?.preventDefault();
    if (!email || !password) { setError('Email and password are required'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.user, res.data.token);
      const dest = res.data.user.role === 'admin' ? '/admin' : from === '/login' ? '/dashboard' : from;
      navigate(dest, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      if (err.response?.data?.needsVerification) {
        navigate('/verify-email', { state: { email: err.response.data.email } });
      } else {
        setError(msg);
      }
    } finally { setLoading(false); }
  }

  return (
    <AuthLayout>
      <div style={{ width:440, maxWidth:'100%' }}>
        {/* Header card */}
        <div style={{ background:'var(--primary)', borderRadius:'var(--r-lg) var(--r-lg) 0 0',
          padding:'28px 32px', textAlign:'center', color:'#fff' }}>
          <div style={{ width:56,height:56,background:'var(--accent)',borderRadius:12,
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:24,fontWeight:700,margin:'0 auto 12px' }}>
            {collegeShort[0]}
          </div>
          <div style={{ fontSize:18, fontWeight:700 }}>{collegeShort} Election Portal</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,.7)', marginTop:4 }}>{collegeName}</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,.5)', marginTop:2 }}>Work is Worship</div>
        </div>

        {/* Form card */}
        <div style={{ background:'#fff', borderRadius:'0 0 var(--r-lg) var(--r-lg)',
          padding:32, border:'1px solid var(--border-subtle)', borderTop:'none' }}>

          <h2 style={{ fontSize:18, fontWeight:600, marginBottom:4 }}>Sign in to your account</h2>
          <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:24 }}>
            Use your college email ({domain})
          </p>

          {error && <Banner variant="danger">{error}</Banner>}

          <form onSubmit={handleSubmit}>
            <Input label="College email" type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder={`yourname${domain}`} autoComplete="email" required />

            <div style={{ position:'relative', marginBottom:8 }}>
              <Input label="Password" type={showPwd?'text':'password'} value={password}
                onChange={e => setPassword(e.target.value)} placeholder="Your password"
                autoComplete="current-password" inputStyle={{ paddingRight:44 }} style={{ marginBottom:0 }} required />
              <button type="button" onClick={() => setShowPwd(v=>!v)}
                style={{ position:'absolute', right:12, top:34, color:'var(--text-hint)' }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  {showPwd
                    ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
                    : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                </svg>
              </button>
            </div>

            <div style={{ textAlign:'right', marginBottom:24 }}>
              <Link to="/forgot-password" style={{ fontSize:12, color:'var(--primary)' }}>Forgot password?</Link>
            </div>

            <Button type="submit" fullWidth size="lg" loading={loading}>Sign in</Button>
          </form>

          <div style={{ textAlign:'center', fontSize:13, color:'var(--text-secondary)', marginTop:20 }}>
            New student?{' '}
            <Link to="/register" style={{ color:'var(--primary)', fontWeight:600 }}>Create account</Link>
          </div>
        </div>

        <div style={{ textAlign:'center', fontSize:11, color:'var(--text-hint)', marginTop:12 }}>
          {collegeName} · Sivakasi, Tamil Nadu
        </div>
      </div>
    </AuthLayout>
  );
}
