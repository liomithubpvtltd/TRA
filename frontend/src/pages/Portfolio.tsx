import React, { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { 
  ExternalLink,
  Target,
  Shield,
  Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchMarketData } from '../services/api';
import Header from '../components/Header';
import MarketWatch from '../components/MarketWatch';

interface Holding {
  id: number;
  symbol: string;
  stock_name: string;
  exchange: string;
  quantity: number;
  entry_price: number;
  live_price: number;
  pnl: number;
  side: string;
  auto_sl_price: number | null;
  auto_target_price: number | null;
  auto_ema_enabled: boolean;
}

export default function Portfolio() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<'XAUUSD' | 'CRYPTO' | 'FOREX'>('XAUUSD');
  const [positions, setPositions] = useState<Holding[]>([]);
  const [metrics, setMetrics] = useState<any>({ total_value: 0, total_pnl: 0, day_pnl: 0 });
  const [notification, setNotification] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data: portfolioData, isLoading } = useQuery({ 
    queryKey: ['portfolio-holdings', user?.email], 
    queryFn: async () => {
      const resp = await axios.get(`http://localhost:8001/api/trading/portfolio?email=${user?.email}`);
      return resp.data;
    },
    refetchInterval: 5000,
    enabled: !!user?.email
  });

  const { data: tickers } = useQuery({ 
    queryKey: ['market', activeCategory], 
    queryFn: () => fetchMarketData(activeCategory), 
    refetchInterval: 5000 
  });

  useEffect(() => {
    if (portfolioData) {
      setPositions(portfolioData.holdings || []);
      setMetrics({
        total_value: portfolioData.total_value || 0,
        total_pnl: portfolioData.total_pnl || 0,
        day_pnl: portfolioData.day_pnl || 0
      });
    }
  }, [portfolioData]);

  const updateAutomation = async (id: number, field: string, value: any) => {
    try {
      await axios.post(`http://localhost:8001/api/trading/update-holding-automation/${id}`, { [field]: value });
      setNotification(`Automation updated: ${field.toUpperCase()}`);
      setTimeout(() => setNotification(null), 3000);
    } catch (e) {
      setNotification("Failed to update automation.");
    }
  };

  const closePosition = async (id: number) => {
    try {
      await axios.post(`http://localhost:8001/api/trading/execute`, { position_id: id, action: 'CLOSE' });
      setNotification("Position closure initiated.");
      setTimeout(() => setNotification(null), 3000);
    } catch (e) {
      setNotification("Execution failure.");
    }
  };

  const capitalStats = [
    { label: 'Initial Capital', value: `$100,000.00`, color: '#64748b' },
    { label: 'Available Cash', value: `$${(user?.balance || 0).toLocaleString()}`, color: '#94a3b8' },
    { label: 'Market Value', value: `$${metrics.total_value.toLocaleString()}`, color: '#94a3b8' },
    { label: 'Net Liquidity', value: `$${((user?.balance || 0) + metrics.total_value).toLocaleString()}`, color: '#f8fafc' },
  ];

  const filteredPositions = useMemo(() => {
    return positions.filter(p => {
      let matchCat = true;
      if (activeCategory === 'XAUUSD') matchCat = p.symbol.toLowerCase().includes('xau') || p.symbol.toLowerCase().includes('gold');
      else if (activeCategory === 'CRYPTO') matchCat = p.symbol.toLowerCase().includes('btc') || p.symbol.toLowerCase().includes('eth') || p.symbol.toLowerCase().includes('usdt');
      else if (activeCategory === 'FOREX') matchCat = (p.symbol.includes('/') || p.symbol.includes('USD')) && !p.symbol.toLowerCase().includes('usdt') && !p.symbol.toLowerCase().includes('xau');
      return matchCat;
    });
  }, [positions, activeCategory]);

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

      {notification && (
        <div style={toastStyle}>{notification}</div>
      )}

      <header style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Holdings & Valuation</h1>
          <p style={subtitleStyle}>Track active positions and aggregate valuation parameters across the matrix.</p>
        </div>
      </header>

      {/* Capital Matrix (Row 1) */}
      <div style={capitalGridStyle}>
        {capitalStats.map((s, i) => (
          <div key={i} style={capitalCardStyle}>
            <span style={capLabelStyle}>{s.label}</span>
            <span style={{ ...capValueStyle, color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Highlighted PnL (Row 2) */}
      <div style={pnlGridStyle}>
        <div style={pnlCardStyle()}>
          <div style={pnlHeaderStyle}>
            <span style={pnlLabelStyle}>DAY'S P&L</span>
            <div style={pnlBadgeStyle(metrics.day_pnl >= 0)}>Realized Today</div>
          </div>
          <span style={pnlValueStyle(metrics.day_pnl >= 0)}>
            {metrics.day_pnl >= 0 ? '+' : '-'} ${Math.abs(metrics.day_pnl).toLocaleString()}
          </span>
          <div style={pnlBar(metrics.day_pnl >= 0)} />
        </div>

        <div style={pnlCardStyle()}>
          <div style={pnlHeaderStyle}>
            <span style={pnlLabelStyle}>HOLDING P&L</span>
            <div style={pnlBadgeStyle(metrics.total_pnl >= 0)}>Unrealized</div>
          </div>
          <span style={pnlValueStyle(metrics.total_pnl >= 0)}>
            {metrics.total_pnl >= 0 ? '+' : '-'} ${Math.abs(metrics.total_pnl).toLocaleString()}
          </span>
          <div style={pnlBar(metrics.total_pnl >= 0)} />
        </div>
      </div>

      <h2 style={sectionHeaderStyle}>ACTIVE POSITIONS</h2>

      {isLoading ? (
        <div style={loadingStyle}>Retuning Neural Channels...</div>
      ) : filteredPositions.length === 0 ? (
        <div style={emptyStyle}>No active positions for this category.</div>
      ) : (
        <div style={positionsGridStyle(isMobile)}>
          {filteredPositions.map((p) => (
            <div key={p.id} style={posCardStyle}>
              <div style={posCardHeader}>
                <div>
                  <span style={exchBadgeStyle}>{p.exchange}</span>
                  <div style={symbolRow}>
                    <h4 style={posSymbolStyle}>{p.symbol}</h4>
                    <a href={`https://tradingview.com/chart/?symbol=${p.symbol}`} target="_blank" rel="noreferrer" style={tvIconStyle}>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                  <span style={posNameStyle}>{p.stock_name}</span>
                </div>
                <span style={qtyBadgeStyle}>{p.quantity} Lots</span>
              </div>

              {/* Price Matrix */}
              <div style={priceGridStyle}>
                <div style={priceItem}>
                  <span style={priceLabel}>AVG PRICE</span>
                  <span style={priceValue}>${p.entry_price.toFixed(2)}</span>
                </div>
                <div style={priceItemCenter}>
                  <span style={priceLabel}>LTP</span>
                  <span style={priceValueLive}>${p.live_price.toFixed(2)}</span>
                </div>
                <div style={priceItemEnd}>
                  <span style={priceLabel}>PNL</span>
                  <span style={pnlText(p.pnl >= 0)}>${p.pnl.toFixed(2)}</span>
                </div>
              </div>

              {/* Automation Console */}
              <div style={autoConsoleStyle}>
                <div style={autoHeader}>
                  <span style={autoLabel}>AUTOMATION CONTROLS</span>
                  <div style={emaToggleRow}>
                    <span style={emaLabel}>20EMA</span>
                    <button 
                      style={toggleStyle(p.auto_ema_enabled)}
                      onClick={() => updateAutomation(p.id, 'ema', !p.auto_ema_enabled)}
                    >
                      <div style={toggleCircle(p.auto_ema_enabled)} />
                    </button>
                  </div>
                </div>
                <div style={autoInputsGrid}>
                   <div style={inputContainer(p.auto_sl_price !== null, '#f43f5e')}>
                      <div style={inputLabelRow}>
                        <span style={inputLabelStyle}>AUTO SL</span>
                        <Shield size={10} color={p.auto_sl_price ? '#f43f5e' : '#475569'} />
                      </div>
                      <input 
                        type="number" 
                        placeholder="Limit" 
                        defaultValue={p.auto_sl_price || ""} 
                        onBlur={(e) => updateAutomation(p.id, 'sl', e.target.value)}
                        style={inputStyle}
                      />
                   </div>
                   <div style={inputContainer(p.auto_target_price !== null, '#14b8a6')}>
                      <div style={inputLabelRow}>
                        <span style={inputLabelStyle}>AUTO TARGET</span>
                        <Target size={10} color={p.auto_target_price ? '#14b8a6' : '#475569'} />
                      </div>
                      <input 
                        type="number" 
                        placeholder="Profit" 
                        defaultValue={p.auto_target_price || ""} 
                        onBlur={(e) => updateAutomation(p.id, 'target', e.target.value)}
                        style={inputStyle}
                      />
                   </div>
                </div>
              </div>

              <div style={actionRow}>
                <button style={closeBtnStyle} onClick={() => closePosition(p.id)}>CLOSE POSITION</button>
                <button style={panicBtnStyle}><Zap size={14} /> LIQUIDATE</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// STYLES
const containerStyle: React.CSSProperties = { maxWidth: '1200px', margin: '0 auto' };
const headerStyle: React.CSSProperties = { marginBottom: '32px' };
const titleStyle: React.CSSProperties = { fontSize: '32px', fontWeight: 900, color: '#f8fafc', margin: 0 };
const subtitleStyle: React.CSSProperties = { color: '#64748b', margin: '8px 0 0', fontSize: '14px', fontWeight: 500 };

const capitalGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '16px' };
const capitalCardStyle: React.CSSProperties = { background: 'rgba(5,10,20,0.3)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column' };
const capLabelStyle: React.CSSProperties = { fontSize: '10px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em' };
const capValueStyle: React.CSSProperties = { fontSize: '18px', fontWeight: 800, marginTop: '4px' };

const pnlGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' };
const pnlCardStyle = (): React.CSSProperties => ({
  background: 'rgba(10,18,35,0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '24px', position: 'relative', overflow: 'hidden'
});
const pnlHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const pnlLabelStyle: React.CSSProperties = { fontSize: '11px', fontWeight: 900, color: '#94a3b8', letterSpacing: '0.2em' };
const pnlBadgeStyle = (plus: boolean): React.CSSProperties => ({
  fontSize: '9px', fontWeight: 900, padding: '3px 8px', borderRadius: '6px', background: plus ? 'rgba(20,184,166,0.1)' : 'rgba(244,63,94,0.1)', color: plus ? '#14b8a6' : '#f43f5e'
});
const pnlValueStyle = (plus: boolean): React.CSSProperties => ({ fontSize: '32px', fontWeight: 900, marginTop: '12px', display: 'block', color: plus ? '#14b8a6' : '#f43f5e', letterSpacing: '-0.03em' });
const pnlBar = (plus: boolean): React.CSSProperties => ({ position: 'absolute', bottom: 0, left: 0, height: '4px', width: '100%', background: plus ? '#14b8a6' : '#f43f5e', opacity: 0.4 });

const sectionHeaderStyle: React.CSSProperties = { fontSize: '14px', fontWeight: 900, color: '#f8fafc', marginBottom: '16px' };
const positionsGridStyle = (mobile: boolean): React.CSSProperties => ({ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(2, 1fr)', gap: '24px' });

const posCardStyle: React.CSSProperties = { background: 'rgba(10,18,35,0.8)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' };
const posCardHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' };
const exchBadgeStyle: React.CSSProperties = { fontSize: '9px', fontWeight: 900, background: '#1e293b', color: '#64748b', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' };
const symbolRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' };
const posSymbolStyle: React.CSSProperties = { fontSize: '20px', fontWeight: 900, color: '#f8fafc', margin: 0 };
const posNameStyle: React.CSSProperties = { fontSize: '12px', fontWeight: 500, color: '#64748b' };
const qtyBadgeStyle: React.CSSProperties = { fontSize: '12px', fontWeight: 900, background: 'rgba(255,255,255,0.05)', color: '#f8fafc', padding: '6px 12px', borderRadius: '10px' };

const priceGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', background: 'rgba(0,0,0,0.2)', borderRadius: '14px', padding: '16px', border: '1px solid rgba(255,255,255,0.03)' };
const priceItem: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '4px' };
const priceItemCenter: React.CSSProperties = { ...priceItem, alignItems: 'center' };
const priceItemEnd: React.CSSProperties = { ...priceItem, alignItems: 'flex-end' };
const priceLabel: React.CSSProperties = { fontSize: '9px', fontWeight: 800, color: '#475569', letterSpacing: '0.05em' };
const priceValue: React.CSSProperties = { fontSize: '14px', fontWeight: 800, color: '#cbd5e1' };
const priceValueLive: React.CSSProperties = { fontSize: '14px', fontWeight: 900, color: '#f8fafc' };
const pnlText = (plus: boolean): React.CSSProperties => ({ fontSize: '14px', fontWeight: 900, color: plus ? '#14b8a6' : '#f43f5e' });

const autoConsoleStyle: React.CSSProperties = { background: 'rgba(0,0,0,0.3)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.03)', overflow: 'hidden' };
const autoHeader: React.CSSProperties = { padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.03)' };
const autoLabel: React.CSSProperties = { fontSize: '9px', fontWeight: 900, color: '#64748b', letterSpacing: '0.1em' };
const emaToggleRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px' };
const emaLabel: React.CSSProperties = { fontSize: '8px', fontWeight: 900, color: '#475569' };

const toggleStyle = (on: boolean): React.CSSProperties => ({
  width: '24px', height: '12px', borderRadius: '12px', background: on ? '#14b8a6' : '#1e293b', border: 'none', position: 'relative', cursor: 'pointer', transition: 'all 0.2s'
});
const toggleCircle = (on: boolean): React.CSSProperties => ({
  width: '8px', height: '8px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', left: on ? '14px' : '2px', transition: 'all 0.2s'
});

const autoInputsGrid: React.CSSProperties = { padding: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' };
const inputContainer = (active: boolean, color: string): React.CSSProperties => ({
  padding: '10px', borderRadius: '10px', border: `1px solid ${active ? color + '40' : 'rgba(255,255,255,0.05)'}`, background: active ? color + '08' : 'none'
});
const inputLabelRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' };
const inputLabelStyle: React.CSSProperties = { fontSize: '8px', fontWeight: 900, color: '#475569' };
const inputStyle: React.CSSProperties = { background: 'none', border: 'none', fontSize: '13px', fontWeight: 800, color: '#f8fafc', width: '100%', outline: 'none' };

const actionRow: React.CSSProperties = { display: 'flex', gap: '12px' };
const closeBtnStyle: React.CSSProperties = { flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)', fontWeight: 800, fontSize: '11px', letterSpacing: '0.05em', cursor: 'pointer' };
const panicBtnStyle: React.CSSProperties = { padding: '12px 18px', borderRadius: '12px', background: '#1e293b', color: '#64748b', border: '1px solid rgba(255,255,255,0.05)', fontWeight: 800, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' };

const toastStyle: React.CSSProperties = { position: 'fixed', top: '70px', right: '24px', background: 'rgba(20,184,166,0.9)', color: '#fff', padding: '12px 24px', borderRadius: '12px', fontWeight: 800, fontSize: '13px', zIndex: 1000, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' };
const tvIconStyle: React.CSSProperties = { color: '#475569', display: 'flex' };
const loadingStyle: React.CSSProperties = { padding: '100px', textAlign: 'center', color: '#475569', fontWeight: 700 };
const emptyStyle: React.CSSProperties = { padding: '100px', textAlign: 'center', color: '#475569', border: '2px dashed rgba(255,255,255,0.05)', borderRadius: '24px' };
