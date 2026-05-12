

interface Props {
  lastUpdated: string;
  activeCategory: 'XAUUSD' | 'CRYPTO' | 'FOREX';
  setActiveCategory: (cat: 'XAUUSD' | 'CRYPTO' | 'FOREX') => void;
}

export default function Header({ lastUpdated, activeCategory, setActiveCategory }: Props) {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 0 20px',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      marginBottom: '32px',
    }}>
      {/* Logo / branding */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#d4af37' }}>VISION</span>
          <span style={{ color: '#f8fafc', opacity: 0.9 }}>COMMAND</span>
        </h1>
        <p style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          PRECISION AT THE SPEED OF AI
        </p>
      </div>

      {/* Center: Category Switcher (Moved from Dashboard) */}
      <div style={{ 
        display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', 
        padding: '4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' 
      }}>
        {(['XAUUSD', 'CRYPTO', 'FOREX'] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '8px 20px',
              borderRadius: '9px',
              fontSize: '11px',
              fontWeight: 900,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              background: activeCategory === cat ? 'linear-gradient(135deg, #d4af37, #b38728)' : 'transparent',
              color: activeCategory === cat ? '#050b14' : '#64748b',
              border: 'none',
              boxShadow: activeCategory === cat ? '0 4px 12px rgba(212,175,55,0.2)' : 'none',
              letterSpacing: '0.05em'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ textAlign: 'right' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
              <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 900, letterSpacing: '0.1em' }}>LIVE FEED</span>
           </div>
           <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', fontWeight: 600 }}>
             {timezone.split('/')[1] || timezone} · {lastUpdated}
           </div>
        </div>
      </div>
    </header>
  );
}
