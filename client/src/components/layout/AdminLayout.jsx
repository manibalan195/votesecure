import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Navbar from './Navbar.jsx';
import { Avatar } from '../ui/index.jsx';

const NAV = [
  { to:'/admin',                   label:'Dashboard',      icon:'grid',    exact:true },
  { to:'/admin/elections',         label:'Elections',      icon:'ballot' },
  { to:'/admin/elections/create',  label:'Create Election',icon:'plus' },
  { to:'/admin/applications',      label:'Applications',   icon:'check', badge:'pending' },
  { to:'/admin/users',             label:'Users',          icon:'people' },
  { to:'/admin/audit',             label:'Audit Log',      icon:'shield' },
];

function Icon({ name }) {
  const paths = {
    grid:   <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>,
    ballot: <><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></>,
    plus:   <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    check:  <><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>,
    people: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>,
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
    chart:  <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></>,
  };
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

export default function AdminLayout({ children, title, actions }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-page)' }}>
      <Navbar />

      {/* Sidebar */}
      <aside style={{
        position:'fixed', top:'var(--navbar-h)', left:0, bottom:0,
        width:'var(--sidebar-w)', background:'#fff',
        borderRight:'1px solid var(--border-subtle)',
        display:'flex', flexDirection:'column', zIndex:90, overflowY:'auto',
      }}>
        <nav style={{ padding:'12px 8px', flex:1 }}>
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.exact}
              style={({ isActive }) => ({
                display:'flex', alignItems:'center', gap:10, height:44,
                padding:'0 14px', borderRadius:'var(--r-sm)', margin:'1px 0',
                fontSize:13, fontWeight: isActive ? 500 : 400,
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                background: isActive ? 'var(--primary-light)' : 'transparent',
                textDecoration:'none', transition:'background var(--transition)',
              })}>
              <Icon name={item.icon} />
              <span style={{ flex:1 }}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom user info */}
        <div style={{ padding:16, borderTop:'1px solid var(--border-subtle)', display:'flex', alignItems:'center', gap:10 }}>
          <Avatar name={user?.full_name||'A'} size={32} />
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {user?.full_name}
            </div>
            <div style={{ fontSize:10, color:'var(--text-hint)' }}>Administrator</div>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }}
            style={{ color:'var(--text-hint)', padding:4, borderRadius:4, display:'flex' }}
            title="Sign out">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ paddingTop:'var(--navbar-h)', paddingLeft:'var(--sidebar-w)', minHeight:'100vh' }}>
        {(title || actions) && (
          <div style={{
            position:'sticky', top:'var(--navbar-h)', zIndex:50,
            background:'#fff', borderBottom:'1px solid var(--border-subtle)',
            height:60, display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'0 32px',
          }}>
            <h1 style={{ fontSize:17, fontWeight:600 }}>{title}</h1>
            {actions && <div style={{ display:'flex', gap:10 }}>{actions}</div>}
          </div>
        )}
        <div style={{ maxWidth:'var(--max-w)', margin:'0 auto', padding:32 }}>
          {children}
        </div>
      </main>
    </div>
  );
}
