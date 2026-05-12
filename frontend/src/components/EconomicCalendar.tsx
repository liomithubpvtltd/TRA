import { motion } from 'framer-motion';
import type { NewsItem } from '../types';
import { Flame, Minus, AlertCircle } from 'lucide-react';

interface Props { news: NewsItem[] }

const impactConfig = {
  HIGH:   { color: '#ef4444', Icon: Flame,        bg: 'rgba(239,68,68,0.1)'  },
  MEDIUM: { color: '#f59e0b', Icon: AlertCircle,  bg: 'rgba(245,158,11,0.1)' },
  LOW:    { color: '#64748b', Icon: Minus,         bg: 'rgba(100,116,139,0.1)'},
};

const sentimentConfig = {
  bullish: { color: '#10b981', label: '↑ Bullish' },
  bearish: { color: '#ef4444', label: '↓ Bearish' },
  neutral: { color: '#94a3b8', label: '→ Neutral' },
};

export default function EconomicCalendar({ news }: Props) {
  if (!news) return null;
  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>
        📅 Economic Calendar
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {news.map((item, i) => {
          const { color, Icon, bg } = impactConfig[item.impact];
          const sent = sentimentConfig[item.sentiment];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 14px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '10px',
                gap: '12px',
              }}
            >
              {/* Left: time + impact */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '42px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {item.time}
                </span>
                <div style={{ marginTop: '4px', background: bg, borderRadius: '6px', padding: '3px 6px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Icon size={10} color={color} />
                  <span style={{ fontSize: '9px', color, fontWeight: '700' }}>{item.impact}</span>
                </div>
              </div>

              {/* Center: event name + description */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '10px', padding: '1px 5px', borderRadius: '4px',
                    background: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)',
                    fontWeight: '700',
                  }}>
                    {item.currency}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>{item.event}</span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px' }}>{item.title}</p>
              </div>

              {/* Right: sentiment */}
              <span style={{ fontSize: '11px', fontWeight: '700', color: sent.color, minWidth: '60px', textAlign: 'right' }}>
                {sent.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
