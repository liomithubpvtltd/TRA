import { motion } from 'framer-motion';
import type { MacroData } from '../types';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface Props { metrics: MacroData }

export default function MacroPanel({ metrics }: Props) {
  if (!metrics || !metrics.session) return null;
  const macro = metrics;
  const sessionColors: Record<MacroData['session'], string> = {
    'London':     '#3b82f6',
    'New York':   '#10b981',
    'Tokyo':      '#f59e0b',
    'Sydney':     '#a855f7',
    'Pre-Market': '#64748b',
  };
  const sessionColor = sessionColors[macro.session];

  const rows: { label: string; value: string; change: string; trend: 'up' | 'down'; goldImpact: 'bullish' | 'bearish' }[] = [
    {
      label: 'DXY Index',
      value: macro.dxy.value.toFixed(2),
      change: `${macro.dxy.change > 0 ? '+' : ''}${macro.dxy.change.toFixed(2)}`,
      trend: macro.dxy.trend,
      goldImpact: macro.dxy.trend === 'down' ? 'bullish' : 'bearish',
    },
    {
      label: 'US 10Y Yield',
      value: `${macro.us10y.value.toFixed(2)}%`,
      change: `${macro.us10y.change > 0 ? '+' : ''}${macro.us10y.change.toFixed(2)}`,
      trend: macro.us10y.trend,
      goldImpact: macro.us10y.trend === 'down' ? 'bullish' : 'bearish',
    },
    {
      label: 'VIX',
      value: macro.vix.toFixed(2),
      change: '',
      trend: macro.vix > 18 ? 'up' : 'down',
      goldImpact: macro.vix > 18 ? 'bullish' : 'bearish',
    },
  ];

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
          🌐 Macro Dashboard
        </h2>
        <div style={{
          background: `${sessionColor}22`,
          border: `1px solid ${sessionColor}55`,
          color: sessionColor,
          padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: '700',
        }}>
          {macro.session} Session
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {rows.map((r, i) => {
          const impactColor = r.goldImpact === 'bullish' ? '#10b981' : '#ef4444';
          const ArrowIcon = r.trend === 'up' ? TrendingUp : TrendingDown;
          return (
            <motion.div
              key={r.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 16px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>{r.label}</p>
                <p style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{r.value}</p>
                {r.change && (
                  <p style={{ fontSize: '12px', color: r.trend === 'down' ? '#ef4444' : '#10b981', marginTop: '2px' }}>{r.change}</p>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                <ArrowIcon size={20} color={r.trend === 'up' ? '#10b981' : '#ef4444'} />
                <span style={{
                  fontSize: '10px', fontWeight: '700',
                  padding: '2px 8px', borderRadius: '99px',
                  background: `${impactColor}22`,
                  color: impactColor,
                  border: `1px solid ${impactColor}44`,
                }}>
                  {r.goldImpact === 'bullish' ? '↑ Gold Bull' : '↓ Gold Bear'}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
