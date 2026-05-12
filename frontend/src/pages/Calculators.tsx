import React, { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import { Clock, ArrowRightLeft, Target } from 'lucide-react';

export default function Calculators() {
  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '40px 24px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>Trading Tools</h1>
        <p style={{ color: '#64748b', margin: '8px 0 0' }}>Utility suite for risk management and global market timing</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        <PipCalculator />
        <CurrencyConverter />
        <WorldClock />
      </div>
    </div>
  );
}

function PipCalculator() {
  const [lotSize, setLotSize] = useState(1);
  const [pips, setPips] = useState(10);
  const result = (lotSize * 10 * pips).toFixed(2);

  return (
    <GlassCard title="🧮 Pip Value Calculator" icon={<Target size={18} />}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Standard Lots</label>
          <input 
            type="number" value={lotSize} onChange={e => setLotSize(+e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Pips</label>
          <input 
            type="number" value={pips} onChange={e => setPips(+e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={resultBoxStyle}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>ESTIMATED VALUE</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981' }}>${result}</div>
        </div>
      </div>
    </GlassCard>
  );
}

function CurrencyConverter() {
  const [amount, setAmount] = useState(1);
  return (
    <GlassCard title="💱 Currency Converter" icon={<ArrowRightLeft size={18} />}>
       <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Amount (USD)</label>
          <input 
            type="number" value={amount} onChange={e => setAmount(+e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
           <div style={smallResultStyle}>
             <div style={smallLabelStyle}>EUR</div>
             <div style={smallValueStyle}>{(amount * 0.92).toFixed(2)}</div>
           </div>
           <div style={smallResultStyle}>
             <div style={smallLabelStyle}>GBP</div>
             <div style={smallValueStyle}>{(amount * 0.79).toFixed(2)}</div>
           </div>
           <div style={smallResultStyle}>
             <div style={smallLabelStyle}>JPY</div>
             <div style={smallValueStyle}>{(amount * 156.4).toFixed(2)}</div>
           </div>
           <div style={smallResultStyle}>
             <div style={smallLabelStyle}>XAU</div>
             <div style={smallValueStyle}>{(amount / 2350).toFixed(4)}</div>
           </div>
        </div>
      </div>
    </GlassCard>
  );
}

function WorldClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const format = (tz: string) => new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).format(time);

  const zones = [
    { name: 'London', tz: 'Europe/London',   flag: '🇬🇧' },
    { name: 'New York', tz: 'America/New_York', flag: '🇺🇸' },
    { name: 'Tokyo',  tz: 'Asia/Tokyo',      flag: '🇯🇵' },
    { name: 'Sydney', tz: 'Australia/Sydney', flag: '🇦🇺' },
  ];

  return (
    <GlassCard title="🌐 Global Market Clock" icon={<Clock size={18} />}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {zones.map(z => (
          <div key={z.name} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>{z.flag}</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>{z.name}</span>
            </div>
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#d4af37', fontVariantNumeric: 'tabular-nums' }}>{format(z.tz)}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase'
};

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '10px', padding: '12px', color: '#f8fafc', fontSize: '14px', outline: 'none'
};

const resultBoxStyle: React.CSSProperties = {
  background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)',
  borderRadius: '12px', padding: '16px', textAlign: 'center', marginTop: '8px'
};

const smallResultStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)'
};

const smallLabelStyle: React.CSSProperties = {
  fontSize: '10px', color: '#64748b', fontWeight: 700
};

const smallValueStyle: React.CSSProperties = {
  fontSize: '13px', fontWeight: 700, color: '#e2e8f0', marginTop: '2px'
};
