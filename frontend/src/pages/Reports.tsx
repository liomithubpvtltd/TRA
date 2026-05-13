import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { 
  TrendingUp, 
  Download, 
  ChevronDown, 
  ChevronRight,
  Calendar,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchMarketData } from '../services/api';
import PnLChart from '../components/PnLChart';
import Header from '../components/Header';
import MarketWatch from '../components/MarketWatch';

export default function Reports() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'signals' | 'personal'>('signals');
  const [activeCategory, setActiveCategory] = useState<'XAUUSD' | 'CRYPTO' | 'FOREX'>('XAUUSD');
  const [expandedDates, setExpandedDates] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data: reportData } = useQuery({
    queryKey: ['reports-data', user?.email],
    queryFn: async () => {
      const resp = await axios.get(`http://localhost:8001/api/reports/all?email=${user?.email}`);
      return resp.data;
    },
    refetchInterval: 60000,
    enabled: !!user?.email
  });

  const { data: tickers } = useQuery({ 
    queryKey: ['market', activeCategory], 
    queryFn: () => fetchMarketData(activeCategory), 
    refetchInterval: 5000 
  });

  const toggleDate = (date: string) => {
    setExpandedDates(prev => prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]);
  };

  const signalStats = [
    { label: 'Signal Accuracy', value: '84.2%', color: '#14b8a6' },
    { label: 'Total Alpha', value: '+$12,420', color: '#14b8a6' },
    { label: 'DD Max', value: '4.8%', color: '#f43f5e' },
    { label: 'Strategy Efficiency', value: '1.42', color: '#64748b' },
  ];

  const personalStats = [
    { label: 'Investment', value: '$100,000', color: '#64748b' },
    { label: 'Available', value: `$${(user?.balance || 0).toLocaleString()}`, color: '#f8fafc' },
    { label: 'Net P&L', value: '+$4,220', color: '#14b8a6' },
    { label: 'Growth', value: '+5.02%', color: '#10b981' },
  ];

  const filteredSignals = useMemo(() => {
    if (!reportData?.signals) return [];
    return reportData.signals.filter((s: any) => {
      let matchCat = true;
      if (activeCategory === 'XAUUSD') matchCat = s.symbol.toLowerCase().includes('xau') || s.symbol.toLowerCase().includes('gold');
      else if (activeCategory === 'CRYPTO') matchCat = s.symbol.toLowerCase().includes('btc') || s.symbol.toLowerCase().includes('eth') || s.symbol.toLowerCase().includes('usdt');
      else if (activeCategory === 'FOREX') matchCat = (s.symbol.includes('/') || s.symbol.includes('USD')) && !s.symbol.toLowerCase().includes('usdt') && !s.symbol.toLowerCase().includes('xau');
      return matchCat;
    });
  }, [reportData, activeCategory]);

  const filteredTrades = useMemo(() => {
    if (!reportData?.trades) return [];
    return reportData.trades.filter((t: any) => {
      let matchCat = true;
      if (activeCategory === 'XAUUSD') matchCat = t.symbol.toLowerCase().includes('xau') || t.symbol.toLowerCase().includes('gold');
      else if (activeCategory === 'CRYPTO') matchCat = t.symbol.toLowerCase().includes('btc') || t.symbol.toLowerCase().includes('eth') || t.symbol.toLowerCase().includes('usdt');
      else if (activeCategory === 'FOREX') matchCat = (t.symbol.includes('/') || t.symbol.includes('USD')) && !t.symbol.toLowerCase().includes('usdt') && !t.symbol.toLowerCase().includes('xau');
      return matchCat;
    });
  }, [reportData, activeCategory]);

  const groupedSignalsByDate = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    filteredSignals.forEach((s: any) => {
      const date = new Date(s.timestamp).toLocaleDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(s);
    });
    return Object.entries(groups).map(([date, signals]) => ({ date, signals }));
  }, [filteredSignals]);

  return (
    <div style={{ ...containerStyle, padding: isMobile ? '0 16px 120px' : '0 24px 80px' }}>
      <Header 
        lastUpdated={new Date().toLocaleTimeString()} 
        activeCategory={activeCategory} 
        setActiveCategory={setActiveCategory} 
      />

      <div style={{ marginBottom: '32px' }}>
        <MarketWatch tickers={tickers || []} />
      </div>

      <header style={headerStyle(isMobile)}>
        <div>
          <h1 style={titleStyle(isMobile)}>Performance Reports</h1>
          <p style={subtitleStyle}>Deep-telemetry registers for signal efficiency and capital utilization.</p>
        </div>
        <div style={tabGroupStyle(isMobile)}>
          <button 
            style={tabButtonStyle(activeTab === 'signals')} 
            onClick={() => setActiveTab('signals')}
          >
            <Activity size={16} /> AI SIGNAL REPORT
          </button>
          <button 
            style={tabButtonStyle(activeTab === 'personal')} 
            onClick={() => setActiveTab('personal')}
          >
            <TrendingUp size={16} /> MY TRADES
          </button>
        </div>
      </header>

      {/* Stats Dynamic Row */}
      <div style={statsGridStyle}>
        {(activeTab === 'signals' ? signalStats : personalStats).map((s, i) => (
          <div key={i} style={statCardStyle}>
            <span style={statLabelStyle}>{s.label}</span>
            <span style={{ ...statValueStyle, color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      {activeTab === 'signals' ? (
        <div style={reportContentStyle}>
          <div style={chartWrapper}>
             <div style={chartHeader}>
               <h3 style={chartTitle}>Algorithmic Velocity</h3>
               {!isMobile && (
                 <div style={chartLegend}>
                   <div style={legendItem}><div style={dotStyle('#14b8a6')} /> Target Hits</div>
                   <div style={legendItem}><div style={dotStyle('#f43f5e')} /> SL Triggers</div>
                 </div>
               )}
             </div>
             <div style={{ height: '240px' }}>
                <PnLChart data={reportData?.equity_curve || []} />
             </div>
          </div>

          <div style={sectionsWrapper}>
             <div style={sectionHeaderRow}>
               <h2 style={sectionTitle}>DAILY SIGNAL AGGREGATION</h2>
               {!isMobile && (
                 <div style={filterGroup}>
                   <button style={filterBtn}><Calendar size={14} /> Date Range</button>
                   <button style={filterBtn}><Download size={14} /> Export XLS</button>
                 </div>
               )}
             </div>

             {/* Grouped Reports */}
             {groupedSignalsByDate.map((day: any) => {
                const totalPnL = day.signals.reduce((acc: number, s: any) => acc + (s.pnl_pct || 0), 0);
                return (
                  <div key={day.date} style={dayGroupWrapper}>
                    <div style={dayHeader} onClick={() => toggleDate(day.date)}>
                      <div style={dayHeaderLeft}>
                        {expandedDates.includes(day.date) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        <span style={dateString}>{day.date}</span>
                      </div>
                      <div style={dayHeaderRight}>
                        <span style={dayPnLStyle(totalPnL >= 0)}>{totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)}%</span>
                        <span style={dayCountText}>{day.signals.length} Signals</span>
                      </div>
                    </div>
                    
                    {expandedDates.includes(day.date) && (
                      <div style={dayTableWrapper}>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={reportTable}>
                            <thead>
                              <tr style={thRow}>
                                <th style={thStyle}>SYMBOL</th>
                                <th style={thStyle}>ACTION</th>
                                <th style={thStyle}>ENTRY</th>
                                <th style={thStyle}>TARGET</th>
                                <th style={thStyle}>EXIT</th>
                                <th style={thStyle}>STATUS</th>
                                <th style={thStyle}>PNL %</th>
                              </tr>
                            </thead>
                            <tbody>
                              {day.signals.map((sig: any, idx: number) => (
                                <tr key={idx} style={trRow}>
                                  <td style={tdSymbolStyle}>{sig.symbol}</td>
                                  <td style={tdStyle}><span style={actionBadge(sig.action)}>{sig.action}</span></td>
                                  <td style={tdStyle}>${sig.entry_price}</td>
                                  <td style={tdStyle}>${sig.target}</td>
                                  <td style={tdStyle}>${sig.exit_price || '—'}</td>
                                  <td style={tdStyle}><span style={statusBadge(sig.status)}>{sig.status}</span></td>
                                  <td style={tdPnLStyle(sig.pnl_pct >= 0)}>{sig.pnl_pct >= 0 ? '+' : ''}{sig.pnl_pct.toFixed(2)}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
             })}
          </div>
        </div>
      ) : (
        <div style={personalReportStyle}>
           <div style={summaryGrid(isMobile)}>
              <div style={summaryHalf}>
                 <h3 style={sectionTitle}>CAPITAL DISTRIBUTION</h3>
                 <div style={capitalBox}>
                   <div style={capRow}><span style={capLabel}>In Securities</span><span style={capVal}>$42,100</span></div>
                   <div style={capRow}><span style={capLabel}>In Derivatives</span><span style={capVal}>$12,500</span></div>
                   <div style={capRow}><span style={capLabel}>Unallocated Liquidity</span><span style={capVal}>$45,400</span></div>
                   <div style={capTotalRow}><span style={capTotalLabel}>Total Assets</span><span style={capTotalVal}>$100,000</span></div>
                 </div>
              </div>
              <div style={summaryHalf}>
                 <h3 style={sectionTitle}>RECENT TRANSCRIPTS</h3>
                 <div style={miniTradeLog}>
                    {filteredTrades.slice(0, 5).map((t: any, i: number) => (
                      <div key={i} style={miniTradeRow}>
                         <div style={miniTradeInfo}>
                           <span style={miniSym}>{t.symbol}</span>
                           <span style={miniDate}>{new Date(t.timestamp).toLocaleString()}</span>
                         </div>
                         <div style={miniTradeVal}>
                            <span style={miniSide(t.action)}>{t.action} {t.quantity}</span>
                            <span style={miniPrice}>${t.price.toLocaleString()}</span>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

// STYLES
const containerStyle: React.CSSProperties = { maxWidth: '1200px', margin: '0 auto' };
const headerStyle = (mobile: boolean): React.CSSProperties => ({ display: 'flex', flexDirection: mobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: mobile ? 'flex-start' : 'center', marginBottom: '40px', gap: mobile ? '20px' : '0' });
const titleStyle = (mobile: boolean): React.CSSProperties => ({ fontSize: mobile ? '28px' : '32px', fontWeight: 900, color: '#f8fafc', margin: 0 });
const subtitleStyle: React.CSSProperties = { color: '#64748b', fontSize: '14px', margin: '8px 0 0' };

const tabGroupStyle = (mobile: boolean): React.CSSProperties => ({ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', width: mobile ? '100%' : 'auto' });
const tabButtonStyle = (active: boolean): React.CSSProperties => ({
  flex: 1, background: active ? '#1e293b' : 'none', color: active ? '#f8fafc' : '#64748b', border: 'none', padding: '10px 16px', borderRadius: '10px', fontSize: '11px', fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
});

const statsGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '32px' };
const statCardStyle: React.CSSProperties = { background: 'rgba(5,10,20,0.3)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '4px' };
const statLabelStyle: React.CSSProperties = { fontSize: '10px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em' };
const statValueStyle: React.CSSProperties = { fontSize: '20px', fontWeight: 900 };

const reportContentStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '32px' };
const chartWrapper: React.CSSProperties = { background: 'rgba(10,18,35,0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '24px' };
const chartHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' };
const chartTitle: React.CSSProperties = { fontSize: '14px', fontWeight: 900, color: '#94a3b8', margin: 0, letterSpacing: '0.1em' };
const chartLegend: React.CSSProperties = { display: 'flex', gap: '16px' };
const legendItem: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 800, color: '#475569' };
const dotStyle = (color: string): React.CSSProperties => ({ width: 8, height: 8, borderRadius: '50%', background: color });

const sectionsWrapper: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '16px' };
const sectionHeaderRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' };
const sectionTitle: React.CSSProperties = { fontSize: '11px', fontWeight: 900, color: '#475569', letterSpacing: '0.15em' };
const filterGroup: React.CSSProperties = { display: 'flex', gap: '10px' };
const filterBtn: React.CSSProperties = { background: 'none', border: '1px solid rgba(255,255,255,0.05)', color: '#64748b', fontSize: '11px', fontWeight: 800, padding: '6px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' };

const dayGroupWrapper: React.CSSProperties = { background: 'rgba(10,18,35,0.4)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)', overflow: 'hidden' };
const dayHeader: React.CSSProperties = { padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'background 0.2s' };
const dayHeaderLeft: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px', color: '#94a3b8' };
const dateString: React.CSSProperties = { fontSize: '14px', fontWeight: 800, color: '#f8fafc' };
const dayHeaderRight: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '20px' };
const dayPnLStyle = (plus: boolean): React.CSSProperties => ({ fontSize: '14px', fontWeight: 900, color: plus ? '#14b8a6' : '#f43f5e' });
const dayCountText: React.CSSProperties = { fontSize: '11px', fontWeight: 800, color: '#475569', background: 'rgba(255,255,255,0.03)', padding: '4px 10px', borderRadius: '6px' };

const dayTableWrapper: React.CSSProperties = { borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.1)' };
const reportTable: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', minWidth: '600px' };
const thRow: React.CSSProperties = { background: 'rgba(0,0,0,0.2)' };
const thStyle: React.CSSProperties = { padding: '12px 24px', textAlign: 'left', fontSize: '10px', fontWeight: 900, color: '#475569', letterSpacing: '0.05em' };
const trRow: React.CSSProperties = { borderBottom: '1px solid rgba(255,255,255,0.02)' };
const tdStyle: React.CSSProperties = { padding: '14px 24px', fontSize: '13px', color: '#cbd5e1', fontWeight: 600 };
const tdSymbolStyle: React.CSSProperties = { ...tdStyle, color: '#f8fafc', fontWeight: 900 };
const tdPnLStyle = (plus: boolean): React.CSSProperties => ({ ...tdStyle, color: plus ? '#14b8a6' : '#f43f5e', fontWeight: 900 });

const actionBadge = (act: string): React.CSSProperties => ({
  fontSize: '9px', fontWeight: 900, padding: '3px 8px', borderRadius: '4px', background: act === 'BUY' ? 'rgba(20,184,166,0.1)' : 'rgba(244,63,94,0.1)', color: act === 'BUY' ? '#14b8a6' : '#f43f5e'
});

const statusBadge = (status: string): React.CSSProperties => {
  let color = '#64748b';
  let bg = 'rgba(100,116,139,0.1)';
  if (status === 'TARGET HIT') { color = '#14b8a6'; bg = 'rgba(20,184,166,0.1)'; }
  if (status === 'SL HIT') { color = '#f43f5e'; bg = 'rgba(244,63,94,0.1)'; }
  if (status === 'ACTIVE') { color = '#3b82f6'; bg = 'rgba(59,130,246,0.1)'; }
  return { fontSize: '9px', fontWeight: 900, padding: '3px 8px', borderRadius: '50px', background: bg, color };
};

const personalReportStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '32px' };
const summaryGrid = (mobile: boolean): React.CSSProperties => ({ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(2, 1fr)', gap: '24px' });
const summaryHalf: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '16px' };
const capitalBox: React.CSSProperties = { background: 'rgba(10,18,35,0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' };
const capRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const capLabel: React.CSSProperties = { fontSize: '13px', color: '#94a3b8', fontWeight: 500 };
const capVal: React.CSSProperties = { fontSize: '14px', color: '#f8fafc', fontWeight: 800 };
const capTotalRow: React.CSSProperties = { ...capRow, marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' };
const capTotalLabel: React.CSSProperties = { fontSize: '14px', fontWeight: 900, color: '#f8fafc' };
const capTotalVal: React.CSSProperties = { fontSize: '18px', fontWeight: 900, color: '#14b8a6' };

const miniTradeLog: React.CSSProperties = { background: 'rgba(10,18,35,0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '1px' };
const miniTradeRow: React.CSSProperties = { padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '12px', transition: 'background 0.2s', cursor: 'default' };
const miniTradeInfo: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '4px' };
const miniSym: React.CSSProperties = { fontSize: '14px', fontWeight: 900, color: '#f8fafc' };
const miniDate: React.CSSProperties = { fontSize: '10px', color: '#475569', fontWeight: 700 };
const miniTradeVal: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' };
const miniSide = (side: string): React.CSSProperties => ({ fontSize: '10px', fontWeight: 900, color: side === 'BUY' ? '#14b8a6' : '#f43f5e' });
const miniPrice: React.CSSProperties = { fontSize: '13px', fontWeight: 800, color: '#94a3b8' };
