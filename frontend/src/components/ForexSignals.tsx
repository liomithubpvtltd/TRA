import { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, LineChart } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addManualPosition } from '../services/api';

interface ForexSignal {
  symbol: string;
  name: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  score: number; // /100
  ema_status: 'Bullish' | 'Bearish' | 'Neutral';
  trend: string;
  support: number;
  resistance: number;
  current_price: number;
}

const mockForexSignals: ForexSignal[] = [
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', action: 'SELL', score: 88, ema_status: 'Bearish', trend: 'Strong Down', support: 1.0710, resistance: 1.0850, current_price: 1.0785 },
  { symbol: 'GBP/USD', name: 'British Pound / US Dollar', action: 'SELL', score: 82, ema_status: 'Bearish', trend: 'Down', support: 1.2500, resistance: 1.2680, current_price: 1.2590 },
  { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', action: 'BUY', score: 79, ema_status: 'Bullish', trend: 'Strong Up', support: 149.50, resistance: 152.00, current_price: 150.80 },
  { symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar', action: 'HOLD', score: 55, ema_status: 'Neutral', trend: 'Sideways', support: 0.6450, resistance: 0.6600, current_price: 0.6520 },
  { symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', action: 'BUY', score: 72, ema_status: 'Bullish', trend: 'Up', support: 1.3400, resistance: 1.3650, current_price: 1.3530 },
  { symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc', action: 'HOLD', score: 45, ema_status: 'Neutral', trend: 'Sideways', support: 0.8800, resistance: 0.8950, current_price: 0.8870 },
];

export default function ForexSignals() {
  const [signals] = useState<ForexSignal[]>(mockForexSignals);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ symbol, side, price }: { symbol: string, side: string, price: number }) => 
      addManualPosition(symbol, side, price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      alert("FX Trade executed successfully!");
    },
    onError: (err: any) => alert("FX Execution failed: " + (err.message || 'Unknown error'))
  });

  const executeTrade = (sig: ForexSignal) => {
    if (sig.action === 'HOLD') return;
    if (window.confirm(`Execute live ${sig.action} for ${sig.symbol} at ${sig.current_price}?`)) {
      mutation.mutate({ symbol: sig.symbol, side: sig.action.toLowerCase(), price: sig.current_price });
    }
  };

  // Sort by score descending
  const sorted = [...signals].sort((a, b) => b.score - a.score);

  return (
    <div style={{
      background: 'rgba(5, 11, 20, 0.4)',
      borderRadius: '20px',
      overflow: 'hidden'
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr 1fr 1fr 1fr 1fr', gap: '8px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '10px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        <div>Pair</div>
        <div>Score</div>
        <div>Action</div>
        <div>Tech (EMA)</div>
        <div>Trend Momentum</div>
        <div>Price</div>
        <div style={{ textAlign: 'right' }}>Sup / Res</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
        {sorted.map((sig, i) => {
          const isBuy = sig.action === 'BUY';
          const isSell = sig.action === 'SELL';
          const actionColor = isBuy ? '#10b981' : isSell ? '#ef4444' : '#d4af37';

          return (
            <motion.div
              key={sig.symbol}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => executeTrade(sig)}
              style={{
                display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr 1fr 1fr 1fr 1fr', gap: '8px', alignItems: 'center',
                padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.03)',
                cursor: sig.action === 'HOLD' ? 'default' : 'pointer'
              }}
              whileHover={sig.action === 'HOLD' ? {} : { background: 'rgba(255,255,255,0.05)', border: `1px solid ${actionColor}44` }}
            >
              {/* Asset */}
              <div>
                 <div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                   {sig.symbol}
                   <a href={`https://www.tradingview.com/chart/?symbol=${sig.symbol.replace('/', '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#475569', display: 'flex' }} onClick={e => e.stopPropagation()}>
                     <LineChart size={12} />
                   </a>
                 </div>
                 <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{sig.name}</div>
              </div>

              {/* Score */}
              <div style={{ fontSize: '14px', fontWeight: 900, color: sig.score >= 80 ? '#10b981' : sig.score <= 40 ? '#ef4444' : '#d4af37' }}>
                 {sig.score}/100
              </div>

              {/* Action */}
              <div>
                 <span style={{
                    padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800,
                    background: `${actionColor}15`, color: actionColor, border: `1px solid ${actionColor}33`
                 }}>
                    {sig.action}
                 </span>
              </div>

              {/* EMA Status */}
              <div style={{ fontSize: '12px', fontWeight: 700, color: sig.ema_status === 'Bullish' ? '#10b981' : sig.ema_status === 'Bearish' ? '#ef4444' : '#94a3b8' }}>
                 {sig.ema_status}
              </div>

              {/* Trend */}
              <div>
                 <div style={{ fontSize: '11px', fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Activity size={10} color="#64748b" /> {sig.trend}
                 </div>
              </div>

              {/* Price */}
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>
                 {sig.current_price.toLocaleString(undefined, { minimumFractionDigits: 3 })}
              </div>

              {/* Support / Resistance */}
              <div style={{ textAlign: 'right' }}>
                 <div style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444' }}>R: {sig.resistance.toLocaleString(undefined, { minimumFractionDigits: 3 })}</div>
                 <div style={{ fontSize: '10px', fontWeight: 600, color: '#10b981', marginTop: '2px' }}>S: {sig.support.toLocaleString(undefined, { minimumFractionDigits: 3 })}</div>
              </div>

            </motion.div>
          )
        })}
      </div>
    </div>
  );
}
