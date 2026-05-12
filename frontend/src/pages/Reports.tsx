import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Download, TrendingUp, TrendingDown, BarChart2, RefreshCw } from 'lucide-react';
import { fetchPortfolio } from '../services/api';
import Header from '../components/Header';

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */
function exportToCSV(rows: any[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]).join(',');
  const body    = rows.map(r => Object.values(r).join(',')).join('\n');
  const blob    = new Blob([`${headers}\n${body}`], { type: 'text/csv' });
  const url     = URL.createObjectURL(blob);
  const a       = document.createElement('a');
  a.href        = url;
  a.download    = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */
export default function Reports() {
  const [dateFrom, setDateFrom]     = useState('');
  const [dateTo,   setDateTo]       = useState('');
  const [symbolFilter, setSymbolFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [activeCategory, setActiveCategory] = useState<'XAUUSD'|'CRYPTO'|'FOREX'>('XAUUSD');

  const { data: portfolio, isLoading, refetch } = useQuery({
    queryKey: ['portfolio'],
    queryFn:  fetchPortfolio,
    refetchInterval: 10000,
  });

  const history: any[] = portfolio?.history || [];
  const positions: any[] = portfolio?.positions || [];

  /* filtered rows */
  const filtered = useMemo(() => {
    return history.filter(h => {
      const ts = new Date(h.timestamp);
      if (dateFrom && ts < new Date(dateFrom)) return false;
      if (dateTo   && ts > new Date(dateTo + 'T23:59:59')) return false;
      if (symbolFilter && !h.action?.toUpperCase().includes(symbolFilter.toUpperCase())) return false;
      if (actionFilter !== 'ALL' && !h.action?.toUpperCase().includes(actionFilter)) return false;
      return true;
    });
  }, [history, dateFrom, dateTo, symbolFilter, actionFilter]);

  /* summary stats */
  const totalTrades = filtered.length;
  const buys  = filtered.filter(h => h.action?.toUpperCase().includes('BUY')).length;
  const sells = filtered.filter(h => h.action?.toUpperCase().includes('SELL')).length;
  const totalVolume = filtered.reduce((s, h) => s + (h.price || 0), 0);

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px', padding: '10px 14px', color: '#f8fafc', fontSize: '12px',
    fontWeight: 600, outline: 'none', width: '100%', colorScheme: 'dark',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: '10px', fontWeight: 800, color: '#475569', textTransform: 'uppercase',
    letterSpacing: '0.08em', marginBottom: '6px', display: 'block',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#050b14', color: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '16px 32px 48px' }}>
        <Header
          lastUpdated={new Date().toLocaleString()}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
        />

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          {/* Page Title */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#f8fafc', margin: 0 }}>
              📋 Trade Reports
            </h1>
            <p style={{ color: '#64748b', fontSize: '13px', marginTop: '6px' }}>
              Full execution history — filter, analyse and export
            </p>
          </div>

          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
            {[
              { label: 'Total Trades',   value: totalTrades,             color: '#d4af37', icon: <BarChart2 size={18} /> },
              { label: 'Buy Orders',     value: buys,                    color: '#10b981', icon: <TrendingUp size={18} /> },
              { label: 'Sell Orders',    value: sells,                   color: '#ef4444', icon: <TrendingDown size={18} /> },
              { label: 'Volume (notional)', value: `$${totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: '#94a3b8', icon: <BarChart2 size={18} /> },
            ].map(({ label, value, color, icon }) => (
              <div key={label} style={{
                background: 'rgba(10,18,35,0.95)', border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '18px', padding: '22px', display: 'flex', alignItems: 'center', gap: '16px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
              }}>
                <div style={{ width: 42, height: 42, borderRadius: '12px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                  {icon}
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color, marginTop: '2px' }}>{value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{
            background: 'rgba(10,18,35,0.95)', border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '18px', padding: '24px', marginBottom: '24px',
            display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 1fr auto', gap: '16px', alignItems: 'end',
          }}>
            <div>
              <label style={labelStyle}>From Date</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>To Date</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Search Action / Symbol</label>
              <input type="text" placeholder="e.g. BUY, XAUUSD…" value={symbolFilter} onChange={e => setSymbolFilter(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Order Type</label>
              <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} style={inputStyle}>
                <option value="ALL">All</option>
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
                <option value="PAPER">Paper</option>
                <option value="LIVE">Live</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => refetch()}
                style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '10px', padding: '10px', cursor: 'pointer', color: '#d4af37', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <RefreshCw size={16} />
              </button>
              <button
                onClick={() => exportToCSV(filtered.map(h => ({ action: h.action, price: h.price, details: h.details, timestamp: h.timestamp })), `vision_trades_${Date.now()}.csv`)}
                style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', padding: '10px 16px', cursor: 'pointer', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '12px' }}
              >
                <Download size={15} /> Export CSV
              </button>
            </div>
          </div>

          {/* Trade History Table */}
          <div style={{
            background: 'rgba(10,18,35,0.95)', border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '18px', overflow: 'hidden',
          }}>
            {/* Table Header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.2fr 1fr 2fr',
              padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
              fontSize: '10px', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.10em',
            }}>
              <div>Action / Type</div><div>Price</div><div>Symbol</div><div>Status</div><div>Timestamp</div>
            </div>

            {/* Rows */}
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '48px', color: '#475569' }}>Loading trade history…</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: '#475569', fontSize: '13px' }}>
                No trades match your filters. Execute trades from the dashboard to see them here.
              </div>
            ) : (
              filtered.map((h, i) => {
                const isBuy  = h.action?.toUpperCase().includes('BUY');
                const isSell = h.action?.toUpperCase().includes('SELL');
                const isLive = h.action?.toUpperCase().includes('LIVE');
                const actionColor = isBuy ? '#10b981' : isSell ? '#ef4444' : '#d4af37';
                const sym = h.details?.match(/symbol[:\s]+([A-Z/]+)/i)?.[1] ||
                            (h.action?.includes('/') ? h.action.split(' ')[0] : '—');

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.01 }}
                    style={{
                      display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.2fr 1fr 2fr',
                      padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.03)',
                      alignItems: 'center',
                    }}
                  >
                    {/* Action */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800,
                        background: `${actionColor}15`, color: actionColor, border: `1px solid ${actionColor}33`,
                      }}>
                        {h.action?.toUpperCase() || '—'}
                      </span>
                    </div>

                    {/* Price */}
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>
                      ${Number(h.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>

                    {/* Symbol extracted from details */}
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>{sym}</div>

                    {/* Status badge */}
                    <div>
                      <span style={{
                        padding: '2px 7px', borderRadius: '5px', fontSize: '10px', fontWeight: 800,
                        background: isLive ? 'rgba(16,185,129,0.1)' : 'rgba(212,175,55,0.1)',
                        color: isLive ? '#10b981' : '#d4af37',
                        border: `1px solid ${isLive ? 'rgba(16,185,129,0.2)' : 'rgba(212,175,55,0.2)'}`,
                      }}>
                        {isLive ? 'LIVE' : 'PAPER'}
                      </span>
                    </div>

                    {/* Timestamp */}
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                      {new Date(h.timestamp).toLocaleString()}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Open Positions */}
          {positions.length > 0 && (
            <div style={{ marginTop: '32px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 900, color: '#d4af37', marginBottom: '16px', letterSpacing: '0.08em' }}>
                📌 OPEN POSITIONS
              </h2>
              <div style={{ background: 'rgba(10,18,35,0.95)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '18px', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '10px', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.10em' }}>
                  <div>Symbol</div><div>Side</div><div>Entry Price</div><div>Size</div><div>Status</div>
                </div>
                {positions.map((p: any, i: number) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.03)', alignItems: 'center' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>{p.symbol}</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: p.side === 'buy' ? '#10b981' : '#ef4444' }}>{p.side?.toUpperCase()}</div>
                    <div style={{ fontSize: '13px', color: '#d4af37', fontWeight: 800 }}>${Number(p.price || 0).toLocaleString()}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{p.size}</div>
                    <span style={{ padding: '2px 7px', borderRadius: '5px', fontSize: '10px', fontWeight: 800, background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', width: 'fit-content' }}>{p.status?.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
