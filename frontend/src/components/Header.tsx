import { useState, useEffect } from 'react';

interface Props {
  lastUpdated: string;
  activeCategory: 'XAUUSD' | 'CRYPTO' | 'FOREX';
  setActiveCategory: (cat: 'XAUUSD' | 'CRYPTO' | 'FOREX') => void;
}

export default function Header({ lastUpdated, activeCategory, setActiveCategory }: Props) {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <header style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      justifyContent: 'space-between',
      alignItems: isMobile ? 'flex-start' : 'center',
      padding: isMobile ? '70px 0 20px' : '12px 0 20px', // Extra top padding for mobile top bar
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      marginBottom: '32px',
      gap: isMobile ? '20px' : '0'
    }}>
      {/* Logo / branding */}
      <div style={{ width: isMobile ? '100%' : 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
           <h1 style={{ fontSize: isMobile ? '20px' : '22px', fontWeight: '900', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#d4af37' }}>VISION</span>
              <span style={{ color: '#f8fafc', opacity: 0.9 }}>COMMAND</span>
           </h1>
           <p style={{ fontSize: '9px', color: '#64748b', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              PRECISION AT THE SPEED OF AI
           </p>
        </div>
      </div>

      {/* Center: Category Switcher */}
      <div style={{ 
        display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', 
        padding: '3px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)',
        width: isMobile ? '100%' : 'auto', overflowX: isMobile ? 'auto' : 'visible'
      }}>
        {(['XAUUSD', 'CRYPTO', 'FOREX'] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: isMobile ? '10px 0' : '8px 20px',
              flex: isMobile ? 1 : 'none',
              borderRadius: '9px',
              fontSize: '10px',
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

      {/* Right side - Hidden or compact on mobile */}
      {!isMobile && (
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
      )}
    </header>
  );
}
