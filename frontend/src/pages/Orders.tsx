import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { 
  ClipboardList, 
  BarChart3, 
  TrendingUp, 
  History, 
  Filter, 
  Download,
  ExternalLink,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchMarketData } from '../services/api';
import Header from '../components/Header';
import GlassCard from '../components/GlassCard';
import MarketWatch from '../components/MarketWatch';

interface OrderRecord {
  id: number;
  symbol: string;
  stock_name: string;
  trade_type: string;
  quantity: number;
  price: number;
  status: string;
  timestamp: string;
}

export default function Orders() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<'XAUUSD' | 'CRYPTO' | 'FOREX'>('XAUUSD');
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data: portfolioData, isLoading } = useQuery({ 
    queryKey: ['orders-history', user?.email], 
    queryFn: async () => {
      const resp = await axios.get(`http://localhost:8001/api/trading/orders?email=${user?.email}`);
      return resp.data;
    },
    refetchInterval: 30000,
    enabled: !!user?.email
  });

  const { data: tickers } = useQuery({ 
    queryKey: ['market', activeCategory], 
    queryFn: () => fetchMarketData(activeCategory), 
    refetchInterval: 5000 
  });

  useEffect(() => {
    if (portfolioData) {
      setOrders(portfolioData.orders || []);
    }
  }, [portfolioData]);

  const stats = [
    { label: 'Total Trades', value: orders.length, icon: <ClipboardList size={18} /> },
    { label: 'Success Rate', value: '72.5%', icon: <TrendingUp size={18} /> },
    { label: 'Profit Factor', value: '1.68', icon: <BarChart3 size={18} /> },
    { label: 'Avg PnL', value: '+$245.10', icon: <History size={18} /> },
  ];

  const exportCSV = () => {
    const headers = "ID,Symbol,Action,Quantity,Price,Status,Time\n";
    const rows = orders.map(o => `${o.id},${o.symbol},${o.trade_type},${o.quantity},${o.price},${o.status},${o.timestamp}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'vision_order_journal.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filteredOrders = orders.filter(o => {
    let matchCat = true;
    if (activeCategory === 'XAUUSD') matchCat = o.symbol.toLowerCase().includes('xau') || o.symbol.toLowerCase().includes('gold');
    else if (activeCategory === 'CRYPTO') matchCat = o.symbol.toLowerCase().includes('btc') || o.symbol.toLowerCase().includes('eth') || o.symbol.toLowerCase().includes('usdt');
    else if (activeCategory === 'FOREX') matchCat = (o.symbol.includes('/') || o.symbol.includes('USD')) && !o.symbol.toLowerCase().includes('usdt') && !o.symbol.toLowerCase().includes('xau');
    return matchCat;
  });

  return (
    <div className="orders-container" style={{ ...containerStyle, padding: isMobile ? '0 16px 120px' : '0 24px 80px' }}>
      <Header 
        lastUpdated={new Date().toLocaleTimeString()} 
        activeCategory={activeCategory} 
        setActiveCategory={setActiveCategory} 
      />

      <div style={{ marginBottom: '32px' }}>
        <MarketWatch tickers={tickers || []} />
      </div>

      <header style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Order Journals</h1>
          <p style={subtitleStyle}>Review execution boundaries mapped dynamically across time periods.</p>
        </div>
        <div style={btnGroupStyle}>
          <button style={actionBtnStyle}><Filter size={16} /> Filters</button>
          <button style={actionBtnStyle} onClick={exportCSV}><Download size={16} /> Export CSV</button>
        </div>
      </header>

      {/* Analytics Matrix */}
      <div style={matrixGridStyle}>
        {stats.map((stat, i) => (
          <GlassCard key={i} delay={i * 0.05} style={matrixCardStyle}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={iconWrapperStyle}>{stat.icon}</div>
                <div>
                  <div style={statLabelStyle}>{stat.label}</div>
                  <div style={statValueStyle}>{stat.value}</div>
                </div>
             </div>
          </GlassCard>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 style={sectionHeaderStyle}>EXECUTION LOGS</h2>
        <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
          {isLoading ? (
            <div style={loadingContainerStyle}>
              <div className="pulse-loader"></div>
              <span>Retrieving Transaction Registers...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div style={emptyStateStyle}>No transactional history for this category.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr style={trHeaderStyle}>
                    <th style={thStyle}>Date & Time</th>
                    <th style={thStyle}>Symbol</th>
                    <th style={thStyle}>Action</th>
                    <th style={thStyle}>Quantity</th>
                    <th style={thStyle}>Price</th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} style={trRowStyle}>
                      <td style={tdStyle}>
                        <div style={dateTimeWrapper}>
                          <span style={dateText}>{new Date(order.timestamp).toLocaleDateString()}</span>
                          <span style={timeText}>{new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={symbolText}>{order.symbol}</span>
                          <a 
                            href={`https://www.tradingview.com/chart/?symbol=${order.symbol}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={tvLinkStyle}
                          >
                            <ExternalLink size={10} />
                          </a>
                        </div>
                        <span style={stockNameText}>{order.stock_name}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={actionBadgeStyle(order.trade_type)}>
                          {order.trade_type}
                        </span>
                      </td>
                      <td style={tdCenterStyle}>{order.quantity}</td>
                      <td style={tdCenterStyle}>${order.price.toLocaleString()}</td>
                      <td style={tdCenterStyle}>
                        <span style={statusBadgeStyle}>{order.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Pagination Simulation */}
      <div style={paginationFooter}>
        <button style={pageBtnStyle}><ChevronLeft size={16} /></button>
        <span style={pageIndicator}>PAGE 1 OF 1</span>
        <button style={pageBtnStyle}><ChevronRight size={16} /></button>
      </div>
    </div>
  );
}

// STYLES
const containerStyle: React.CSSProperties = { maxWidth: '1200px', margin: '0 auto' };
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' };
const titleStyle: React.CSSProperties = { fontSize: '32px', fontWeight: 900, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' };
const subtitleStyle: React.CSSProperties = { color: '#64748b', margin: '8px 0 0', fontSize: '14px', fontWeight: 500 };
const btnGroupStyle: React.CSSProperties = { display: 'flex', gap: '12px' };

const actionBtnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
  color: '#cbd5e1', padding: '10px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center',
  gap: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
};

const matrixGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '40px' };
const matrixCardStyle: React.CSSProperties = { padding: '24px', border: '1px solid rgba(255,255,255,0.03)' };
const iconWrapperStyle: React.CSSProperties = { padding: '10px', borderRadius: '10px', background: 'rgba(20,184,166,0.1)', color: '#14b8a6' };
const statLabelStyle: React.CSSProperties = { fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' };
const statValueStyle: React.CSSProperties = { fontSize: '24px', fontWeight: 900, color: '#f8fafc', marginTop: '2px' };

const sectionHeaderStyle: React.CSSProperties = { fontSize: '11px', fontWeight: 900, color: '#475569', letterSpacing: '0.15em', marginBottom: '16px', textTransform: 'uppercase' };

const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' };
const trHeaderStyle: React.CSSProperties = { background: 'rgba(5,10,20,0.4)', borderBottom: '1px solid rgba(255,255,255,0.05)' };
const thStyle: React.CSSProperties = { padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' };
const trRowStyle: React.CSSProperties = { borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.2s' };
const tdStyle: React.CSSProperties = { padding: '12px 24px' };
const tdCenterStyle: React.CSSProperties = { ...tdStyle, textAlign: 'center', fontWeight: 700, color: '#e2e8f0' };

const dateTimeWrapper: React.CSSProperties = { display: 'flex', flexDirection: 'column' };
const dateText: React.CSSProperties = { fontSize: '13px', fontWeight: 700, color: '#94a3b8' };
const timeText: React.CSSProperties = { fontSize: '10px', fontWeight: 800, color: '#475569', marginTop: '2px' };

const symbolText: React.CSSProperties = { fontSize: '14px', fontWeight: 800, color: '#f8fafc' };
const stockNameText: React.CSSProperties = { display: 'block', fontSize: '10px', fontWeight: 600, color: '#64748b' };
const tvLinkStyle: React.CSSProperties = { padding: '4px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#64748b', display: 'flex' };

const actionBadgeStyle = (type: string): React.CSSProperties => ({
  fontSize: '10px', fontWeight: 900, padding: '4px 10px', borderRadius: '6px', textTransform: 'uppercase',
  background: type === 'BUY' ? 'rgba(20,184,166,0.1)' : 'rgba(244,63,94,0.1)',
  color: type === 'BUY' ? '#14b8a6' : '#f43f5e',
  border: `1px solid ${type === 'BUY' ? 'rgba(20,184,166,0.2)' : 'rgba(244,63,94,0.2)'}`
});

const statusBadgeStyle: React.CSSProperties = {
  fontSize: '10px', fontWeight: 800, padding: '3px 8px', background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: '4px'
};

const loadingContainerStyle: React.CSSProperties = { padding: '60px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: '#94a3b8' };
const emptyStateStyle: React.CSSProperties = { padding: '60px', textAlign: 'center', color: '#64748b', fontWeight: 600 };

const paginationFooter: React.CSSProperties = { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '32px' };
const pageBtnStyle: React.CSSProperties = { background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '8px', borderRadius: '10px', cursor: 'pointer' };
const pageIndicator: React.CSSProperties = { fontSize: '11px', fontWeight: 800, color: '#475569', letterSpacing: '0.1em' };
