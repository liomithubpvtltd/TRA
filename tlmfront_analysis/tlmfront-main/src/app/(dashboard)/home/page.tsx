"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSocket } from "@/providers/SocketProvider";
import Image from "next/image";
import tlmApis from "@/api/tlmapis";
import { Calendar as CalendarIcon, RefreshCw, CheckCircle2, X } from "lucide-react";

interface IndexTick {
  name: string;
  last_price: number;
  change: number;
}

interface Recommendation {
  id: number;
  stock_symbol: string;
  stock_name: string;
  stock_exchange: string;
  action: string;
  entry_price: number;
  target_price_1: number;
  target_price_2: number;
  target_price_3: number;
  target_price_4: number;
  stop_loss: number;
  rsi: number;
  score: number;
  strategy: string;
  live_ltp: number;
  duration: string;
  created_at: string;
  is_active: boolean;
  closed_at: string | null;
  closed_price: number | null;
  closed_reason: string | null;
  target_status_at: string | null;
  target_price: number | null;
  target_reason: string | null;
  live_pts?: number;
  live_pct?: number;
}

const NSE_HOLIDAYS_2026 = [
  "2026-01-26", "2026-02-17", "2026-03-03", "2026-03-20", 
  "2026-04-01", "2026-04-10", "2026-04-14", "2026-05-01", 
  "2026-05-27", "2026-10-02", "2026-10-20", "2026-11-24", 
  "2026-12-25"
];

export default function Home() {
  const [indices, setIndices] = useState<IndexTick[]>([]);
  const [socketStatus, setSocketStatus] = useState<string>("connecting");
  const [activeTab, setActiveTab] = useState<string>("default");
  const [tradeStatusFilter, setTradeStatusFilter] = useState<"live" | "closed">("live");
  const [recommendations, setRecommendations] = useState<Record<string, Recommendation[]>>({
    default: [],
    volume_breakout: [],
    oversold_reversal: [],
    complete_exit: [],
    profit_booking: []
  });
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [holdings, setHoldings] = useState<Record<string, number>>({});
  const [dailyMessage, setDailyMessage] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const dateParam = params.get('date');
      if (dateParam) return dateParam;

      const saved = localStorage.getItem('tlm_selected_date_v2');
      if (saved) {
        try {
          const { date, expiry } = JSON.parse(saved);
          if (Date.now() < expiry) {
            return date;
          }
          localStorage.removeItem('tlm_selected_date_v2');
        } catch (e) {
          console.error("Error parsing saved date:", e);
        }
      }
    }
    return new Date().toISOString().split('T')[0];
  });

  const [showCalendar, setShowCalendar] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date(selectedDate));

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' | null }>({ message: '', type: null });
  const [globalAutomation, setGlobalAutomation] = useState({
    slEnabled: true,
    targetEnabled: true,
    emaEnabled: false
  });

  // Load preferences
  useEffect(() => {
    const saved = localStorage.getItem('tlm_global_automation');
    if (saved) {
      try {
        setGlobalAutomation(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading automation prefs", e);
      }
    }
  }, []);

  const [showTradeModal, setShowTradeModal] = useState(false);
  const [activeTradeRec, setActiveTradeRec] = useState<Recommendation | null>(null);

  const updateGlobalAutomation = (key: keyof typeof globalAutomation, val: boolean) => {
    const newSettings = { ...globalAutomation, [key]: val };
    setGlobalAutomation(newSettings);
    localStorage.setItem('tlm_global_automation', JSON.stringify(newSettings));
  };

  const [customSlPrices, setCustomSlPrices] = useState<Record<number, number>>({});
  const [customTargetPrices, setCustomTargetPrices] = useState<Record<number, number>>({});
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const symbolParam = searchParams.get('symbol');

  useEffect(() => {
    if (selectedDate) {
      // Calculate IST midnight expiry
      const expiryDate = new Date();
      expiryDate.setHours(23, 59, 59, 999); 
      
      localStorage.setItem('tlm_selected_date_v2', JSON.stringify({
        date: selectedDate,
        expiry: expiryDate.getTime()
      }));
    }
  }, [selectedDate]);

  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam && dateParam !== selectedDate) {
      setSelectedDate(dateParam);
    }
  }, [searchParams]);

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: null }), 5000);
  };

  const fetchHoldings = async () => {
    try {
      const res = await tlmApis.getPortfolio();
      if (res.data && res.data.holdings) {
        const holdingMap: Record<string, number> = {};
        res.data.holdings.forEach((h: any) => {
          holdingMap[h.stock_symbol] = h.quantity;
        });
        setHoldings(holdingMap);
      }
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchHoldings();
  }, []);

  const handleTrade = (rec: Recommendation, tradeType: "BUY" | "SELL") => {
    setActiveTradeRec(rec);
    setShowTradeModal(true);
  };

  const confirmTrade = async () => {
    if (!activeTradeRec) return;
    
    const rec = activeTradeRec;
    const qty = quantities[rec.id] || 100;
    const price = rec.live_ltp || rec.entry_price || 0;
    
    if (price <= 0) {
      showNotification("Price not available for execution.", "error");
      return;
    }

    try {
      const res = await tlmApis.executeTrade({
        stock_symbol: rec.stock_symbol,
        trade_type: "BUY",
        quantity: qty,
        price: price,
        auto_sl: globalAutomation.slEnabled ? (customSlPrices[rec.id] || rec.stop_loss) : null,
        auto_target: globalAutomation.targetEnabled ? (customTargetPrices[rec.id] || rec.target_price_1) : null,
        auto_ema: globalAutomation.emaEnabled
      });
      
      const data = res.data;
      if (data.error) {
        showNotification(data.error, "error");
      } else {
        setSuccessMsg(data.message || "Order executed successfully.");
        setShowSuccessPopup(true);
        setShowTradeModal(false);
        setActiveTradeRec(null);
        fetchHoldings();
      }
    } catch (e: any) {
      console.error("Error executing buy order:", e);
      const errorMsg = e.response?.data?.error || "Terminal Error: Execution failed.";
      showNotification(errorMsg, "error");
    }
  };

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const res = await tlmApis.getRecommendations({ date: selectedDate });
        const data = res.data;
        setRecommendations(data);
      } catch (err) {
        console.error("Error fetching recommendations:", err);
      }
    };
    fetchRecommendations();
    const interval = setInterval(() => {
      fetchRecommendations();
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  useEffect(() => {
    const fetchDailyMessage = async () => {
      try {
        const res = await tlmApis.getDailyMessage();
        setDailyMessage(res.data.message);
      } catch (err) {
        console.error("Error fetching daily message:", err);
      }
    };
    fetchDailyMessage();
  }, []);

  const { lastMessage, status: centralStatus, reconnect, sendMessage } = useSocket();

  useEffect(() => {
    if (centralStatus === 'connected' && selectedDate) {
      sendMessage({ action: "set_date", date: selectedDate });
    }
  }, [selectedDate, centralStatus]);

  useEffect(() => {
    setSocketStatus(centralStatus);
  }, [centralStatus]);

  useEffect(() => {
    if (!lastMessage) return;

    try {
      const payload = lastMessage;
      if (payload.type === "tick") {
        setIndices(payload.data);
        
        if (payload.recommendations) {
          setRecommendations((prevRecs) => {
            const mergedRecs = { ...payload.recommendations };
            Object.keys(mergedRecs).forEach((strategyKey) => {
              mergedRecs[strategyKey] = mergedRecs[strategyKey].map((rec: Recommendation) => {
                if (payload.live_ltp && payload.live_ltp[rec.stock_symbol]) {
                  const live_change = payload.live_change && payload.live_change[rec.stock_symbol];
                  return {
                    ...rec,
                    live_ltp: payload.live_ltp[rec.stock_symbol],
                    live_pts: live_change ? live_change.pts : undefined,
                    live_pct: live_change ? live_change.pct : undefined
                  };
                }
                return rec;
              });
            });
            return mergedRecs;
          });
        } else if (payload.live_ltp) {
          setRecommendations((prevRecs) => {
            const updatedRecs = { ...prevRecs };
            Object.keys(updatedRecs).forEach((strategyKey) => {
              updatedRecs[strategyKey] = updatedRecs[strategyKey].map((rec) => {
                if (payload.live_ltp[rec.stock_symbol]) {
                  const live_change = payload.live_change && payload.live_change[rec.stock_symbol];
                  return {
                    ...rec,
                    live_ltp: payload.live_ltp[rec.stock_symbol],
                    live_pts: live_change ? live_change.pts : undefined,
                    live_pct: live_change ? live_change.pct : undefined
                  };
                }
                return rec;
              });
            });
            return updatedRecs;
          });
        }
      }
    } catch (err) {
      console.error("Error processing central WebSocket message in Home:", err);
    }
  }, [lastMessage]);

  useEffect(() => {
    if (symbolParam && Object.keys(recommendations).length > 0) {
      for (const [strategy, recs] of Object.entries(recommendations)) {
        if (recs.some(r => r.stock_symbol === symbolParam)) {
          if (activeTab !== strategy) {
            setActiveTab(strategy);
          }
          
          // Determine if it's a closed trade (if we're not in exit/profit tabs)
          const targetRec = recs.find(r => r.stock_symbol === symbolParam);
          if (targetRec && !targetRec.is_active && strategy !== "complete_exit" && strategy !== "profit_booking") {
            setTradeStatusFilter("closed");
          }

          setTimeout(() => {
            const el = document.getElementById(`rec-${symbolParam}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el.classList.add('ring-2', 'ring-teal-500', 'ring-offset-4', 'ring-offset-zinc-950');
              setTimeout(() => {
                el.classList.remove('ring-2', 'ring-teal-500', 'ring-offset-4', 'ring-offset-zinc-950');
              }, 3000);
            }
          }, 800);
          break;
        }
      }
    }
  }, [symbolParam, recommendations]);

  return (
    <div className="w-full relative overflow-hidden bg-gradient-to-br from-zinc-900 via-black to-slate-950 text-zinc-100 font-sans flex flex-col items-center p-6 md:p-12 pb-24 md:pb-12">
      {/* Custom Notification Toast (Errors only) */}
      {notification.type === 'error' && (
        <div className={`fixed top-8 right-8 z-[100] flex items-center gap-4 p-4 rounded-2xl border backdrop-blur-2xl shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500 bg-rose-500/10 border-rose-500/20 text-rose-400`}>
          <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-xl font-bold bg-rose-500/20">
            !
          </div>
          <div className="flex flex-col pr-4">
            <span className="text-[10px] uppercase tracking-widest font-black opacity-60">
              Execution Failed
            </span>
            <p className="text-sm font-bold text-zinc-100">{notification.message}</p>
          </div>
          <button onClick={() => setNotification({ message: '', type: null })} className="text-zinc-500 hover:text-zinc-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Success Execution Modal */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSuccessPopup(false)} />
          <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl shadow-[0_32px_64px_rgba(0,0,0,0.8)] p-8 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-6 shadow-inner">
                <CheckCircle2 className="w-8 h-8 text-teal-400" />
              </div>
              <h3 className="text-xl font-black tracking-tight text-zinc-100 mb-2">Order Executed</h3>
              <p className="text-zinc-400 text-sm font-medium leading-relaxed mb-8">
                {successMsg}
              </p>
              
              <div className="grid grid-cols-2 gap-3 w-full">
                <button 
                  onClick={() => router.push('/portfolio')}
                  className="py-3 px-4 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-black text-[11px] uppercase tracking-wider rounded-xl shadow-lg transition-all duration-200 active:scale-95"
                >
                  Portfolio
                </button>
                <button 
                  onClick={() => setShowSuccessPopup(false)}
                  className="py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-black text-[11px] uppercase tracking-wider rounded-xl border border-zinc-700 transition-all duration-200 active:scale-95"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Decorative ambient background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      <main className="w-full max-w-4xl z-10 backdrop-blur-xl bg-zinc-900/40 border border-zinc-800/50 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-3xl p-8 md:p-12">
        {/* Daily Message Announcement Banner */}
        {dailyMessage && (
          <div className="mb-10 p-4 md:p-5 bg-teal-900/10 border border-teal-500/20 rounded-2xl relative overflow-hidden group shadow-[0_8px_32px_rgba(20,184,166,0.05)]">
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 via-transparent to-teal-500/5 opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
            <div className="relative flex items-center gap-4">
              <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/20 text-xl shadow-inner border border-teal-500/20">
                📢
              </div>
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-[0.2em] font-black text-teal-500/60 mb-1">Update</div>
                <p className="text-zinc-200 text-sm md:text-base font-semibold leading-relaxed">
                  {dailyMessage}
                </p>
              </div>
              <div className="hidden sm:block absolute -right-4 -bottom-4 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-700">
                 <div className="text-8xl">📢</div>
              </div>
            </div>
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-teal-300 via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
              Market Overview
            </h1>
            <p className="text-zinc-400 mt-2 text-sm md:text-base">
              High-fidelity institutional feeds mapped in real-time
            </p>
          </div>
          
          <div className="flex items-center gap-3 self-start sm:self-auto">
            {/* Status Badge */}
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-zinc-800/40 border border-zinc-700/30 backdrop-blur-md text-xs font-medium tracking-wide shadow-inner">
              <span className="relative flex h-2 w-2">
                {socketStatus === "connected" && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  socketStatus === "connected" ? "bg-teal-400" : socketStatus === "error" ? "bg-red-500" : "bg-amber-500"
                }`}></span>
              </span>
              <span className={`capitalize ${
                socketStatus === "connected" ? "text-teal-300" : socketStatus === "error" ? "text-red-400" : "text-amber-400"
              }`}>
                {socketStatus}
              </span>
            </div>

            {(socketStatus === "disconnected" || socketStatus === "error") && (
              <button 
                onClick={() => reconnect()}
                className="px-3 py-2 rounded-full bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/20 text-xs font-bold tracking-wide transition-all duration-200 flex items-center gap-1 shadow-[0_4px_20px_rgba(20,184,166,0.1)]"
              >
                <span>↻</span> Reconnect
              </button>
            )}
          </div>
        </div>

        {indices.length === 0 ? (
          <div className="flex flex-col items-center justify-center w-full py-24 border border-zinc-800/50 border-dashed bg-zinc-900/20 rounded-2xl text-zinc-500 group hover:border-zinc-700/60 transition-all duration-300">
            <div className="animate-spin h-6 w-6 border-2 border-teal-400 border-t-transparent rounded-full mb-4"></div>
            <span className="text-sm font-medium tracking-wide">Synchronizing Live Tickers...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
            {indices.map((index) => {
              const isPositive = index.change >= 0;
              return (
                <div 
                  key={index.name} 
                  className="relative group overflow-hidden p-6 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl shadow-lg hover:shadow-2xl hover:border-zinc-700/50 transition-all duration-300"
                >
                  {/* Card gradient hover effect */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-[0.03] bg-gradient-to-br ${
                    isPositive ? "from-teal-400 to-emerald-400" : "from-rose-500 to-red-500"
                  } transition-opacity duration-500 pointer-events-none`} />

                  <div className="flex justify-between items-start">
                    <h2 className="text-lg font-bold tracking-wide text-zinc-300 group-hover:text-white transition-colors duration-200">
                      {index.name}
                    </h2>
                    
                    {/* Dynamic mini trending badges */}
                    <div className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md font-semibold ${
                      isPositive ? "text-teal-300 bg-teal-500/10 border border-teal-500/20" : "text-rose-300 bg-rose-500/10 border border-rose-500/20"
                    }`}>
                      <span>{isPositive ? "↑" : "↓"}</span>
                      <span>{isPositive ? "+" : ""}{index.change.toFixed(2)}%</span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="text-xs font-medium tracking-wider text-zinc-500 uppercase">Last Traded Price</div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-3xl font-black tracking-tight text-zinc-100 group-hover:text-white">
                        ₹{index.last_price ? index.last_price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '---'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Background micro animation element */}
                  <div className={`h-1 w-full absolute bottom-0 left-0 ${
                    isPositive ? "bg-gradient-to-r from-teal-400 to-emerald-400" : "bg-gradient-to-r from-rose-400 to-red-400"
                  } opacity-30 group-hover:opacity-100 transition-all duration-500`} />
                </div>
              );
            })}
          </div>
        )}

        {/* Navigation Bar Tabs for Recommendations */}
        <div className="mt-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-200 bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              Trading Recommendations
            </h2>
            
            <div className="relative">
              <button 
                onClick={() => setShowCalendar(!showCalendar)}
                className="flex items-center gap-2 bg-zinc-950/50 hover:bg-zinc-900/80 p-2 px-3 rounded-xl border border-zinc-800/80 transition-all duration-200 group/date shadow-inner"
              >
                <CalendarIcon className="w-3.5 h-3.5 text-teal-500/70 group-hover/date:text-teal-400 transition-colors" />
                <span className="text-zinc-200 text-xs font-bold tracking-wide">
                  {new Date(selectedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </button>

              {showCalendar && (
                <div className="absolute top-full right-0 mt-3 z-[110] w-72 bg-zinc-900/95 backdrop-blur-2xl border border-zinc-800/80 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-4">
                    <button 
                      onClick={() => setCalMonth(new Date(calMonth.setMonth(calMonth.getMonth() - 1)))}
                      className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400"
                    >
                      ←
                    </button>
                    <span className="text-xs font-black uppercase tracking-widest text-zinc-100">
                      {calMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>
                    <button 
                      onClick={() => setCalMonth(new Date(calMonth.setMonth(calMonth.getMonth() + 1)))}
                      className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400"
                    >
                      →
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
                      <span key={`${d}-${idx}`} className="text-[10px] font-bold text-zinc-500">{d}</span>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {(() => {
                      const days = [];
                      const firstDay = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1).getDay();
                      const daysInMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate();
                      
                      for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} />);
                      
                      for (let d = 1; d <= daysInMonth; d++) {
                        const dateStr = `${calMonth.getFullYear()}-${String(calMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                        const isSelected = selectedDate === dateStr;
                        const isToday = new Date().toISOString().split('T')[0] === dateStr;
                        const dayOfWeek = new Date(dateStr).getDay();
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                        const isHoliday = NSE_HOLIDAYS_2026.includes(dateStr);
                        const isDisabled = isWeekend || isHoliday;
                        
                        days.push(
                          <button
                            key={d}
                            disabled={isDisabled}
                            onClick={() => {
                              setSelectedDate(dateStr);
                              setShowCalendar(false);
                            }}
                            className={`h-8 w-8 text-[10px] font-bold rounded-lg transition-all duration-200 ${
                              isSelected 
                                ? 'bg-teal-500 text-zinc-950 shadow-[0_0_15px_rgba(20,184,166,0.4)]' 
                                : isDisabled
                                  ? 'text-zinc-700 cursor-not-allowed bg-transparent'
                                  : isToday 
                                    ? 'bg-zinc-800 text-teal-400 border border-teal-500/30' 
                                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                            }`}
                          >
                            {d}
                          </button>
                        );
                      }
                      return days;
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-zinc-800/80 pb-px">
            <div className="flex gap-2 overflow-x-auto">
              {[
                { id: "default", label: "General" },
                { id: "volume_breakout", label: "Volume Breakout" },
                { id: "oversold_reversal", label: "Oversold Reversal" },
                { id: "complete_exit", label: "Exit" },
                { id: "profit_booking", label: "Profit Booking" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setTradeStatusFilter("live");
                  }}
                  className={`px-4 py-2 text-sm font-medium transition-all duration-200 rounded-t-lg ${
                    activeTab === tab.id
                      ? "text-teal-300 border-b-2 border-teal-400 bg-zinc-800/30"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/10"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab !== "complete_exit" && activeTab !== "profit_booking" && (
              <div className="flex gap-2 bg-zinc-950/40 p-1 rounded-xl border border-zinc-800/50 self-start sm:self-auto mb-2 sm:mb-0">
                <button
                  onClick={() => setTradeStatusFilter("live")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                    tradeStatusFilter === "live"
                      ? "bg-teal-500/20 text-teal-300 shadow-inner border border-teal-500/30"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Live Trade
                </button>
                <button
                  onClick={() => setTradeStatusFilter("closed")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                    tradeStatusFilter === "closed"
                      ? "bg-teal-500/20 text-teal-300 shadow-inner border border-teal-500/30"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Closed Trade
                </button>
              </div>
            )}
          </div>

          {(() => {

            const filteredRecs = (recommendations[activeTab] || []).filter((rec) => {
              if (activeTab === "complete_exit" || activeTab === "profit_booking") return true;
              return tradeStatusFilter === "live" ? rec.is_active : !rec.is_active;
            });

            if (filteredRecs.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-12 border border-zinc-800/50 border-dashed bg-zinc-900/10 rounded-2xl text-zinc-500">
                  <span className="text-sm font-medium">
                    {tradeStatusFilter === "live" 
                      ? "No active recommendations for this strategy." 
                      : "No closed recommendations for this strategy."}
                  </span>
                </div>
              );
            }

            return (
              <div className="flex flex-col gap-6">
                {filteredRecs.map((rec) => {
                  const isBuy = rec.action === "BUY";
                  const isProfitBooking = rec.strategy === "profit_booking" || activeTab === "profit_booking";
                return (
                  <div 
                    key={rec.id} 
                    id={`rec-${rec.stock_symbol}`}
                    className={`relative group overflow-hidden p-6 bg-zinc-900/90 border border-zinc-800/80 rounded-2xl shadow-2xl hover:shadow-[0_20px_40px_rgba(0,0,0,0.7)] transition-all duration-300 flex flex-col gap-5 text-zinc-100 ${
                      isProfitBooking ? "hover:border-amber-500/30" : "hover:border-teal-500/30"
                    }`}
                  >
                    {isProfitBooking && (
                      <div className="absolute top-0 right-0 px-3 py-1 bg-amber-500 text-zinc-950 text-[10px] font-black uppercase tracking-widest rounded-bl-xl z-20 shadow-lg">
                        Profit Booking
                      </div>
                    )}
                    {/* Header: Avatar & Symbol/LTP */}
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full bg-zinc-800/60 border border-zinc-700/30 flex items-center justify-center text-xl font-black text-zinc-100 flex-shrink-0 shadow-inner ${isProfitBooking ? 'text-amber-400' : ''}`}>
                        {rec.stock_symbol?.[0]?.toUpperCase() || 'S'}
                      </div>
                      
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-extrabold tracking-tight text-zinc-100">
                            {rec.stock_symbol}
                          </h3>
                          <a 
                            href={`https://in.tradingview.com/chart/?symbol=${rec.stock_exchange || 'NSE'}:${rec.stock_symbol}`}
                            target="_blank"
                            rel="noreferrer"
                            className={`p-0.5 px-1.5 rounded-md bg-zinc-800/50 hover:bg-zinc-700/80 border border-zinc-700/30 text-[9px] font-bold transition-colors duration-200 ${
                              isProfitBooking ? 'text-amber-400 hover:text-amber-300' : 'text-teal-400 hover:text-teal-300'
                            }`}
                            title={`View ${rec.stock_symbol} Chart`}
                          >
                            Chart ↗
                          </a>
                        </div>

                        {/* LTP and Percentage Change */}
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="text-sm font-bold text-zinc-100">
                            ₹{rec.live_ltp ? rec.live_ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '---'}
                          </span>
                          {typeof rec.live_pts !== 'undefined' && typeof rec.live_pct !== 'undefined' ? (
                            <span className={`text-xs font-semibold ${
                              isProfitBooking ? 'text-amber-400' : (rec.live_pts >= 0 ? 'text-teal-400' : 'text-rose-400')
                            }`}>
                              {rec.live_pts >= 0 ? '+' : ''}
                              {rec.live_pts.toFixed(2)} ({rec.live_pct.toFixed(2)}%)
                            </span>
                          ) : (
                            rec.entry_price && rec.live_ltp && (
                              <span className={`text-xs font-semibold ${
                                isProfitBooking ? 'text-amber-400' : (rec.live_ltp >= rec.entry_price ? 'text-teal-400' : 'text-rose-400')
                              }`}>
                                {rec.live_ltp >= rec.entry_price ? '+' : ''}
                                {(rec.live_ltp - rec.entry_price).toFixed(2)} ({(((rec.live_ltp - rec.entry_price) / rec.entry_price) * 100).toFixed(2)}%)
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Table Details: Date, Action, Price, Target 1, Current Gain */}
                    <div className="overflow-hidden rounded-xl border border-zinc-800/60 bg-zinc-900/30">
                      <div className={`grid ${activeTab === "complete_exit" || activeTab === "profit_booking" ? "grid-cols-3" : "grid-cols-5"} bg-zinc-800/40 text-[10px] font-bold tracking-wider text-zinc-400 uppercase border-b border-zinc-800/50 py-2 px-4`}>
                        <div>Date & Time</div>
                        <div className="text-center">Action</div>
                        <div className="text-center">Price</div>
                        {activeTab !== "complete_exit" && activeTab !== "profit_booking" && <div className="text-center">Target 1</div>}
                        {activeTab !== "complete_exit" && activeTab !== "profit_booking" && <div className="text-center">Current Gain</div>}
                      </div>
                      <div className={`grid ${activeTab === "complete_exit" || activeTab === "profit_booking" ? "grid-cols-3" : "grid-cols-5"} items-center py-3 px-4 text-xs text-zinc-200 font-semibold`}>
                        <div className="flex flex-col">
                          <span>{new Date(rec.created_at).toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit', year: '2-digit'})}</span>
                          <span className="text-[9px] text-zinc-400/80 mt-0.5 font-medium">{new Date(rec.created_at).toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'})}</span>
                        </div>
                        <div className="flex justify-center">
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                            isProfitBooking ? "border-amber-500/30 bg-amber-500/10 text-amber-400" : (isBuy ? "border-teal-500/30 bg-teal-500/10 text-teal-400" : "border-rose-500/30 bg-rose-500/10 text-rose-400")
                          }`}>
                            {isProfitBooking ? "PROFIT BOOK" : rec.action}
                          </span>
                        </div>
                        <div className="text-center text-zinc-100">
                          ₹{rec.entry_price ? rec.entry_price.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '---'}
                        </div>
                        {activeTab !== "complete_exit" && activeTab !== "profit_booking" && (
                          <div className="text-center text-teal-400 font-bold">
                            ₹{rec.target_price_1 ? rec.target_price_1.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '---'}
                          </div>
                        )}
                        {activeTab !== "complete_exit" && activeTab !== "profit_booking" && (
                          <div className="text-center">
                            {rec.entry_price && rec.live_ltp ? (
                              <span className={`font-bold text-[11px] ${rec.live_ltp >= rec.entry_price ? 'text-teal-400' : 'text-rose-400'}`}>
                                {rec.live_ltp >= rec.entry_price ? '+' : ''}
                                {(rec.live_ltp - rec.entry_price).toFixed(1)} ({(((rec.live_ltp - rec.entry_price) / rec.entry_price) * 100).toFixed(1)}%)
                              </span>
                            ) : '---'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Parameters: Stoploss, Target, Duration */}
                    {activeTab !== "complete_exit" && activeTab !== "profit_booking" && (
                      <div className="grid grid-cols-3 gap-4 pt-2 text-center border-t border-zinc-800/40">
                        <div className="flex flex-col items-start text-left">
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold flex items-center gap-1">
                            Stoploss 
                            <span className="text-zinc-600 text-[8px] cursor-help" title="Strict Stoploss boundary">ⓘ</span>
                          </span>
                          <span className="text-xs font-bold text-rose-400 mt-1">
                            ₹{rec.stop_loss ? rec.stop_loss.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '---'}
                          </span>
                        </div>

                        <div className="flex justify-center gap-4 text-center">
                          <div className="flex flex-col items-center border-l border-zinc-800/40 pl-4">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Score</span>
                            <span className="text-xs font-bold text-teal-300 mt-1">
                              {rec.score ? `${rec.score}/10` : "---"}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end text-right">
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Duration</span>
                          <span className="text-xs font-bold text-zinc-300 mt-1">
                            {rec.duration || "---"}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Additional Parameters: T2, T3, T4 */}
                    {activeTab !== "complete_exit" && activeTab !== "profit_booking" && (
                      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-zinc-800/20 text-center bg-zinc-950/20 p-2 rounded-xl">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-zinc-500 font-bold uppercase">Target 2</span>
                          <span className="text-xs font-bold text-teal-400 mt-0.5">
                            ₹{rec.target_price_2 ? rec.target_price_2.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '---'}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-zinc-500 font-bold uppercase">Target 3</span>
                          <span className="text-xs font-bold text-teal-400 mt-0.5">
                            ₹{rec.target_price_3 ? rec.target_price_3.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '---'}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-zinc-500 font-bold uppercase">Holding Qty</span>
                          <span className={`text-xs font-bold mt-0.5 ${holdings[rec.stock_symbol] ? 'text-emerald-400' : 'text-zinc-500'}`}>
                            {holdings[rec.stock_symbol] || 0}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Closed/Target Metrics */}
                    {!rec.is_active && (
                      <div className={`grid grid-cols-2 gap-3 pt-3 border-t border-zinc-800/40 p-3 rounded-xl border text-center ${
                        rec.target_reason 
                          ? 'bg-emerald-500/5 border-emerald-500/20' 
                          : 'bg-zinc-950/30 border-zinc-900'
                      }`}>
                        {rec.target_reason ? (
                          <>
                            <div className="text-left">
                              <span className="text-[9px] text-emerald-500/60 font-bold tracking-wider uppercase">Target Price</span>
                              <span className="block text-xs font-bold text-emerald-400 mt-0.5">
                                ₹{rec.target_price ? rec.target_price.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '---'}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] text-emerald-500/60 font-bold tracking-wider uppercase">Hit At</span>
                              <span className="block text-xs font-bold text-emerald-500/80 mt-0.5">
                                {rec.target_status_at ? new Date(rec.target_status_at).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '---'}
                              </span>
                            </div>
                            <div className="col-span-2 text-left border-t border-emerald-500/10 pt-2 mt-1">
                              <span className="text-[9px] text-emerald-500/60 font-bold tracking-wider uppercase">Target Status</span>
                              <p className="text-[11px] font-bold text-emerald-400 mt-0.5 leading-relaxed">🎯 {rec.target_reason}</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-left">
                              <span className="text-[9px] text-zinc-500 font-bold tracking-wider uppercase">Closed Price</span>
                              <span className="block text-xs font-bold text-amber-400 mt-0.5">
                                ₹{rec.closed_price ? rec.closed_price.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '---'}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] text-zinc-500 font-bold tracking-wider uppercase">Closed At</span>
                              <span className="block text-xs font-bold text-zinc-400 mt-0.5">
                                {rec.closed_at ? new Date(rec.closed_at).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '---'}
                              </span>
                            </div>
                            {rec.closed_reason && (
                              <div className="col-span-2 text-left border-t border-zinc-800/30 pt-2 mt-1">
                                <span className="text-[9px] text-zinc-500 font-bold tracking-wider uppercase">Closed Reason</span>
                                <p className="text-[11px] italic text-zinc-400 mt-0.5 leading-relaxed">{rec.closed_reason}</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}



                    {/* Place Order Action (for Active recommendations) */}
                    {rec.is_active && activeTab !== "portfolio" && activeTab !== "complete_exit" && !isProfitBooking && (
                      <div className="flex items-center gap-3 justify-end bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/50 mt-2">
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Qty:</label>
                          <input 
                            type="number" 
                            min="1" 
                            value={quantities[rec.id] ?? ""} 
                            placeholder="100"
                            onFocus={() => setQuantities(prev => ({ ...prev, [rec.id]: "" as any }))}
                            onChange={(e) => setQuantities(prev => ({ ...prev, [rec.id]: e.target.value === "" ? "" as any : parseInt(e.target.value) }))}
                            className="w-20 bg-zinc-900 border border-zinc-700/60 rounded px-2.5 py-1 text-xs text-zinc-100 font-bold focus:outline-none focus:border-teal-500/50 transition-colors"
                          />
                        </div>
                        <button
                          onClick={() => handleTrade(rec, "BUY")}
                          className="px-4 py-1.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-zinc-950 font-extrabold text-xs uppercase tracking-wider rounded-lg shadow-lg transform hover:scale-102 active:scale-98 transition-all duration-200"
                        >
                          Place Order
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            );
          })()}
        </div>


      </main>

      {/* Trade Confirmation Modal */}
      {showTradeModal && activeTradeRec && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto overflow-x-hidden">
          <div 
            className="fixed inset-0 bg-zinc-950/90 backdrop-blur-md" 
            onClick={() => setShowTradeModal(false)}
          />
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 font-black">
                  {activeTradeRec.stock_symbol[0]}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">{activeTradeRec.stock_symbol}</h3>
                  <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Confirm Your Order</p>
                </div>
              </div>
              <button 
                onClick={() => setShowTradeModal(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/50">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Price</span>
                  <p className="text-sm font-bold text-zinc-100 mt-1">₹{(activeTradeRec.live_ltp || activeTradeRec.entry_price || 0).toLocaleString()}</p>
                </div>
                <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/50">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Quantity</span>
                  <input 
                    type="number" 
                    value={quantities[activeTradeRec.id] ?? ""}
                    placeholder="100"
                    onChange={(e) => setQuantities(prev => ({ ...prev, [activeTradeRec.id]: e.target.value === "" ? "" as any : parseInt(e.target.value) }))}
                    className="w-full bg-transparent text-sm font-bold text-zinc-100 mt-1 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {/* Automation Controls */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Exit Automation</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-zinc-600 font-bold uppercase">20EMA Sell</span>
                    <button 
                      onClick={() => updateGlobalAutomation('emaEnabled', !globalAutomation.emaEnabled)}
                      className={`w-8 h-4 rounded-full transition-all duration-300 relative ${globalAutomation.emaEnabled ? 'bg-teal-500' : 'bg-zinc-800'}`}
                    >
                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-300 ${globalAutomation.emaEnabled ? 'left-4.5' : 'left-0.5'}`} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* SL Automation */}
                  <div className={`p-4 rounded-xl border transition-all duration-300 ${globalAutomation.slEnabled ? 'bg-rose-500/5 border-rose-500/20' : 'bg-zinc-950/30 border-zinc-800/50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${globalAutomation.slEnabled ? 'bg-rose-500 animate-pulse' : 'bg-zinc-700'}`} />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">Auto Stop Loss</span>
                      </div>
                      <button 
                        onClick={() => updateGlobalAutomation('slEnabled', !globalAutomation.slEnabled)}
                        className={`w-7 h-3.5 rounded-full transition-all duration-300 relative ${globalAutomation.slEnabled ? 'bg-rose-500' : 'bg-zinc-800'}`}
                      >
                        <div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-all duration-300 ${globalAutomation.slEnabled ? 'left-4' : 'left-0.5'}`} />
                      </button>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-zinc-600 font-bold text-xs">₹</span>
                      <input 
                        type="number"
                        disabled={!globalAutomation.slEnabled}
                        value={customSlPrices[activeTradeRec.id] ?? activeTradeRec.stop_loss ?? ""}
                        onChange={(e) => setCustomSlPrices(prev => ({ ...prev, [activeTradeRec.id]: parseFloat(e.target.value) }))}
                        className="w-full bg-transparent text-lg font-bold text-rose-400 focus:outline-none disabled:opacity-30 placeholder:text-zinc-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Target Automation */}
                  <div className={`p-4 rounded-xl border transition-all duration-300 ${globalAutomation.targetEnabled ? 'bg-teal-500/5 border-teal-500/20' : 'bg-zinc-950/30 border-zinc-800/50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${globalAutomation.targetEnabled ? 'bg-teal-500 animate-pulse' : 'bg-zinc-700'}`} />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">Auto Target</span>
                      </div>
                      <button 
                        onClick={() => updateGlobalAutomation('targetEnabled', !globalAutomation.targetEnabled)}
                        className={`w-7 h-3.5 rounded-full transition-all duration-300 relative ${globalAutomation.targetEnabled ? 'bg-teal-500' : 'bg-zinc-800'}`}
                      >
                        <div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-all duration-300 ${globalAutomation.targetEnabled ? 'left-4' : 'left-0.5'}`} />
                      </button>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-zinc-600 font-bold text-xs">₹</span>
                      <input 
                        type="number"
                        disabled={!globalAutomation.targetEnabled}
                        value={customTargetPrices[activeTradeRec.id] ?? activeTradeRec.target_price_1 ?? ""}
                        onChange={(e) => setCustomTargetPrices(prev => ({ ...prev, [activeTradeRec.id]: parseFloat(e.target.value) }))}
                        className="w-full bg-transparent text-lg font-bold text-teal-400 focus:outline-none disabled:opacity-30 placeholder:text-zinc-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-zinc-950/50 border-t border-zinc-800 flex gap-3">
              <button
                onClick={() => setShowTradeModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 font-bold text-xs uppercase tracking-wider hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmTrade}
                className="flex-[2] px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg transform active:scale-95 transition-all"
              >
                Confirm Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
