import { useEffect, useState } from 'react';
import { getHistory } from '../api';
import { Clock, CheckCircle, AlertTriangle, RefreshCw, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

export default function Dashboard() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await getHistory();
      setHistory(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getTrustLabel = (score) => {
    if (score >= 80) return { label: 'High Trust', color: 'text-emerald-600', dot: 'bg-emerald-500' };
    if (score >= 50) return { label: 'Mixed',      color: 'text-amber-600',   dot: 'bg-amber-500'   };
    return                 { label: 'Low Trust',   color: 'text-rose-600',    dot: 'bg-rose-500'    };
  };

  return (
    <div className="h-[calc(100vh-57px)] overflow-y-auto custom-scrollbar">
      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Query History</h1>
            <p className="text-sm text-slate-400 mt-0.5">Your past verified questions</p>
          </div>
          <button
            onClick={() => fetchHistory(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-all"
          >
            <RefreshCw className={clsx('w-3.5 h-3.5', refreshing && 'animate-spin')} />
            Refresh
          </button>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shimmer h-24" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && history.length === 0 && (
          <div className="text-center py-24">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Clock className="w-5 h-5 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-600">No queries yet</p>
            <p className="text-sm text-slate-400 mt-1">Start chatting to see your history here</p>
          </div>
        )}

        {/* History list */}
        {!loading && history.length > 0 && (
          <div className="space-y-3">
            {history.map((chat, i) => {
              const trust = getTrustLabel(chat.overallConfidence);
              const verified = chat.claims.filter(c => c.isFact).length;
              const hallucinations = chat.claims.filter(c => !c.isFact).length;

              return (
                <div
                  key={chat._id}
                  className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-slate-200 hover:shadow-sm transition-all duration-200 animate-fade-up"
                  style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{chat.prompt}</p>
                      <p className="text-slate-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">{chat.response}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" />
                  </div>

                  {/* Footer meta */}
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-50">
                    {/* Trust badge */}
                    <div className={clsx('flex items-center gap-1.5 text-xs font-semibold', trust.color)}>
                      <span className={clsx('w-1.5 h-1.5 rounded-full', trust.dot)} />
                      {trust.label}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 ml-auto">
                      {verified > 0 && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                          {verified} verified
                        </span>
                      )}
                      {hallucinations > 0 && (
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          {hallucinations} flagged
                        </span>
                      )}
                      <span className="text-slate-300">·</span>
                      <span>{new Date(chat.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
