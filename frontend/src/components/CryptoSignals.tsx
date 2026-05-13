import { motion } from 'framer-motion';
import { Activity, LineChart } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addManualPosition } from '../services/api';

interface LiveCryptoAsset {
  symbol: string;
  price: number;
  changePct: number;
  volume: number;
  ml_score?: number;
}

interface Props {
  assets: LiveCryptoAsset[];
  onAssetClick?: (symbol: string) => void;
}

function deriveSignal(asset: LiveCryptoAsset) {
  const score = asset.ml_score ?? 50;
  const chg   = asset.changePct ?? 0;
  const vol   = asset.volume    ?? 0;

  const action     = score >= 70 ? 'BUY' : score <= 40 ? 'SELL' : 'HOLD';
  const ema_status = chg > 1 ? 'Bullish' : chg < -1 ? 'Bearish' : 'Neutral';
  const vol_label  = vol > 50_000_000 ? 'Very High' : vol > 10_000_000 ? 'High' : vol > 1_000_000 ? 'Medium' : 'Low';
  const vix_label  = Math.abs(chg) > 5 ? 'Elevated' : Math.abs(chg) > 2 ? 'Normal' : 'Low';

  const price     = asset.price;
  const support   = +(price * 0.965).toFixed(price < 1 ? 4 : 2);
  const resistance= +(price * 1.035).toFixed(price < 1 ? 4 : 2);
  // symbol comes as "BTC" from scoring; add /USDT suffix
  const symbol    = asset.symbol.includes('/') ? asset.symbol : `${asset.symbol}/USDT`;

  return { symbol, action, score, ema_status, vol_label, vix_label, support, resistance };
}

export default function CryptoSignals({ assets, onAssetClick }: Props) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ symbol, side, price }: { symbol: string; side: string; price: number }) =>
      addManualPosition(symbol, side, price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      alert('Crypto trade executed!');
    },
    onError: (err: any) => alert('Execution failed: ' + (err.message || 'Unknown')),
  });

  const handleRowClick = (asset: LiveCryptoAsset, action: string, symbol: string) => {
    // 1. Focus the asset
    onAssetClick?.(symbol);
    
    // 2. If it's a valid signal, offer trade
    if (action !== 'HOLD') {
      const sym = asset.symbol.includes('/') ? asset.symbol : `${asset.symbol}/USDT`;
      if (window.confirm(`Execute live ${action} for ${sym} at $${asset.price}?`)) {
        mutation.mutate({ symbol: sym, side: action.toLowerCase(), price: asset.price });
      }
    }
  };

  // Sort by ML score descending (already sorted from backend, but ensure it)
  const sorted = [...(assets || [])].sort((a, b) => (b.ml_score ?? 50) - (a.ml_score ?? 50));

  if (!sorted.length) {
    return <div style={{ textAlign: 'center', padding: '32px', color: '#475569', fontSize: '13px' }}>Loading ML signals…</div>;
  }

  return (
    <div style={{ background: 'rgba(5,11,20,0.4)', borderRadius: '20px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div style={{ minWidth: '800px' }}>
      {/* Header Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.7fr 0.7fr 0.9fr 0.9fr 0.9fr 1fr', gap: '8px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '10px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        <div>Asset</div><div>Score</div><div>Action</div><div>EMA</div><div>Volume</div><div>Price</div><div style={{ textAlign: 'right' }}>Sup / Res</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px', maxHeight: '520px', overflowY: 'auto', paddingRight: '4px' }}>
        {sorted.map((asset, i) => {
          const { symbol, action, score, ema_status, vol_label, vix_label, support, resistance } = deriveSignal(asset);
          const isBuy = action === 'BUY';
          const isSell = action === 'SELL';
          const actionColor = isBuy ? '#10b981' : isSell ? '#ef4444' : '#d4af37';
          const tvSym = symbol.replace('/', '');

          return (
            <motion.div
              key={symbol + i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => handleRowClick(asset, action, symbol)}
              whileHover={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${actionColor}44` }}
              style={{
                display: 'grid', gridTemplateColumns: '1.6fr 0.7fr 0.7fr 0.9fr 0.9fr 0.9fr 1fr', gap: '8px', alignItems: 'center',
                padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.03)',
                cursor: action === 'HOLD' ? 'default' : 'pointer',
              }}
            >
              {/* Asset */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {symbol}
                  <a href={`https://www.tradingview.com/chart/?symbol=${tvSym}`} target="_blank" rel="noopener noreferrer" style={{ color: '#475569', display: 'flex' }} onClick={e => e.stopPropagation()}>
                    <LineChart size={11} />
                  </a>
                </div>
                <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>
                  {asset.changePct >= 0 ? '+' : ''}{asset.changePct?.toFixed(2)}% 24h
                </div>
              </div>

              {/* Score */}
              <div style={{ fontSize: '13px', fontWeight: 900, color: score >= 70 ? '#10b981' : score <= 40 ? '#ef4444' : '#d4af37' }}>
                {score}/100
              </div>

              {/* Action */}
              <div>
                <span style={{ padding: '3px 7px', borderRadius: '5px', fontSize: '10px', fontWeight: 800, background: `${actionColor}15`, color: actionColor, border: `1px solid ${actionColor}33` }}>
                  {action}
                </span>
              </div>

              {/* EMA */}
              <div style={{ fontSize: '11px', fontWeight: 700, color: ema_status === 'Bullish' ? '#10b981' : ema_status === 'Bearish' ? '#ef4444' : '#94a3b8' }}>
                {ema_status}
              </div>

              {/* Volume */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#e2e8f0', display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <Activity size={9} color="#64748b" />{vol_label}
                </div>
                <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>{vix_label} VIX</div>
              </div>

              {/* Price */}
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc' }}>
                ${(asset.price || 0) < 1 ? (asset.price || 0).toFixed(4) : (asset.price || 0).toLocaleString()}
              </div>

              {/* S/R */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#ef4444' }}>R: ${(resistance || 0).toLocaleString()}</div>
                <div style={{ fontSize: '9px', fontWeight: 600, color: '#10b981', marginTop: '2px' }}>S: ${(support || 0).toLocaleString()}</div>
              </div>
            </motion.div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
