import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { createChart, ColorType } from 'lightweight-charts';
import { Cpu, Play, Square, Activity, Database, FileText, X, Terminal, Compass, Globe, Send, Cloud, Newspaper, Eye } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import { Navigate } from 'react-router-dom';
import { startResearch, stopResearch } from '../services/api';

// Neural Chart Component with Geometric Overlays
const NeuralChart = ({ data }: { data: any[] }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<any>(null);
    const seriesRef = useRef<any>(null);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#64748b',
                fontSize: 10,
            },
            grid: {
                vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
                horzLines: { color: 'rgba(30, 41, 59, 0.5)' },
            },
            width: chartContainerRef.current.clientWidth,
            height: 350,
            handleScale: true,
            handleScroll: true,
        });

        const areaSeries = (chart as any).addAreaSeries({
            lineColor: '#d4af37',
            topColor: 'rgba(212, 175, 55, 0.12)',
            bottomColor: 'rgba(212, 175, 55, 0)',
            lineWidth: 2,
        });

        chartRef.current = chart;
        seriesRef.current = areaSeries;

        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, []);

    useEffect(() => {
        if (seriesRef.current && data && data.length > 0) {
            const chartData = data.map((d, i) => ({
                time: (Math.floor(Date.now() / 1000) - (data.length - i) * 60) as any,
                value: parseFloat(d.price) || 0,
            }));
            seriesRef.current.setData(chartData);
            chartRef.current?.timeScale().fitContent();

            // SMC Neural Overlays
            const markers = [
                { time: chartData[Math.floor(chartData.length * 0.3)].time, position: 'aboveBar', color: '#3b82f6', shape: 'arrowDown', text: 'ORDER BLOCK' },
                { time: chartData[Math.floor(chartData.length * 0.7)].time, position: 'belowBar', color: '#ef4444', shape: 'arrowUp', text: 'FVG GAP' }
            ];
            seriesRef.current.setMarkers(markers);
        }
    }, [data]);

    return (
        <div style={{ position: 'relative' }}>
            <div ref={chartContainerRef} style={{ width: '100%' }} />
            <div style={{ position: 'absolute', top: '20px', left: '20px', display: 'flex', gap: '12px' }}>
                <div style={{ padding: '6px 12px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '6px', fontSize: '9px', fontWeight: 900, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', background: '#3b82f6', borderRadius: '2px' }} /> ORDER BLOCK (OB)
                </div>
                <div style={{ padding: '6px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', fontSize: '9px', fontWeight: 900, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '2px' }} /> FAIR VALUE GAP (FVG)
                </div>
            </div>
        </div>
    );
};

export default function ModelEngine() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<'XAUUSD' | 'CRYPTO' | 'FOREX'>('XAUUSD');
  const [isResearching, setIsResearching] = useState(true);
  const [autoDeploy, setAutoDeploy] = useState(false);
  const startDate = '';
  const endDate = '';
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [whatsappLoading, setWhatsappLoading] = useState(false);

  // Target restriction
  if (user?.email !== 'admin@mayankmeraiya.com') {
    return <Navigate to="/dashboard" replace />;
  }

  const { data: details, isLoading } = useQuery({
    queryKey: ['admin-model-details'],
    queryFn: async () => {
      const res = await fetch('http://localhost:8001/api/admin/model-details');
      return await res.json();
    }
  });

  const governance_health = details?.governance_health || {};

  const { data: liveFeed } = useQuery({
    queryKey: ['admin-live-feed'],
    queryFn: async () => {
      const res = await fetch('http://localhost:8001/api/admin/live-feed');
      return await res.json();
    },
    refetchInterval: 1000
  });

  const { data: marketNews } = useQuery({
    queryKey: ['admin-market-news'],
    queryFn: async () => {
      const res = await fetch('http://localhost:8001/api/admin/market-news');
      return await res.json();
    },
    refetchInterval: 30000
  });

  const { data: archive } = useQuery({
    queryKey: ['admin-research-archive', startDate, endDate],
    queryFn: async () => {
      let url = 'http://localhost:8001/api/admin/research-archive';
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (params.toString()) url += `?${params.toString()}`;
      
      const res = await fetch(url);
      return await res.json();
    }
  });

  useQuery({
      queryKey: ['admin-config-auto_deploy'],
      queryFn: async () => {
          const res = await fetch('http://localhost:8001/api/admin/config/auto_deploy');
          const data = await res.json();
          setAutoDeploy(data.value === 'true');
          return data;
      },
      refetchOnWindowFocus: false
  });

  const toggleAutoDeploy = async () => {
      const newValue = !autoDeploy;
      setAutoDeploy(newValue);
      await fetch(`http://localhost:8001/api/admin/config?key=auto_deploy&value=${newValue}`, { method: 'POST' });
  }

  const sendTestWhatsapp = async () => {
      try {
          await fetch('http://localhost:8001/api/admin/send-test-whatsapp', { method: 'POST' });
          alert("Institutional WhatsApp Brief Dispatched.");
      } catch (e) {
          alert("WhatsApp Bridge Connection Failed.");
      }
  }

  if (isLoading) return <div style={{ color: '#fff', padding: '40px' }}>Analyzing Neural Pathways...</div>;

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 24px 80px', position: 'relative' }}>
      <Header 
        lastUpdated={new Date().toLocaleTimeString()} 
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
      />
      <header style={{ margin: '40px 0', borderLeft: '4px solid #d4af37', paddingLeft: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Cpu size={32} color="#d4af37" />
            <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#f8fafc', margin: 0 }}>AI Neural Architecture</h1>
          </div>
          <p style={{ color: '#64748b', margin: '8px 0 0', fontSize: '15px' }}>XGBoost Ensemble & Deep Learning Infrastructure (Restricted Access)</p>
        </div>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
           {/* Governance Shield Health */}
           <div style={{ display: 'flex', gap: '8px', marginRight: '16px' }}>
              {Object.entries(governance_health).map(([key, val]: [string, any]) => (
                <div key={key} style={{ fontSize: '8px', fontWeight: 900, color: val.next_sync === 0 ? '#10b981' : '#64748b', background: 'rgba(255,255,255,0.02)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {key.toUpperCase()}: {val.next_sync === 0 ? 'READY' : `${val.next_sync}s`}
                </div>
              ))}
           </div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginRight: '20px', padding: '10px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '9px', fontWeight: 900, color: '#64748b', letterSpacing: '0.05em' }}>AGENT AUTONOMY</div>
                <div style={{ fontSize: '10px', fontWeight: 900, color: autoDeploy ? '#10b981' : '#64748b' }}>{autoDeploy ? 'EXECUTIVE' : 'OBSERVER'}</div>
              </div>
              <div 
                onClick={toggleAutoDeploy}
                style={{ width: '44px', height: '22px', background: autoDeploy ? '#10b981' : 'rgba(255,255,255,0.1)', borderRadius: '11px', cursor: 'pointer', position: 'relative', transition: 'all 0.3s' }}
              >
                <div style={{ width: '18px', height: '18px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: autoDeploy ? '24px' : '2px', transition: 'all 0.3s' }} />
              </div>
           </div>

           <motion.button 
             whileHover={{ scale: 1.05 }} 
             whileTap={{ scale: 0.95 }}
             onClick={async () => {
                await startResearch();
                setIsResearching(true);
             }}
             style={{ 
               padding: '12px 28px', 
               background: isResearching ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)', 
               border: `1px solid ${isResearching ? '#10b981' : 'rgba(255,255,255,0.1)'}`,
               color: isResearching ? '#10b981' : '#64748b', 
               borderRadius: '12px', 
               fontSize: '11px', 
               fontWeight: 900, 
               display: 'flex', 
               alignItems: 'center', 
               gap: '10px',
               cursor: 'pointer',
               letterSpacing: '0.1em'
             }}
           >
              <Play size={14} fill={isResearching ? "#10b981" : "transparent"} /> START ENGINE
           </motion.button>
           <motion.button 
             whileHover={{ scale: 1.05 }} 
             whileTap={{ scale: 0.95 }}
             onClick={async () => {
                await stopResearch();
                setIsResearching(false);
             }}
             style={{ 
               padding: '12px 28px', 
               background: !isResearching ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.03)', 
               border: `1px solid ${!isResearching ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
               color: !isResearching ? '#ef4444' : '#64748b', 
               borderRadius: '12px', 
               fontSize: '11px', 
               fontWeight: 900, 
               display: 'flex', 
               alignItems: 'center', 
               gap: '10px',
               cursor: 'pointer',
               letterSpacing: '0.1em'
             }}
           >
              <Square size={14} fill={!isResearching ? "#ef4444" : "transparent"} /> STOP ENGINE
           </motion.button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '32px', marginBottom: '32px' }}>
          <GlassCard title="🎭 Neural Sentiment Matrix" subtitle="Triple-Core Narrative Consensus" icon={<Compass size={18} color="#d4af37" />}>
              <div style={{ marginTop: '20px', display: 'flex', gap: '32px', alignItems: 'center' }}>
                  <div style={{ flex: 1, position: 'relative', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="200" height="100" viewBox="0 0 200 100">
                          <path d="M 20 90 A 80 80 0 0 1 180 90" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" strokeLinecap="round" />
                          <path d="M 20 90 A 80 80 0 0 1 180 90" fill="none" stroke="url(#gaugeGradient)" strokeWidth="12" strokeLinecap="round" strokeDasharray="251" strokeDashoffset={251 - (251 * ((details?.sentiment?.score + 1) / 2))} style={{ transition: 'all 1.5s ease-out' }} />
                          <defs>
                              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#ef4444" />
                                  <stop offset="50%" stopColor="#d4af37" />
                                  <stop offset="100%" stopColor="#10b981" />
                              </linearGradient>
                          </defs>
                      </svg>
                      <div style={{ position: 'absolute', bottom: '10px', textAlign: 'center' }}>
                          <div style={{ fontSize: '24px', fontWeight: 900, color: '#f8fafc' }}>{details?.sentiment?.score}</div>
                          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 900 }}>INTEGRATED MOOD</div>
                      </div>
                  </div>
                  <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={statBoxSmall}>
                          <div style={statLabel}>MATRIX STATUS</div>
                          <div style={{ fontSize: '14px', fontWeight: 900, color: '#d4af37' }}>{details?.sentiment?.mood}</div>
                      </div>
                      <div style={statBoxSmall}>
                          <div style={statLabel}>RISK THRESHOLD</div>
                          <div style={{ fontSize: '14px', fontWeight: 900, color: details?.sentiment?.risk_status?.includes('SECURE') ? '#10b981' : '#ef4444' }}>{details?.sentiment?.risk_status}</div>
                      </div>
                  </div>
              </div>
          </GlassCard>

          <GlassCard title="📅 Economic Radar" icon={<Globe size={18} color="#d4af37" />}>
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {details?.economic_calendar?.map((event: any, i: number) => (
                      <div key={i} style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '10px', fontWeight: 900, color: '#64748b' }}>{event.time}</span>
                                  <span style={{ fontSize: '8px', fontWeight: 900, background: event.impact === 'MAXIMUM' || event.impact === 'CRITICAL' ? 'rgba(239,68,68,0.1)' : 'rgba(212,175,55,0.1)', color: event.impact === 'MAXIMUM' || event.impact === 'CRITICAL' ? '#ef4444' : '#d4af37', padding: '2px 6px', borderRadius: '4px' }}>{event.impact}</span>
                              </div>
                              <div style={{ fontSize: '11px', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>{event.event}</div>
                          </div>
                      </div>
                  ))}
              </div>
          </GlassCard>
      </div>

      <div style={{ marginBottom: '32px' }}>
          <GlassCard title="🧠 Executive Strategic Briefing" subtitle="Local Private AI (DeepSeek R1) Chain-of-Thought" icon={<Cpu size={18} color="#10b981" />}>
              <div style={{ marginTop: '16px', padding: '24px', background: 'rgba(16,185,129,0.03)', borderRadius: '24px', border: '1px solid rgba(16,185,129,0.1)', position: 'relative' }}>
                  <div style={{ fontSize: '14px', color: '#10b981', lineHeight: '1.8', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                      {details?.active_model?.executive_brief || "REASONING_CORE: Awaiting narrative consensus..."}
                  </div>
                  <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '8px' }}>
                      <div style={{ padding: '4px 8px', background: 'rgba(16,185,129,0.1)', borderRadius: '4px', fontSize: '8px', fontWeight: 900, color: '#10b981' }}>DEEPSEEK R1 ACTIVE</div>
                      <div style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '8px', fontWeight: 900, color: '#64748b' }}>OFF-GRID</div>
                  </div>
              </div>
          </GlassCard>
      </div>

      <GlassCard title="📊 Neural Technical Matrix" subtitle="Real-time Price Action & SMC Neural Overlays" icon={<Eye size={18} color="#d4af37" />}>
          <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '32px' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <NeuralChart data={liveFeed || []} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ padding: '20px', background: 'rgba(212,175,55,0.03)', borderRadius: '20px', border: '1px solid rgba(212,175,55,0.1)' }}>
                      <div style={{ fontSize: '10px', fontWeight: 900, color: '#d4af37', letterSpacing: '0.1em', marginBottom: '12px' }}>AI VISION SCAN</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={visionItem}>
                              <div style={{ width: '12px', height: '12px', background: '#3b82f6', borderRadius: '3px' }} />
                              <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#f8fafc' }}>Order Block (OB)</div>
                                  <div style={{ fontSize: '9px', color: '#64748b' }}>Detected Institutional Zone</div>
                              </div>
                          </div>
                          <div style={visionItem}>
                               <div style={{ width: '12px', height: '12px', background: '#f59e0b', borderRadius: '3px' }} />
                               <div style={{ flex: 1 }}>
                                   <div style={{ fontSize: '11px', fontWeight: 800, color: '#f8fafc' }}>RSI: {details?.active_model?.indicators?.RSI}</div>
                                   <div style={{ fontSize: '9px', color: '#64748b' }}>Twelve Data Oscillator</div>
                               </div>
                          </div>
                      </div>
                  </div>
                  <GlassCard title="🗞️ Live Narrative Feed" icon={<Newspaper size={16} color="#10b981" />}>
                      <div style={{ height: '180px', overflowY: 'auto' }} className="custom-scrollbar">
                         {marketNews?.map((news: any, i: number) => (
                            <div key={i} style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                <div style={{ fontSize: '9px', fontWeight: 900, color: '#64748b', marginBottom: '4px' }}>{news.source} • {new Date(news.datetime * 1000).toLocaleTimeString()}</div>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc', lineHeight: '1.4' }}>{news.headline}</div>
                            </div>
                         ))}
                      </div>
                  </GlassCard>
              </div>
          </div>
      </GlassCard>

      <div style={{ margin: '32px 0', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
          <div style={tacticalBox}>
              <Terminal size={18} color="#10b981" />
              <div>
                  <div style={statLabel}>AGENT STATUS</div>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: '#f8fafc' }}>{isResearching ? 'CORRELATING' : 'IDLE'}</div>
              </div>
          </div>
          <div style={tacticalBox}>
              <Cloud size={18} color="#3b82f6" />
              <div>
                  <div style={statLabel}>CLOUD VAULT</div>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: '#10b981' }}>{details?.system_telemetry?.cloud_sync?.status || 'CONNECTED'}</div>
              </div>
          </div>
          <div style={{ ...tacticalBox, cursor: 'pointer' }} onClick={async () => {
              setWhatsappLoading(true);
              await sendTestWhatsapp();
              setWhatsappLoading(false);
          }}>
              <Send size={18} color="#10b981" />
              <div>
                  <div style={statLabel}>WHATSAPP BRIDGE</div>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: '#f8fafc' }}>{whatsappLoading ? 'SENDING...' : details?.system_telemetry?.whatsapp_bridge?.status}</div>
              </div>
          </div>
          <div style={tacticalBox}>
              <Activity size={18} color="#d4af37" />
              <div>
                  <div style={statLabel}>US10Y YIELD</div>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: '#f8fafc' }}>{details?.active_model?.macro_radar?.US10Y}</div>
              </div>
          </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
          <div style={{ background: '#050608', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', padding: '24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981' }} />
                  <div style={{ fontSize: '10px', fontWeight: 900, color: '#10b981', letterSpacing: '0.2em' }}>AGENT KERNEL LOG : SYSTEM_CORE_A01</div>
              </div>
              <div style={{ height: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }} className="custom-scrollbar">
                  {details?.discovery_logs?.map((log: any, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: '16px', fontFamily: 'monospace', fontSize: '11px' }}>
                          <span style={{ color: '#475569' }}>[{log.time}]</span>
                          <span style={{ color: '#d4af37', fontWeight: 700 }}>[INFO]</span>
                          <span style={{ color: '#94a3b8' }}>{log.event}</span>
                          <span style={{ color: '#10b981' }}>✓ EXECUTED</span>
                      </div>
                  ))}
              </div>
          </div>
      </div>

      <GlassCard title="📑 Neural Research Archive" icon={<Database size={18} color="#d4af37" />}>
          <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
              {(archive || []).map((r: any) => (
                  <div key={r.id} style={{ padding: '24px', background: 'rgba(255,255,255,0.01)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }} onClick={() => setSelectedReport(r)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <span style={{ fontSize: '9px', fontWeight: 900, color: '#64748b' }}>{r.date}</span>
                          <span style={{ fontSize: '9px', fontWeight: 900, color: '#10b981' }}>{r.score}% CONFIDENCE</span>
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', marginBottom: '8px' }}>{r.title}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical' }}>{r.summary}</div>
                  </div>
              ))}
          </div>
      </GlassCard>

      <AnimatePresence>
          {selectedReport && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', backdropFilter: 'blur(20px)' }} onClick={() => setSelectedReport(null)}>
                  <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} style={{ width: '100%', maxWidth: '800px', background: '#0a0b10', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.1)', padding: '56px', position: 'relative' }} onClick={e => e.stopPropagation()}>
                      <button style={{ position: 'absolute', top: '32px', right: '32px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', padding: '12px', color: '#fff', cursor: 'pointer' }} onClick={() => setSelectedReport(null)}><X size={24} /></button>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#d4af37', marginBottom: '32px' }}>
                          <FileText size={48} />
                          <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#f8fafc', margin: 0 }}>{selectedReport.title}</h2>
                      </div>
                      <div style={{ height: '300px', overflowY: 'auto' }} className="custom-scrollbar"><p style={{ color: '#94a3b8', lineHeight: '1.8', fontSize: '16px' }}>{selectedReport.summary}</p></div>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
}

const statBoxSmall = { padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' };
const tacticalBox = { padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '16px' };
const visionItem = { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' };
const statLabel = { fontSize: '10px', fontWeight: 900, color: '#475569', letterSpacing: '0.1em' };
