import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPortfolio } from '../services/api';
import GlassCard from '../components/GlassCard';
import { ClipboardList, BarChart3, TrendingUp, History, Filter, Download } from 'lucide-react';

export default function Orders() {
  const { data: portfolio } = useQuery({ 
    queryKey: ['portfolio'], 
    queryFn: fetchPortfolio, 
    refetchInterval: 10000 
  });

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '40px 24px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>Trade History</h1>
          <p style={{ color: '#64748b', margin: '8px 0 0' }}>Comprehensive log of AI-executed and manual orders</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={actionBtnStyle}><Filter size={16} /> Filters</button>
          <button style={actionBtnStyle}><Download size={16} /> Export CSV</button>
        </div>
      </header>

      {/* Analytics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        {[
          { label: 'Total Trades', value: '1,242', icon: <ClipboardList size={18} /> },
          { label: 'Win Rate', value: '68.4%', icon: <TrendingUp size={18} /> },
          { label: 'Profit Factor', value: '1.42', icon: <BarChart3 size={18} /> },
          { label: 'Avg Trade', value: '+$142.10', icon: <History size={18} /> },
        ].map((stat, i) => (
          <GlassCard key={i} delay={i * 0.05} style={{ padding: '20px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
               <div style={{ color: '#d4af37' }}>{stat.icon}</div>
               <div>
                 <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{stat.label}</div>
                 <div style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>{stat.value}</div>
               </div>
             </div>
          </GlassCard>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        <div>
          <h2 style={categoryHeaderStyle}>🆕 RECENT SESSIONS</h2>
          <GlassCard style={{ padding: 0 }}>
             <OrderTable orders={portfolio?.history?.slice(0, 5) || []} />
          </GlassCard>
        </div>

        <div>
          <h2 style={categoryHeaderStyle}>📜 ARCHIVED TRADES</h2>
          <GlassCard style={{ padding: 0 }}>
             <OrderTable orders={portfolio?.history?.slice(5) || []} />
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

const actionBtnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
  color: '#f8fafc', padding: '10px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center',
  gap: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer'
};

const categoryHeaderStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 900, color: '#475569', letterSpacing: '0.15em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px'
};

function OrderTable({ orders }: { orders: any[] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <th style={thStyle}>ID</th>
          <th style={thStyle}>SYMBOL</th>
          <th style={thStyle}>ACTION</th>
          <th style={thStyle}>PRICE</th>
          <th style={thStyle}>EXECUTION</th>
          <th style={thStyle}>STATUS</th>
          <th style={thStyle}>TIMESTAMP</th>
        </tr>
      </thead>
      <tbody>
        {orders.length > 0 ? orders.map((h: any, i: number) => (
          <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
            <td style={tdStyle}>#{Math.floor(Math.random() * 9000 + 1000)}</td>
            <td style={tdStyle}><span style={{ fontWeight: 700, color: '#f8fafc' }}>XAUUSD</span></td>
            <td style={tdStyle}>
              <span style={{ 
                fontSize: '10px', fontWeight: 900, padding: '3px 8px', borderRadius: '4px',
                background: h.action.includes('buy') || h.action.includes('opened') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                color: h.action.includes('buy') || h.action.includes('opened') ? '#10b981' : '#ef4444',
                textTransform: 'uppercase'
              }}>{h.action.replace('_', ' ')}</span>
            </td>
            <td style={{ ...tdStyle, color: '#d4af37', fontWeight: 700 }}>${h.price.toFixed(2)}</td>
            <td style={tdStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: h.details.includes('Auto') ? '#10b981' : '#3b82f6' }} />
                {h.details.includes('Auto') ? 'AI Auto' : 'Manual'}
              </div>
            </td>
            <td style={tdStyle}>
              <span style={{ color: '#10b981', fontWeight: 700 }}>FILLED</span>
            </td>
            <td style={tdStyle}>{new Date(h.timestamp).toLocaleString()}</td>
          </tr>
        )) : (
          <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#475569' }}>No orders in this category.</td></tr>
        )}
      </tbody>
    </table>
  );
}

const thStyle: React.CSSProperties = {
  padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: '#475569', letterSpacing: '0.05em'
};

const tdStyle: React.CSSProperties = {
  padding: '16px 24px', fontSize: '13px', color: '#94a3b8', whiteSpace: 'nowrap'
};
