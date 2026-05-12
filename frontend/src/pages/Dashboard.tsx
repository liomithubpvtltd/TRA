import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  fetchMarketData, fetchMacroData, fetchNews, 
  fetchPrediction, fetchSMCPatterns, fetchCryptoAssets, fetchPortfolio 
} from '../services/api';

import Header from '../components/Header';
import MarketWatch from '../components/MarketWatch';
import PredictionEngine from '../components/PredictionEngine';
import SMCPanel from '../components/SMCPanel';
import MacroPanel from '../components/MacroPanel';
import EconomicCalendar from '../components/EconomicCalendar';
import Recommendations from '../components/Recommendations';
import CryptoSignals from '../components/CryptoSignals';
import ForexSignals from '../components/ForexSignals';
import MLTrainingEngine from '../components/MLTrainingEngine';
import CryptoTicker from '../components/CryptoTicker';
import GlassCard from '../components/GlassCard';
import CapitalManagement from '../components/CapitalManagement';
import { Zap, Shield, Activity, Clock } from 'lucide-react';

const REFETCH_INTERVAL = 5000;

function AssetDetailsModal({ prediction, onClose }: { prediction: any, onClose: () => void }) {
  if (!prediction) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
      padding: '24px'
    }} onClick={onClose}>
      <div style={{ maxWidth: '800px', width: '100%' }} onClick={e => e.stopPropagation()}>
         <GlassCard title="🧠 AI Prediction Engine (Detailed)" subtitle="Institutional grade signal analysis" icon={<Zap size={20} />}>
            <div style={{ padding: '20px' }}>
              <PredictionEngine prediction={prediction} />
              <button 
                onClick={onClose}
                style={{
                  width: '100%', marginTop: '32px', padding: '16px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.05)', color: '#f8fafc', fontWeight: 700,
                  border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer'
                }}
              >CLOSE PREVIEW</button>
            </div>
         </GlassCard>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState<'XAUUSD' | 'CRYPTO' | 'FOREX'>('XAUUSD');

  const { data: tickers   } = useQuery({ queryKey: ['market', activeCategory],     queryFn: () => fetchMarketData(activeCategory),    refetchInterval: REFETCH_INTERVAL });
  const { data: prediction} = useQuery({ queryKey: ['prediction', activeCategory], queryFn: () => fetchPrediction(activeCategory),    refetchInterval: REFETCH_INTERVAL });
  const { data: patterns  } = useQuery({ queryKey: ['smc', activeCategory],        queryFn: () => fetchSMCPatterns(activeCategory),   refetchInterval: 15000 });
  const { data: macro     } = useQuery({ queryKey: ['macro'],      queryFn: fetchMacroData,     refetchInterval: REFETCH_INTERVAL });
  const { data: news      } = useQuery({ queryKey: ['news'],       queryFn: fetchNews,          refetchInterval: 60000 });
  const { data: crypto    } = useQuery({ queryKey: ['crypto'],     queryFn: fetchCryptoAssets,  refetchInterval: 15000 });
  const { data: portfolio } = useQuery({ queryKey: ['portfolio'],  queryFn: fetchPortfolio,     refetchInterval: REFETCH_INTERVAL });

  const now = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    day: '2-digit', month: 'short', year: 'numeric',
    hour12: true,
  }).format(new Date());

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '16px 32px 32px' }}>
      <Header 
        lastUpdated={now} 
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
      />
      
      {selectedAsset && <AssetDetailsModal prediction={prediction} onClose={() => setSelectedAsset(null)} />}

      {/* Hero Section / Market Ticker Tape */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '32px' }}
      >
        <MarketWatch tickers={tickers || []} onAssetClick={(t) => setSelectedAsset(t)} />
      </motion.div>

      {/* Main Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '32px' }}>
        
        {/* Left Column: Core Analysis */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Analysis Category */}
          <div>
            <h2 style={categoryHeaderStyle}>📊 MARKET INTELLIGENCE</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '24px' }}>
              <GlassCard title="🎯 Trading Signals" subtitle={activeCategory === 'CRYPTO' ? 'Top Spot Crypto Opportunities — ML Ranked' : activeCategory === 'FOREX' ? 'Top FX Pair Recommendations' : 'Automated action recommendations'} icon={<Shield size={18} />}>
                {activeCategory === 'CRYPTO' ? (
                  <CryptoSignals assets={crypto || []} />
                ) : activeCategory === 'FOREX' ? (
                  <ForexSignals />
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
                {crypto && <CryptoTicker assets={crypto} />}
              </GlassCard>
            </div>
          )}

          {/* Technicals Category - XAUUSD only */}
          {activeCategory === 'XAUUSD' && (
            <div>
              <h2 style={categoryHeaderStyle}>📐 TECHNICAL CONFLUENCE</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
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
          
          {/* Capital + Wallet — XAUUSD only */}
          {activeCategory === 'XAUUSD' && (
            <>
              <CapitalManagement balance={portfolio?.balance || 124530.42} />

              {/* Quick Portfolio Stats */}
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
            </>
          )}

          {/* Economic Calendar — Hidden in FOREX */}
          {activeCategory !== 'FOREX' && (
            <GlassCard title="📅 Market Events" subtitle="High impact news schedule" icon={<Clock size={18} />}>
              {news && <EconomicCalendar news={news} />}
            </GlassCard>
          )}

          {/* ML Auto-training Widget */}
          <MLTrainingEngine />

        </div>
      </div>
    </div>
  );
}

const categoryHeaderStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 900, color: '#475569', letterSpacing: '0.15em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px'
};
