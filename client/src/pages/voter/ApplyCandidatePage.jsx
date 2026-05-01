import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import { useFetch } from '../../hooks/index.js';
import { VoterLayout } from '../../components/layout/Layouts.jsx';
import { Card, Input, Banner, Button, Divider } from '../../components/ui/index.jsx';

export default function ApplyCandidatePage() {
  const { id } = useParams(); // electionId
  const navigate = useNavigate();
  const { data: elData } = useFetch(`/elections/${id}`);
  const election = elData?.election;

  const [form, setForm] = useState({
    party_name: '', manifesto: '',
    agenda1: '', agenda2: '', agenda3: '',
    instagram: '', linkedin: '', twitter: '',
  });
  const [photo,    setPhoto]    = useState(null);
  const [preview,  setPreview]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [submitted,setSubmitted]= useState(false);

  function change(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); }

  function handlePhoto(e) {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 2*1024*1024) { setError('Photo must be under 2MB'); return; }
    setPhoto(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleSubmit(e) {
    e?.preventDefault();
    if (!form.manifesto.trim()) { setError('Please write your manifesto'); return; }
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('party_name', form.party_name);
      fd.append('manifesto',  form.manifesto);
      const agenda = [form.agenda1, form.agenda2, form.agenda3].filter(Boolean);
      fd.append('agenda_points', JSON.stringify(agenda));
      fd.append('social_links', JSON.stringify({
        instagram: form.instagram || null,
        linkedin:  form.linkedin  || null,
        twitter:   form.twitter   || null,
      }));
      if (photo) fd.append('photo', photo);

      await api.post(`/candidates/apply/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit application');
    } finally { setLoading(false); }
  }

  if (submitted) return (
    <VoterLayout narrow>
      <Card style={{ textAlign:'center', padding:'48px 32px' }}>
        <div className="pop-in" style={{ width:72,height:72,background:'#FDF3E0',borderRadius:'50%',
          display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',fontSize:32 }}>🎯</div>
        <h1 style={{ fontSize:22,fontWeight:700,marginBottom:8 }}>Application submitted!</h1>
        <p style={{ fontSize:14,color:'var(--text-secondary)',lineHeight:1.7,marginBottom:24 }}>
          Your candidacy application for <strong>{election?.title}</strong> is under review.
          The Election Committee will notify you by email once a decision is made.
        </p>
        <div style={{ display:'flex',gap:10,justifyContent:'center' }}>
          <Button variant="secondary" onClick={() => navigate('/my-applications')}>View my applications</Button>
          <Button onClick={() => navigate('/dashboard')}>Back to dashboard</Button>
        </div>
      </Card>
    </VoterLayout>
  );

  return (
    <VoterLayout narrow>
      <button onClick={() => navigate(-1)}
        style={{ display:'inline-flex',alignItems:'center',gap:4,fontSize:13,color:'var(--text-secondary)',
          background:'none',border:'none',cursor:'pointer',marginBottom:20 }}>← Back</button>

      <h1 style={{ fontSize:22,fontWeight:700,marginBottom:4 }}>Apply as Candidate</h1>
      <p style={{ fontSize:14,color:'var(--text-secondary)',marginBottom:20 }}>
        {election?.title}
        {election?.candidate_apply_end && (
          <span style={{ color:'#D97706',marginLeft:8 }}>
            · Deadline: {new Date(election.candidate_apply_end).toLocaleString('en-IN')}
          </span>
        )}
      </p>

      {error && <Banner variant="danger">{error}</Banner>}

      <form onSubmit={handleSubmit}>
        {/* Photo */}
        <Card style={{ marginBottom:20 }}>
          <h2 style={{ fontSize:15,fontWeight:600,marginBottom:14 }}>Profile photo</h2>
          <div style={{ display:'flex',alignItems:'center',gap:20 }}>
            <div style={{ width:90,height:90,borderRadius:'50%',overflow:'hidden',flexShrink:0,
              border:'2px solid var(--border-subtle)',display:'flex',alignItems:'center',justifyContent:'center',
              background:'var(--bg-surface)',fontSize:32 }}>
              {preview ? <img src={preview} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }} /> : '👤'}
            </div>
            <div>
              <label style={{ display:'inline-block',background:'var(--bg-page)',border:'1px solid #D3D1C7',
                borderRadius:'var(--r-sm)',padding:'8px 16px',fontSize:13,cursor:'pointer',fontFamily:'inherit' }}>
                Upload photo
                <input type="file" accept="image/*" onChange={handlePhoto} style={{ display:'none' }} />
              </label>
              <p style={{ fontSize:11,color:'var(--text-hint)',marginTop:6 }}>JPG/PNG · Max 2MB</p>
            </div>
          </div>
        </Card>

        {/* Basic info */}
        <Card style={{ marginBottom:20 }}>
          <h2 style={{ fontSize:15,fontWeight:600,marginBottom:14 }}>Campaign details</h2>
          <Input label="Party / Group name (optional)" name="party_name" value={form.party_name}
            onChange={change} placeholder="e.g. Students United Front, or leave blank for Independent" />
          <Input label="Your manifesto *" type="textarea" name="manifesto" value={form.manifesto}
            onChange={change} placeholder="Describe your vision, goals, and what you will do for students..."
            inputStyle={{ minHeight:160 }} required
            hint={`${form.manifesto.length} characters`} />
        </Card>

        {/* Agenda */}
        <Card style={{ marginBottom:20 }}>
          <h2 style={{ fontSize:15,fontWeight:600,marginBottom:14 }}>Key agenda points (optional)</h2>
          {['agenda1','agenda2','agenda3'].map((k,i) => (
            <Input key={k} label={`Point ${i+1}`} name={k} value={form[k]} onChange={change}
              placeholder={`e.g. ${['Improve WiFi connectivity in hostels','Better canteen facilities','More cultural events'][i]}`} />
          ))}
        </Card>

        {/* Social links */}
        <Card style={{ marginBottom:24 }}>
          <h2 style={{ fontSize:15,fontWeight:600,marginBottom:14 }}>Social links (optional)</h2>
          <Input label="Instagram profile URL" name="instagram" value={form.instagram} onChange={change}
            placeholder="https://instagram.com/yourhandle" />
          <Input label="LinkedIn profile URL" name="linkedin" value={form.linkedin} onChange={change}
            placeholder="https://linkedin.com/in/yourname" />
          <Input label="Twitter / X profile URL" name="twitter" value={form.twitter} onChange={change}
            placeholder="https://twitter.com/yourhandle" />
        </Card>

        <div style={{ background:'var(--warning-bg)',border:'1px solid #F5C885',borderRadius:'var(--r-sm)',
          padding:'12px 16px',fontSize:13,color:'var(--warning-text)',marginBottom:20 }}>
          ⚠️ Your application will be reviewed by the Election Committee. You will receive an email notification of approval or rejection.
        </div>

        <div style={{ display:'flex',gap:10 }}>
          <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" size="lg" loading={loading}>Submit application</Button>
        </div>
      </form>
    </VoterLayout>
  );
}
