'use client';

import { useEffect, useState } from 'react';
import { tlmApis } from '@/api/tlmapis';
import { ExternalLink } from 'lucide-react';

interface OrderRecord {
  id: number;
  stock_symbol: string;
  stock_name: string;
  trade_type: string;
  quantity: number;
  price: number;
  status: string;
  created_at: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [nextCursor, setNextCursor] = useState<number | null>(null);

  const fetchOrders = async (cursor: number | null = null) => {
    if (cursor) setLoadingMore(true);
    else setLoading(true);

    try {
      const res = await tlmApis.getOrders({ limit: 20, cursor });
      if (res.data && !res.data.error) {
        if (cursor) {
          setOrders(prev => [...prev, ...res.data.orders]);
        } else {
          setOrders(res.data.orders);
        }
        setNextCursor(res.data.next_cursor);
      }
    } catch (e) {
      console.error("Error fetching executed orders history:", e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-zinc-400">
        <div className="animate-spin h-8 w-8 border-2 border-teal-400 border-t-transparent rounded-full mb-4"></div>
        <span className="text-sm font-medium">Retrieving Transaction Registers...</span>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex flex-col gap-1 mb-8">
        <h1 className="text-3xl font-black tracking-tight text-zinc-100 bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
          Order Journals
        </h1>
        <p className="text-zinc-500 font-medium text-sm">Review execution boundaries mapped dynamically across time periods.</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 border border-zinc-800/50 border-dashed bg-zinc-900/10 rounded-2xl text-zinc-500 font-medium">
          No transactional history deployed.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="overflow-x-auto rounded-2xl border border-zinc-800/60 bg-zinc-900/20 shadow-xl">
            <table className="w-full text-left border-collapse text-zinc-300">
              {/* ... table content remains same ... */}
              <thead>
                <tr className="border-b border-zinc-800/80 bg-zinc-950/40 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Symbol</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4 text-center">Quantity</th>
                  <th className="px-6 py-4 text-center">Executed Price</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40 text-sm font-semibold">
                {orders.map((order) => {
                  const isBuy = order.trade_type === "BUY";
                  const orderDate = new Date(order.created_at);
                  return (
                    <tr key={order.id} className="hover:bg-zinc-800/10 transition-all duration-150">
                      <td className="px-6 py-4 text-zinc-400 text-xs font-medium flex flex-col">
                        <span>{orderDate.toLocaleDateString('en-GB')}</span>
                        <span className="text-[10px] text-zinc-600 mt-0.5 font-bold">{orderDate.toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'})}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-100 font-bold">{orderSymbol(order.stock_symbol)}</span>
                          <a 
                            href={`https://www.tradingview.com/chart/?symbol=NSE%3A${orderSymbol(order.stock_symbol)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-md bg-zinc-800/50 text-zinc-500 hover:text-teal-400 hover:bg-zinc-700 transition-all duration-200"
                            title="View TradingView Chart"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                        <span className="block text-[10px] text-zinc-500 font-medium">{order.stock_name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                          isBuy ? "border-teal-500/30 bg-teal-500/10 text-teal-400" : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                        }`}>
                          {order.trade_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-zinc-200 font-extrabold">{order.quantity}</td>
                      <td className="px-6 py-4 text-center text-zinc-100">
                        ₹{order.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[10px] font-bold">
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {nextCursor && (
            <div className="flex justify-center pb-10">
              <button
                onClick={() => fetchOrders(nextCursor)}
                disabled={loadingMore}
                className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 border border-zinc-800 hover:border-teal-500/50 hover:bg-zinc-800 text-zinc-300 font-bold text-xs uppercase tracking-widest rounded-xl transition-all duration-200 disabled:opacity-50 group"
              >
                {loadingMore ? (
                  <div className="animate-spin h-3 w-3 border-2 border-teal-400 border-t-transparent rounded-full"></div>
                ) : (
                  <span className="group-hover:text-teal-400 transition-colors">Load More Orders</span>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function orderSymbol(sym: string) {
  return sym.includes(':') ? sym.split(':')[1] : sym;
}
