
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
    if (timer < 5) return "正在建立加密连接...";
    if (timer < 15) return "AI 正在深度解析对话逻辑...";
    if (timer < 30) return "正在匹配场景化心理学模型...";
    if (timer < 45) return "生成专业教练指导建议...";
    return "报告生成较慢，请再耐心等待几秒...";
  };

  const scenarioCards = [
    { key: 'telesales_coaching', name: '电销实战', desc: '听觉心理 x 节奏控制 x 转化效率', icon: PhoneCall, color: 'bg-blue-600' },
    { key: 'field_sales_visit', name: '现场销售', desc: '场景体验 x 空间心理 x 行为金融', icon: Users, color: 'bg-indigo-600' },
    { key: 'livestream_sales', name: '直播销售', desc: '高频互动 x 情绪唤起 x 瞬时转化', icon: MonitorPlay, color: 'bg-rose-600' },
    { key: 'test_drive_sales', name: '试驾体验', desc: '体感验证 x 安全信任 x 情感带入', icon: Compass, color: 'bg-emerald-600' },
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
    <div className="min-h-screen bg-[#0f172a] text-slate-100 pb-12">
      <nav className="sticky top-0 z-50 bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setSelectedScenario(null); setResult(null); }}>
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white shadow-lg shadow-indigo-500/20">
              <Car className="w-6 h-6" />
            </div>
            <span className="font-bold text-xl tracking-tight">SalesCoach<span className="text-indigo-400">AI</span></span>
          </div>
          <div className="flex items-center gap-3">
             <span className="text-[10px] font-black text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/10 uppercase tracking-widest">
               Enterprise Pro
             </span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 mt-12">
        {!selectedScenario ? (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="text-center mb-16 space-y-4">
              <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white">
                犀利教练 <span className="text-indigo-400">实战复盘</span>
              </h1>
              <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                选择您的业务场景，由 AI 销售教练深度解剖沟通漏洞，提供定制化话术建议。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {scenarioCards.map((card) => (
                <button
                  key={card.key}
                  onClick={() => setSelectedScenario(card.key as ScenarioKey)}
                  className="group relative bg-slate-800/50 hover:bg-slate-800 border border-white/5 hover:border-indigo-500/50 p-8 rounded-[2.5rem] text-left transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/10 overflow-hidden"
                >
                  <div className={`w-16 h-16 ${card.color} rounded-2xl flex items-center justify-center mb-8 shadow-lg group-hover:scale-110 transition-transform`}>
                    <card.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-white">{card.name}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">
                    {card.desc}
                  </p>
                  <div className="flex items-center text-indigo-400 text-sm font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    进入复盘舱 <Sparkles className="w-4 h-4 ml-2" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : !result ? (
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <button 
              onClick={handleBack}
              className="flex items-center gap-2 text-slate-400 hover:text-white font-bold text-sm transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> 返回场景选择
            </button>

            <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-white/5 space-y-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/5 pb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">{SCENARIO_CONFIGS[selectedScenario].name}</h2>
                  <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest">Coaching Engine Input</p>
                </div>
                <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                  <button 
                    onClick={() => setProvider('deepseek')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${provider === 'deepseek' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500'}`}
                  >
                    DeepSeek
                  </button>
                  <button 
                    onClick={() => setProvider('gemini')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${provider === 'gemini' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}
                  >
                    Gemini
                  </button>
                </div>
              </div>

              {provider === 'deepseek' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">API Key Configuration</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      value={deepseekApiKey}
                      onChange={(e) => setDeepseekApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-black/40 border border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none text-indigo-300 font-mono text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Transcript Analysis Body</label>
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  disabled={isAnalyzing}
                  placeholder="在此处粘贴对话转写记录..."
                  className="w-full h-80 p-6 rounded-[1.5rem] bg-black/40 border border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-200 resize-none font-medium text-sm leading-relaxed"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !transcript.trim()}
                  className="flex-1 flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-2xl font-black text-lg transition-all shadow-xl shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      深度诊断中 ({timer}s)
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6" />
                      启动 AI 复盘
                    </>
                  )}
                </button>
              </div>

              {isAnalyzing && (
                <div className="p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20 flex items-center gap-3">
                   <Clock className="w-5 h-5 text-indigo-400" />
                   <p className="text-sm font-medium text-indigo-300">{getLoadingMessage()}</p>
                </div>
              )}

              {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm font-medium flex gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="flex justify-between items-center">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-slate-400 hover:text-white font-bold text-sm"
              >
                <ChevronLeft className="w-4 h-4" /> 返回重新复盘
              </button>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Cpu className="w-3 h-3 text-indigo-400" /> Engine: {result.provider}
              </div>
            </div>
            <div className="bg-slate-100 text-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <AnalysisDashboard data={result.data} />
            </div>
          </div>
        )}
      </main>

      <footer className="mt-24 text-center text-slate-600 text-[10px] uppercase font-black tracking-widest">
        &copy; 2025 Automotive Sales Multi-Scenario Coaching Platform
      </footer>
    </div>
  );
};

export default App;
