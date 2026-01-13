
import React, { useState, useEffect } from 'react';
import { runAnalysis, ModelProvider } from './services/analysisService';
import { SalesVisitAnalysis } from './types';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { Loader2, Sparkles, Car, Cpu, Zap, Key, AlertCircle, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [transcript, setTranscript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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

  const handleAnalyze = async () => {
    if (!transcript.trim()) return;
    
    if (provider === 'deepseek' && !deepseekApiKey.trim()) {
      setError('请先配置您的 DeepSeek API Key');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    try {
      const response = await runAnalysis(transcript, provider, deepseekApiKey);
      setResult(response);
    } catch (err: any) {
      console.error("Analysis Error:", err);
      setError(err.message || '分析中断，请检查 API 配置。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const sampleTranscript = `
销售：王先生您好，欢迎来到我们中心。您看，这辆是目前我们最火的纯电轿跑。
客户：车是挺好看，但你们这个价格比隔壁那家还是贵了不少，续航也没高出多少啊。
销售：咱们这品牌毕竟定位在那儿，技术沉淀不一样。而且现在订车有金融优惠。
客户：金融优惠哪家都有。我更在意的是这车贬值率，现在电车更新太快了，我怕买手手就亏几万。
销售：其实保值率这块，我们是大品牌，二手车市场还是比较硬的。您要不先试驾下感觉感觉？
客户：今天先不试了，我再去看看那个竞争品牌的，听说他们电池质保是终身的。
  `.trim();

  return (
    <div className="min-h-screen bg-[#f1f5f9] pb-12">
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
              <Car className="w-6 h-6" />
            </div>
            <span className="font-bold text-xl text-slate-900 tracking-tight">SalesCoach<span className="text-indigo-600">AI</span></span>
          </div>
          <div className="flex items-center gap-3">
             <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 uppercase tracking-tighter">
               {isAnalyzing ? "分析中..." : (result ? `${result.provider} Engine` : "Ready")}
             </span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        {!result ? (
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-extrabold text-slate-900">犀利教练，实战复盘</h2>
              <p className="text-slate-500 max-w-lg mx-auto text-sm">
                快速诊断销售拜访中的失分点。如果您所在的网络环境限制了 DeepSeek API 的访问，推荐切换到 <b>Gemini Flash</b> 引擎。
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 space-y-6">
              {/* Engine Selector */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  选择分析引擎
                </label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button 
                    onClick={() => { setProvider('deepseek'); setError(null); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${provider === 'deepseek' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Cpu className="w-4 h-4" />
                    DeepSeek-V3
                  </button>
                  <button 
                    onClick={() => { setProvider('gemini'); setError(null); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${provider === 'gemini' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Zap className="w-4 h-4" />
                    Gemini Flash
                  </button>
                </div>
              </div>

              {/* API Key Input for DeepSeek */}
              {provider === 'deepseek' && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <div className="flex justify-between items-center mb-2 ml-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      DeepSeek API Key
                    </label>
                    <a href="https://platform.deepseek.com/" target="_blank" className="text-[10px] text-indigo-600 font-bold hover:underline">获取密钥 →</a>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Key className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={deepseekApiKey}
                      onChange={(e) => setDeepseekApiKey(e.target.value)}
                      placeholder="在此处输入 sk- 开头的密钥"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all outline-none text-sm font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  对话转写内容
                </label>
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="在此处粘贴销售与客户的对话记录..."
                  className="w-full h-64 p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-slate-700 resize-none font-medium"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !transcript.trim()}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95 ${provider === 'deepseek' ? 'bg-slate-900 text-white shadow-slate-200 hover:bg-slate-800' : 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700'}`}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      正在调用 {provider}...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      开始分析诊断
                    </>
                  )}
                </button>
                <button 
                  onClick={() => setTranscript(sampleTranscript)}
                  className="text-indigo-600 font-bold text-sm hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> 填入示例文本
                </button>
              </div>

              {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm font-medium flex gap-3 items-start animate-in fade-in zoom-in-95 duration-200 shadow-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">引擎响应异常</p>
                    <p className="opacity-90 leading-relaxed">{error}</p>
                    {provider === 'deepseek' && (
                      <div className="mt-2 pt-2 border-t border-rose-200/50">
                        <p className="text-[11px] text-rose-500">
                          提示：由于安全策略，DeepSeek API 通常不允许在纯网页端跨域访问。如需正常使用，建议在带有 CORS 代理的环境运行，或使用 <b>Gemini Flash</b>（已内置环境适配）。
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              {[
                { label: '逻辑推理', desc: '模拟资深总监思维模式' },
                { label: '实战拆解', desc: '深度洞察客户潜台词' },
                { label: '话术再造', desc: '提供可复制的成交金句' },
              ].map((item, i) => (
                <div key={i} className="p-4 bg-slate-100/50 rounded-2xl border border-slate-200">
                  <p className="font-bold text-slate-900 text-sm">{item.label}</p>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => setResult(null)}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors"
              >
                ← 返回重新复盘
              </button>
              <div className="flex items-center gap-4">
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-widest ${result.provider === 'deepseek' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-indigo-600 border-indigo-100'}`}>
                  Engine: {result.provider}
                </div>
                <button
                  onClick={() => window.print()}
                  className="bg-white text-slate-900 border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all"
                >
                  导出报告 PDF
                </button>
              </div>
            </div>
            <AnalysisDashboard data={result.data} />
          </div>
        )}
      </main>

      <footer className="mt-16 text-center text-slate-400 text-[10px] uppercase font-bold tracking-widest">
        &copy; 2024 Automotive Sales Coach AI - Professional Edition
      </footer>
    </div>
  );
};

export default App;
