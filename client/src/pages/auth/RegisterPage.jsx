import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import { Input, Select, Banner, Button, Divider } from '../../components/ui/index.jsx';
import { AuthLayout } from '../../components/layout/Layouts.jsx';
import { COLLEGE, DEPARTMENTS, YEARS, DEGREES, GENDERS, HOSTEL_OPTIONS } from '../../utils/constants.js';

function StrengthBar({ password }) {
  const score = [password.length>=8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
  const levels = [null,
    { label:'Weak',   color:'#DC2626', w:'25%' },
    { label:'Fair',   color:'#D97706', w:'50%' },
    { label:'Good',   color:'var(--primary)', w:'75%' },
    { label:'Strong', color:'#065F46', w:'100%' },
  ];
  if (!password) return null;
  const lv = levels[Math.min(score,4)];
  return (
    <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:6 }}>
      <div style={{ flex:1, height:4, background:'#E0DED6', borderRadius:2, overflow:'hidden' }}>
        <div style={{ height:4, background:lv.color, width:lv.w, borderRadius:2, transition:'width .3s,background .3s' }} />
      </div>
      <span style={{ fontSize:11, color:lv.color, whiteSpace:'nowrap' }}>{lv.label}</span>
    </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=basic, 2=academic, 3=account
  const [form, setForm] = useState({
    full_name:'', email:'', password:'', confirm:'',
    roll_number:'', department:'', year:'', degree:'',
    gender:'', phone:'', hostel_day:'',
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  function change(e) { setForm(f=>({ ...f, [e.target.name]: e.target.value })); setError(''); }

  function validateStep1() {
    if (!form.full_name.trim()) return 'Full name is required';
    if (!form.gender)           return 'Please select gender';
    if (!form.phone.trim())     return 'Phone number is required';
    if (!/^[0-9]{10}$/.test(form.phone.trim())) return 'Enter a valid 10-digit phone number';
    return null;
  }
  function validateStep2() {
    if (!form.roll_number.trim()) return 'Roll number is required';
    if (!form.department)         return 'Please select your department';
    if (!form.year)               return 'Please select your year';
    if (!form.degree)             return 'Please select your degree';
    if (!form.hostel_day)         return 'Please select Hosteller / Day Scholar';
    return null;
  }
  function validateStep3() {
    if (!form.email)              return 'Email is required';
    if (!form.email.endsWith(COLLEGE.domain)) return `Only ${COLLEGE.domain} emails are allowed`;
    if (!form.password)           return 'Password is required';
    if (form.password.length < 8) return 'Password must be at least 8 characters';
    if (form.password !== form.confirm) return 'Passwords do not match';
    return null;
  }

  function nextStep() {
    const err = step === 1 ? validateStep1() : step === 2 ? validateStep2() : null;
    if (err) { setError(err); return; }
    setError(''); setStep(s => s + 1);
  }

  async function handleSubmit(e) {
    e?.preventDefault();
    const err = validateStep3();
    if (err) { setError(err); return; }
    setLoading(true); setError('');
    try {
      await api.post('/auth/register', form);
      navigate('/verify-email', { state: { email: form.email } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  }

  const steps = ['Personal Info','Academic Details','Account Setup'];

  return (
    <AuthLayout>
      <div style={{ width:500, maxWidth:'100%' }}>
        {/* Header */}
        <div style={{ background:'var(--primary)', borderRadius:'var(--r-lg) var(--r-lg) 0 0',
          padding:'22px 32px', color:'#fff', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:40,height:40,background:'var(--accent)',borderRadius:8,
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:700 }}>
            {COLLEGE.short[0]}
          </div>
          <div>
            <div style={{ fontWeight:600 }}>{COLLEGE.short} Election Portal</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.65)' }}>Student Registration</div>
          </div>
        </div>

        <div style={{ background:'#fff', borderRadius:'0 0 var(--r-lg) var(--r-lg)',
          padding:32, border:'1px solid var(--border-subtle)', borderTop:'none' }}>

          {/* Step indicator */}
          <div style={{ display:'flex', gap:0, marginBottom:28 }}>
            {steps.map((s, i) => (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6,
                position:'relative' }}>
                <div style={{ width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',
                  justifyContent:'center',fontSize:12,fontWeight:600,
                  background: i+1 < step ? 'var(--primary)' : i+1===step ? 'var(--accent)' : '#E0DED6',
                  color: i+1 <= step ? '#fff' : 'var(--text-hint)',
                }}>
                  {i+1 < step ? '✓' : i+1}
                </div>
                <div style={{ fontSize:10, color: i+1<=step?'var(--primary)':'var(--text-hint)',
                  fontWeight: i+1===step?600:400, textAlign:'center' }}>{s}</div>
                {i < steps.length-1 && (
                  <div style={{ position:'absolute', top:14, left:'50%', width:'100%', height:2,
                    background: i+1 < step ? 'var(--primary)' : '#E0DED6' }} />
                )}
              </div>
            ))}
          </div>

          {error && <Banner variant="danger">{error}</Banner>}

          {/* Step 1 — Personal */}
          {step === 1 && (
            <div className="fade-in">
              <Input label="Full name" name="full_name" value={form.full_name} onChange={change}
                placeholder="As per college records" required />
              <Select label="Gender" name="gender" value={form.gender} onChange={change} required>
                <option value="">Select gender</option>
                {GENDERS.map(g => <option key={g}>{g}</option>)}
              </Select>
              <Input label="Phone number" name="phone" value={form.phone} onChange={change}
                placeholder="10-digit mobile number" required />
              <Select label="Accommodation" name="hostel_day" value={form.hostel_day} onChange={change} required>
                <option value="">Select</option>
                {HOSTEL_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </Select>
              <Button fullWidth size="lg" onClick={nextStep}>Continue →</Button>
            </div>
          )}

          {/* Step 2 — Academic */}
          {step === 2 && (
            <div className="fade-in">
              <Input label="Roll number" name="roll_number" value={form.roll_number} onChange={change}
                placeholder="e.g. 22CSE101" required />
              <Select label="Department" name="department" value={form.department} onChange={change} required>
                <option value="">Select your department</option>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </Select>
              <Select label="Year of study" name="year" value={form.year} onChange={change} required>
                <option value="">Select year</option>
                {YEARS.map(y => <option key={y}>{y}</option>)}
              </Select>
              <Select label="Degree programme" name="degree" value={form.degree} onChange={change} required>
                <option value="">Select degree</option>
                {DEGREES.map(d => <option key={d}>{d}</option>)}
              </Select>
              <div style={{ display:'flex', gap:10 }}>
                <Button variant="secondary" style={{ flex:1 }} onClick={() => setStep(1)}>← Back</Button>
                <Button style={{ flex:2 }} size="lg" onClick={nextStep}>Continue →</Button>
              </div>
            </div>
          )}

          {/* Step 3 — Account */}
          {step === 3 && (
            <form className="fade-in" onSubmit={handleSubmit}>
              <Input label="College email" type="email" name="email" value={form.email} onChange={change}
                placeholder={`yourrollno${COLLEGE.domain}`}
                hint={`Must end with ${COLLEGE.domain}`} required />
              <div style={{ marginBottom:16 }}>
                <Input label="Password" type="password" name="password" value={form.password} onChange={change}
                  placeholder="Min. 8 characters" style={{ marginBottom:0 }} required />
                <StrengthBar password={form.password} />
              </div>
              <Input label="Confirm password" type="password" name="confirm" value={form.confirm} onChange={change}
                placeholder="Repeat password" required />
              <div style={{ display:'flex', gap:10 }}>
                <Button variant="secondary" style={{ flex:1 }} onClick={() => setStep(2)}>← Back</Button>
                <Button type="submit" style={{ flex:2 }} size="lg" loading={loading}>Create account</Button>
              </div>
            </form>
          )}

          <Divider style={{ margin:'20px 0 14px' }} />
          <p style={{ textAlign:'center', fontSize:13, color:'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color:'var(--primary)', fontWeight:600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
