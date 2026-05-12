import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addManualPosition } from '../services/api';
import type { Prediction } from '../types';
import { Shield, Clock, ArrowRight, Zap, Info, LineChart } from 'lucide-react';

interface Props {
  prediction: Prediction;
}

export default function Recommendations({ prediction }: Props) {
  const queryClient = useQueryClient();
  const [qty, setQty] = useState(1);
  
  const mutation = useMutation({
    mutationFn: ({ symbol, side, price }: { symbol: string, side: string, price: number }) => 
      addManualPosition(symbol, side, price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      alert("Trade executed successfully!");
    },
    onError: (err: any) => alert("Execution failed: " + (err.message || 'Unknown error'))
  });

  const isBuy = prediction.trend.toLowerCase().includes('bullish');
  const action = isBuy ? 'BUY' : 'SELL';
  const actionColor = isBuy ? '#10b981' : '#ef4444';

  const entryPrice = prediction.entry_price || 2350.45;
  const currentPrice = entryPrice - 2.33; // Mocking slightly off entry
  const gain = prediction.current_gain || -1.2;

  const executeTrade = () => {
    let sym = 'XAUUSD';
    if (prediction.asset_name?.includes('BTC')) sym = 'BTCUSD';
    if (prediction.asset_name?.includes('EUR')) sym = 'EURUSD';
    mutation.mutate({ symbol: sym, side: isBuy ? 'buy' : 'sell', price: entryPrice });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
       {/* Recommendation Card */}
       <div style={{
         background: 'rgba(5, 11, 20, 0.95)',
         border: '1px solid rgba(255, 255, 255, 0.05)',
         borderRadius: '24px',
         padding: '28px',
         boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
         position: 'relative',
         overflow: 'hidden'
       }}>
         {/* Top Accent Bar */}
         <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: `linear-gradient(90deg, ${actionColor}, transparent)` }} />

         {/* Header */}
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
             <div style={{
               width: 48, height: 48, borderRadius: '14px',
               background: `linear-gradient(135deg, ${actionColor}22, rgba(0,0,0,0))`,
               display: 'flex', alignItems: 'center', justifyContent: 'center',
               border: `1px solid ${actionColor}33`, color: actionColor, fontSize: '20px', fontWeight: 900
             }}>
               {prediction.asset_name?.[0] || 'G'}
             </div>
             <div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {prediction.asset_name || 'XAU/USD (Gold)'}
                  <a href={`https://www.tradingview.com/chart/?symbol=${(prediction.asset_name || 'XAU/USD').split(' ')[0].replace('/', '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#64748b', display: 'flex' }}>
                    <LineChart size={16} />
                  </a>
                  <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', color: '#64748b' }}>H1 SIGNAL</span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#d4af37', marginTop: '2px' }}>
                  ${currentPrice.toLocaleString()} <span style={{ color: gain >= 0 ? '#10b981' : '#ef4444', fontSize: '12px' }}>{gain >= 0 ? '+' : ''}{gain}%</span>
                </div>
             </div>
           </div>
           <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', letterSpacing: '0.1em' }}>DATE & TIME</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0', marginTop: '4px' }}>12/05/2026 14:30</div>
           </div>
         </div>

         {/* Signal Table */}
         <div style={{ 
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', 
            background: 'rgba(255,255,255,0.03)', borderRadius: '12px', overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px'
         }}>
            {[
              { label: 'ACTION', value: action, color: actionColor },
              { label: 'ENTRY PRICE', value: `$${entryPrice.toFixed(2)}` },
              { label: 'TARGET 1', value: `$${prediction.targets?.[0]?.toFixed(2) || '2370.00'}` },
              { label: 'PROBABILITY', value: `${Math.max(prediction.buy_probability, prediction.sell_probability)}%` },
            ].map((cell, i) => (
              <div key={i} style={{ background: 'rgba(5, 11, 20, 0.6)', padding: '16px' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>{cell.label}</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: cell.color || '#f8fafc' }}>{cell.value}</div>
              </div>
            ))}
         </div>

         {/* Secondary Stats */}
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
            <div style={statBoxStyle}>
              <div style={statLabelStyle}><Shield size={12} /> STOPLOSS</div>
              <div style={{ ...statValueStyle, color: '#ef4444' }}>${prediction.stop_loss?.toFixed(2) || '2335.00'}</div>
            </div>
            <div style={statBoxStyle}>
              <div style={statLabelStyle}><Zap size={12} /> AI SCORE</div>
              <div style={statValueStyle}>{prediction.score || 8}/10</div>
            </div>
            <div style={statBoxStyle}>
              <div style={statLabelStyle}><Clock size={12} /> DURATION</div>
              <div style={statValueStyle}>{prediction.duration || '3-15 Days'}</div>
            </div>
         </div>

         {/* Targets Row */}
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
            <div style={statBoxStyle}>
              <div style={statLabelStyle}>TARGET 2</div>
              <div style={statValueStyle}>${prediction.targets?.[1]?.toFixed(2) || '2400.00'}</div>
            </div>
            <div style={statBoxStyle}>
              <div style={statLabelStyle}>TARGET 3</div>
              <div style={statValueStyle}>${prediction.targets?.[2]?.toFixed(2) || '2450.00'}</div>
            </div>
            <div style={statBoxStyle}>
              <div style={statLabelStyle}>HOLDING QTY</div>
              <div style={statValueStyle}>100 units</div>
            </div>
         </div>

         {/* Micro Details */}
         <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', marginBottom: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                <div>
                   <div style={statLabelStyle}>RR RATIO</div>
                   <div style={statValueStyle}>{prediction.rr_ratio || '1:3'}</div>
                </div>
                <div>
                   <div style={statLabelStyle}>SESSION BIAS</div>
                   <div style={statValueStyle}>{prediction.session_bias || 'Neutral'}</div>
                </div>
                <div>
                   <div style={statLabelStyle}>CONFLUENCE</div>
                   <div style={statValueStyle}>{prediction.confluence_score || 85}%</div>
                </div>
            </div>
            {prediction.execution_log && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                    <div style={statLabelStyle}>EXECUTION LOG</div>
                    <ul style={{ margin: '8px 0 0 16px', padding: 0, color: '#94a3b8', fontSize: '11px', lineHeight: '1.6' }}>
                        {prediction.execution_log.map((log, i) => (
                            <li key={i}>{log}</li>
                        ))}
                    </ul>
                </div>
            )}
         </div>

         {/* Action Bar */}
         <div style={{ 
           display: 'flex', gap: '16px', alignItems: 'center', 
           paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' 
         }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input 
                 type="number" value={qty} onChange={e => setQty(+e.target.value)}
                 style={qtyInputStyle}
              />
              <span style={{ position: 'absolute', left: '12px', top: '-8px', fontSize: '10px', background: '#050b14', color: '#64748b', padding: '0 4px', fontWeight: 700 }}>QUANTITY (LOTS)</span>
            </div>
            <button 
              onClick={executeTrade}
              disabled={mutation.isPending}
              style={{
                ...placeOrderBtnStyle,
                background: isBuy ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #b91c1c)',
                opacity: mutation.isPending ? 0.7 : 1,
                cursor: mutation.isPending ? 'wait' : 'pointer'
              }}
            >
              {mutation.isPending ? 'EXECUTING...' : `PLACE ${action} ORDER`} <ArrowRight size={16} />
            </button>
         </div>

         <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '11px' }}>
            <Info size={12} /> Always ensure stop-loss is placed at the suggested institutional liquidity level.
         </div>
       </div>
    </div>
  );
}

const statBoxStyle: React.CSSProperties = {
  borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px'
};

const statLabelStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 800, color: '#475569', marginBottom: '4px'
};

const statValueStyle: React.CSSProperties = {
  fontSize: '15px', fontWeight: 800, color: '#e2e8f0'
};

const qtyInputStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '10px', padding: '14px', color: '#f8fafc', fontSize: '15px', fontWeight: 800, outline: 'none'
};

const placeOrderBtnStyle: React.CSSProperties = {
  flex: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
  border: 'none', padding: '16px', borderRadius: '12px', color: '#fff', fontWeight: 900,
  fontSize: '14px', letterSpacing: '0.05em', boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
  transition: 'transform 0.2s'
};
