import { useState } from 'react';
import { askAi } from '../api';
import { Send, Loader2, Sparkles, CheckCircle, AlertTriangle, ExternalLink, Search, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

export default function ComparisonMode() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setResults(null);
    try {
      const [openRouterRes, geminiRes] = await Promise.all([
        askAi(prompt, 'openrouter').catch(e => ({ error: true, msg: e.message })),
        askAi(prompt, 'gemini').catch(e => ({ error: true, msg: e.message }))
      ]);
      setResults({ openrouter: openRouterRes, gemini: geminiRes });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreUI = (score) => {
    if (score >= 80) return { label: 'Verified', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', bar: 'bg-emerald-500', dot: 'bg-emerald-500' };
    if (score >= 50) return { label: 'Mixed',    color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   bar: 'bg-amber-500',   dot: 'bg-amber-500'   };
    return                 { label: 'Risk',      color: 'text-rose-600',    bg: 'bg-rose-50',    border: 'border-rose-200',    bar: 'bg-rose-500',    dot: 'bg-rose-500'    };
  };

  const renderResult = (data, title, accentColor) => {
    if (!data) return null;
    if (data.error) return (
      <div className="flex-1 bg-rose-50 text-rose-600 rounded-2xl border border-rose-200 p-8 flex items-center justify-center text-sm font-medium shadow-sm animate-scale-in">
        ⚠️ Error: {data.msg}
      </div>
    );

    const scoreUI = getScoreUI(data.overallConfidence);
    const verifiedCount = data.claims.filter(c => c.isFact).length;
    const hallCount = data.claims.filter(c => !c.isFact).length;

    return (
      <div className="flex-1 bg-white rounded-2xl shadow-lg border border-slate-100 flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className={clsx('p-5 border-b border-slate-100 bg-gradient-to-r', accentColor)}>
          <div className="flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2 text-slate-800">
              <Sparkles className="w-4 h-4" />
              {title}
            </h3>
            <div className={clsx('flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest shadow-sm', scoreUI.color, scoreUI.bg, scoreUI.border)}>
              <span className={clsx('w-1.5 h-1.5 rounded-full animate-pulse', scoreUI.dot)} />
              {scoreUI.label} {data.overallConfidence}%
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-1.5 bg-white/60 rounded-full overflow-hidden">
            <div
              className={clsx('h-full rounded-full transition-all duration-1000 ease-out', scoreUI.bar)}
              style={{ width: `${data.overallConfidence}%` }}
            />
          </div>
        </div>

        {/* Annotated Text */}
        <div className="p-5 leading-relaxed text-slate-700 text-sm border-b border-slate-50 bg-slate-50/30">
          {data.claims.map((claim, idx) => (
            <span
              key={idx}
              className={clsx(
                'mx-0.5 px-1.5 py-0.5 rounded-md border-b-2 cursor-help transition-all hover:scale-[1.02] inline-block',
                claim.isFact
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-rose-50 text-rose-900 border-rose-300 hover:bg-rose-100'
              )}
              title={`${claim.confidence}% confidence`}
            >
              {claim.text}&nbsp;
            </span>
          ))}
        </div>

        {/* Evidence */}
        <div className="p-5 flex-1 overflow-y-auto custom-scrollbar space-y-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Search className="w-3 h-3" /> Supporting Evidence
          </p>
          <div className="space-y-2">
            {data.claims.filter(c => c.sources && c.sources.length > 0).slice(0, 4).map((claim, cIdx) => (
              <div key={cIdx}>
                {claim.sources.slice(0, 1).map((src, sIdx) => {
                  let hostname = '#';
                  try { hostname = new URL(src.link).hostname; } catch {}
                  return (
                    <a
                      key={sIdx}
                      href={src.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-200 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <img src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`} alt="" className="w-3.5 h-3.5 rounded-sm" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight truncate">{hostname}</span>
                        <ExternalLink className="w-2.5 h-2.5 text-slate-300 ml-auto" />
                      </div>
                      <p className="text-[11px] font-bold text-slate-700 line-clamp-1">{src.title}</p>
                    </a>
                  );
                })}
              </div>
            ))}
            {data.claims.filter(c => c.sources && c.sources.length > 0).length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">No sources found</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <div className="flex gap-3 text-[10px] font-bold uppercase tracking-wider">
            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              <CheckCircle className="w-3 h-3" /> {verifiedCount} verified
            </div>
            <div className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
              <AlertTriangle className="w-3 h-3" /> {hallCount} issues
            </div>
          </div>
        </div>
      </div>
    );
  };

  const suggestions = [
    "Is the Great Wall visible from space?",
    "Did Einstein fail math in school?",
    "Is lightning never strikes the same place twice true?",
  ];

  return (
    <div className="h-[calc(100vh-57px)] flex flex-col p-6 max-w-7xl mx-auto gap-6">

      {/* Header & Input */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center animate-fade-up">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4 border border-indigo-100">
          <Sparkles className="w-3 h-3" /> Side-by-Side Model Comparison
        </div>
        <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Compare AI Models</h1>
        <p className="text-slate-400 text-sm mb-8 max-w-lg mx-auto">
          Ask a question and instantly compare how OpenRouter and Gemini respond — with real-time fact-checking on both sides.
        </p>

        <form onSubmit={handleSubmit} className="flex gap-3 max-w-2xl mx-auto">
          <input
            type="text"
            className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 focus:bg-white outline-none transition-all text-sm placeholder:text-slate-400"
            placeholder="Ask something to compare both models..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="px-6 bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl flex items-center gap-2 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 font-semibold text-sm"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Compare</>}
          </button>
        </form>

        {/* Suggestion chips */}
        {!results && !loading && (
          <div className="flex flex-wrap gap-2 justify-center mt-5">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => setPrompt(s)}
                className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all font-medium"
              >
                <ArrowRight className="w-3 h-3" /> {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 animate-fade-up">
          <div className="relative flex gap-4">
            {['bg-indigo-500', 'bg-violet-500'].map((c, i) => (
              <div key={i} className={clsx('w-12 h-12 rounded-full opacity-80 animate-pulse', c)} style={{ animationDelay: `${i * 200}ms` }} />
            ))}
          </div>
          <div className="text-center space-y-1">
            <p className="font-bold text-slate-700">Querying both models...</p>
            <p className="text-sm text-slate-400">Verifying claims against live search</p>
          </div>
          <div className="flex gap-1.5">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
        </div>
      )}

      {/* Results */}
      {results && !loading && (
        <div className="flex gap-5 flex-1 min-h-0">
          {renderResult(results.openrouter, 'OpenRouter · Gemini 2.0', 'from-indigo-50/60 to-white')}
          {/* VS Divider */}
          <div className="flex flex-col items-center justify-center gap-2 flex-shrink-0">
            <div className="h-full w-px bg-slate-100" />
            <div className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-[10px] font-black text-slate-400 shadow-sm flex-shrink-0">
              VS
            </div>
            <div className="h-full w-px bg-slate-100" />
          </div>
          {renderResult(results.gemini, 'Gemini 1.5 Flash', 'from-violet-50/60 to-white')}
        </div>
      )}
    </div>
  );
}
