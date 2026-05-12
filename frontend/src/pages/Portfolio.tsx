import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPortfolio } from '../services/api';
import GlassCard from '../components/GlassCard';
import { PieChart, Landmark, TrendingUp, MoreHorizontal } from 'lucide-react';

export default function Portfolio() {
  const { data: portfolio } = useQuery({ 
    queryKey: ['portfolio'], 
    queryFn: fetchPortfolio, 
    refetchInterval: 5000 
  });

  const stats = [
    { label: 'Total Balance', value: '$124,530.00', change: '+2.4%', up: true, icon: <Landmark size={20} /> },
    { label: 'Total Equity', value: '$126,210.00', change: '+1.8%', up: true, icon: <PieChart size={20} /> },
    { label: 'Open PnL', value: '+$1,680.00', change: 'Live', up: true, icon: <TrendingUp size={20} /> },
  ];

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '40px 24px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>My Portfolio</h1>
        <p style={{ color: '#64748b', margin: '8px 0 0' }}>Manage your virtual assets and open positions</p>
      </header>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
        {stats.map((s, i) => (
          <GlassCard key={s.label} delay={i * 0.1}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(212,175,55,0.1)', color: '#d4af37' }}>{s.icon}</div>
              <div style={{ 
                fontSize: '12px', fontWeight: 700, padding: '4px 8px', borderRadius: '99px',
                background: s.up ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                color: s.up ? '#10b981' : '#ef4444'
              }}>
                {s.change}
              </div>
            </div>
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc', marginTop: '4px', letterSpacing: '-0.02em' }}>{s.value}</div>
            </div>
          </GlassCard>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '32px' }}>
        {/* Active Positions */}
        {/* Active Positions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Bullion Category */}
          <div>
            <h2 style={categoryHeaderStyle}>🏆 BULLION POSITIONS</h2>
            <GlassCard style={{ padding: 0 }}>
              <PositionTable positions={portfolio?.positions?.filter((p: any) => p.symbol === 'XAUUSD') || []} />
            </GlassCard>
          </div>

          {/* Crypto Category */}
          <div>
            <h2 style={categoryHeaderStyle}>⚡ CRYPTO POSITIONS</h2>
            <GlassCard style={{ padding: 0 }}>
              <PositionTable positions={portfolio?.positions?.filter((p: any) => p.symbol !== 'XAUUSD') || []} />
            </GlassCard>
          </div>
        </div>

        {/* Distribution / Side Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={categoryHeaderStyle}>📊 ASSET MIX</h2>
          <GlassCard style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '160px', height: '160px', borderRadius: '50%', 
                border: '12px solid rgba(212,175,55,0.1)', borderTopColor: '#d4af37',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px'
              }}>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc' }}>94%</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>GOLD</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#d4af37' }} /> XAU
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(212,175,55,0.2)' }} /> CRYPTO
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

const categoryHeaderStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 900, color: '#475569', letterSpacing: '0.15em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px'
};

function PositionTable({ positions }: { positions: any[] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <th style={thStyle}>SYMBOL</th>
          <th style={thStyle}>SIDE</th>
          <th style={thStyle}>ENTRY</th>
          <th style={thStyle}>SIZE</th>
          <th style={thStyle}>PNL</th>
          <th style={thStyle}>TIME</th>
          <th style={thStyle}></th>
        </tr>
      </thead>
      <tbody>
        {positions.length > 0 ? positions.map((p: any, i: number) => (
          <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
            <td style={tdStyle}>
              <div style={{ fontWeight: 700, color: '#f8fafc' }}>{p.symbol}</div>
            </td>
            <td style={tdStyle}>
              <span style={{ 
                fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px',
                background: p.side === 'buy' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                color: p.side === 'buy' ? '#10b981' : '#ef4444',
                textTransform: 'uppercase'
              }}>{p.side}</span>
            </td>
            <td style={tdStyle}>${p.price.toFixed(2)}</td>
            <td style={tdStyle}>{p.size} Lots</td>
            <td style={{ ...tdStyle, color: '#10b981', fontWeight: 700 }}>+$420.00</td>
            <td style={tdStyle}>{new Date(p.timestamp).toLocaleTimeString()}</td>
            <td style={tdStyle}>
              <button style={{ 
                background: 'none', border: 'none', color: '#64748b', 
                cursor: 'pointer', padding: '8px', borderRadius: '8px' 
              }}>
                <MoreHorizontal size={20} />
              </button>
            </td>
          </tr>
        )) : (
          <tr>
            <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#475569' }}>
              No active positions in this category.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

const thStyle: React.CSSProperties = {
  padding: '16px 24px',
  fontSize: '11px',
  fontWeight: 800,
  color: '#475569',
  letterSpacing: '0.05em'
};

const tdStyle: React.CSSProperties = {
  padding: '16px 24px',
  fontSize: '13px',
  color: '#94a3b8',
  whiteSpace: 'nowrap'
};
