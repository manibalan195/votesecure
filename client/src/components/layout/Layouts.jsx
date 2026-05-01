import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

function VoterSidebar() {
  const { isCandidate } = useAuth();
  const links = [
    { to:'/dashboard',       label:'Dashboard',       icon:'grid' },
    { to:'/elections',       label:'Elections',        icon:'ballot' },
    { to:'/results',         label:'Results',          icon:'chart' },
    ...(isCandidate ? [{ to:'/my-applications', label:'My Campaign', icon:'star' }] : [
      { to:'/apply-candidate', label:'Run for Election', icon:'star' },
    ]),
    { to:'/profile',         label:'My Profile',      icon:'person' },
    { to:'/verify-vote',     label:'Verify My Vote',  icon:'check' },
  ];
  const icons = {
    grid:   <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>,
    ballot: <><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></>,
    chart:  <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></>,
    star:   <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>,
    person: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    check:  <><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>,
  };
  return (
    <aside style={{
      position:'fixed', top:'var(--navbar-h)', left:0, bottom:0,
      width:'var(--sidebar-w)', background:'#fff',
      borderRight:'1px solid var(--border-subtle)',
      zIndex:90, overflowY:'auto', padding:'12px 8px',
    }}>
      {links.map(l => (
        <NavLink key={l.to} to={l.to} end={l.to==='/dashboard'}
          style={({ isActive }) => ({
            display:'flex', alignItems:'center', gap:10, height:44,
            padding:'0 14px', borderRadius:'var(--r-sm)', margin:'1px 0',
            fontSize:13, fontWeight: isActive?500:400,
            color: isActive?'var(--primary)':'var(--text-secondary)',
            background: isActive?'var(--primary-light)':'transparent',
            textDecoration:'none',
          })}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {icons[l.icon]}
          </svg>
          {l.label}
        </NavLink>
      ))}
    </aside>
  );
}

export function VoterLayout({ children, title, narrow }) {
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-page)' }}>
      <Navbar />
      <VoterSidebar />
      <main style={{ paddingTop:'var(--navbar-h)', paddingLeft:'var(--sidebar-w)', minHeight:'100vh' }}>
        <div style={{ maxWidth: narrow ? 760 : 'var(--max-w)', margin:'0 auto', padding:'32px 28px' }}>
          {title && <h1 style={{ fontSize:22, fontWeight:700, marginBottom:20 }}>{title}</h1>}
          {children}
        </div>
      </main>
    </div>
  );
}

export function AuthLayout({ children }) {
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-page)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      {children}
    </div>
  );
}
