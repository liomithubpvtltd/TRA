import { motion } from 'framer-motion';
import type { SMCPattern } from '../types';

interface Props { patterns: SMCPattern[] }

const typeColors: Record<SMCPattern['type'], string> = {
  BOS:       '#10b981',
  CHOCH:     '#f59e0b',
  OB:        '#3b82f6',
  Liquidity: '#a855f7',
  FVG:       '#ec4899',
};

const typeLabels: Record<SMCPattern['type'], string> = {
  BOS:       'Break of Structure',
  CHOCH:     'Change of Character',
  OB:        'Order Block',
  Liquidity: 'Liquidity Zone',
  FVG:       'Fair Value Gap',
};

export default function SMCPanel({ patterns }: Props) {
  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>
        🏛️ Smart Money Concepts
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {patterns.map((p, i) => {
          const color = typeColors[p.type];
          const strengthOpacity = p.strength === 'Strong' ? 1 : p.strength === 'Medium' ? 0.7 : 0.45;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: strengthOpacity, x: 0 }}
              transition={{ delay: i * 0.1 }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px',
                background: `${color}0d`,
                border: `1px solid ${color}33`,
                borderLeft: `3px solid ${color}`,
                borderRadius: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color, letterSpacing: '0.05em' }}>
                      {p.type}
                    </span>
                    <span style={{
                      fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
                      background: p.direction === 'bullish' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                      color: p.direction === 'bullish' ? '#10b981' : '#ef4444',
                      fontWeight: '600',
                    }}>
                      {p.direction.toUpperCase()}
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                    {typeLabels[p.type]}
                    {p.type === 'BOS' || p.type === 'CHOCH' ? (['15M', '1H'].includes(p.timeframe) ? ' (Internal)' : ' (External)') : ''}
                  </p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc', fontVariantNumeric: 'tabular-nums' }}>
                  {p.level > 100 ? '$' : ''}{p.level.toFixed(4)}
                </div>
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', marginTop: '2px' }}>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>{p.timeframe}</span>
                  <span style={{
                    fontSize: '10px', fontWeight: '600',
                    color: p.strength === 'Strong' ? '#10b981' : p.strength === 'Medium' ? '#d4af37' : '#64748b',
                  }}>
                    · {p.strength}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Liquidity Heatmap */}
      <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#475569', letterSpacing: '0.1em', marginBottom: '12px' }}>LIQUIDITY HEATMAP</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '6px 12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '6px' }}>
             <span>Sell-Side Liquidity (Premium)</span>
             <span style={{ fontWeight: 800 }}>High Density</span>
           </div>
           <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '6px 12px', background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: '6px' }}>
             <span>Buy-Side Liquidity (Discount)</span>
             <span style={{ fontWeight: 800 }}>Medium Density</span>
           </div>
        </div>
      </div>
    </div>
  );
}
