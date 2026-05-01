import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api.js';
import { useFetch, useForm } from '../../hooks/index.js';
import AdminLayout from '../../components/layout/AdminLayout.jsx';
import { Card, Badge, ProgressBar, Banner, Button, Input, Select, Toggle, Spinner, Divider } from '../../components/ui/index.jsx';
import { ELECTION_STATUS_LABEL, DEPARTMENTS, YEARS } from '../../utils/constants.js';

// ── Elections list ─────────────────────────────────────────────────────────────
export function AdminElectionsPage() {
  const navigate = useNavigate();
  const { data, loading, refetch } = useFetch('/elections/admin/all');
  const [search, setSearch]  = useState('');
  const [status, setStatus]  = useState('all');
  const elections = (data?.elections || []).filter(e => {
    const ms = !search || e.title.toLowerCase().includes(search.toLowerCase());
    const mt = status === 'all' || e.status === status;
    return ms && mt;
  });

  async function handlePublish(e) {
    const newStatus = new Date(e.start_time) > new Date() ? 'upcoming' : 'live';
    try { await api.put(`/elections/${e.id}`, { status: newStatus }); refetch(); }
    catch (err) { alert(err.response?.data?.message || 'Failed'); }
  }

  async function handleCancel(e) {
    if (!window.confirm(`Cancel "${e.title}"?`)) return;
    try { await api.delete(`/elections/${e.id}`); refetch(); }
    catch (err) { alert('Failed to cancel'); }
  }

  return (
    <AdminLayout title="Elections"
      actions={<Button size="sm" onClick={() => navigate('/admin/elections/create')}>+ Create Election</Button>}>
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search elections..."
          style={{ flex:1, minWidth:220, height:44, border:'1px solid #D3D1C7', borderRadius:'var(--r-sm)',
            padding:'0 14px', fontSize:14, background:'#fff', color:'var(--text-primary)' }} />
        {['all','draft','upcoming','live','ended'].map(s => (
          <button key={s} onClick={() => setStatus(s)}
            style={{ height:44, padding:'0 16px', borderRadius:'var(--r-sm)', fontSize:13, fontWeight:500,
              border: status===s ? '2px solid var(--primary)' : '1px solid #D3D1C7',
              background: status===s ? 'var(--primary-light)' : '#fff',
              color: status===s ? 'var(--primary)' : 'var(--text-secondary)', cursor:'pointer',
              textTransform:'capitalize' }}>
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      {loading && <div style={{ display:'flex',justifyContent:'center',padding:48 }}><Spinner size={28}/></div>}

      {!loading && elections.length === 0 && (
        <Card style={{ textAlign:'center',padding:'56px 24px' }}>
          <div style={{ fontSize:40,marginBottom:12 }}>🗳️</div>
          <h2 style={{ fontSize:16,fontWeight:600,marginBottom:8 }}>
            {search||status!=='all' ? 'No elections match your filter' : 'No elections yet'}
          </h2>
          {!search && status==='all' && (
            <Button onClick={() => navigate('/admin/elections/create')}>+ Create first election</Button>
          )}
        </Card>
      )}

      {elections.map(e => {
        const s = ELECTION_STATUS_LABEL[e.status] || {};
        const turnout = e.voter_count > 0 ? Math.round(e.voted_count/e.voter_count*100) : 0;
        return (
          <Card key={e.id} style={{ marginBottom:12 }}>
            <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,marginBottom:10 }}>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:15,fontWeight:600,marginBottom:2 }}>{e.title}</div>
                <div style={{ fontSize:12,color:'var(--text-secondary)' }}>
                  {e.election_type||'General'} · Created by {e.created_by_name}
                </div>
              </div>
              <div style={{ display:'flex',gap:6,alignItems:'center' }}>
                {e.pending_count > 0 && (
                  <Badge color="#7a4f00" bg="#FDF3E0">{e.pending_count} pending</Badge>
                )}
                <Badge color={s.color} bg={s.bg} dot={e.status==='live'?'pulse':undefined}>{s.label}</Badge>
              </div>
            </div>

            <div style={{ display:'flex',gap:20,fontSize:12,color:'var(--text-secondary)',marginBottom:10,flexWrap:'wrap' }}>
              <span>📅 {new Date(e.start_time).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})} → {new Date(e.end_time).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})}</span>
              <span>👥 {(e.voter_count||0).toLocaleString()} voters</span>
              <span>🙋 {e.candidate_count} candidates</span>
            </div>

            {e.status !== 'draft' && e.status !== 'upcoming' && (
              <div style={{ marginBottom:12 }}>
                <div style={{ display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--text-hint)',marginBottom:4 }}>
                  <span>Turnout</span><span style={{ fontWeight:500,color:'var(--text-primary)' }}>{turnout}% ({e.voted_count||0} votes)</span>
                </div>
                <ProgressBar value={turnout} height={6} />
              </div>
            )}

            <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
              <Button size="xs" variant="secondary" onClick={() => navigate(`/admin/elections/${e.id}/candidates`)}>
                Candidates
              </Button>
              <Button size="xs" variant="secondary" onClick={() => navigate(`/admin/elections/${e.id}/voters`)}>
                Voters
              </Button>
              <Button size="xs" variant="secondary" onClick={() => navigate(`/admin/elections/${e.id}/results`)}>
                Results
              </Button>
              <Button size="xs" variant="secondary" onClick={() => navigate(`/admin/elections/${e.id}/edit`)}>
                Edit
              </Button>
              {e.status === 'draft' && (
                <Button size="xs" onClick={() => handlePublish(e)}>Publish</Button>
              )}
              {['draft','upcoming'].includes(e.status) && (
                <button onClick={() => handleCancel(e)}
                  style={{ fontSize:12,color:'#DC2626',background:'none',border:'none',cursor:'pointer',padding:'5px 8px' }}>
                  Cancel
                </button>
              )}
            </div>
          </Card>
        );
      })}
      {!loading && elections.length > 0 && (
        <div style={{ fontSize:12,color:'var(--text-hint)',marginTop:8 }}>
          {elections.length} election{elections.length!==1?'s':''}
        </div>
      )}
    </AdminLayout>
  );
}

// ── Create / Edit election ─────────────────────────────────────────────────────
export function CreateElectionPage() {
  const navigate   = useNavigate();
  const { id }     = useParams();
  const isEdit     = Boolean(id);
  const { data }   = useFetch(isEdit ? `/elections/${id}` : null);

  const [form, setForm] = useState({
    title:'', description:'', election_type:'',
    start_time:'', end_time:'',
    candidate_apply_start:'', candidate_apply_end:'',
    eligible_departments:'ALL', eligible_years:'ALL',
    allow_nota: true, results_visible_after:'ended',
    status:'draft',
  });
  const [deptMode, setDeptMode] = useState('ALL'); // 'ALL' | 'select'
  const [yearMode, setYearMode] = useState('ALL');
  const [selDepts, setSelDepts] = useState([]);
  const [selYears, setSelYears] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  React.useEffect(() => {
    if (data?.election) {
      const e = data.election;
      setForm({
        title:                   e.title||'',
        description:             e.description||'',
        election_type:           e.election_type||'',
        start_time:              e.start_time?.slice(0,16)||'',
        end_time:                e.end_time?.slice(0,16)||'',
        candidate_apply_start:   e.candidate_apply_start?.slice(0,16)||'',
        candidate_apply_end:     e.candidate_apply_end?.slice(0,16)||'',
        eligible_departments:    e.eligible_departments||'ALL',
        eligible_years:          e.eligible_years||'ALL',
        allow_nota:              Boolean(e.allow_nota),
        results_visible_after:   e.results_visible_after||'ended',
        status:                  e.status||'draft',
      });
    }
  }, [data]);

  function change(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); }

  function toggleDept(d) { setSelDepts(s => s.includes(d) ? s.filter(x=>x!==d) : [...s,d]); }
  function toggleYear(y) { setSelYears(s => s.includes(y) ? s.filter(x=>x!==y) : [...s,y]); }

  async function submit(action) {
    if (!form.title||!form.start_time||!form.end_time) {
      setError('Title, start time and end time are required'); return;
    }
    if (new Date(form.end_time) <= new Date(form.start_time)) {
      setError('End time must be after start time'); return;
    }
    setLoading(true); setError('');
    try {
      const payload = {
        ...form,
        eligible_departments: deptMode==='ALL' ? 'ALL' : JSON.stringify(selDepts),
        eligible_years:       yearMode==='ALL' ? 'ALL' : JSON.stringify(selYears),
        status: action==='draft' ? 'draft'
              : new Date(form.start_time) > new Date() ? 'upcoming' : 'live',
      };
      if (isEdit) {
        await api.put(`/elections/${id}`, payload);
        navigate('/admin/elections');
      } else {
        const res = await api.post('/elections', payload);
        navigate(`/admin/elections/${res.data.electionId}/candidates`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save election');
    } finally { setLoading(false); }
  }

  const duration = form.start_time && form.end_time
    ? (() => { const d=new Date(form.end_time)-new Date(form.start_time); if(d<=0)return null;
        const h=Math.floor(d/3600000),m=Math.floor((d%3600000)/60000); return `${h}h ${m}m`; })()
    : null;

  return (
    <AdminLayout title={isEdit ? 'Edit Election' : 'Create Election'}>
      <button onClick={() => navigate('/admin/elections')}
        style={{ display:'inline-flex',alignItems:'center',gap:4,fontSize:13,color:'var(--text-secondary)',
          background:'none',border:'none',cursor:'pointer',marginBottom:20 }}>← Elections</button>

      <div style={{ maxWidth:760 }}>
        {error && <Banner variant="danger">{error}</Banner>}

        {/* Basic info */}
        <Card style={{ marginBottom:20 }}>
          <h2 style={{ fontSize:15,fontWeight:600,marginBottom:16 }}>Election details</h2>
          <Input label="Election title *" name="title" value={form.title} onChange={change}
            placeholder="e.g. Student Council President 2025" required />
          <Input label="Election type" name="election_type" value={form.election_type} onChange={change}
            placeholder="e.g. Student Council, Sports Secretary, Cultural Head" />
          <Input label="Description" type="textarea" name="description" value={form.description}
            onChange={change} placeholder="Describe the purpose of this election..." inputStyle={{ minHeight:90 }} />
        </Card>

        {/* Dates */}
        <Card style={{ marginBottom:20 }}>
          <h2 style={{ fontSize:15,fontWeight:600,marginBottom:16 }}>Schedule</h2>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
            <Input label="Voting opens *" type="datetime-local" name="start_time" value={form.start_time} onChange={change} required />
            <Input label="Voting closes *" type="datetime-local" name="end_time"   value={form.end_time}   onChange={change} required />
            <Input label="Application window opens" type="datetime-local" name="candidate_apply_start" value={form.candidate_apply_start} onChange={change} />
            <Input label="Application deadline"    type="datetime-local" name="candidate_apply_end"   value={form.candidate_apply_end}   onChange={change} />
          </div>
          {duration && (
            <div style={{ background:'var(--primary-light)',borderRadius:'var(--r-sm)',padding:'8px 14px',
              fontSize:13,color:'var(--primary)',display:'inline-block',marginTop:4 }}>
              Election duration: <strong>{duration}</strong>
            </div>
          )}
        </Card>

        {/* Eligibility */}
        <Card style={{ marginBottom:20 }}>
          <h2 style={{ fontSize:15,fontWeight:600,marginBottom:16 }}>Voter eligibility</h2>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:13,fontWeight:500,color:'var(--text-secondary)',display:'block',marginBottom:8 }}>
              Eligible departments
            </label>
            <div style={{ display:'flex',gap:8,marginBottom:10 }}>
              {['ALL','select'].map(m => (
                <button key={m} onClick={() => setDeptMode(m)}
                  style={{ padding:'6px 14px',borderRadius:'var(--r-sm)',fontSize:13,fontWeight:500,
                    border: deptMode===m ? '2px solid var(--primary)' : '1px solid #D3D1C7',
                    background: deptMode===m ? 'var(--primary-light)' : '#fff',
                    color: deptMode===m ? 'var(--primary)' : 'var(--text-secondary)',cursor:'pointer' }}>
                  {m==='ALL' ? 'All departments' : 'Select departments'}
                </button>
              ))}
            </div>
            {deptMode==='select' && (
              <div style={{ display:'flex',flexWrap:'wrap',gap:8 }}>
                {DEPARTMENTS.map(d => (
                  <button key={d} onClick={() => toggleDept(d)}
                    style={{ padding:'5px 12px',borderRadius:'var(--r-full)',fontSize:12,
                      border: selDepts.includes(d) ? '1.5px solid var(--primary)' : '1px solid #D3D1C7',
                      background: selDepts.includes(d) ? 'var(--primary-light)' : '#fff',
                      color: selDepts.includes(d) ? 'var(--primary)' : 'var(--text-secondary)',cursor:'pointer' }}>
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label style={{ fontSize:13,fontWeight:500,color:'var(--text-secondary)',display:'block',marginBottom:8 }}>
              Eligible years
            </label>
            <div style={{ display:'flex',gap:8,marginBottom:10 }}>
              {['ALL','select'].map(m => (
                <button key={m} onClick={() => setYearMode(m)}
                  style={{ padding:'6px 14px',borderRadius:'var(--r-sm)',fontSize:13,fontWeight:500,
                    border: yearMode===m ? '2px solid var(--primary)' : '1px solid #D3D1C7',
                    background: yearMode===m ? 'var(--primary-light)' : '#fff',
                    color: yearMode===m ? 'var(--primary)' : 'var(--text-secondary)',cursor:'pointer' }}>
                  {m==='ALL' ? 'All years' : 'Select years'}
                </button>
              ))}
            </div>
            {yearMode==='select' && (
              <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
                {YEARS.map(y => (
                  <button key={y} onClick={() => toggleYear(y)}
                    style={{ padding:'5px 12px',borderRadius:'var(--r-full)',fontSize:12,
                      border: selYears.includes(y) ? '1.5px solid var(--primary)' : '1px solid #D3D1C7',
                      background: selYears.includes(y) ? 'var(--primary-light)' : '#fff',
                      color: selYears.includes(y) ? 'var(--primary)' : 'var(--text-secondary)',cursor:'pointer' }}>
                    {y}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Options */}
        <Card style={{ marginBottom:24 }}>
          <h2 style={{ fontSize:15,fontWeight:600,marginBottom:16 }}>Ballot options</h2>
          <Toggle checked={form.allow_nota} onChange={v => setForm(f=>({...f,allow_nota:v}))}
            label="Allow NOTA (None of the above)"
            description="Students can register their dissent without voting for any candidate" />
          <div style={{ marginTop:14 }}>
            <label style={{ fontSize:13,fontWeight:500,color:'var(--text-secondary)',display:'block',marginBottom:8 }}>
              When are results visible to students?
            </label>
            <div style={{ display:'flex',gap:8 }}>
              {[['ended','After voting ends (recommended)'],['live','While voting is live']].map(([v,l]) => (
                <button key={v} onClick={() => setForm(f=>({...f,results_visible_after:v}))}
                  style={{ padding:'8px 16px',borderRadius:'var(--r-sm)',fontSize:13,
                    border: form.results_visible_after===v ? '2px solid var(--primary)' : '1px solid #D3D1C7',
                    background: form.results_visible_after===v ? 'var(--primary-light)' : '#fff',
                    color: form.results_visible_after===v ? 'var(--primary)' : 'var(--text-secondary)',cursor:'pointer' }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <div style={{ display:'flex',justifyContent:'flex-end',gap:10 }}>
          <Button variant="secondary" onClick={() => navigate('/admin/elections')}>Cancel</Button>
          <Button variant="secondary" loading={loading} onClick={() => submit('draft')}
            style={{ color:'var(--primary)',borderColor:'var(--primary)' }}>
            Save as draft
          </Button>
          <Button loading={loading} onClick={() => submit('publish')}>
            {isEdit ? 'Save changes' : 'Create & add candidates →'}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
