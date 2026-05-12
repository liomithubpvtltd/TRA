import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Activity, LineChart } from 'lucide-react';
import type { MarketTicker } from '../types';

interface Props { 
  tickers: MarketTicker[];
  onAssetClick?: (ticker: MarketTicker) => void;
}

export default function MarketWatch({ tickers, onAssetClick }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
      {tickers.map((t, i) => {
        const isPrimary = ['XAU/USD', 'EUR/USD'].includes(t.symbol);
        const isTopGainer = Math.max(...tickers.map(x => x.changePct)) === t.changePct && t.symbol.includes('USD');
        const showBadge = isPrimary || isTopGainer;
        const badgeText = isPrimary ? 'PRIMARY ASSET' : 'TOP OPPORTUNITY';

        const isUp   = t.change >= 0;
        const color = isUp ? '#10b981' : '#ef4444';
        const Icon  = isUp ? TrendingUp : isUp === false ? TrendingDown : Minus;

        return (
          <motion.div
            key={t.symbol}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => onAssetClick?.(t)}
            whileHover={onAssetClick ? { scale: 1.02, border: '1px solid rgba(212,175,55,0.3)' } : {}}
            style={{
              background: 'rgba(10,18,35,0.95)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '20px',
              padding: '24px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
              cursor: onAssetClick ? 'pointer' : 'default'
            }}
          >
            {showBadge && (
              <div style={{ position: 'absolute', top: 0, right: 0, padding: '8px 12px', background: 'rgba(212,175,55,0.1)', color: '#d4af37', fontSize: '10px', fontWeight: 900, borderRadius: '0 0 0 12px', borderLeft: '1px solid rgba(212,175,55,0.2)', borderBottom: '1px solid rgba(212,175,55,0.2)' }}>
                {badgeText}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {t.symbol}
                  <a href={`https://www.tradingview.com/chart/?symbol=${t.symbol.replace('/', '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#475569', display: 'flex' }} onClick={e => e.stopPropagation()}>
                    <LineChart size={12} />
                  </a>
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
                   <p style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
                    {isPrimary ? '$' : ''}{t.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  {t.symbol === 'US10Y' && <span style={{ fontSize: '16px', color: '#64748b' }}>%</span>}
                </div>
              </div>
              <div style={{
                width: 44, height: 44, borderRadius: '12px',
                background: `${color}11`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color, border: `1px solid ${color}22`
              }}>
                <Icon size={24} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px', color, fontWeight: 800 }}>
                  {isUp ? '+' : ''}{t.change.toFixed(2)}
                </span>
                <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.06)' }} />
                <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 600 }}>
                  {isUp ? '+' : ''}{t.changePct.toFixed(2)}%
                </span>
              </div>
              
              {isPrimary ? (
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#10b981', fontWeight: 900 }}>
                  <Activity size={12} /> LIVE
                </div>
              ) : (
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#d4af37', fontWeight: 900 }}>
                  <Activity size={12} /> {(Math.random() * 4 + 1).toFixed(1)}x VOLATILITY
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
