import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFetch } from '../../hooks/index.js';
import { joinElection, getSocket } from '../../services/socket.js';
import { VoterLayout } from '../../components/layout/Layouts.jsx';
import { Card, Badge, ProgressBar, Avatar, Spinner, Banner, Button } from '../../components/ui/index.jsx';
import { ELECTION_STATUS_LABEL } from '../../utils/constants.js';

export default function ResultsPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { data: elData } = useFetch(`/elections/${id}`);
  const { data: resData, loading, error } = useFetch(`/elections/${id}/results`);
  const [live, setLive] = useState(null);

  useEffect(() => {
    joinElection(id);
    const socket = getSocket();
    socket.on('vote_update', data => {
      if (String(data.electionId) === String(id)) setLive(data);
    });
    return () => socket.off('vote_update');
  }, [id]);

  const election    = elData?.election;
  const results     = live?.counts || resData?.results || [];
  const totalVotes  = live?.totalVotes  ?? resData?.totalVotes  ?? 0;
  const notaCount   = live?.nota_count  ?? resData?.nota_count  ?? 0;
  const notaPct     = live?.nota_percent ?? resData?.nota_percent ?? 0;
  const turnout     = live?.turnoutPercent ?? resData?.turnoutPercent ?? 0;
  const eligible    = resData?.totalEligible ?? 0;
  const isLive      = election?.status === 'live';
  const s           = ELECTION_STATUS_LABEL[election?.status] || ELECTION_STATUS_LABEL.ended;

  return (
    <VoterLayout>
      <button onClick={() => navigate(`/elections/${id}`)}
        style={{ display:'inline-flex',alignItems:'center',gap:4,fontSize:13,color:'var(--text-secondary)',
          background:'none',border:'none',cursor:'pointer',marginBottom:20 }}>
        ← Back to election
      </button>

      {/* Header */}
      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,marginBottom:6,flexWrap:'wrap' }}>
        <div>
          <h1 style={{ fontSize:22,fontWeight:700,marginBottom:4 }}>{election?.title || 'Results'}</h1>
          <p style={{ fontSize:13,color:'var(--text-secondary)' }}>
            {election?.election_type || 'Election'} · MSEC
          </p>
        </div>
        <Badge color={s.color} bg={s.bg} dot={isLive?'pulse':undefined} style={{ fontSize:12 }}>
          {isLive ? 'LIVE RESULTS' : 'FINAL RESULTS'}
        </Badge>
      </div>
      <p style={{ fontSize:12,color:'var(--text-hint)',marginBottom:24 }}>
        {isLive ? 'Updates in real time as votes are cast' :
          `Ended ${new Date(election?.end_time).toLocaleString('en-IN')}`}
      </p>

      {error && <Banner variant="danger">{error}</Banner>}

      {loading && <div style={{ display:'flex',justifyContent:'center',padding:64 }}><Spinner size={28}/></div>}

      {!loading && (
        <>
          {/* Summary stats */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:24 }}>
            {[
              { label:'Total votes', value: totalVotes.toLocaleString(), color:'var(--primary)' },
              { label:'Eligible voters', value: eligible.toLocaleString() },
              { label:'Voter turnout', value:`${turnout}%`, color:'#D97706' },
              { label:'Candidates', value: results.length },
            ].map(s => (
              <Card key={s.label} style={{ textAlign:'center', padding:'16px' }}>
                <div style={{ fontSize:28,fontWeight:700,color:s.color||'var(--text-primary)',marginBottom:4 }}>{s.value}</div>
                <div style={{ fontSize:12,color:'var(--text-secondary)' }}>{s.label}</div>
              </Card>
            ))}
          </div>

          {/* Result bars */}
          {results.map((c, i) => {
            const leading  = i === 0 && results.length > 1;
            const voteCount = c.vote_count ?? 0;
            const pct       = totalVotes > 0 ? Math.round(voteCount/totalVotes*100) : 0;
            return (
              <div key={c.id} style={{ background:'#fff',
                border:`1px solid ${leading?'var(--primary)':'var(--border-subtle)'}`,
                borderRadius:'var(--r-md)',padding:'14px 18px',marginBottom:10,
                background: leading?'var(--primary-light)':'#fff',
                display:'flex',alignItems:'center',gap:14 }}>
                <div style={{ width:28,height:28,borderRadius:'50%',
                  background: leading?'var(--primary)':'var(--bg-surface)',
                  color: leading?'#fff':'var(--text-secondary)',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:13,fontWeight:600,flexShrink:0 }}>{i+1}</div>
                <Avatar name={c.full_name} size={40} src={c.photo_url||null} />
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:5,flexWrap:'wrap' }}>
                    <span style={{ fontSize:14,fontWeight:600 }}>{c.full_name}</span>
                    <span style={{ fontSize:12,color:'var(--text-secondary)' }}>
                      {c.party_name || 'Independent'} · {c.department}
                    </span>
                    {leading && <Badge color="#085041" bg="#E1F5EE" style={{ marginLeft:'auto' }}>🏆 Leading</Badge>}
                  </div>
                  <ProgressBar value={pct} height={7} color={leading?'var(--primary)':'#6B9EC3'} />
                </div>
                <div style={{ textAlign:'right',flexShrink:0,minWidth:70 }}>
                  <div style={{ fontSize:16,fontWeight:700 }}>{voteCount.toLocaleString()}</div>
                  <div style={{ fontSize:12,color:'var(--text-secondary)' }}>{pct}%</div>
                </div>
              </div>
            );
          })}

          {/* NOTA row */}
          {notaCount > 0 && (
            <div style={{ background:'#fff',border:'1px solid var(--border-subtle)',borderRadius:'var(--r-md)',
              padding:'14px 18px',marginBottom:10,display:'flex',alignItems:'center',gap:14 }}>
              <div style={{ width:28,height:28,borderRadius:'50%',background:'#FCEBEB',
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0 }}>🚫</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14,fontWeight:600,marginBottom:5 }}>NOTA — None of the above</div>
                <ProgressBar value={notaPct} height={7} color="#DC2626" />
              </div>
              <div style={{ textAlign:'right',flexShrink:0,minWidth:70 }}>
                <div style={{ fontSize:16,fontWeight:700 }}>{notaCount.toLocaleString()}</div>
                <div style={{ fontSize:12,color:'var(--text-secondary)' }}>{notaPct}%</div>
              </div>
            </div>
          )}

          {results.length === 0 && !loading && (
            <Card style={{ textAlign:'center',padding:'40px 24px' }}>
              <div style={{ fontSize:13,color:'var(--text-secondary)' }}>No votes recorded yet.</div>
            </Card>
          )}

          {/* Vote receipt verify */}
          <Card style={{ marginTop:24 }}>
            <div style={{ fontSize:14,fontWeight:600,marginBottom:8 }}>Verify your vote</div>
            <p style={{ fontSize:13,color:'var(--text-secondary)',marginBottom:12 }}>
              Enter the receipt hash from your confirmation email to verify your vote was counted.
            </p>
            <Button variant="secondary" size="sm" onClick={() => navigate('/verify-vote')}>
              Verify vote hash →
            </Button>
          </Card>
        </>
      )}
    </VoterLayout>
  );
}
