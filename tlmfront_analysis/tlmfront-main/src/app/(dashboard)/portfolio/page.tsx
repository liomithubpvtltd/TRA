'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { tlmApis } from '@/api/tlmapis';
import { useSocket } from '@/providers/SocketProvider';
import { ExternalLink } from 'lucide-react';

interface RecommendationData {
  action: string;
  created_at: string;
  target_reason: string | null;
  target_status_at: string | null;
  closed_reason: string | null;
  closed_at: string | null;
}

interface Holding {
  id: number;
  stock_symbol: string;
  stock_name: string;
  stock_exchange: string;
  quantity: number;
  avg_price: number;
  live_price: number;
  pnl: number;
  auto_sl_price: number | null;
  auto_target_price: number | null;
  auto_ema_enabled: boolean;
  last_recommendation: RecommendationData | null;
}

interface PortfolioData {
  current_balance: number;
  initial_balance: number;
  total_value: number;
  total_pnl: number;
  day_pnl: number;
  holdings: Holding[];
}

export default function PortfolioPage() {
  const router = useRouter();
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [socketStatus, setSocketStatus] = useState<string>("connecting");
  const [reconnectTrigger, setReconnectTrigger] = useState<number>(0);
  const [sellQuantities, setSellQuantities] = useState<Record<number, number>>({});
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' | null }>({ message: '', type: null });

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: null }), 5000);
  };

  const fetchPortfolio = async () => {
    try {
      const res = await tlmApis.getPortfolio();
      if (res.data && !res.data.error) {
        setData(res.data);
      }
    } catch (e) {
      console.error("Error fetching portfolio dashboard:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
    const interval = setInterval(fetchPortfolio, 15000);
    return () => clearInterval(interval);
  }, []);

  const { lastMessage, status: centralStatus } = useSocket();

  useEffect(() => {
    setSocketStatus(centralStatus);
  }, [centralStatus]);

  useEffect(() => {
    if (!lastMessage) return;

    try {
      const payload = lastMessage;
      if (payload.type === "portfolio_update" && payload.data) {
        const { holding_id, stock, message } = payload.data;
        setData(prevData => {
          if (!prevData) return prevData;
          return {
            ...prevData,
            holdings: prevData.holdings.filter(h => h.id !== holding_id)
          };
        });
        showNotification(message || `Automated exit for ${stock}`, "success");
      }

      if (payload.type === "tick" && payload.live_ltp) {
        setData(prevData => {
          if (!prevData) return prevData;

          let updatedTotalValue = 0;
          let updatedTotalPnl = 0;
          
          const updatedHoldings = prevData.holdings.map(h => {
            let newLivePrice = h.live_price;
            if (payload.live_ltp[h.stock_symbol] !== undefined) {
              newLivePrice = payload.live_ltp[h.stock_symbol];
            }
            const newPnl = (newLivePrice - h.avg_price) * h.quantity;
            
            updatedTotalValue += (newLivePrice * h.quantity);
            updatedTotalPnl += newPnl;

            return {
              ...h,
              live_price: newLivePrice,
              pnl: newPnl
            };
          });

          return {
            ...prevData,
            holdings: updatedHoldings,
            total_value: updatedTotalValue,
            total_pnl: updatedTotalPnl
          };
        });
      }
    } catch (err) {
      console.error("Error processing central WebSocket message in Portfolio:", err);
    }
  }, [lastMessage]);

  const handleSell = async (stockSymbol: string, qty: number) => {
    const price = data?.holdings.find(h => h.stock_symbol === stockSymbol)?.live_price || 0;
    if (price <= 0) {
      showNotification("Price not available for execution.", "error");
      return;
    }

    try {
      const res = await tlmApis.executeTrade({
        stock_symbol: stockSymbol,
        trade_type: "SELL",
        quantity: qty,
        price: price
      });
      
      const resData = res.data;
      if (resData.error) {
        showNotification(resData.error, "error");
      } else {
        showNotification(resData.message, "success");
        fetchPortfolio();
      }
    } catch (e: any) {
      console.error("Error executing sell order:", e);
      const errorMsg = e.response?.data?.error || "Terminal Error: Execution failed.";
      showNotification(errorMsg, "error");
    }
  };

  const updateAutomation = async (holdingId: number, field: string, value: any) => {
    try {
      const payload: any = {};
      if (field === 'sl') payload.auto_sl = value;
      if (field === 'target') payload.auto_target = value;
      if (field === 'ema') payload.auto_ema = value;

      const res = await tlmApis.updateHoldingAutomation(holdingId, payload);
      if (res.data.success) {
        setNotification({ message: `Automation updated for ${field.toUpperCase()}`, type: 'success' });
        // Update local state
        setData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            holdings: prev.holdings.map(h => h.id === holdingId ? {
              ...h,
              auto_sl_price: field === 'sl' ? (value === "" ? null : value) : h.auto_sl_price,
              auto_target_price: field === 'target' ? (value === "" ? null : value) : h.auto_target_price,
              auto_ema_enabled: field === 'ema' ? value : h.auto_ema_enabled
            } : h)
          };
        });
      }
    } catch (e: any) {
      setNotification({ message: e.response?.data?.error || "Update failed", type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-zinc-400">
        <div className="animate-spin h-8 w-8 border-2 border-teal-400 border-t-transparent rounded-full mb-4"></div>
        <span className="text-sm font-medium">Aggregating Portfolio Insights...</span>
      </div>
    );
  }

  const currentPnL = data?.total_pnl || 0;
  const isProfit = currentPnL >= 0;
  const dayPnL = data?.day_pnl || 0;
  const isDayProfit = dayPnL >= 0;
  
  // Calculate total invested (cost basis)
  const totalInvested = data?.holdings.reduce((acc, h) => acc + (h.avg_price * h.quantity), 0) || 0;

  return (
    <div className="p-8 max-w-6xl mx-auto relative">
      {/* Custom Notification Toast */}
      {notification.type && (
        <div className={`fixed top-8 right-8 z-[100] flex items-center gap-4 p-4 rounded-2xl border backdrop-blur-2xl shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500 ${
          notification.type === 'success' 
            ? 'bg-teal-500/10 border-teal-500/20 text-teal-400' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          <div className={`flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-xl font-bold ${
            notification.type === 'success' ? 'bg-teal-500/20' : 'bg-rose-500/20'
          }`}>
            {notification.type === 'success' ? '✓' : '!'}
          </div>
          <div className="flex flex-col pr-4">
            <span className="text-[10px] uppercase tracking-widest font-black opacity-60">
              {notification.type === 'success' ? 'Execution Success' : 'Execution Failed'}
            </span>
            <p className="text-sm font-bold text-zinc-100">{notification.message}</p>
          </div>
          <button onClick={() => setNotification({ message: '', type: null })} className="text-zinc-500 hover:text-zinc-300">
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-col gap-1 mb-8">
        <h1 className="text-3xl font-black tracking-tight text-zinc-100 bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
          Holdings & Valuation
        </h1>
        <p className="text-zinc-500 font-medium text-sm">Track active positions and aggregate valuation parameters.</p>
      </div>

      {/* Summary Dashboard - Row 1: Capital Metrics (Small) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-zinc-900/20 border border-zinc-800/40 rounded-xl p-3 flex flex-col justify-center">
          <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Initial Capital</span>
          <span className="text-sm font-bold text-zinc-500 mt-0.5">
            ₹{data?.initial_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="bg-zinc-900/20 border border-zinc-800/40 rounded-xl p-3 flex flex-col justify-center">
          <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Available Capital</span>
          <span className="text-sm font-bold text-zinc-400 mt-0.5">
            ₹{data?.current_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="bg-zinc-900/20 border border-zinc-800/40 rounded-xl p-3 flex flex-col justify-center">
          <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Invested</span>
          <span className="text-sm font-bold text-zinc-400 mt-0.5">
            ₹{totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="bg-zinc-900/20 border border-zinc-800/40 rounded-xl p-3 flex flex-col justify-center">
          <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Networth</span>
          <span className="text-sm font-bold text-zinc-400 mt-0.5">
            ₹{((data?.current_balance || 0) + (data?.total_value || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Summary Dashboard - Row 2: Performance Metrics (Highlighted) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden group shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Day's P&L</span>
            <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${isDayProfit ? 'bg-teal-500/10 text-teal-400' : 'bg-rose-500/10 text-rose-400'}`}>
              Realized Today
            </div>
          </div>
          <span className={`block text-3xl font-black mt-3 tracking-tighter ${isDayProfit ? 'text-teal-400' : 'text-rose-400'}`}>
            {isDayProfit ? '+' : '-'}₹{Math.abs(dayPnL).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <div className={`h-1.5 w-full absolute bottom-0 left-0 ${isDayProfit ? 'bg-teal-500/40' : 'bg-rose-500/40'} opacity-30 group-hover:opacity-100 transition-all duration-700`} />
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden group shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Holding P&L</span>
            <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${isProfit ? 'bg-teal-500/10 text-teal-400' : 'bg-rose-500/10 text-rose-400'}`}>
              Active Holdings
            </div>
          </div>
          <span className={`block text-3xl font-black mt-3 tracking-tighter ${isProfit ? 'text-teal-400' : 'text-rose-400'}`}>
            {isProfit ? '+' : '-'}₹{Math.abs(currentPnL).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <div className={`h-1.5 w-full absolute bottom-0 left-0 ${isProfit ? 'bg-teal-500/40' : 'bg-rose-500/40'} opacity-30 group-hover:opacity-100 transition-all duration-700`} />
        </div>
      </div>

      <h2 className="text-xl font-bold tracking-tight text-zinc-200 mb-4">Holded Shares</h2>

      {!data?.holdings || data.holdings.length === 0 ? (
        <div className="text-center py-20 border border-zinc-800/50 border-dashed bg-zinc-900/10 rounded-2xl text-zinc-500 font-medium">
          No active holdings deployed.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.holdings.map((h) => {
            const hProfit = h.pnl >= 0;
            return (
              <div key={h.id} className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-6 shadow-xl hover:border-zinc-700/80 transition-all duration-300 relative flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 font-bold uppercase rounded border border-zinc-700/50">{h.stock_exchange}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <h4 
                        onClick={() => h.last_recommendation && window.open(`/home?symbol=${h.stock_symbol}&date=${h.last_recommendation.created_at.split('T')[0]}`, '_blank')}
                        className="text-base font-black tracking-tight text-zinc-100 cursor-pointer hover:text-teal-400 transition-colors"
                      >
                        {h.stock_symbol}
                      </h4>
                      <a 
                        href={`https://www.tradingview.com/chart/?symbol=NSE%3A${h.stock_symbol}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded-md bg-zinc-800 text-zinc-500 hover:text-teal-400 hover:bg-zinc-700 transition-all duration-200"
                        title="View TradingView Chart"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <span className="text-xs text-zinc-500 font-medium">{h.stock_name}</span>
                    
                    {h.last_recommendation && (
                      <div 
                        onClick={() => window.open(`/home?symbol=${h.stock_symbol}&date=${h.last_recommendation!.created_at.split('T')[0]}`, '_blank')}
                        className="mt-3 p-2.5 bg-zinc-950/60 rounded-xl border border-zinc-800/50 flex flex-col gap-1.5 cursor-pointer hover:bg-zinc-900/60 hover:border-teal-500/30 transition-all duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${h.last_recommendation.action === 'BUY' ? 'bg-teal-500/10 text-teal-400' : 'bg-rose-500/10 text-rose-400'}`}>
                              {h.last_recommendation.action}
                            </span>
                            <span className="text-[9px] text-zinc-500 font-bold tracking-tight">
                              {new Date(h.last_recommendation.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        {(h.last_recommendation.target_reason || h.last_recommendation.closed_reason) && (
                          <div className={`flex items-center gap-1.5 text-[10px] font-bold ${h.last_recommendation.target_reason ? 'text-emerald-400' : 'text-amber-400'}`}>
                            <span>{h.last_recommendation.target_reason ? '🎯' : '🛑'}</span>
                            <span className="truncate">{h.last_recommendation.target_reason || h.last_recommendation.closed_reason}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-xs font-extrabold text-zinc-100 bg-zinc-800 px-3 py-1 rounded-lg border border-zinc-700/40">
                      {h.quantity} Shares
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 bg-zinc-950/40 p-4 rounded-xl border border-zinc-800/50 text-center">
                  <div className="flex flex-col items-start text-left">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Avg Price</span>
                    <span className="text-xs font-bold text-zinc-300 mt-0.5">₹{h.avg_price.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Live Price</span>
                    <span className="text-xs font-bold text-zinc-100 mt-0.5">₹{h.live_price.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col items-end text-right">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">P&L</span>
                    <span className={`text-xs font-bold mt-0.5 ${hProfit ? 'text-teal-400' : 'text-rose-400'}`}>
                      ₹{h.pnl.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Automation Panel */}
                <div className="bg-zinc-950/60 rounded-xl border border-zinc-800/50 flex flex-col overflow-hidden">
                  <div className="px-4 py-2 bg-zinc-900/50 border-b border-zinc-800/50 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Automation Controls</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-zinc-600 font-bold uppercase">20EMA</span>
                      <button 
                        onClick={() => updateAutomation(h.id, 'ema', !h.auto_ema_enabled)}
                        className={`w-7 h-3.5 rounded-full transition-all duration-300 relative ${h.auto_ema_enabled ? 'bg-teal-500' : 'bg-zinc-800'}`}
                      >
                        <div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-all duration-300 ${h.auto_ema_enabled ? 'left-4' : 'left-0.5'}`} />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 grid grid-cols-2 gap-3">
                    {/* SL Control */}
                    <div className={`p-2 rounded-lg border transition-all duration-300 ${h.auto_sl_price ? 'bg-rose-500/5 border-rose-500/20' : 'bg-zinc-900/30 border-zinc-800/50'}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase">Auto SL</span>
                        <div className={`w-1.5 h-1.5 rounded-full ${h.auto_sl_price ? 'bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.5)]' : 'bg-zinc-700'}`} />
                      </div>
                      <input 
                        type="number"
                        defaultValue={h.auto_sl_price || ""}
                        placeholder="Set SL"
                        onBlur={(e) => {
                          const val = e.target.value === "" ? null : parseFloat(e.target.value);
                          if (val !== h.auto_sl_price) updateAutomation(h.id, 'sl', val);
                        }}
                        className="w-full bg-transparent text-xs font-bold text-rose-400 focus:outline-none placeholder:text-zinc-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>

                    {/* Target Control */}
                    <div className={`p-2 rounded-lg border transition-all duration-300 ${h.auto_target_price ? 'bg-teal-500/5 border-teal-500/20' : 'bg-zinc-900/30 border-zinc-800/50'}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase">Auto Target</span>
                        <div className={`w-1.5 h-1.5 rounded-full ${h.auto_target_price ? 'bg-teal-500 shadow-[0_0_5px_rgba(20,184,166,0.5)]' : 'bg-zinc-700'}`} />
                      </div>
                      <input 
                        type="number"
                        defaultValue={h.auto_target_price || ""}
                        placeholder="Set Target"
                        onBlur={(e) => {
                          const val = e.target.value === "" ? null : parseFloat(e.target.value);
                          if (val !== h.auto_target_price) updateAutomation(h.id, 'target', val);
                        }}
                        className="w-full bg-transparent text-xs font-bold text-teal-400 focus:outline-none placeholder:text-zinc-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 items-center">
                  <div className="flex items-center gap-2 w-24 bg-zinc-950/60 p-2 rounded-xl border border-zinc-800/50">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Qty</label>
                    <input 
                      type="number" 
                      min="1" 
                      max={h.quantity}
                      value={sellQuantities[h.id] !== undefined ? sellQuantities[h.id] : h.quantity} 
                      onChange={(e) => {
                        let val = parseInt(e.target.value);
                        if (val > h.quantity) val = h.quantity;
                        setSellQuantities(prev => ({ ...prev, [h.id]: val }));
                      }}
                      className="w-full bg-transparent text-right border-none text-xs text-zinc-100 font-bold focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => handleSell(h.stock_symbol, sellQuantities[h.id] !== undefined ? sellQuantities[h.id] : h.quantity)}
                    className="flex-1 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold text-xs uppercase tracking-wider rounded-xl active:scale-98 transition-all duration-200"
                  >
                    Sell
                  </button>
                  <button
                    onClick={() => handleSell(h.stock_symbol, h.quantity)}
                    className="flex-1 py-2.5 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 border border-zinc-700/50 font-bold text-xs uppercase tracking-wider rounded-xl active:scale-98 transition-all duration-200"
                  >
                    Sell All
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
