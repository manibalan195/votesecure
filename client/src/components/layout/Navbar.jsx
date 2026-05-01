import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Avatar, Badge } from '../ui/index.jsx';
import { COLLEGE, APPLICATION_STATUS_LABEL } from '../../utils/constants.js';

const ROLE_BADGE = {
  admin:     { label:'Admin',     color:'#fff',    bg:'var(--accent)' },
  candidate: { label:'Candidate', color:'#085041', bg:'#E1F5EE' },
  voter:     { label:'Student',   color:'#1a3a5c', bg:'#EEF4FB' },
};

export default function Navbar() {
  const { user, college, logout } = useAuth();
  const navigate  = useNavigate();
  const [open, setOpen] = useState(false);

  const collegeName = college?.short || COLLEGE.short;
  const homeLink    = user?.role === 'admin' ? '/admin' : '/dashboard';
  const rb          = ROLE_BADGE[user?.role] || ROLE_BADGE.voter;

  return (
    <nav style={{
      position:'fixed', top:0, left:0, right:0,
      height:'var(--navbar-h)', background:'var(--primary)',
      display:'flex', alignItems:'center', padding:'0 28px',
      gap:16, zIndex:100, boxShadow:'0 2px 8px rgba(0,0,0,.18)',
    }}>
      {/* Brand */}
      <Link to={homeLink} style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
        <div style={{ width:36,height:36,background:'var(--accent)',borderRadius:8,
          display:'flex',alignItems:'center',justifyContent:'center',
          fontSize:18,fontWeight:700,color:'#fff',flexShrink:0 }}>
          {collegeName[0]}
        </div>
        <div>
          <div style={{ fontSize:14,fontWeight:600,color:'#fff',lineHeight:1.2 }}>{collegeName} Election Portal</div>
          <div style={{ fontSize:10,color:'rgba(255,255,255,.65)',lineHeight:1.2 }}>
            {college?.name || COLLEGE.name}
          </div>
        </div>
      </Link>

      <div style={{ flex:1 }} />

      {/* Notification bell placeholder */}
      <button style={{ color:'rgba(255,255,255,.75)',display:'flex',alignItems:'center',padding:8,borderRadius:'50%' }}
        onClick={() => navigate(user?.role === 'admin' ? '/admin/notifications' : '/notifications')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
      </button>

      {/* User menu */}
      <div style={{ position:'relative' }}>
        <button onClick={() => setOpen(o => !o)}
          style={{ display:'flex',alignItems:'center',gap:8,padding:'6px 10px',
            borderRadius:'var(--r-md)',background:'rgba(255,255,255,.12)',border:'none',cursor:'pointer' }}>
          <Avatar name={user?.full_name||'U'} size={32}
            src={user?.avatar_url ? `/uploads/${user.avatar_url.split('/').pop()}` : null} />
          <div style={{ textAlign:'left', display:'flex', flexDirection:'column' }}>
            <span style={{ fontSize:13,fontWeight:500,color:'#fff',lineHeight:1.2 }}>
              {user?.full_name?.split(' ')[0] || 'User'}
            </span>
            <Badge color={rb.color} bg={rb.bg} style={{ fontSize:9,padding:'1px 6px',marginTop:2 }}>{rb.label}</Badge>
          </div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {open && (
          <div style={{ position:'absolute', top:'calc(100% + 8px)', right:0,
            background:'#fff', border:'1px solid var(--border-subtle)', borderRadius:'var(--r-md)',
            boxShadow:'var(--shadow-lg)', minWidth:220, zIndex:200, overflow:'hidden',
            animation:'fadeIn .15s ease' }}>
            <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight:600, fontSize:14 }}>{user?.full_name}</div>
              <div style={{ fontSize:12, color:'var(--text-hint)', marginTop:2 }}>{user?.email}</div>
              {user?.department && (
                <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop:2 }}>{user.department}</div>
              )}
            </div>
            {[
              { label:'My Profile', path: user?.role==='admin' ? '/admin/profile' : '/profile' },
              ...(user?.role !== 'admin' ? [{ label:'My Applications', path:'/my-applications' }] : []),
              { label:'Settings', path: user?.role==='admin' ? '/admin/settings' : '/settings' },
            ].map(item => (
              <button key={item.path} onClick={() => { navigate(item.path); setOpen(false); }}
                style={{ display:'block', width:'100%', padding:'11px 16px', fontSize:14,
                  textAlign:'left', background:'none', border:'none', cursor:'pointer',
                  borderBottom:'1px solid var(--border-subtle)', color:'var(--text-primary)' }}
                onMouseEnter={e => e.target.style.background = 'var(--bg-page)'}
                onMouseLeave={e => e.target.style.background = 'transparent'}>
                {item.label}
              </button>
            ))}
            <button onClick={() => { logout(); navigate('/login'); setOpen(false); }}
              style={{ display:'block', width:'100%', padding:'11px 16px', fontSize:14,
                textAlign:'left', color:'#DC2626', cursor:'pointer', background:'none', border:'none' }}
              onMouseEnter={e => e.target.style.background = 'var(--danger-bg)'}
              onMouseLeave={e => e.target.style.background = 'transparent'}>
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
