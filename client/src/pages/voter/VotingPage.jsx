import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import { useFetch, useCountdown } from '../../hooks/index.js';
import { VoterLayout } from '../../components/layout/Layouts.jsx';
import { Card, Banner, Divider, ProgressBar, Avatar, Spinner, Button } from '../../components/ui/index.jsx';

function VoteSuccess({ election, candidateName, isNota, voteHash }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  function copy() { navigator.clipboard?.writeText(voteHash); setCopied(true); setTimeout(()=>setCopied(false),2000); }
  return (
    <VoterLayout narrow>
      <div style={{ textAlign:'center', paddingTop:40 }}>
        <div className="pop-in" style={{ width:76,height:76,background:'#E1F5EE',borderRadius:'50%',
          display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px' }}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h1 style={{ fontSize:24, fontWeight:700, marginBottom:8 }}>Vote submitted!</h1>
        <p style={{ fontSize:15, color:'var(--text-secondary)', marginBottom:28 }}>
          {isNota
            ? 'Your NOTA vote has been anonymously recorded.'
            : <>Your vote for <strong>{candidateName}</strong> has been anonymously recorded.</>}
        </p>
        <Card style={{ maxWidth:480, margin:'0 auto 24px', textAlign:'left' }}>
          <div style={{ fontSize:11,fontWeight:600,color:'var(--text-hint)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8 }}>
            Vote Receipt Hash
          </div>
          <div style={{ background:'var(--bg-surface)',borderRadius:'var(--r-sm)',padding:'10px 14px',
            fontFamily:'monospace',fontSize:12,display:'flex',alignItems:'center',justifyContent:'space-between',gap:8 }}>
            <span style={{ overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{voteHash}</span>
            <button onClick={copy} style={{ color:copied?'var(--primary)':'var(--text-hint)',
              background:'none',border:'none',cursor:'pointer',fontSize:12,flexShrink:0 }}>
              {copied?'✓ Copied':'Copy'}
            </button>
          </div>
          <p style={{ fontSize:11,color:'var(--text-hint)',marginTop:8,lineHeight:1.6 }}>
            A receipt has also been emailed to you. This code does not reveal who you voted for.
          </p>
        </Card>
        <div style={{ display:'flex',gap:12,maxWidth:400,margin:'0 auto' }}>
          <Button variant="secondary" style={{ flex:1 }} onClick={() => navigate(`/elections/${election?.id}/results`)}>
            View results
          </Button>
          <Button style={{ flex:1 }} onClick={() => navigate('/dashboard')}>Back to dashboard</Button>
        </div>
      </div>
    </VoterLayout>
  );
}

export default function VotingPage() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { data: elData, loading: elLoading } = useFetch(`/elections/${id}`);
  const { data: cData, loading: cLoading }   = useFetch(`/candidates/election/${id}`);
  const [selected,  setSelected]  = useState(null);
  const [isNota,    setIsNota]     = useState(false);
  const [submitting,setSubmitting] = useState(false);
  const [error,     setError]      = useState('');
  const [voteHash,  setVoteHash]   = useState(null);
  const countdown = useCountdown(elData?.election?.end_time);

  if (elLoading || cLoading) return (
    <VoterLayout narrow><div style={{ display:'flex',justifyContent:'center',padding:80 }}><Spinner size={32}/></div></VoterLayout>
  );

  const election   = elData?.election;
  const candidates = cData?.candidates || [];

  if (!election) return <VoterLayout narrow><Banner variant="danger">Election not found.</Banner></VoterLayout>;
  if (election.status !== 'live') return (
    <VoterLayout narrow>
      <Banner variant="warning">This election is not currently active.</Banner>
      <Button onClick={() => navigate('/dashboard')}>← Back</Button>
    </VoterLayout>
  );
  if (election.my_has_voted) return <VoteSuccess election={election} candidateName="(already voted)" isNota={false} voteHash="Already recorded" />;
  if (voteHash) {
    const chosenCandidate = candidates.find(c => c.id === selected);
    return <VoteSuccess election={election} candidateName={chosenCandidate?.full_name} isNota={isNota} voteHash={voteHash} />;
  }

  const turnout = election.voter_count > 0
    ? Math.round((election.voted_count / election.voter_count) * 100) : 0;

  async function handleVote() {
    setSubmitting(true); setError('');
    try {
      const res = await api.post('/votes', {
        electionId: id,
        candidateApplicationId: isNota ? null : selected,
        isNota,
      });
      setVoteHash(res.data.voteHash);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cast vote. Please try again.');
    } finally { setSubmitting(false); }
  }

  function selectCandidate(id) { setSelected(id); setIsNota(false); }
  function selectNota()        { setIsNota(true); setSelected(null); }

  const showConfirm = selected || isNota;

  return (
    <VoterLayout narrow>
      <button onClick={() => navigate(`/elections/${id}`)}
        style={{ display:'inline-flex',alignItems:'center',gap:4,fontSize:13,color:'var(--text-secondary)',
          background:'none',border:'none',cursor:'pointer',marginBottom:20 }}>
        ← Back to election
      </button>

      {/* Election context */}
      <Card style={{ marginBottom:20 }}>
        <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,marginBottom:8 }}>
          <div style={{ fontSize:18,fontWeight:700,flex:1 }}>{election.title}</div>
          <span style={{ background:'var(--warning-bg)',color:'var(--warning-text)',fontSize:12,fontWeight:600,
            padding:'5px 12px',borderRadius:'var(--r-full)',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:5 }}>
            <span style={{ width:6,height:6,background:'#D97706',borderRadius:'50%',animation:'pulse 1.5s infinite' }} />
            {countdown}
          </span>
        </div>
        <div style={{ display:'flex',gap:16,fontSize:12,color:'var(--text-secondary)',marginBottom:10,flexWrap:'wrap' }}>
          <span>👥 {(election.voter_count||0).toLocaleString()} eligible voters</span>
          <span>🙋 {candidates.length} candidates</span>
          <span>📊 {turnout}% turnout so far</span>
        </div>
        <ProgressBar value={turnout} height={5} />
      </Card>

      {/* Instruction */}
      <div style={{ fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'.06em',
        color:'var(--text-secondary)',marginBottom:8 }}>
        Select your candidate
      </div>
      <p style={{ fontSize:13,color:'var(--text-hint)',marginBottom:16 }}>
        Choose exactly one. Your vote is <strong>anonymous</strong> and cannot be changed once submitted.
      </p>

      {error && <Banner variant="danger">{error}</Banner>}

      {/* Candidate cards */}
      {candidates.map(c => {
        const chosen = selected === c.id;
        return (
          <div key={c.id} onClick={() => selectCandidate(c.id)}
            style={{ display:'flex',alignItems:'center',gap:16,padding:'14px 18px',marginBottom:10,
              background: chosen?'var(--primary-light)':'#fff',
              border:`${chosen?'2px':'1.5px'} solid ${chosen?'var(--primary)':'var(--border-subtle)'}`,
              borderRadius:'var(--r-lg)',cursor:'pointer',transition:'all .15s' }}>
            <Avatar name={c.full_name} size={52}
              src={c.photo_url ? c.photo_url : null} />
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontSize:15,fontWeight:600 }}>{c.full_name}</div>
              <div style={{ fontSize:13,color:'var(--text-secondary)',marginTop:2 }}>
                {c.party_name || 'Independent'}
              </div>
              <div style={{ fontSize:11,color:'var(--text-hint)',marginTop:3 }}>
                {c.department} · {c.year}
              </div>
              <button onClick={e => { e.stopPropagation(); navigate(`/candidates/${c.id}`); }}
                style={{ fontSize:12,color:'var(--primary)',background:'none',border:'none',cursor:'pointer',padding:0,marginTop:4 }}>
                View full profile →
              </button>
            </div>
            {/* Radio */}
            <div style={{ width:22,height:22,borderRadius:'50%',flexShrink:0,
              border:`2px solid ${chosen?'var(--primary)':'#D3D1C7'}`,
              background: chosen?'var(--primary)':'transparent',
              display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s' }}>
              {chosen && <div style={{ width:9,height:9,borderRadius:'50%',background:'#fff' }} />}
            </div>
          </div>
        );
      })}

      {/* NOTA */}
      {election.allow_nota && (
        <div onClick={selectNota}
          style={{ display:'flex',alignItems:'center',gap:16,padding:'14px 18px',marginBottom:10,
            background: isNota?'#FCEBEB':'#fff',
            border:`${isNota?'2px':'1.5px'} solid ${isNota?'#DC2626':'var(--border-subtle)'}`,
            borderRadius:'var(--r-lg)',cursor:'pointer',transition:'all .15s' }}>
          <div style={{ width:52,height:52,borderRadius:'50%',background:'#FCEBEB',
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0 }}>🚫</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15,fontWeight:600 }}>NOTA — None of the above</div>
            <div style={{ fontSize:12,color:'var(--text-secondary)',marginTop:2 }}>
              Register your dissent without voting for any candidate
            </div>
          </div>
          <div style={{ width:22,height:22,borderRadius:'50%',flexShrink:0,
            border:`2px solid ${isNota?'#DC2626':'#D3D1C7'}`,
            background: isNota?'#DC2626':'transparent',
            display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s' }}>
            {isNota && <div style={{ width:9,height:9,borderRadius:'50%',background:'#fff' }} />}
          </div>
        </div>
      )}

      {/* Confirmation box */}
      {showConfirm && (
        <div style={{ background:'var(--primary-light)',border:'1px solid #B5D4F4',borderRadius:'var(--r-md)',
          padding:'16px 20px',marginTop:12,animation:'slideDown .2s ease' }}>
          <p style={{ fontSize:14,color:'var(--primary-text)',lineHeight:1.7,marginBottom:14 }}>
            {isNota
              ? 'You are about to cast a NOTA vote. This action is permanent and anonymous.'
              : <>You are about to vote for <strong>{candidates.find(c=>c.id===selected)?.full_name}</strong> ({candidates.find(c=>c.id===selected)?.party_name || 'Independent'}). This is permanent and anonymous.</>}
          </p>
          <div style={{ display:'flex',gap:10 }}>
            <Button variant="secondary" style={{ flex:1 }} onClick={() => { setSelected(null); setIsNota(false); }}>
              Change selection
            </Button>
            <Button style={{ flex:1 }} loading={submitting} onClick={handleVote}>
              Confirm &amp; submit vote
            </Button>
          </div>
        </div>
      )}

      <p style={{ fontSize:11,color:'var(--text-hint)',textAlign:'center',marginTop:20 }}>
        🔒 Your identity is never linked to your vote. Complete anonymity guaranteed.
      </p>
    </VoterLayout>
  );
}
