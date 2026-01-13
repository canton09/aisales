
import React, { useState, useEffect, useRef } from 'react';
import { runAnalysis, ModelProvider, SCENARIO_CONFIGS } from './services/analysisService';
import { SalesVisitAnalysis, ScenarioKey } from './types';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { 
  Loader2, Sparkles, Car, Cpu, Key, AlertCircle, Clock, 
  PhoneCall, Users, MonitorPlay, Compass, ChevronLeft 
} from 'lucide-react';

const App: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioKey | null>(null);
  const [transcript, setTranscript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<number | null>(null);

  const [deepseekApiKey, setDeepseekApiKey] = useState(() => {
    return localStorage.getItem('user_deepseek_api_key') || '';
  });
  const [provider, setProvider] = useState<ModelProvider>(() => {
    return (localStorage.getItem('preferred_provider') as ModelProvider) || 'gemini';
  });
  const [result, setResult] = useState<{data: SalesVisitAnalysis, provider: ModelProvider} | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('preferred_provider', provider);
  }, [provider]);

  useEffect(() => {
    localStorage.setItem('user_deepseek_api_key', deepseekApiKey);
  }, [deepseekApiKey]);

  useEffect(() => {
    if (isAnalyzing) {
      setTimer(0);
      timerRef.current = window.setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAnalyzing]);

  const handleAnalyze = async () => {
    if (!transcript.trim() || !selectedScenario) return;
    
    if (provider === 'deepseek' && !deepseekApiKey.trim()) {
      setError('请先配置您的 DeepSeek API Key');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    try {
      const response = await runAnalysis(transcript, selectedScenario, provider, deepseekApiKey);
      setResult(response);
    } catch (err: any) {
      console.error("Analysis Error:", err);
      setError(err.message || '分析中断，请检查 API 配置或网络环境。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getLoadingMessage = () => {
    if (timer < 5) return "建立连接...";
    if (timer < 15) return "解析逻辑...";
    return "生成报告...";
  };

  const scenarioCards = [
    { key: 'telesales_coaching', name: '电销实战', desc: '听觉心理 x 转化', icon: PhoneCall, color: 'bg-blue-600' },
    { key: 'field_sales_visit', name: '现场销售', desc: '场景体验 x 心理', icon: Users, color: 'bg-indigo-600' },
    { key: 'livestream_sales', name: '直播销售', desc: '情绪唤起 x 转化', icon: MonitorPlay, color: 'bg-rose-600' },
    { key: 'test_drive_sales', name: '试驾体验', desc: '体感验证 x 情感', icon: Compass, color: 'bg-emerald-600' },
  ];

  const handleBack = () => {
    if (result) {
      setResult(null);
    } else {
      setSelectedScenario(null);
      setTranscript('');
      setError(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 pb-8">
      <nav className="sticky top-0 z-50 bg-[#0f172a]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setSelectedScenario(null); setResult(null); }}>
            <div className="bg-indigo-600 p-1 rounded-lg text-white">
              <Car className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">SalesCoach<span className="text-indigo-400">AI</span></span>
          </div>
          <span className="text-[10px] font-black text-slate-400 border border-white/10 px-2 py-0.5 rounded-full uppercase">PRO</span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-3 mt-6">
        {!selectedScenario ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-8 px-2">
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-2">
                犀利教练 <span className="text-indigo-400 text-2xl md:text-5xl block md:inline">实战复盘</span>
              </h1>
              <p className="text-slate-400 text-sm md:text-base">选择业务场景，解剖沟通漏洞</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
              {scenarioCards.map((card) => (
                <button
                  key={card.key}
                  onClick={() => setSelectedScenario(card.key as ScenarioKey)}
                  className="group relative bg-slate-800/40 border border-white/5 p-4 md:p-8 rounded-2xl md:rounded-[2rem] text-left transition-all hover:bg-slate-800"
                >
                  <div className={`w-10 h-10 md:w-16 md:h-16 ${card.color} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                    <card.icon className="w-5 h-5 md:w-8 md:h-8 text-white" />
                  </div>
                  <h3 className="text-base md:text-2xl font-bold mb-1 text-white">{card.name}</h3>
                  <p className="text-slate-500 text-[10px] md:text-sm leading-tight line-clamp-2">
                    {card.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : !result ? (
          <div className="max-w-3xl mx-auto space-y-4 animate-in fade-in zoom-in-95 duration-400">
            <button 
              onClick={handleBack}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white font-bold text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> 返回场景
            </button>

            <div className="bg-slate-900/50 p-5 md:p-8 rounded-2xl md:rounded-[2rem] border border-white/5 space-y-5 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h2 className="text-lg md:text-2xl font-bold text-white truncate">{SCENARIO_CONFIGS[selectedScenario].name}</h2>
                <div className="flex bg-black/40 p-1 rounded-lg border border-white/5 scale-90 md:scale-100 origin-right">
                  <button onClick={() => setProvider('deepseek')} className={`px-2 md:px-4 py-1.5 rounded-md text-[10px] md:text-xs font-bold transition-all ${provider === 'deepseek' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>DS</button>
                  <button onClick={() => setProvider('gemini')} className={`px-2 md:px-4 py-1.5 rounded-md text-[10px] md:text-xs font-bold transition-all ${provider === 'gemini' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>GM</button>
                </div>
              </div>

              {provider === 'deepseek' && (
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="password"
                    value={deepseekApiKey}
                    onChange={(e) => setDeepseekApiKey(e.target.value)}
                    placeholder="API Key (sk-...)"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border border-white/10 text-sm"
                  />
                </div>
              )}

              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                disabled={isAnalyzing}
                placeholder="粘贴对话转写记录..."
                className="w-full h-64 md:h-80 p-4 rounded-xl bg-black/40 border border-white/10 text-slate-200 text-sm leading-relaxed outline-none focus:border-indigo-500/50 transition-colors"
              />

              <div className="space-y-3">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !transcript.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold text-base transition-all active:scale-95 disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      分析中 ({timer}s)
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      启动复盘
                    </>
                  )}
                </button>
                
                {isAnalyzing && (
                  <p className="text-[10px] text-center text-indigo-400 font-bold uppercase tracking-widest animate-pulse">
                    {getLoadingMessage()}
                  </p>
                )}
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs font-medium flex gap-2 items-start">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500 px-1">
            <div className="flex justify-between items-center no-print">
              <button onClick={handleBack} className="flex items-center gap-1 text-slate-400 font-bold text-xs">
                <ChevronLeft className="w-3 h-3" /> 返回
              </button>
              <div className="text-[9px] font-black uppercase tracking-tighter text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">
                {result.provider} Engine
              </div>
            </div>
            <div className="bg-slate-100 text-slate-900 rounded-2xl md:rounded-[2rem] overflow-hidden shadow-2xl">
              <AnalysisDashboard data={result.data} />
            </div>
          </div>
        )}
      </main>

      <footer className="mt-12 text-center text-slate-700 text-[9px] uppercase font-black tracking-widest pb-4">
        &copy; 2025 Sales Coaching Platform
      </footer>
    </div>
  );
};

export default App;
