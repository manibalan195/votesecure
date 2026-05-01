// ─── ElectionDetailPage.jsx ───────────────────────────────────────────────────
import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useFetch } from '../../hooks/index.js';
import { VoterLayout } from '../../components/layout/Layouts.jsx';
import { Card, Badge, Divider, Avatar, Spinner, Button } from '../../components/ui/index.jsx';
import { ELECTION_STATUS_LABEL } from '../../utils/constants.js';

export function ElectionDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { data: elData, loading } = useFetch(`/elections/${id}`);
  const { data: cData }           = useFetch(`/candidates/election/${id}`);

  const election   = elData?.election;
  const candidates = cData?.candidates || [];
  const s          = ELECTION_STATUS_LABEL[election?.status] || {};

  if (loading) return <VoterLayout narrow><div style={{ display:'flex',justifyContent:'center',padding:64 }}><Spinner size={28}/></div></VoterLayout>;

  return (
    <VoterLayout narrow>
      <button onClick={() => navigate('/dashboard')}
        style={{ display:'inline-flex',alignItems:'center',gap:4,fontSize:13,color:'var(--text-secondary)',
          background:'none',border:'none',cursor:'pointer',marginBottom:20 }}>← Dashboard</button>

      {election && (
        <>
          <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,marginBottom:12 }}>
            <h1 style={{ fontSize:22,fontWeight:700 }}>{election.title}</h1>
            <Badge color={s.color} bg={s.bg} dot={election.status==='live'?'pulse':undefined} style={{ flexShrink:0 }}>
              {s.label}
            </Badge>
          </div>

          {election.description && (
            <p style={{ fontSize:14,color:'var(--text-secondary)',lineHeight:1.8,marginBottom:20 }}>
              {election.description}
            </p>
          )}

          <Card style={{ marginBottom:20 }}>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,fontSize:13 }}>
              <div><div style={{ color:'var(--text-hint)',fontSize:11,marginBottom:3 }}>VOTING OPENS</div>
                <strong>{new Date(election.start_time).toLocaleString('en-IN')}</strong></div>
              <div><div style={{ color:'var(--text-hint)',fontSize:11,marginBottom:3 }}>VOTING CLOSES</div>
                <strong>{new Date(election.end_time).toLocaleString('en-IN')}</strong></div>
              {election.candidate_apply_end && (
                <div><div style={{ color:'var(--text-hint)',fontSize:11,marginBottom:3 }}>APPLICATION DEADLINE</div>
                  <strong>{new Date(election.candidate_apply_end).toLocaleString('en-IN')}</strong></div>
              )}
              <div><div style={{ color:'var(--text-hint)',fontSize:11,marginBottom:3 }}>CANDIDATES</div>
                <strong>{candidates.length}</strong></div>
            </div>
          </Card>

          {/* Actions */}
          <div style={{ display:'flex',gap:10,marginBottom:24,flexWrap:'wrap' }}>
            {election.status === 'live' && !election.my_has_voted && (
              <Button onClick={() => navigate(`/elections/${id}/vote`)}>🗳️ Vote now</Button>
            )}
            {(election.status === 'ended' || (election.status === 'live' && election.my_has_voted)) && (
              <Button variant="secondary" onClick={() => navigate(`/elections/${id}/results`)}>View results</Button>
            )}
            {!election.my_application_status && election.candidate_apply_end &&
              new Date() < new Date(election.candidate_apply_end) && election.status !== 'ended' && (
              <Button variant="secondary" onClick={() => navigate(`/elections/${id}/apply`)}>
                Apply as candidate
              </Button>
            )}
          </div>

          <Divider />

          {/* Candidates */}
          <h2 style={{ fontSize:16,fontWeight:600,marginBottom:14 }}>Candidates ({candidates.length})</h2>
          {candidates.length === 0 && (
            <p style={{ fontSize:13,color:'var(--text-hint)' }}>No approved candidates yet.</p>
          )}
          {candidates.map(c => (
            <div key={c.id} style={{ display:'flex',alignItems:'center',gap:14,padding:'12px 16px',
              background:'#fff',border:'1px solid var(--border-subtle)',borderRadius:'var(--r-md)',marginBottom:10 }}>
              <Avatar name={c.full_name} size={48} src={c.photo_url||null} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14,fontWeight:600 }}>{c.full_name}</div>
                <div style={{ fontSize:12,color:'var(--text-secondary)' }}>{c.party_name||'Independent'} · {c.department}</div>
              </div>
              <Link to={`/candidates/${c.id}`}
                style={{ fontSize:12,color:'var(--primary)',fontWeight:500 }}>View profile →</Link>
            </div>
          ))}
        </>
      )}
    </VoterLayout>
  );
}

// ─── CandidateProfilePage.jsx ─────────────────────────────────────────────────
export function CandidateProfilePage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { data, loading } = useFetch(`/candidates/profile/${id}`);
  const c = data?.candidate;

  return (
    <VoterLayout narrow>
      <button onClick={() => navigate(-1)}
        style={{ display:'inline-flex',alignItems:'center',gap:4,fontSize:13,color:'var(--text-secondary)',
          background:'none',border:'none',cursor:'pointer',marginBottom:20 }}>← Back</button>
      {loading && <div style={{ display:'flex',justifyContent:'center',padding:64 }}><Spinner size={28}/></div>}
      {c && (
        <Card style={{ padding:32 }}>
          <div style={{ textAlign:'center',marginBottom:24 }}>
            <Avatar name={c.full_name} size={96} src={c.photo_url||null}
              style={{ margin:'0 auto 16px',border:'3px solid var(--border-subtle)' }} />
            <h1 style={{ fontSize:22,fontWeight:700,marginBottom:4 }}>{c.full_name}</h1>
            <p style={{ fontSize:15,color:'var(--primary)',fontWeight:500,marginBottom:4 }}>
              {c.party_name || 'Independent Candidate'}
            </p>
            <p style={{ fontSize:13,color:'var(--text-secondary)' }}>
              {c.department} · {c.year} · {c.degree}
            </p>
          </div>
          <Divider />
          <h2 style={{ fontSize:15,fontWeight:600,marginBottom:10 }}>Manifesto</h2>
          <p style={{ fontSize:14,lineHeight:1.8,color:'var(--text-primary)',whiteSpace:'pre-wrap',marginBottom:20 }}>
            {c.manifesto || 'No manifesto provided.'}
          </p>
          {c.agenda_points?.length > 0 && (
            <>
              <h2 style={{ fontSize:15,fontWeight:600,marginBottom:10 }}>Key Agenda Points</h2>
              <ul style={{ paddingLeft:20,lineHeight:2 }}>
                {c.agenda_points.map((p,i) => <li key={i} style={{ fontSize:14,color:'var(--text-primary)' }}>{p}</li>)}
              </ul>
            </>
          )}
          {c.social_links && Object.values(c.social_links).some(Boolean) && (
            <>
              <Divider />
              <div style={{ display:'flex',gap:12,flexWrap:'wrap' }}>
                {c.social_links.instagram && <a href={c.social_links.instagram} target="_blank" rel="noreferrer"
                  style={{ fontSize:13,color:'var(--primary)' }}>Instagram →</a>}
                {c.social_links.linkedin  && <a href={c.social_links.linkedin}  target="_blank" rel="noreferrer"
                  style={{ fontSize:13,color:'var(--primary)' }}>LinkedIn →</a>}
              </div>
            </>
          )}
          <Divider />
          <div style={{ display:'flex',gap:10 }}>
            <Button onClick={() => navigate(`/elections/${c.election_id}/vote`)}>
              Vote in this election
            </Button>
            <Button variant="secondary" onClick={() => navigate(`/elections/${c.election_id}`)}>
              Election details
            </Button>
          </div>
        </Card>
      )}
    </VoterLayout>
  );
}
