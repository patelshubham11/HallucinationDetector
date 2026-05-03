import { useState, useRef, useEffect } from 'react';
import { askAi } from '../api';
import { Send, Bot, Loader2, Search, CheckCircle, AlertTriangle, ExternalLink, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';

export default function ChatInterface() {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('gemini');
  const [loading, setLoading] = useState(false);
  const [chatLog, setChatLog] = useState([]);
  const [expandedReports, setExpandedReports] = useState({});
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const currentPrompt = prompt;
    setPrompt('');
    setLoading(true);

    try {
      const historyContext = chatLog.flatMap(chat => [
        { role: 'user', content: chat.prompt },
        { role: 'model', content: chat.response }
      ]);
      const data = await askAi(currentPrompt, model, historyContext);
      setChatLog(prev => [...prev, data]);
      setExpandedReports(prev => ({ ...prev, [chatLog.length]: false }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const toggleReport = (idx) => {
    setExpandedReports(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const getScoreUI = (score) => {
    if (score >= 80) return { label: 'Verified', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', bar: 'bg-emerald-500' };
    if (score >= 50) return { label: 'Mixed',    color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   dot: 'bg-amber-500',   bar: 'bg-amber-500'   };
    return                 { label: 'Risk',      color: 'text-rose-600',    bg: 'bg-rose-50',    border: 'border-rose-200',    dot: 'bg-rose-500',    bar: 'bg-rose-500'    };
  };

  const suggestions = [
    "Is the Earth flat?",
    "Who invented the telephone?",
    "What is the speed of light?",
    "Is 1 an even or odd number?",
  ];

  return (
    <div className="h-[calc(100vh-57px)] flex flex-col max-w-4xl mx-auto w-full border-x border-slate-100 bg-white shadow-xl isolate">

      {/* Header */}
      <div className="border-b border-slate-100 p-4 bg-white/90 backdrop-blur-md flex justify-between items-center z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-md shadow-indigo-200 animate-pulse-ring">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 tracking-tight">VerifAI Chat</h2>
            <p className="text-xs text-slate-400">Real-time hallucination detection</p>
          </div>
        </div>

        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 p-2.5 shadow-sm outline-none transition-all cursor-pointer hover:border-indigo-300"
        >
          <option value="openrouter">⚡ OpenRouter (Gemini 2.0)</option>
          <option value="gemini">🔮 Gemini 1.5 Flash</option>
        </select>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50 custom-scrollbar">

        {/* Empty State */}
        {chatLog.length === 0 && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-16 animate-fade-up">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-3xl flex items-center justify-center shadow-inner">
              <Sparkles className="w-10 h-10 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">Ask anything, verify everything</h3>
              <p className="text-sm text-slate-400 max-w-sm">Every AI response is fact-checked against live search results in real time.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full max-w-md">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setPrompt(s); inputRef.current?.focus(); }}
                  className="text-left p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-all duration-200 shadow-sm card-hover font-medium"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Messages */}
        {chatLog.map((result, index) => {
          const scoreUI = getScoreUI(result.overallConfidence);
          const reportExpanded = expandedReports[index] !== false; // default expanded

          return (
            <div key={index} className="space-y-4 animate-fade-up">
              {/* User Bubble */}
              <div className="flex justify-end animate-fade-right">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white px-5 py-3.5 rounded-2xl rounded-tr-sm max-w-[82%] shadow-lg shadow-indigo-200/50 text-sm leading-relaxed font-medium">
                  {result.prompt}
                </div>
              </div>

              {/* AI Response */}
              <div className="flex gap-3 animate-fade-left">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex-shrink-0 flex items-center justify-center border border-slate-200 shadow-sm mt-1">
                  <Bot className="w-4 h-4 text-slate-500" />
                </div>

                <div className="flex-1 space-y-3">
                  {/* Annotated Text */}
                  <div className="bg-white px-5 py-4 rounded-2xl rounded-tl-sm shadow-sm border border-slate-100 leading-relaxed text-slate-700 text-sm">
                    {result.claims.map((claim, idx) => (
                      <span
                        key={idx}
                        className={clsx(
                          'mx-0.5 px-1.5 py-0.5 rounded-md cursor-help transition-all duration-200 border-b-2 hover:scale-[1.02] inline-block',
                          claim.isFact
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-900 border-rose-300 hover:bg-rose-100'
                        )}
                        title={`${claim.isFact ? '✅ Verified' : '⚠️ Potential Hallucination'} — ${claim.confidence}% confidence`}
                      >
                        {claim.text}&nbsp;
                      </span>
                    ))}
                  </div>

                  {/* Verification Card */}
                  <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden transition-all duration-300">
                    {/* Card Header — clickable to expand/collapse */}
                    <button
                      onClick={() => toggleReport(index)}
                      className="w-full bg-gradient-to-r from-slate-50 to-white p-4 border-b border-slate-100 flex justify-between items-center hover:from-indigo-50/30 transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-indigo-50 rounded-lg">
                          <Search className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-slate-800 text-sm">Fact-Check Report</p>
                          <p className="text-[10px] text-slate-400">Verified via live search</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Progress Gauge */}
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={clsx('h-full rounded-full transition-all duration-1000 ease-out', scoreUI.bar)}
                              style={{ width: `${result.overallConfidence}%` }}
                            />
                          </div>
                          <div className={clsx('flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wide', scoreUI.color, scoreUI.bg, scoreUI.border)}>
                            <span className={clsx('w-1.5 h-1.5 rounded-full animate-pulse', scoreUI.dot)} />
                            {scoreUI.label} {result.overallConfidence}%
                          </div>
                        </div>
                        {reportExpanded
                          ? <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                          : <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                        }
                      </div>
                    </button>

                    {/* Claims List */}
                    {reportExpanded && (
                      <div className="p-5 space-y-6 max-h-[480px] overflow-y-auto custom-scrollbar">
                        {result.claims.map((claim, idx) => (
                          <div key={idx} className={clsx('animate-fade-up', `delay-${idx * 75}`)}>
                            <div className="flex items-start gap-3">
                              <div className={clsx(
                                'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border-2',
                                claim.isFact ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-500'
                              )}>
                                {claim.isFact ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                              </div>
                              <div className="flex-1 space-y-3">
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className={clsx(
                                      'text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded',
                                      claim.isFact ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                    )}>
                                      {claim.isFact ? 'Verified Claim' : 'Potential Hallucination'}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                          className={clsx('h-full rounded-full', claim.isFact ? 'bg-emerald-400' : 'bg-rose-400')}
                                          style={{ width: `${claim.confidence}%` }}
                                        />
                                      </div>
                                      <span className="text-[10px] text-slate-400 font-mono">{claim.confidence}%</span>
                                    </div>
                                  </div>
                                  <p className="text-sm text-slate-700 font-medium leading-relaxed">{claim.text}</p>
                                </div>

                                {/* Source Cards */}
                                {claim.sources && claim.sources.length > 0 && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {claim.sources.map((src, i) => {
                                      let hostname = '#';
                                      try { hostname = new URL(src.link).hostname; } catch {}
                                      return (
                                        <a
                                          key={i}
                                          href={src.link}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="group/src p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-indigo-200 hover:shadow-md transition-all duration-200 block"
                                        >
                                          <div className="flex items-center gap-2 mb-1.5">
                                            <img
                                              src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
                                              alt=""
                                              className="w-3.5 h-3.5 rounded-sm"
                                            />
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight truncate">{hostname}</span>
                                            <ExternalLink className="w-2.5 h-2.5 text-slate-300 group-hover/src:text-indigo-500 ml-auto transition-colors" />
                                          </div>
                                          <p className="text-[11px] font-semibold text-slate-700 line-clamp-1 group-hover/src:text-indigo-600 transition-colors">{src.title}</p>
                                          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 leading-normal">{src.snippet}</p>
                                        </a>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                            {idx < result.claims.length - 1 && (
                              <div className="ml-12 mt-5 border-b border-slate-100" />
                            )}
                          </div>
                        ))}
                        <div className="text-center pt-2 border-t border-slate-50">
                          <p className="text-[9px] text-slate-300 uppercase tracking-[0.25em] font-bold">End of Verification Report</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing Indicator */}
        {loading && (
          <div className="flex gap-3 animate-fade-up">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex-shrink-0 flex items-center justify-center border border-slate-200 shadow-sm">
              <Bot className="w-4 h-4 text-slate-500" />
            </div>
            <div className="space-y-2">
              <div className="bg-white px-5 py-4 rounded-2xl rounded-tl-sm shadow-sm border border-slate-100 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
                <span className="text-xs text-slate-400 font-medium">Generating & verifying claims...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100">
        <form onSubmit={handleSubmit} className="flex gap-3 relative max-w-3xl mx-auto">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              className="w-full p-4 pr-5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 outline-none shadow-sm transition-all text-sm placeholder:text-slate-400 bg-slate-50 focus:bg-white"
              placeholder="Ask a question and verify the facts..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="px-5 bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl flex items-center justify-center hover:from-indigo-700 hover:to-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 duration-200"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
        <p className="text-center text-[10px] text-slate-300 mt-2 font-medium">AI can make mistakes. Always verify critical information.</p>
      </div>
    </div>
  );
}
