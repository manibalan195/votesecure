import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import { useFetch } from '../../hooks/index.js';
import AdminLayout from '../../components/layout/AdminLayout.jsx';
import { Card, Badge, Avatar, ProgressBar, Banner, Spinner, Button, Divider, StatCard } from '../../components/ui/index.jsx';
import { ELECTION_STATUS_LABEL, DEPARTMENTS, YEARS } from '../../utils/constants.js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { joinElection, getSocket } from '../../services/socket.js';

// ── Manage Candidates ─────────────────────────────────────────────────────────
export function ManageCandidatesPage() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { data: elData } = useFetch(`/elections/${id}`);
  const { data: cData, loading, refetch } = useFetch(`/candidates/admin/${id}?status=approved`);
  const election   = elData?.election;
  const candidates = cData?.applications || [];

  async function remove(appId, name) {
    if (!window.confirm(`Remove ${name} from ballot?`)) return;
    try { await api.put(`/candidates/admin/review/${appId}`, { status:'rejected', admin_note:'Removed by admin' }); refetch(); }
    catch { alert('Failed'); }
  }

  return (
    <AdminLayout title="Manage Candidates"
      actions={<Button size="sm" onClick={() => navigate('/admin/applications')}>Review applications</Button>}>
      {election && (
        <Card style={{ marginBottom:20,padding:'12px 20px' }}>
          <button onClick={() => navigate('/admin/elections')}
            style={{ fontSize:13,color:'var(--text-secondary)',background:'none',border:'none',cursor:'pointer',marginBottom:6,display:'block' }}>← Elections</button>
          <div style={{ display:'flex',alignItems:'center',gap:12,flexWrap:'wrap' }}>
            <span style={{ fontSize:15,fontWeight:600 }}>{election.title}</span>
            <Badge color={ELECTION_STATUS_LABEL[election.status]?.color} bg={ELECTION_STATUS_LABEL[election.status]?.bg}>
              {ELECTION_STATUS_LABEL[election.status]?.label}
            </Badge>
            <Button size="xs" variant="secondary" onClick={() => navigate(`/admin/elections/${id}/voters`)}>
              Voters
            </Button>
          </div>
        </Card>
      )}

      {loading && <div style={{ display:'flex',justifyContent:'center',padding:48 }}><Spinner size={24}/></div>}

      {candidates.length === 0 && !loading && (
        <Card style={{ textAlign:'center',padding:'48px 24px' }}>
          <div style={{ fontSize:40,marginBottom:12 }}>🙋</div>
          <h2 style={{ fontSize:16,fontWeight:600,marginBottom:8 }}>No approved candidates yet</h2>
          <p style={{ fontSize:14,color:'var(--text-secondary)',marginBottom:16 }}>
            Approve applications to add candidates to the ballot.
          </p>
          <Button onClick={() => navigate('/admin/applications')}>Review applications →</Button>
        </Card>
      )}

      {candidates.map((c, i) => (
        <Card key={c.id} style={{ display:'flex',alignItems:'center',gap:14,padding:'14px 18px',marginBottom:10 }}>
          <span style={{ color:'#C8C6BE',fontSize:18,cursor:'grab' }}>⋮⋮</span>
          <Avatar name={c.full_name} size={48} src={c.photo_url||null} />
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14,fontWeight:600 }}>{c.full_name}</div>
            <div style={{ fontSize:12,color:'var(--text-secondary)' }}>{c.party_name||'Independent'}</div>
            <div style={{ fontSize:11,color:'var(--text-hint)' }}>{c.department} · {c.year} · Roll: {c.roll_number}</div>
          </div>
          <Button size="xs" variant="secondary" onClick={() => remove(c.id, c.full_name)}
            style={{ color:'#DC2626',borderColor:'#DC2626' }}>Remove</Button>
        </Card>
      ))}
    </AdminLayout>
  );
}

// ── Manage Voters ─────────────────────────────────────────────────────────────
export function ManageVotersPage() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { data: elData } = useFetch(`/elections/${id}`);
  const { data: voterData, loading, refetch } = useFetch(`/voters/election/${id}`);
  const [email,    setEmail]    = useState('');
  const [adding,   setAdding]   = useState(false);
  const [addErr,   setAddErr]   = useState('');
  const [addOk,    setAddOk]    = useState('');
  const [search,   setSearch]   = useState('');
  const [tab,      setTab]      = useState('single');
  const [csvRes,   setCsvRes]   = useState(null);
  const [csvLoading,setCsvLoading]=useState(false);
  const [bulkLoading,setBulkLoading]=useState(false);
  const fileRef = useRef();

  const election = elData?.election;
  const voters   = voterData?.voters || [];
  const total    = voterData?.total  || 0;
  const filtered = voters.filter(v =>
    !search || [v.full_name,v.email,v.roll_number].some(f=>f?.toLowerCase().includes(search.toLowerCase()))
  );
  const votedCount = voters.filter(v=>v.has_voted).length;
  const turnout    = voters.length > 0 ? Math.round(votedCount/voters.length*100) : 0;

  async function addSingle() {
    if (!email.trim()) return;
    setAdding(true); setAddErr(''); setAddOk('');
    try {
      await api.post(`/voters/election/${id}`, { email: email.trim() });
      setAddOk(`${email} added`); setEmail(''); refetch();
    } catch (err) { setAddErr(err.response?.data?.message || 'Failed'); }
    finally { setAdding(false); }
  }

  async function bulkAdd() {
    setBulkLoading(true);
    try { const res = await api.post(`/voters/election/${id}/bulk`,{}); setAddOk(`Added ${res.data.added} voters`); refetch(); }
    catch { setAddErr('Bulk add failed'); }
    finally { setBulkLoading(false); }
  }

  async function handleCSV(e) {
    const f = e.target.files[0]; if(!f) return;
    setCsvLoading(true); setCsvRes(null);
    try {
      const fd = new FormData(); fd.append('file',f);
      const res = await api.post(`/voters/election/${id}/csv`,fd,{headers:{'Content-Type':'multipart/form-data'}});
      setCsvRes(res.data); refetch();
    } catch (err) { setCsvRes({error:err.response?.data?.message||'Upload failed'}); }
    finally { setCsvLoading(false); e.target.value=''; }
  }

  async function removeVoter(userId,name) {
    if(!window.confirm(`Remove ${name}?`)) return;
    try { await api.delete(`/voters/election/${id}/user/${userId}`); refetch(); }
    catch { alert('Failed'); }
  }

  return (
    <AdminLayout title="Manage Voters">
      {election && (
        <Card style={{ marginBottom:20,padding:'12px 20px' }}>
          <button onClick={() => navigate('/admin/elections')}
            style={{ fontSize:13,color:'var(--text-secondary)',background:'none',border:'none',cursor:'pointer',marginBottom:6,display:'block' }}>← Elections</button>
          <div style={{ display:'flex',alignItems:'center',gap:12,flexWrap:'wrap' }}>
            <span style={{ fontSize:15,fontWeight:600 }}>{election.title}</span>
            <Badge color={ELECTION_STATUS_LABEL[election.status]?.color} bg={ELECTION_STATUS_LABEL[election.status]?.bg}>
              {ELECTION_STATUS_LABEL[election.status]?.label}
            </Badge>
            <span style={{ fontSize:13,color:'var(--text-secondary)' }}>
              {total} voters · {turnout}% turnout
            </span>
          </div>
        </Card>
      )}

      <div style={{ display:'grid',gridTemplateColumns:'1fr 340px',gap:20,alignItems:'start' }}>
        {/* Table */}
        <div>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search voters..."
            style={{ width:'100%',height:44,border:'1px solid #D3D1C7',borderRadius:'var(--r-sm)',
              padding:'0 14px',fontSize:14,marginBottom:14,background:'#fff',color:'var(--text-primary)' }} />
          {loading ? <div style={{ display:'flex',justifyContent:'center',padding:40 }}><Spinner size={24}/></div> : (
            <div style={{ background:'#fff',borderRadius:'var(--r-lg)',border:'1px solid var(--border-subtle)',overflow:'hidden' }}>
              <table style={{ width:'100%',borderCollapse:'collapse',fontSize:13 }}>
                <thead>
                  <tr style={{ background:'var(--bg-page)',borderBottom:'1px solid var(--border-subtle)' }}>
                    {['Name','Roll No.','Department','Voted?',''].map(h=>(
                      <th key={h} style={{ padding:'10px 14px',textAlign:'left',fontSize:11,fontWeight:500,
                        color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(v=>(
                    <tr key={v.user_id} style={{ borderBottom:'1px solid var(--bg-page)' }}>
                      <td style={{ padding:'10px 14px' }}>
                        <div style={{ fontWeight:500 }}>{v.full_name}</div>
                        <div style={{ fontSize:11,color:'var(--text-hint)' }}>{v.email}</div>
                      </td>
                      <td style={{ padding:'0 14px' }}>{v.roll_number||'—'}</td>
                      <td style={{ padding:'0 14px',fontSize:12,color:'var(--text-secondary)' }}>{v.department||'—'}</td>
                      <td style={{ padding:'0 14px' }}>
                        {v.has_voted ? <span style={{ color:'var(--primary)',fontWeight:600 }}>✓</span> : <span style={{ color:'#D3D1C7' }}>—</span>}
                      </td>
                      <td style={{ padding:'0 14px' }}>
                        {!v.has_voted && (
                          <button onClick={()=>removeVoter(v.user_id,v.full_name)}
                            style={{ fontSize:12,color:'#DC2626',background:'none',border:'none',cursor:'pointer' }}>
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filtered.length===0 && (
                    <tr><td colSpan={5} style={{ padding:'36px 14px',textAlign:'center',color:'var(--text-hint)' }}>
                      {search ? 'No voters match.' : 'No voters added yet.'}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          <div style={{ fontSize:12,color:'var(--text-hint)',marginTop:8 }}>Showing {filtered.length} of {total}</div>
        </div>

        {/* Add panel */}
        <Card style={{ padding:0,overflow:'hidden',position:'sticky',top:130 }}>
          <div style={{ display:'flex',borderBottom:'1px solid var(--border-subtle)' }}>
            {['single','bulk','csv'].map(t=>(
              <button key={t} onClick={()=>setTab(t)}
                style={{ flex:1,padding:11,fontSize:13,fontWeight:tab===t?500:400,
                  color:tab===t?'var(--primary)':'var(--text-secondary)',
                  borderBottom:tab===t?'2px solid var(--primary)':'2px solid transparent',
                  background:'none',border:'none',cursor:'pointer',textTransform:'capitalize' }}>
                {t === 'single' ? 'Add single' : t === 'bulk' ? 'Add all' : 'CSV upload'}
              </button>
            ))}
          </div>
          <div style={{ padding:18 }}>
            {tab==='single' && (
              <>
                {addOk  && <Banner variant="success">{addOk}</Banner>}
                {addErr && <Banner variant="danger">{addErr}</Banner>}
                <div style={{ marginBottom:10 }}>
                  <label style={{ fontSize:12,fontWeight:500,color:'var(--text-secondary)',display:'block',marginBottom:5 }}>Email address</label>
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&addSingle()}
                    placeholder="student@mepcoeng.ac.in"
                    style={{ width:'100%',height:44,border:'1px solid #D3D1C7',borderRadius:'var(--r-sm)',
                      padding:'0 12px',fontSize:14,background:'#fff' }} />
                </div>
                <Button fullWidth loading={adding} onClick={addSingle}>Add voter</Button>
              </>
            )}
            {tab==='bulk' && (
              <>
                {addOk  && <Banner variant="success">{addOk}</Banner>}
                {addErr && <Banner variant="danger">{addErr}</Banner>}
                <p style={{ fontSize:13,color:'var(--text-secondary)',marginBottom:14,lineHeight:1.6 }}>
                  Add all verified students who match the election's department/year eligibility criteria.
                </p>
                <Button fullWidth loading={bulkLoading} onClick={bulkAdd}>Add all eligible students</Button>
              </>
            )}
            {tab==='csv' && (
              <>
                {csvRes && !csvRes.error && <Banner variant="success">Added {csvRes.added} · Skipped {csvRes.skipped}</Banner>}
                {csvRes?.error && <Banner variant="danger">{csvRes.error}</Banner>}
                <div onClick={()=>fileRef.current?.click()}
                  style={{ border:'1.5px dashed #D3D1C7',borderRadius:'var(--r-sm)',padding:'24px 16px',
                    textAlign:'center',cursor:'pointer',marginBottom:12 }}>
                  {csvLoading ? <Spinner size={24} style={{ margin:'0 auto' }} /> : (
                    <><div style={{ fontSize:28,marginBottom:6 }}>📄</div>
                    <div style={{ fontSize:13,fontWeight:500,marginBottom:4 }}>Drop CSV or click</div>
                    <div style={{ fontSize:11,color:'var(--text-hint)' }}>Column: email</div></>
                  )}
                </div>
                <input ref={fileRef} type="file" accept=".csv" onChange={handleCSV} style={{ display:'none' }} />
                <button onClick={()=>{
                    const b=new Blob(['email\nstudent1@mepcoeng.ac.in\nstudent2@mepcoeng.ac.in'],{type:'text/csv'});
                    const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='voters_template.csv';a.click();
                  }} style={{ fontSize:12,color:'var(--primary)',background:'none',border:'none',cursor:'pointer' }}>
                  Download template
                </button>
              </>
            )}
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}

// ── Admin Results ─────────────────────────────────────────────────────────────
export function AdminResultsPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { data: elData } = useFetch(`/elections/${id}`);
  const { data: resData, loading, refetch } = useFetch(`/elections/${id}/results`);
  const [live, setLive] = useState(null);

  React.useEffect(() => {
    joinElection(id);
    const socket = getSocket();
    socket.on('vote_update', d => { if(String(d.electionId)===String(id)) setLive(d); });
    return () => socket.off('vote_update');
  }, [id]);

  const election   = elData?.election;
  const results    = live?.counts || resData?.results || [];
  const totalVotes = live?.totalVotes ?? resData?.totalVotes ?? 0;
  const notaCount  = live?.nota_count ?? resData?.nota_count ?? 0;
  const turnout    = live?.turnoutPercent ?? resData?.turnoutPercent ?? 0;
  const eligible   = resData?.totalEligible ?? 0;
  const isLive     = election?.status === 'live';

  function exportCSV() {
    const rows = [['Rank','Candidate','Party','Department','Year','Votes','Percent']];
    results.forEach((c,i) => rows.push([i+1,c.full_name,c.party_name||'Independent',c.department,c.year,c.vote_count,`${c.percent}%`]));
    if (notaCount) rows.push(['—','NOTA','—','—','—',notaCount,`${resData?.nota_percent||0}%`]);
    const csv = rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
    a.download = `results-${id}.csv`; a.click();
  }

  return (
    <AdminLayout title="Election Results"
      actions={<div style={{ display:'flex',gap:10 }}><Button size="sm" variant="secondary" onClick={exportCSV}>Export CSV</Button><Button size="sm" onClick={refetch}>Refresh</Button></div>}>

      {election && (
        <Card style={{ marginBottom:20,padding:'12px 20px' }}>
          <button onClick={() => navigate('/admin/elections')}
            style={{ fontSize:13,color:'var(--text-secondary)',background:'none',border:'none',cursor:'pointer',marginBottom:6,display:'block' }}>← Elections</button>
          <div style={{ display:'flex',alignItems:'center',gap:12,flexWrap:'wrap' }}>
            <span style={{ fontSize:15,fontWeight:600 }}>{election.title}</span>
            <Badge color={ELECTION_STATUS_LABEL[election.status]?.color} bg={ELECTION_STATUS_LABEL[election.status]?.bg}
              dot={isLive?'pulse':undefined}>
              {isLive ? 'LIVE' : ELECTION_STATUS_LABEL[election.status]?.label}
            </Badge>
          </div>
        </Card>
      )}

      {loading && <div style={{ display:'flex',justifyContent:'center',padding:48 }}><Spinner size={28}/></div>}

      {!loading && (
        <>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:24 }}>
            <StatCard label="Total votes" value={totalVotes.toLocaleString()} />
            <StatCard label="Eligible voters" value={eligible.toLocaleString()} />
            <StatCard label="Voter turnout" value={`${turnout}%`} subColor="#D97706" />
            <StatCard label="Candidates" value={results.length} />
          </div>

          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,alignItems:'start' }}>
            <Card>
              <h3 style={{ fontSize:14,fontWeight:600,marginBottom:16 }}>Vote distribution</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={results.map(c=>({ name:(c.full_name||'').split(' ')[0], votes:c.vote_count, percent:c.percent }))}
                  margin={{ top:5,right:10,left:-10,bottom:5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1EFE8" />
                  <XAxis dataKey="name" tick={{ fontSize:11,fill:'#888780' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize:11,fill:'#888780' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius:8,border:'1px solid #E0DED6',fontSize:12 }}
                    formatter={(v,n,p)=>[`${v} votes (${p.payload.percent}%)`,p.payload.name]} />
                  <Bar dataKey="votes" fill="var(--primary)" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <h3 style={{ fontSize:14,fontWeight:600,marginBottom:14 }}>Ranked results</h3>
              {results.map((c,i) => {
                const leading = i===0 && results.length>1;
                return (
                  <div key={c.id} style={{ display:'flex',alignItems:'center',gap:10,marginBottom:14 }}>
                    <div style={{ width:26,height:26,borderRadius:'50%',flexShrink:0,
                      background:leading?'var(--primary)':'var(--bg-surface)',
                      color:leading?'#fff':'var(--text-secondary)',
                      display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:600 }}>
                      {i+1}
                    </div>
                    <Avatar name={c.full_name} size={34} src={c.photo_url||null} />
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ display:'flex',justifyContent:'space-between',fontSize:13,fontWeight:500,marginBottom:4 }}>
                        <span style={{ overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1 }}>
                          {c.full_name}
                        </span>
                        <span style={{ flexShrink:0,marginLeft:8,color:'var(--text-secondary)' }}>
                          {c.vote_count} ({c.percent}%)
                        </span>
                      </div>
                      <ProgressBar value={c.percent} height={5} color={leading?'var(--primary)':'#6B9EC3'} />
                    </div>
                  </div>
                );
              })}
              {notaCount > 0 && (
                <div style={{ display:'flex',alignItems:'center',gap:10,marginTop:8,paddingTop:8,borderTop:'1px solid var(--border-subtle)' }}>
                  <div style={{ width:26,height:26,borderRadius:'50%',background:'#FCEBEB',
                    display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,flexShrink:0 }}>🚫</div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:4 }}>
                      <span>NOTA</span>
                      <span style={{ color:'var(--text-secondary)' }}>{notaCount} ({resData?.nota_percent||0}%)</span>
                    </div>
                    <ProgressBar value={resData?.nota_percent||0} height={5} color="#DC2626" />
                  </div>
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </AdminLayout>
  );
}

// ── Users ─────────────────────────────────────────────────────────────────────
export function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [role,   setRole]   = useState('');
  const [msg,    setMsg]    = useState('');
  const url = `/admin/users?${search?`search=${encodeURIComponent(search)}&`:''}${role?`role=${role}&`:''}limit=50`;
  const { data, loading, refetch } = useFetch(url, [search,role]);
  const users = data?.users || [];

  async function toggleActive(id, name) {
    if (!window.confirm(`Toggle active status for ${name}?`)) return;
    try { await api.put(`/admin/users/${id}/toggle`); setMsg('Status updated'); refetch(); setTimeout(()=>setMsg(''),3000); }
    catch { alert('Failed'); }
  }

  return (
    <AdminLayout title="Student Users">
      {msg && <Banner variant="success">{msg}</Banner>}
      <div style={{ display:'flex',gap:12,marginBottom:16,flexWrap:'wrap' }}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Search by name, email, roll number..."
          style={{ flex:1,minWidth:220,height:44,border:'1px solid #D3D1C7',borderRadius:'var(--r-sm)',
            padding:'0 14px',fontSize:14,background:'#fff',color:'var(--text-primary)' }} />
        <select value={role} onChange={e=>setRole(e.target.value)}
          style={{ height:44,border:'1px solid #D3D1C7',borderRadius:'var(--r-sm)',padding:'0 14px',fontSize:14,background:'#fff' }}>
          <option value="">All roles</option>
          <option value="voter">Voter</option>
          <option value="candidate">Candidate</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      {loading && <div style={{ display:'flex',justifyContent:'center',padding:40 }}><Spinner size={24}/></div>}
      {!loading && (
        <div style={{ background:'#fff',borderRadius:'var(--r-lg)',border:'1px solid var(--border-subtle)',overflow:'hidden' }}>
          <table style={{ width:'100%',borderCollapse:'collapse',fontSize:13 }}>
            <thead>
              <tr style={{ background:'var(--bg-page)',borderBottom:'1px solid var(--border-subtle)' }}>
                {['Name','Roll No.','Department','Year','Role','Verified','Active',''].map(h=>(
                  <th key={h} style={{ padding:'10px 14px',textAlign:'left',fontSize:11,fontWeight:500,
                    color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u=>(
                <tr key={u.id} style={{ borderBottom:'1px solid var(--bg-page)' }}>
                  <td style={{ padding:'10px 14px' }}>
                    <div style={{ fontWeight:500 }}>{u.full_name}</div>
                    <div style={{ fontSize:11,color:'var(--text-hint)' }}>{u.email}</div>
                  </td>
                  <td style={{ padding:'0 14px' }}>{u.roll_number||'—'}</td>
                  <td style={{ padding:'0 14px',fontSize:12,color:'var(--text-secondary)' }}>{u.department||'—'}</td>
                  <td style={{ padding:'0 14px',fontSize:12 }}>{u.year||'—'}</td>
                  <td style={{ padding:'0 14px' }}>
                    <Badge color={u.role==='admin'?'#7a4f00':u.role==='candidate'?'#085041':'var(--primary)'}
                      bg={u.role==='admin'?'#FDF3E0':u.role==='candidate'?'#E1F5EE':'var(--primary-light)'}>
                      {u.role}
                    </Badge>
                  </td>
                  <td style={{ padding:'0 14px' }}>
                    {u.is_verified ? <span style={{ color:'var(--primary)',fontWeight:600 }}>✓</span> : <span style={{ color:'#D3D1C7' }}>✗</span>}
                  </td>
                  <td style={{ padding:'0 14px' }}>
                    {u.is_active ? <span style={{ color:'var(--primary)',fontWeight:600 }}>✓</span> : <span style={{ color:'#DC2626' }}>✗</span>}
                  </td>
                  <td style={{ padding:'0 14px' }}>
                    <button onClick={()=>toggleActive(u.id,u.full_name)}
                      style={{ fontSize:12,color:'var(--primary)',background:'none',border:'none',cursor:'pointer' }}>
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
              {users.length===0 && (
                <tr><td colSpan={8} style={{ padding:'36px',textAlign:'center',color:'var(--text-hint)' }}>No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ fontSize:12,color:'var(--text-hint)',marginTop:8 }}>{data?.total||0} total users</div>
    </AdminLayout>
  );
}

// ── Audit Log ─────────────────────────────────────────────────────────────────
export function AuditLogPage() {
  const [type, setType] = useState('');
  const url = `/admin/audit-log?${type?`event_type=${type}&`:''}limit=100`;
  const { data, loading } = useFetch(url, [type]);
  const log = data?.log || [];
  const typeMap = {
    vote_cast:         { bg:'#E1F5EE',color:'#085041' },
    register:          { bg:'var(--primary-light)',color:'var(--primary)' },
    login:             { bg:'var(--bg-surface)',color:'var(--text-secondary)' },
    candidate_applied: { bg:'#FDF3E0',color:'#7a4f00' },
    candidate_approved:{ bg:'#E1F5EE',color:'#085041' },
    candidate_rejected:{ bg:'#FCEBEB',color:'#791F1F' },
    election_created:  { bg:'var(--primary-light)',color:'var(--primary)' },
    election_updated:  { bg:'#FDF3E0',color:'#7a4f00' },
    email_verified:    { bg:'#E1F5EE',color:'#085041' },
  };

  function exportCSV() {
    const rows=[['Time','Event','Election','User','IP','Details']];
    log.forEach(e=>rows.push([new Date(e.created_at).toISOString(),e.event_type,e.election_id||'',e.full_name||e.user_id||'',e.ip_address||'',JSON.stringify(e.details||{})]));
    const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='audit-log.csv';a.click();
  }

  return (
    <AdminLayout title="Audit Log" actions={<Button size="sm" variant="secondary" onClick={exportCSV}>Export CSV</Button>}>
      <div style={{ display:'flex',gap:12,marginBottom:16,flexWrap:'wrap' }}>
        <select value={type} onChange={e=>setType(e.target.value)}
          style={{ height:44,border:'1px solid #D3D1C7',borderRadius:'var(--r-sm)',padding:'0 14px',fontSize:14,background:'#fff' }}>
          <option value="">All events</option>
          {Object.keys(typeMap).map(k=><option key={k} value={k}>{k}</option>)}
        </select>
      </div>
      {loading && <div style={{ display:'flex',justifyContent:'center',padding:40 }}><Spinner size={24}/></div>}
      {!loading && (
        <div style={{ background:'#fff',borderRadius:'var(--r-lg)',border:'1px solid var(--border-subtle)',overflow:'hidden' }}>
          <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
            <thead>
              <tr style={{ background:'var(--bg-page)',borderBottom:'1px solid var(--border-subtle)' }}>
                {['Timestamp','Event','User','Election','IP','Details'].map(h=>(
                  <th key={h} style={{ padding:'10px 14px',textAlign:'left',fontSize:10,fontWeight:500,
                    color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {log.map(e=>{
                const s=typeMap[e.event_type]||{bg:'var(--bg-surface)',color:'var(--text-secondary)'};
                return (
                  <tr key={e.id} style={{ borderBottom:'1px solid var(--bg-page)' }}>
                    <td style={{ padding:'10px 14px',whiteSpace:'nowrap',color:'var(--text-secondary)' }}>
                      {new Date(e.created_at).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding:'0 14px' }}>
                      <span style={{ background:s.bg,color:s.color,padding:'2px 8px',borderRadius:'var(--r-full)',
                        fontSize:10,fontWeight:600 }}>{e.event_type}</span>
                    </td>
                    <td style={{ padding:'0 14px',color:'var(--text-secondary)' }}>{e.full_name||e.user_id||'—'}</td>
                    <td style={{ padding:'0 14px',color:'var(--text-secondary)' }}>{e.election_id||'—'}</td>
                    <td style={{ padding:'0 14px',fontFamily:'monospace' }}>{e.ip_address||'—'}</td>
                    <td style={{ padding:'0 14px',maxWidth:200 }}>
                      <code style={{ fontSize:10,color:'var(--text-hint)',background:'var(--bg-page)',
                        padding:'2px 6px',borderRadius:3,display:'block',overflow:'hidden',
                        textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                        {JSON.stringify(e.details||{})}
                      </code>
                    </td>
                  </tr>
                );
              })}
              {log.length===0&&<tr><td colSpan={6} style={{ padding:'36px',textAlign:'center',color:'var(--text-hint)' }}>No log entries.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ fontSize:12,color:'var(--text-hint)',marginTop:8 }}>{data?.total||0} total entries</div>
    </AdminLayout>
  );
}
