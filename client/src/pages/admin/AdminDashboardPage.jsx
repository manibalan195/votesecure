import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFetch } from '../../hooks/index.js';
import AdminLayout from '../../components/layout/AdminLayout.jsx';
import { StatCard, Card, Badge, ProgressBar, Spinner, Button } from '../../components/ui/index.jsx';
import { ELECTION_STATUS_LABEL } from '../../utils/constants.js';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { data: statsData } = useFetch('/admin/stats');
  const { data: elData, loading } = useFetch('/elections/admin/all');

  const stats     = statsData?.stats || {};
  const elections = elData?.elections || [];
  const recent    = elections.slice(0, 6);

  return (
    <AdminLayout title="Dashboard"
      actions={<Button size="sm" onClick={() => navigate('/admin/elections/create')}>+ Create Election</Button>}>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 }}>
        <StatCard label="Total elections"    value={stats.total_elections ?? '—'}
          sub={`${stats.live_count||0} live`} subColor="var(--primary)" />
        <StatCard label="Registered students" value={stats.total_users?.toLocaleString() ?? '—'}
          sub={`${stats.verified_users||0} verified`} />
        <StatCard label="Votes today"        value={stats.votes_today ?? '—'}
          sub="Across all elections" />
        <StatCard label="Pending applications" value={stats.pending_applications ?? '—'}
          sub="Awaiting your review" subColor={stats.pending_applications > 0 ? '#D97706' : 'var(--text-hint)'}
          style={{ cursor: stats.pending_applications > 0 ? 'pointer' : 'default',
            border: stats.pending_applications > 0 ? '1px solid #F5C885' : undefined }}
          onClick={stats.pending_applications > 0 ? () => navigate('/admin/applications') : undefined} />
      </div>

      {/* Pending applications alert */}
      {stats.pending_applications > 0 && (
        <div style={{ background:'var(--warning-bg)', border:'1px solid #F5C885',
          borderRadius:'var(--r-md)', padding:'14px 20px', marginBottom:24,
          display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:600, color:'var(--warning-text)' }}>
              ⚠️ {stats.pending_applications} candidate application{stats.pending_applications>1?'s':''} awaiting review
            </div>
            <div style={{ fontSize:12, color:'var(--warning-text)', opacity:.8, marginTop:2 }}>
              Review and approve or reject applications to let candidates appear on the ballot.
            </div>
          </div>
          <Button size="sm" variant="accent" onClick={() => navigate('/admin/applications')}>
            Review now
          </Button>
        </div>
      )}

      {/* Recent elections table */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <h2 style={{ fontSize:16, fontWeight:600 }}>Elections</h2>
        <button onClick={() => navigate('/admin/elections')}
          style={{ fontSize:13, color:'var(--primary)', background:'none', border:'none', cursor:'pointer' }}>
          View all →
        </button>
      </div>

      {loading ? <div style={{ display:'flex',justifyContent:'center',padding:40 }}><Spinner size={24}/></div> : (
        <div style={{ background:'#fff', borderRadius:'var(--r-lg)', border:'1px solid var(--border-subtle)', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'var(--bg-page)', borderBottom:'1px solid var(--border-subtle)' }}>
                {['Election','Status','Candidates','Pending','Turnout','End Date','Actions'].map(h => (
                  <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:11, fontWeight:500,
                    color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map(e => {
                const s = ELECTION_STATUS_LABEL[e.status] || {};
                const turnout = e.voter_count > 0 ? Math.round(e.voted_count/e.voter_count*100) : 0;
                return (
                  <tr key={e.id} style={{ borderBottom:'1px solid var(--bg-page)' }}>
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ fontWeight:500,marginBottom:2 }}>{e.title}</div>
                      <div style={{ fontSize:11,color:'var(--text-hint)' }}>{e.election_type||'General'}</div>
                    </td>
                    <td style={{ padding:'0 16px' }}>
                      <Badge color={s.color} bg={s.bg} dot={e.status==='live'?'pulse':undefined}>
                        {s.label}
                      </Badge>
                    </td>
                    <td style={{ padding:'0 16px', color:'var(--text-secondary)' }}>{e.candidate_count}</td>
                    <td style={{ padding:'0 16px' }}>
                      {e.pending_count > 0
                        ? <span style={{ color:'#D97706',fontWeight:600 }}>{e.pending_count} pending</span>
                        : <span style={{ color:'var(--text-hint)' }}>—</span>}
                    </td>
                    <td style={{ padding:'0 16px', minWidth:120 }}>
                      <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                        <div style={{ width:70 }}><ProgressBar value={turnout} height={5}/></div>
                        <span style={{ color:'var(--text-secondary)' }}>{turnout}%</span>
                      </div>
                    </td>
                    <td style={{ padding:'0 16px', color:'var(--text-secondary)' }}>
                      {new Date(e.end_time).toLocaleDateString('en-IN')}
                    </td>
                    <td style={{ padding:'0 16px' }}>
                      <div style={{ display:'flex',gap:8 }}>
                        <button onClick={() => navigate(`/admin/elections/${e.id}/candidates`)}
                          style={{ fontSize:12,color:'var(--primary)',background:'none',border:'none',cursor:'pointer' }}>
                          Candidates
                        </button>
                        <button onClick={() => navigate(`/admin/elections/${e.id}/results`)}
                          style={{ fontSize:12,color:'var(--primary)',background:'none',border:'none',cursor:'pointer' }}>
                          Results
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {elections.length === 0 && (
                <tr><td colSpan={7} style={{ padding:'48px 16px',textAlign:'center',color:'var(--text-hint)' }}>
                  No elections yet. <button onClick={() => navigate('/admin/elections/create')}
                    style={{ color:'var(--primary)',background:'none',border:'none',cursor:'pointer',fontWeight:500 }}>
                    Create the first one →
                  </button>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
