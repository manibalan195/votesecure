import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api.js';
import { Banner, Button } from '../../components/ui/index.jsx';
import { AuthLayout } from '../../components/layout/Layouts.jsx';
import { COLLEGE } from '../../utils/constants.js';

export default function VerifyOTPPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const email     = location.state?.email || '';
  const [otp,     setOtp]     = useState(['','','','','','']);
  const [loading, setLoading] = useState(false);
  const [resending,setResending]=useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [timer,   setTimer]   = useState(60);
  const refs = useRef([]);

  useEffect(() => {
    refs.current[0]?.focus();
    const t = setInterval(() => setTimer(n => n > 0 ? n-1 : 0), 1000);
    return () => clearInterval(t);
  }, []);

  function handleInput(i, val) {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[i] = val; setOtp(next);
    if (val && i < 5) refs.current[i+1]?.focus();
  }

  function handleKey(i, e) {
    if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i-1]?.focus();
  }

  function handlePaste(e) {
    const text = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);
    if (text.length === 6) { setOtp(text.split('')); refs.current[5]?.focus(); }
  }

  async function handleVerify() {
    const code = otp.join('');
    if (code.length < 6) { setError('Please enter all 6 digits'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/auth/verify-otp', { email, token: code });
      navigate('/login', { state: { verified: true } });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired code');
      setOtp(['','','','','','']);
      refs.current[0]?.focus();
    } finally { setLoading(false); }
  }

  async function handleResend() {
    if (timer > 0) return;
    setResending(true);
    try {
      await api.post('/auth/send-otp', { email });
      setTimer(60); setSuccess('New code sent to your email');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend');
    } finally { setResending(false); }
  }

  return (
    <AuthLayout>
      <div style={{ width:420, maxWidth:'100%', background:'#fff',
        border:'1px solid var(--border-subtle)', borderRadius:'var(--r-lg)',
        padding:40, textAlign:'center' }}>

        <div style={{ width:64,height:64,background:'var(--primary-light)',borderRadius:'50%',
          display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>

        <h1 style={{ fontSize:22, fontWeight:700, marginBottom:8 }}>Verify your college email</h1>
        <p style={{ fontSize:14, color:'var(--text-secondary)', lineHeight:1.7, marginBottom:28 }}>
          We sent a 6-digit code to<br/>
          <strong style={{ color:'var(--text-primary)' }}>{email || 'your college email'}</strong>
        </p>

        {error   && <Banner variant="danger">{error}</Banner>}
        {success && <Banner variant="success">{success}</Banner>}

        <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:28 }} onPaste={handlePaste}>
          {otp.map((d, i) => (
            <input key={i} ref={el => refs.current[i] = el}
              value={d} onChange={e => handleInput(i, e.target.value)}
              onKeyDown={e => handleKey(i, e)}
              maxLength={1} inputMode="numeric"
              style={{ width:50, height:58, border:`1px solid ${d?'var(--primary)':'#D3D1C7'}`,
                borderRadius:'var(--r-sm)', fontSize:26, fontWeight:700, textAlign:'center',
                background:'#fff', color:'var(--text-primary)',
                boxShadow: d ? '0 0 0 3px rgba(26,58,92,.1)' : 'none',
                outline:'none', transition:'border-color .15s, box-shadow .15s' }}
            />
          ))}
        </div>

        <Button fullWidth size="lg" loading={loading} onClick={handleVerify} style={{ marginBottom:20 }}>
          Verify email
        </Button>

        <p style={{ fontSize:13, color:'var(--text-secondary)' }}>
          Didn't receive the code?{' '}
          {timer > 0
            ? <span style={{ color:'var(--text-hint)' }}>
                Resend in {String(Math.floor(timer/60)).padStart(2,'0')}:{String(timer%60).padStart(2,'0')}
              </span>
            : <button onClick={handleResend} disabled={resending}
                style={{ color:'var(--primary)', fontWeight:600, background:'none', border:'none', cursor:'pointer' }}>
                {resending ? 'Sending…' : 'Resend code'}
              </button>}
        </p>

        <p style={{ fontSize:11, color:'var(--text-hint)', marginTop:20 }}>
          {COLLEGE.name} · Official Election Portal
        </p>
      </div>
    </AuthLayout>
  );
}
