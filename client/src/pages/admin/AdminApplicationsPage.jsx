import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import { useFetch } from '../../hooks/index.js';
import AdminLayout from '../../components/layout/AdminLayout.jsx';
import { Card, Badge, Avatar, Banner, Spinner, Button, Divider, Input } from '../../components/ui/index.jsx';
import { APPLICATION_STATUS_LABEL } from '../../utils/constants.js';

function ApplicationCard({ app, onReview }) {
  const [showReview, setShowReview] = useState(false);
  const [note,       setNote]       = useState('');
  const [loading,    setLoading]    = useState(false);
  const as = APPLICATION_STATUS_LABEL[app.status];

  async function submit(status) {
    setLoading(true);
    try {
      await onReview(app.id, status, note);
      setShowReview(false);
    } finally { setLoading(false); }
  }

  return (
    <Card style={{ marginBottom:14 }}>
      <div style={{ display:'flex',alignItems:'flex-start',gap:16,marginBottom:12 }}>
        <Avatar name={app.full_name} size={52}
          src={app.photo_url ? app.photo_url : null} />
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:4 }}>
            <span style={{ fontSize:15,fontWeight:600 }}>{app.full_name}</span>
            <Badge color={as.color} bg={as.bg}>{as.label}</Badge>
          </div>
          <div style={{ fontSize:13,color:'var(--text-secondary)',marginBottom:2 }}>
            {app.department} · {app.year} · Roll: {app.roll_number||'—'}
          </div>
          <div style={{ fontSize:12,color:'var(--text-hint)' }}>
            {app.email} · {app.gender||'—'} · {app.hostel_day||'—'}
          </div>
          <div style={{ fontSize:12,color:'var(--text-hint)',marginTop:2 }}>
            Applied {new Date(app.applied_at).toLocaleString('en-IN')}
          </div>
        </div>
        {app.status === 'pending' && (
          <Button size="sm" onClick={() => setShowReview(v=>!v)}>
            {showReview ? 'Cancel' : 'Review'}
          </Button>
        )}
      </div>

      {app.party_name && (
        <div style={{ fontSize:13,marginBottom:8 }}>
          <strong>Party:</strong> {app.party_name}
        </div>
      )}

      {app.manifesto && (
        <div style={{ marginBottom:10 }}>
          <div style={{ fontSize:12,fontWeight:500,color:'var(--text-hint)',textTransform:'uppercase',
            letterSpacing:'.04em',marginBottom:4 }}>Manifesto</div>
          <div style={{ fontSize:13,color:'var(--text-primary)',lineHeight:1.7,
            background:'var(--bg-page)',borderRadius:'var(--r-sm)',padding:'10px 14px',
            maxHeight:120,overflow:'auto' }}>
            {app.manifesto}
          </div>
        </div>
      )}

      {app.agenda_points?.length > 0 && (
        <div style={{ marginBottom:10 }}>
          <div style={{ fontSize:12,fontWeight:500,color:'var(--text-hint)',textTransform:'uppercase',
            letterSpacing:'.04em',marginBottom:4 }}>Agenda points</div>
          <ul style={{ paddingLeft:20,fontSize:13,color:'var(--text-primary)',lineHeight:1.8 }}>
            {app.agenda_points.map((p,i) => <li key={i}>{p}</li>)}
          </ul>
        </div>
      )}

      {app.status !== 'pending' && app.admin_note && (
        <div style={{ background: app.status==='approved'?'var(--success-bg)':'var(--danger-bg)',
          border:`1px solid ${app.status==='approved'?'#9FE1CB':'#F09595'}`,
          borderRadius:'var(--r-sm)',padding:'8px 14px',fontSize:13,marginTop:8 }}>
          <strong>Committee note:</strong> {app.admin_note}
        </div>
      )}

      {app.status === 'pending' && showReview && (
        <div style={{ marginTop:14,padding:'16px',background:'var(--bg-page)',borderRadius:'var(--r-sm)',
          animation:'fadeIn .15s ease' }}>
          <div style={{ fontSize:13,fontWeight:500,marginBottom:10 }}>
            Review application from {app.full_name}
          </div>
          <Input label="Note to candidate (optional — will be emailed)" type="textarea"
            value={note} onChange={e=>setNote(e.target.value)}
            placeholder="Reason for approval/rejection, or any message for the candidate..."
            inputStyle={{ minHeight:70 }} />
          <div style={{ display:'flex',gap:10 }}>
            <button onClick={() => submit('rejected')} disabled={loading}
              style={{ flex:1,height:40,borderRadius:'var(--r-sm)',fontSize:13,fontWeight:600,
                border:'1.5px solid #DC2626',background:'#fff',color:'#DC2626',cursor:'pointer' }}>
              {loading ? 'Processing…' : '✗ Reject'}
            </button>
            <button onClick={() => submit('approved')} disabled={loading}
              style={{ flex:1,height:40,borderRadius:'var(--r-sm)',fontSize:13,fontWeight:600,
                border:'none',background:'var(--primary)',color:'#fff',cursor:'pointer' }}>
              {loading ? 'Processing…' : '✓ Approve'}
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function AdminApplicationsPage() {
  const navigate = useNavigate();
  const { data: elData } = useFetch('/elections/admin/all');
  const [electionId, setElectionId] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [msg, setMsg] = useState('');

  const elUrl = electionId
    ? `/candidates/admin/${electionId}?status=${statusFilter === 'all' ? '' : statusFilter}`
    : null;
  const { data, loading, refetch } = useFetch(elUrl, [electionId, statusFilter]);

  const elections = elData?.elections || [];
  const apps      = data?.applications || [];
  const pending   = apps.filter(a => a.status==='pending').length;

  async function handleReview(appId, status, note) {
    try {
      await api.put(`/candidates/admin/review/${appId}`, { status, admin_note: note });
      setMsg(`Application ${status}. Candidate notified by email.`);
      setTimeout(() => setMsg(''), 4000);
      refetch();
    } catch (err) {
      alert(err.response?.data?.message || 'Review failed');
    }
  }

  return (
    <AdminLayout title="Candidate Applications">
      {msg && <Banner variant="success">{msg}</Banner>}

      {/* Controls */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <select value={electionId} onChange={e => setElectionId(e.target.value)}
          style={{ height:44,border:'1px solid #D3D1C7',borderRadius:'var(--r-sm)',padding:'0 14px',
            fontSize:14,background:'#fff',color:'var(--text-primary)',minWidth:280 }}>
          <option value="">— Select an election —</option>
          {elections.map(e => (
            <option key={e.id} value={e.id}>
              {e.title} {e.pending_count > 0 ? `(${e.pending_count} pending)` : ''}
            </option>
          ))}
        </select>

        {['all','pending','approved','rejected'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            style={{ height:44,padding:'0 16px',borderRadius:'var(--r-sm)',fontSize:13,fontWeight:500,
              border: statusFilter===s ? '2px solid var(--primary)' : '1px solid #D3D1C7',
              background: statusFilter===s ? 'var(--primary-light)' : '#fff',
              color: statusFilter===s ? 'var(--primary)' : 'var(--text-secondary)',
              cursor:'pointer',textTransform:'capitalize' }}>
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      {!electionId && (
        <Card style={{ textAlign:'center',padding:'56px 24px' }}>
          <div style={{ fontSize:40,marginBottom:12 }}>👆</div>
          <h2 style={{ fontSize:16,fontWeight:600,marginBottom:8 }}>Select an election above</h2>
          <p style={{ fontSize:14,color:'var(--text-secondary)' }}>
            Choose an election to view and review candidate applications.
          </p>
        </Card>
      )}

      {electionId && loading && (
        <div style={{ display:'flex',justifyContent:'center',padding:48 }}><Spinner size={28}/></div>
      )}

      {electionId && !loading && apps.length === 0 && (
        <Card style={{ textAlign:'center',padding:'40px 24px' }}>
          <div style={{ fontSize:13,color:'var(--text-hint)' }}>
            No {statusFilter !== 'all' ? statusFilter : ''} applications for this election.
          </div>
        </Card>
      )}

      {electionId && !loading && apps.length > 0 && (
        <>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14 }}>
            <div style={{ fontSize:14,color:'var(--text-secondary)' }}>
              {apps.length} application{apps.length!==1?'s':''}{pending > 0 ? ` · ${pending} pending review` : ''}
            </div>
          </div>
          {apps.map(app => (
            <ApplicationCard key={app.id} app={app} onReview={handleReview} />
          ))}
        </>
      )}
    </AdminLayout>
  );
}
