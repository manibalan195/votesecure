import React from 'react';

/* ── Button ─────────────────────────────────────────────────────────────── */
export function Button({ children, variant='primary', size='md', loading=false,
  disabled=false, fullWidth=false, onClick, type='button', style, className }) {
  const base = {
    display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6,
    fontFamily:'inherit', fontWeight:600, borderRadius:'var(--r-md)',
    cursor: disabled||loading ? 'not-allowed':'pointer',
    opacity: disabled||loading ? .6 : 1,
    transition:'background var(--transition), box-shadow var(--transition)',
    width: fullWidth?'100%':undefined,
    border:'none',
  };
  const sizes = {
    xs:{ padding:'5px 12px', fontSize:12, borderRadius:'var(--r-sm)' },
    sm:{ padding:'7px 16px', fontSize:13 },
    md:{ padding:'10px 20px', fontSize:14, minHeight:42 },
    lg:{ padding:'12px 28px', fontSize:15, minHeight:48 },
  };
  const variants = {
    primary:   { background:'var(--primary)',  color:'#fff' },
    secondary: { background:'#fff', color:'var(--text-secondary)', border:'1px solid #D3D1C7' },
    accent:    { background:'var(--accent)',   color:'#fff' },
    danger:    { background:'#DC2626',         color:'#fff' },
    ghost:     { background:'transparent',     color:'var(--text-secondary)' },
  };
  return (
    <button type={type} onClick={!disabled&&!loading?onClick:undefined}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }} className={className}>
      {loading
        ? <span style={{ width:16,height:16,border:'2px solid rgba(255,255,255,.4)',borderTop:'2px solid #fff',borderRadius:'50%',animation:'spin .7s linear infinite' }} />
        : children}
    </button>
  );
}

/* ── Input ──────────────────────────────────────────────────────────────── */
export function Input({ label, error, hint, id, type='text', style, inputStyle, fullWidth=true, required, ...props }) {
  const elId = id || label?.toLowerCase().replace(/\s+/g,'-');
  const inputBase = { width:'100%', border:`1px solid ${error?'#DC2626':'#D3D1C7'}`, borderRadius:'var(--r-sm)',
    padding:'0 14px', fontSize:15, background:'#fff', color:'var(--text-primary)',
    transition:'border-color var(--transition), box-shadow var(--transition)', ...inputStyle };
  return (
    <div style={{ marginBottom:16, width:fullWidth?'100%':undefined, ...style }}>
      {label && <label htmlFor={elId} style={{ display:'block', fontSize:13, fontWeight:500,
        color:'var(--text-secondary)', marginBottom:6 }}>{label}{required && <span style={{ color:'#DC2626' }}> *</span>}</label>}
      {type==='textarea'
        ? <textarea id={elId} {...props}
            style={{ ...inputBase, height:'auto', padding:'10px 14px', resize:'vertical', lineHeight:1.6, minHeight:90 }}
            onFocus={e=>{ e.target.style.borderColor='var(--primary)'; e.target.style.boxShadow='0 0 0 3px rgba(26,58,92,.12)'; }}
            onBlur={e=>{ e.target.style.borderColor=error?'#DC2626':'#D3D1C7'; e.target.style.boxShadow='none'; }} />
        : <input id={elId} type={type} {...props}
            style={{ ...inputBase, height:44 }}
            onFocus={e=>{ e.target.style.borderColor='var(--primary)'; e.target.style.boxShadow='0 0 0 3px rgba(26,58,92,.12)'; }}
            onBlur={e=>{ e.target.style.borderColor=error?'#DC2626':'#D3D1C7'; e.target.style.boxShadow='none'; }} />}
      {error && <p style={{ fontSize:12, color:'#DC2626', marginTop:4 }}>{error}</p>}
      {hint && !error && <p style={{ fontSize:12, color:'var(--text-hint)', marginTop:4 }}>{hint}</p>}
    </div>
  );
}

/* ── Select ─────────────────────────────────────────────────────────────── */
export function Select({ label, error, id, children, style, required, ...props }) {
  const elId = id || label?.toLowerCase().replace(/\s+/g,'-');
  return (
    <div style={{ marginBottom:16, ...style }}>
      {label && <label htmlFor={elId} style={{ display:'block', fontSize:13, fontWeight:500,
        color:'var(--text-secondary)', marginBottom:6 }}>{label}{required && <span style={{ color:'#DC2626' }}> *</span>}</label>}
      <select id={elId} {...props} style={{ width:'100%', height:44, border:`1px solid ${error?'#DC2626':'#D3D1C7'}`,
        borderRadius:'var(--r-sm)', padding:'0 14px', fontSize:15, background:'#fff', color:'var(--text-primary)' }}>
        {children}
      </select>
      {error && <p style={{ fontSize:12, color:'#DC2626', marginTop:4 }}>{error}</p>}
    </div>
  );
}

/* ── Badge ──────────────────────────────────────────────────────────────── */
export function Badge({ children, color, bg, dot, style }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:600,
      padding:'3px 10px', borderRadius:'var(--r-full)', letterSpacing:'.04em',
      background: bg || 'var(--bg-surface)', color: color || 'var(--text-secondary)', ...style }}>
      {dot && <span style={{ width:6,height:6,borderRadius:'50%',background:'currentColor',
        animation: dot==='pulse' ? 'pulse 1.5s infinite':'none' }} />}
      {children}
    </span>
  );
}

/* ── Card ───────────────────────────────────────────────────────────────── */
export function Card({ children, style, onClick, padding='20px 24px' }) {
  return (
    <div onClick={onClick} style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)',
      borderRadius:'var(--r-lg)', padding, cursor:onClick?'pointer':undefined, ...style }}>
      {children}
    </div>
  );
}

/* ── ProgressBar ────────────────────────────────────────────────────────── */
export function ProgressBar({ value=0, height=6, color, style }) {
  return (
    <div style={{ background:'var(--bg-surface)', borderRadius:99, overflow:'hidden', height, ...style }}>
      <div style={{ background: color||'var(--primary)', height, borderRadius:99,
        width:`${Math.max(0,Math.min(100,value))}%`, transition:'width .6s ease' }} />
    </div>
  );
}

/* ── Divider ────────────────────────────────────────────────────────────── */
export function Divider({ style }) {
  return <div style={{ height:1, background:'var(--border-subtle)', margin:'16px 0', ...style }} />;
}

/* ── Banner ─────────────────────────────────────────────────────────────── */
export function Banner({ variant='info', children, style }) {
  const map = {
    info:    { bg:'var(--info-bg)',    border:'#B5D4F4', color:'var(--info-text)' },
    success: { bg:'var(--success-bg)', border:'#9FE1CB', color:'var(--success-text)' },
    warning: { bg:'var(--warning-bg)', border:'#F5C885', color:'var(--warning-text)' },
    danger:  { bg:'var(--danger-bg)',  border:'#F09595', color:'var(--danger-text)' },
  };
  const s = map[variant] || map.info;
  return (
    <div style={{ background:s.bg, border:`1px solid ${s.border}`, color:s.color,
      borderRadius:'var(--r-sm)', padding:'11px 16px', fontSize:13, lineHeight:1.6,
      marginBottom:14, ...style }}>
      {children}
    </div>
  );
}

/* ── Toggle ─────────────────────────────────────────────────────────────── */
export function Toggle({ checked, onChange, label, description, style }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px',
      border:'1px solid var(--border-subtle)', borderRadius:'var(--r-md)', ...style }}>
      <div onClick={() => onChange(!checked)} style={{ position:'relative', width:40, height:22, cursor:'pointer', flexShrink:0 }}>
        <div style={{ width:40, height:22, background:checked?'var(--primary)':'#D3D1C7', borderRadius:11, transition:'background .2s' }} />
        <div style={{ position:'absolute', top:3, left: checked?21:3, width:16, height:16,
          background:'#fff', borderRadius:'50%', transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,.15)' }} />
      </div>
      {(label||description) && (
        <div>
          {label && <div style={{ fontSize:14, fontWeight:500 }}>{label}</div>}
          {description && <div style={{ fontSize:12, color:'var(--text-hint)', marginTop:2 }}>{description}</div>}
        </div>
      )}
    </div>
  );
}

/* ── Avatar ─────────────────────────────────────────────────────────────── */
const PALETTES = [
  { bg:'#EEF4FB', c:'#1a3a5c' },
  { bg:'#FDF3E0', c:'#7a4f00' },
  { bg:'#E1F5EE', c:'#085041' },
  { bg:'#FCEBEB', c:'#791F1F' },
  { bg:'#EEEDFE', c:'#3C3489' },
];
function pal(name) {
  let h = 0;
  for (const ch of (name||'')) h = (h<<5)-h+ch.charCodeAt(0);
  return PALETTES[Math.abs(h) % PALETTES.length];
}
export function Avatar({ name='', size=40, src, style }) {
  const initials = (name||'U').split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);
  const { bg, c } = pal(name);
  if (src) return <img src={src} alt={name} style={{ width:size,height:size,borderRadius:'50%',objectFit:'cover',flexShrink:0,...style }} />;
  return (
    <div style={{ width:size,height:size,borderRadius:'50%',background:bg,color:c,
      display:'flex',alignItems:'center',justifyContent:'center',
      fontSize:size*.36,fontWeight:600,flexShrink:0,userSelect:'none',...style }}>
      {initials}
    </div>
  );
}

/* ── Spinner ────────────────────────────────────────────────────────────── */
export function Spinner({ size=24, color='var(--primary)' }) {
  return (
    <div style={{ width:size,height:size,border:`2px solid ${color}25`,
      borderTop:`2px solid ${color}`,borderRadius:'50%',animation:'spin .7s linear infinite',flexShrink:0 }} />
  );
}

/* ── StatCard ───────────────────────────────────────────────────────────── */
export function StatCard({ label, value, sub, subColor, style }) {
  return (
    <Card style={style}>
      <div style={{ fontSize:32, fontWeight:700, lineHeight:1, marginBottom:6 }}>{value ?? '—'}</div>
      <div style={{ fontSize:13, color:'var(--text-secondary)' }}>{label}</div>
      {sub && <div style={{ fontSize:12, color:subColor||'var(--text-hint)', marginTop:2 }}>{sub}</div>}
    </Card>
  );
}
