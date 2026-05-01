// ─── MyApplicationsPage.jsx ───────────────────────────────────────────────────
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFetch } from '../../hooks/index.js';
import { VoterLayout } from '../../components/layout/Layouts.jsx';
import { APPLICATION_STATUS_LABEL, ELECTION_STATUS_LABEL } from '../../utils/constants.js';
import {
  Avatar,
  Card,
  Badge,
  Spinner,
  Divider,
  Input,
  Select,
  Banner,
  Button,
} from '../../components/ui/index.jsx';
import { GENDERS, HOSTEL_OPTIONS } from '../../utils/constants.js';
import apiMod from '../../services/api.js';

export function MyApplicationsPage() {
  const navigate = useNavigate();
  const { data, loading } = useFetch('/candidates/my-applications');
  const apps = data?.applications || [];

  return (
    <VoterLayout title="My Campaign Applications">
      {loading && <div style={{ display:'flex',justifyContent:'center',padding:48 }}><Spinner size={28}/></div>}

      {!loading && apps.length === 0 && (
        <Card style={{ textAlign:'center',padding:'56px 24px' }}>
          <div style={{ fontSize:40,marginBottom:12 }}>🎯</div>
          <h2 style={{ fontSize:16,fontWeight:600,marginBottom:8 }}>No applications yet</h2>
          <p style={{ fontSize:14,color:'var(--text-secondary)',marginBottom:20 }}>
            You haven't applied as a candidate in any election.
          </p>
          <Button onClick={() => navigate('/elections')}>Browse elections</Button>
        </Card>
      )}

      {apps.map(app => {
        const as = APPLICATION_STATUS_LABEL[app.status];
        const es = ELECTION_STATUS_LABEL[app.election_status];
        return (
          <Card key={app.id} style={{ marginBottom:14 }}>
            <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,marginBottom:10 }}>
              <div>
                <div style={{ fontSize:15,fontWeight:600,marginBottom:3 }}>{app.election_title}</div>
                <div style={{ fontSize:12,color:'var(--text-secondary)' }}>
                  Applied {new Date(app.applied_at).toLocaleDateString('en-IN')}
                </div>
              </div>
              <div style={{ display:'flex',flexDirection:'column',gap:5,alignItems:'flex-end' }}>
                <Badge color={as?.color} bg={as?.bg}>{as?.label}</Badge>
                <Badge color={es?.color} bg={es?.bg}>{es?.label}</Badge>
              </div>
            </div>

            {app.status === 'rejected' && app.admin_note && (
              <div style={{ background:'var(--danger-bg)',border:'1px solid #F09595',borderRadius:'var(--r-sm)',
                padding:'10px 14px',fontSize:13,color:'var(--danger-text)',marginBottom:10 }}>
                <strong>Committee note:</strong> {app.admin_note}
              </div>
            )}
            {app.status === 'approved' && (
              <div style={{ background:'var(--success-bg)',border:'1px solid #9FE1CB',borderRadius:'var(--r-sm)',
                padding:'10px 14px',fontSize:13,color:'var(--success-text)',marginBottom:10 }}>
                ✅ You are an approved candidate. Your profile is visible to all students.
              </div>
            )}

            <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
              <Button size="xs" variant="secondary"
                onClick={() => navigate(`/elections/${app.election_id}`)}>View election</Button>
              {app.status === 'approved' && (
                <Button size="xs" variant="secondary"
                  onClick={() => navigate(`/candidates/${app.id}`)}>My public profile</Button>
              )}
              {app.status === 'approved' && app.election_status === 'ended' && (
                <Button size="xs" variant="secondary"
                  onClick={() => navigate(`/elections/${app.election_id}/results`)}>View results</Button>
              )}
            </div>
          </Card>
        );
      })}
    </VoterLayout>
  );
}

// ─── ProfilePageSync ──────────────────────────────────────────────────────────
export function ProfilePageSync() {
  const { data, loading, refetch } = useFetch('/auth/me');
  const user = data?.user;
  const [editing, setEditing] = React.useState(false);
  const [form,    setForm]    = React.useState({});
  const [saving,  setSaving]  = React.useState(false);
  const [msg,     setMsg]     = React.useState('');

  React.useEffect(() => {
    if (user) setForm({
      full_name: user.full_name || '',
      phone: user.phone || '',
      hostel_day: user.hostel_day || '',
      gender: user.gender || '',
    });
  }, [user]);

  async function save() {
    setSaving(true); setMsg('');
    try {
      await apiMod.put('/auth/profile', form);
      await refetch();
      setEditing(false);
      setMsg('Profile updated successfully!');
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setMsg('Update failed. Try again.');
    } finally { setSaving(false); }
  }

  if (loading) return (
    <VoterLayout title="My Profile">
      <div style={{ display:'flex',justifyContent:'center',padding:64 }}>
        <Spinner size={28}/>
      </div>
    </VoterLayout>
  );

  return (
    <VoterLayout title="My Profile">
      {msg && <Banner variant={msg.includes('failed') ? 'danger' : 'success'}>{msg}</Banner>}
      <div style={{ display:'grid',gridTemplateColumns:'280px 1fr',gap:20,alignItems:'start' }}>
        {/* Left panel */}
        <Card style={{ textAlign:'center',padding:28 }}>
          <Avatar name={user?.full_name || 'U'} size={88} style={{ margin:'0 auto 14px' }} />
          <div style={{ fontSize:16,fontWeight:600,marginBottom:4 }}>{user?.full_name}</div>
          <div style={{ fontSize:12,color:'var(--text-secondary)',marginBottom:8 }}>{user?.email}</div>
          <Badge color="#1a3a5c" bg="#EEF4FB">{user?.role?.toUpperCase()}</Badge>
          <Divider />
          <div style={{ fontSize:12,color:'var(--text-secondary)',textAlign:'left' }}>
            <div style={{ marginBottom:6 }}><strong>Department:</strong><br/>{user?.department || '—'}</div>
            <div style={{ marginBottom:6 }}><strong>Year:</strong> {user?.year || '—'}</div>
            <div style={{ marginBottom:6 }}><strong>Roll No:</strong> {user?.roll_number || '—'}</div>
            <div style={{ marginBottom:6 }}><strong>Degree:</strong> {user?.degree || '—'}</div>
            <div><strong>Member since:</strong> {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN') : '—'}</div>
          </div>
        </Card>

        {/* Right panel */}
        <Card>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
            <h2 style={{ fontSize:16,fontWeight:600 }}>Personal Information</h2>
            {!editing && <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>Edit</Button>}
          </div>
          {editing ? (
            <>
              <Input label="Full name" value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
              <Input label="Phone number" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="10-digit number" />
              <Select label="Gender" value={form.gender}
                onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                <option value="">Select</option>
                {GENDERS.map(g => <option key={g}>{g}</option>)}
              </Select>
              <Select label="Accommodation" value={form.hostel_day}
                onChange={e => setForm(f => ({ ...f, hostel_day: e.target.value }))}>
                <option value="">Select</option>
                {HOSTEL_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </Select>
              <div style={{ display:'flex',gap:10 }}>
                <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
                <Button loading={saving} onClick={save}>Save changes</Button>
              </div>
            </>
          ) : (
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,fontSize:14 }}>
              {[
                ['Full name', user?.full_name],
                ['Email', user?.email],
                ['Phone', user?.phone || '—'],
                ['Gender', user?.gender || '—'],
                ['Accommodation', user?.hostel_day || '—'],
                ['Roll number', user?.roll_number || '—'],
                ['Department', user?.department || '—'],
                ['Year', user?.year || '—'],
                ['Degree', user?.degree || '—'],
              ].map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize:11,fontWeight:500,color:'var(--text-hint)',
                    textTransform:'uppercase',letterSpacing:'.04em',marginBottom:3 }}>{label}</div>
                  <div style={{ fontWeight:500 }}>{val}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </VoterLayout>
  );
}

// ─── VerifyVotePage.jsx ───────────────────────────────────────────────────────
export function VerifyVotePage() {
  const [hash,    setHash]    = React.useState('');
  const [result,  setResult]  = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  async function verify() {
    if (!hash.trim()) return;
    setLoading(true); setResult(null);
    try {
      const res = await apiMod.get(`/votes/verify/${hash.trim()}`);
      setResult(res.data);
    } catch {
      setResult({ success: false, found: false });
    } finally { setLoading(false); }
  }

  return (
    <VoterLayout title="Verify My Vote" narrow>
      <Card style={{ maxWidth:520 }}>
        <p style={{ fontSize:14,color:'var(--text-secondary)',lineHeight:1.7,marginBottom:20 }}>
          Enter the vote receipt hash from your confirmation email to verify that your vote was counted in the system.
          This does not reveal who you voted for.
        </p>
        <Input label="Vote receipt hash" value={hash} onChange={e => setHash(e.target.value)}
          placeholder="Paste your 64-character hash here" />
        <Button loading={loading} onClick={verify}>Verify</Button>

        {result && (
          <div style={{ marginTop:20 }}>
            {result.found
              ? <Banner variant="success">
                  ✅ Vote verified! Your vote in <strong>{result.vote?.election_title}</strong> was recorded
                  on {new Date(result.vote?.voted_at).toLocaleString('en-IN')}.
                  {result.vote?.is_nota ? ' (NOTA)' : ''}
                </Banner>
              : <Banner variant="danger">❌ No vote found with this hash. Check if you copied it correctly.</Banner>}
          </div>
        )}
      </Card>
    </VoterLayout>
  );
}