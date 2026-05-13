import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  fetchMarketData, fetchMacroData, fetchNews, 
  fetchPrediction, fetchSMCPatterns, fetchCryptoAssets, 
  fetchForexAssets, fetchPortfolio 
} from '../services/api';
import { useAuth } from '../context/AuthContext';

import AssetDetailsModal from '../components/AssetDetailsModal';
import Header from '../components/Header';
import MarketWatch from '../components/MarketWatch';
import SMCPanel from '../components/SMCPanel';
import MacroPanel from '../components/MacroPanel';
import EconomicCalendar from '../components/EconomicCalendar';
import Recommendations from '../components/Recommendations';
import CryptoSignals from '../components/CryptoSignals';
import ForexSignals from '../components/ForexSignals';
import CryptoTicker from '../components/CryptoTicker';
import GlassCard from '../components/GlassCard';
import RallyCapture from '../components/RallyCapture';
import { Zap, Shield, Activity, Clock } from 'lucide-react';

const REFETCH_INTERVAL = 5000;


const categoryHeaderStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 800,
  color: '#475569',
  letterSpacing: '0.12em',
  marginBottom: '16px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};
export default function Dashboard() {
  const [activeCategory, setActiveCategory] = useState<'XAUUSD' | 'CRYPTO' | 'FOREX'>('XAUUSD');
  const [focusedSymbol, setFocusedSymbol] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  const { user, refreshUser } = useAuth();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    
    // Periodically refresh user data (balance, etc)
    const interval = setInterval(() => {
      refreshUser();
    }, 30000); // every 30s
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(interval);
    };
  }, [refreshUser]);

  // Clear focused symbol when switching major categories
  React.useEffect(() => {
    setFocusedSymbol(null);
  }, [activeCategory]);

  const { data: tickers    } = useQuery({ queryKey: ['market', activeCategory],    queryFn: () => fetchMarketData(activeCategory),    refetchInterval: REFETCH_INTERVAL });
  const { data: prediction } = useQuery({ 
    queryKey: ['prediction', activeCategory, focusedSymbol], 
    queryFn: () => fetchPrediction(activeCategory, focusedSymbol || undefined), 
    refetchInterval: REFETCH_INTERVAL,
    enabled: !!focusedSymbol || activeCategory === 'XAUUSD'
  });
  const { data: patterns   } = useQuery({ queryKey: ['smc', activeCategory],       queryFn: () => fetchSMCPatterns(activeCategory),   refetchInterval: 15000 });
  const { data: macro      } = useQuery({ queryKey: ['macro'],      queryFn: fetchMacroData,     refetchInterval: REFETCH_INTERVAL });
  const { data: news       } = useQuery({ queryKey: ['news'],       queryFn: fetchNews,          refetchInterval: 60000 });
  const { data: crypto     } = useQuery({ queryKey: ['crypto'],     queryFn: fetchCryptoAssets,  refetchInterval: 15000 });
  const { data: forex      } = useQuery({ queryKey: ['forex'],      queryFn: fetchForexAssets,   refetchInterval: 15000 });
  const { data: portfolio  } = useQuery({ 
    queryKey: ['portfolio', user?.email],  
    queryFn: () => fetchPortfolio(user?.email),     
    refetchInterval: REFETCH_INTERVAL,
    enabled: !!user?.email
  });

  const now = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    day: '2-digit', month: 'short', year: 'numeric',
    hour12: true,
  }).format(new Date());

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: isMobile ? '0 16px 120px' : '16px 32px 32px' }}>
      <Header 
        lastUpdated={now} 
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
      />

      {focusedSymbol && (
        <AssetDetailsModal 
          symbol={focusedSymbol} 
          prediction={prediction} 
          onClose={() => setFocusedSymbol(null)} 
        />
      )}
      
      {/* Hero Section / Market Ticker Tape */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '32px' }}
      >
        <MarketWatch tickers={tickers || []} onAssetClick={(t) => setFocusedSymbol(t.symbol)} />
      </motion.div>

      {/* Main Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) 380px', gap: '32px' }}>
        
        {/* Left Column: Core Analysis */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Analysis Category */}
          <div>
            <h2 style={categoryHeaderStyle}>📊 MARKET INTELLIGENCE</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '24px' }}>
              <GlassCard 
                title={`🎯 Trading Signals ${focusedSymbol ? `— ${focusedSymbol}` : ''}`} 
                subtitle={activeCategory === 'CRYPTO' ? 'Top Spot Crypto Opportunities — ML Ranked' : activeCategory === 'FOREX' ? 'Top FX Pair Recommendations — LIVE' : 'Automated action recommendations'} 
                icon={<Shield size={18} />}
              >
                {activeCategory === 'CRYPTO' ? (
                  <CryptoSignals assets={crypto || []} onAssetClick={setFocusedSymbol} />
                ) : activeCategory === 'FOREX' ? (
                  <ForexSignals signals={forex || []} onAssetClick={setFocusedSymbol} />
                ) : (
                  prediction && <Recommendations prediction={prediction} />
                )}
              </GlassCard>
            </div>
          </div>

          {/* Asset Mix Category - Only show for Crypto */}
          {activeCategory === 'CRYPTO' && (
            <div>
              <h2 style={categoryHeaderStyle}>🔥 ASSET SELECTION</h2>
              <GlassCard title="🔥 HOT CRYPTO VOLUMES (24H)" subtitle="Top 100 most volatile cryptocurrencies" icon={<Activity size={18} />}>
                {crypto && <CryptoTicker assets={crypto} onAssetClick={(t) => setFocusedSymbol(t.symbol)} />}
              </GlassCard>
            </div>
          )}

          {/* Technicals Category - XAUUSD only */}
          {activeCategory === 'XAUUSD' && (
            <div>
              <h2 style={categoryHeaderStyle}>📐 TECHNICAL CONFLUENCE</h2>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr', gap: '24px' }}>
                <GlassCard title="Smart Money Concepts" subtitle="Institutional order blocks" icon={<Activity size={18} />}>
                  {patterns && <SMCPanel patterns={patterns} />}
                </GlassCard>

                <GlassCard title="Macro Pulse" subtitle="Fundamental correlations" icon={<Zap size={18} />}>
                  {macro && <MacroPanel metrics={macro} />}
                </GlassCard>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Execution & Events */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Rally Capture — top of right col for XAUUSD */}
          {activeCategory === 'XAUUSD' && tickers && (
            <GlassCard title="🚀 ML Rally Capture" subtitle="Real-time Buy & Sell Breakout Signals" icon={<Zap size={18} />}>
              <RallyCapture assets={tickers} onAssetClick={(t) => setFocusedSymbol(t)} />
            </GlassCard>
          )}

          {/* Wallet Activity — XAUUSD only */}
          {activeCategory === 'XAUUSD' && (
            <GlassCard title="💳 Wallet Activity" subtitle="Recent account execution" icon={<Clock size={18} />}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                {portfolio?.history?.length > 0 ? (
                  portfolio.history.slice(0, 5).map((h: any, i: number) => (
                    <div key={i} style={{ 
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>{h.action.toUpperCase()}</div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>{new Date(h.timestamp).toLocaleTimeString()}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#d4af37' }}>${h.price}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#475569', fontSize: '12px' }}>No recent activity.</div>
                )}
              </div>
            </GlassCard>
          )}

          {/* Economic Calendar — Hidden in FOREX */}
          {activeCategory !== 'FOREX' && (
            <GlassCard title="📅 Market Events" subtitle="High impact news schedule" icon={<Clock size={18} />}>
              {news && <EconomicCalendar news={news} />}
            </GlassCard>
          )}

          {/* Rally Capture — CRYPTO & FOREX */}
          {activeCategory === 'CRYPTO' && crypto && (
            <GlassCard title="🚀 ML Rally Capture" subtitle="Real-time Buy & Sell Breakout Signals" icon={<Zap size={18} />}>
              <RallyCapture assets={crypto} onAssetClick={(t) => setFocusedSymbol(t)} />
            </GlassCard>
          )}
          {activeCategory === 'FOREX' && forex && (
            <GlassCard title="🚀 ML Rally Capture" subtitle="Real-time Buy & Sell Breakout Signals" icon={<Zap size={18} />}>
              <RallyCapture assets={forex} onAssetClick={(t) => setFocusedSymbol(t)} />
            </GlassCard>
          )}



        </div>
      </div>
    </div>
  );
}
