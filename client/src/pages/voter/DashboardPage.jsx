import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFetch } from '../../hooks/index.js';
import { VoterLayout } from '../../components/layout/Layouts.jsx';
import { Card, Badge, ProgressBar, StatCard, Spinner, Banner } from '../../components/ui/index.jsx';
import { Button } from '../../components/ui/index.jsx';
import { ELECTION_STATUS_LABEL, DEPT_SHORT } from '../../utils/constants.js';

function timeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  if (h < 21) return 'evening';
  return 'night';
}

function ElectionCard({ election, onVote, onView, onResults }) {
  const s       = ELECTION_STATUS_LABEL[election.status] || ELECTION_STATUS_LABEL.ended;
  const turnout = election.voter_count > 0
    ? Math.round((election.voted_count / election.voter_count) * 100) : 0;
  const voted   = election.my_has_voted;
  const live    = election.status === 'live';
  const ended   = election.status === 'ended';
  const myApp   = election.my_application_status;

  return (
    <Card style={{ marginBottom:12, transition:'border-color .15s' }}
      onClick={undefined}>
      {/* Top row */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:10 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:15, fontWeight:600, marginBottom:2 }}>{election.title}</div>
          <div style={{ fontSize:12, color:'var(--text-secondary)' }}>
            {election.election_type || 'General Election'}
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:4, alignItems:'flex-end' }}>
          <Badge color={s.color} bg={s.bg} dot={live ? 'pulse' : undefined}>
            {s.label.toUpperCase()}
          </Badge>
          {voted && <Badge color="#085041" bg="#E1F5EE">✓ VOTED</Badge>}
          {myApp === 'approved' && <Badge color="#7a4f00" bg="#FDF3E0">YOUR ELECTION</Badge>}
        </div>
      </div>

      {/* Meta */}
      <div style={{ display:'flex', gap:16, fontSize:12, color:'var(--text-secondary)', marginBottom:10, flexWrap:'wrap' }}>
        <span>👥 {(election.voter_count||0).toLocaleString()} voters</span>
        <span>🙋 {election.candidate_count||0} candidates</span>
        <span>📅 {new Date(election.end_time).toLocaleDateString('en-IN',{ day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</span>
      </div>

      {/* Progress */}
      {(live || ended) && (
        <div style={{ marginBottom:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11,
            color:'var(--text-hint)', marginBottom:5 }}>
            <span>Voter turnout</span>
            <span style={{ fontWeight:500, color:'var(--text-primary)' }}>{turnout}%</span>
          </div>
          <ProgressBar value={turnout} />
        </div>
      )}

      {/* Actions */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:4 }}>
        <Button size="xs" variant="ghost" onClick={() => onView(election.id)}
          style={{ color:'var(--primary)' }}>View details</Button>

        {live && !voted && (
          <Button size="sm" onClick={() => onVote(election.id)}>
            🗳️ Cast your vote
          </Button>
        )}
        {voted && (
          <Button size="sm" variant="secondary" onClick={() => onResults(election.id)}>
            View results
          </Button>
        )}
        {ended && (
          <Button size="sm" variant="secondary" onClick={() => onResults(election.id)}>
            Final results
          </Button>
        )}
        {election.status === 'upcoming' && (
          <span style={{ fontSize:12, color:'var(--text-hint)', alignSelf:'center' }}>
            Opens {new Date(election.start_time).toLocaleDateString('en-IN',{ day:'numeric', month:'short' })}
          </span>
        )}
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, loading } = useFetch('/elections');
  const navigate = useNavigate();

  const elections = data?.elections || [];
  const live      = elections.filter(e => e.status === 'live');
  const upcoming  = elections.filter(e => e.status === 'upcoming');
  const ended     = elections.filter(e => e.status === 'ended');
  const voted     = elections.filter(e => e.my_has_voted);

  return (
    <VoterLayout>
      {/* Welcome */}
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:24, fontWeight:700, marginBottom:4 }}>
          Good {timeOfDay()}, {user?.full_name?.split(' ')[0]} 👋
        </h1>
        <p style={{ fontSize:14, color:'var(--text-secondary)' }}>
          {user?.department ? `${user.department} · ${user.year}` : 'Welcome to MSEC Election Portal'}
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:28 }}>
        <StatCard label="Active elections" value={live.length}
          sub={live.length > 0 ? 'Vote now!' : 'None right now'} subColor={live.length?'var(--primary)':'var(--text-hint)'} />
        <StatCard label="Votes cast" value={voted.length} sub="By you" />
        <StatCard label="Upcoming" value={upcoming.length} sub="Opening soon" />
        <StatCard label="Completed" value={ended.length} sub="View results" />
      </div>

      {loading && (
        <div style={{ display:'flex', justifyContent:'center', padding:64 }}>
          <Spinner size={32} />
        </div>
      )}

      {!loading && live.length === 0 && upcoming.length === 0 && ended.length === 0 && (
        <Card style={{ textAlign:'center', padding:'56px 24px' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🗳️</div>
          <div style={{ fontSize:16, fontWeight:600, marginBottom:8 }}>No elections right now</div>
          <p style={{ fontSize:14, color:'var(--text-secondary)' }}>
            Check back soon. The Election Committee will announce upcoming elections here.
          </p>
        </Card>
      )}

      {/* Live */}
      {!loading && live.length > 0 && (
        <section style={{ marginBottom:28 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <span style={{ width:8,height:8,borderRadius:'50%',background:'#16A34A',animation:'pulse 1.5s infinite',display:'inline-block' }} />
            <span style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--text-secondary)' }}>Live Now</span>
          </div>
          {live.map(e => (
            <ElectionCard key={e.id} election={e}
              onVote={id => navigate(`/elections/${id}/vote`)}
              onView={id => navigate(`/elections/${id}`)}
              onResults={id => navigate(`/elections/${id}/results`)} />
          ))}
        </section>
      )}

      {/* Upcoming */}
      {!loading && upcoming.length > 0 && (
        <section style={{ marginBottom:28 }}>
          <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--text-secondary)', marginBottom:12 }}>
            Upcoming Elections
          </div>
          {upcoming.map(e => (
            <ElectionCard key={e.id} election={e}
              onVote={() => {}} onView={id => navigate(`/elections/${id}`)} onResults={() => {}} />
          ))}
        </section>
      )}

      {/* Ended */}
      {!loading && ended.length > 0 && (
        <section>
          <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--text-secondary)', marginBottom:12 }}>
            Past Elections
          </div>
          {ended.map(e => (
            <ElectionCard key={e.id} election={e}
              onVote={() => {}} onView={id => navigate(`/elections/${id}`)}
              onResults={id => navigate(`/elections/${id}/results`)} />
          ))}
        </section>
      )}
    </VoterLayout>
  );
}
