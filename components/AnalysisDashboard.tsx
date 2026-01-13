
import React from 'react';
import { SalesVisitAnalysis } from '../types';
import { Trophy, Target, User, TrendingUp, AlertCircle, MessageSquare, ShieldCheck, ChevronRight, BrainCircuit, Activity, FileDown, Printer } from 'lucide-react';

interface Props {
  data: SalesVisitAnalysis;
}

const RatingBadge: React.FC<{ rating?: any, label?: string }> = ({ rating = 'N/A', label }) => {
  const getColor = (r: any) => {
    const val = String(r || '').toUpperCase();
    if (val.includes('S')) return 'bg-purple-600 text-white border-purple-700';
    if (val.includes('A')) return 'bg-emerald-600 text-white border-emerald-700';
    if (val.includes('B')) return 'bg-blue-600 text-white border-blue-700';
    if (val.includes('C')) return 'bg-amber-500 text-white border-amber-600';
    return 'bg-rose-500 text-white border-rose-600';
  };
  const match = String(rating).match(/[SABCD]/i);
  const displayRating = match ? match[0].toUpperCase() : 'N/A';

  return (
    <div className="flex flex-col items-center">
      {label && <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{label}</p>}
      <div className={`w-12 h-12 flex items-center justify-center rounded-xl text-xl font-black shadow-inner border-b-4 ${getColor(displayRating)}`}>
        {displayRating}
      </div>
    </div>
  );
};

export const AnalysisDashboard: React.FC<Props> = ({ data }) => {
  const summary = data?.summary || {} as any;
  const insights = data?.insights || {} as any;
  const portrait = insights?.customer_portrait || {};
  const performance = insights?.sales_performance || {};
  const highlights = data?.highlights || [];
  const nextSteps = insights?.next_steps || {};

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 print-container">
      {/* Header Panel */}
      <section className="bg-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none no-print">
          <BrainCircuit className="w-64 h-64 rotate-12" />
        </div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="bg-indigo-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Diagnostic Report</span>
              <span className="text-slate-400 text-sm font-medium">/ {summary.time || '实时'} / {summary.location || '线下'}</span>
            </div>
            <button 
              onClick={handlePrint}
              className="no-print flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm font-bold transition-all border border-white/5"
            >
              <Printer className="w-4 h-4" /> 导出 PDF / 打印
            </button>
          </div>

          <div className="flex flex-col lg:flex-row justify-between gap-8 items-start">
            <div className="max-w-3xl">
              <h1 className="text-3xl md:text-4xl font-black mb-4 leading-tight tracking-tight">
                {summary.title || '销售复盘诊断'}
              </h1>
              <div className="text-lg text-indigo-100 font-medium leading-relaxed border-l-4 border-indigo-500 pl-6 py-1 bg-white/5 rounded-r-xl">
                {summary.text || '正在生成深度归纳...'}
              </div>
            </div>

            <div className="flex gap-4 bg-black/30 backdrop-blur-md p-5 rounded-3xl border border-white/10 self-stretch lg:self-auto justify-around">
              <RatingBadge label="战况评价" rating={insights.battle_evaluation} />
              <div className="w-px bg-white/10 self-stretch"></div>
              <RatingBadge label="意向等级" rating={insights.customer_intent} />
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Content (Left) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Coach Advice - Optimized for Summary */}
          <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-800 px-8 py-4 flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-indigo-400" />
              <h2 className="text-white font-bold text-base">归纳诊断与教练话术 <span className="text-indigo-400 ml-2 text-xs font-medium tracking-widest uppercase">Expert Insights</span></h2>
            </div>
            <div className="p-8 space-y-8">
              {Array.isArray(insights.coaching_guidance) ? insights.coaching_guidance.map((item: any, idx: number) => (
                <div key={idx} className="group">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-black text-[10px] flex-shrink-0 border border-slate-200">
                      {idx + 1}
                    </div>
                    <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100 italic text-slate-600 text-sm">
                      "{item.original_q || '对话片段'}"
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-10">
                    <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                      <p className="text-[10px] text-indigo-600 font-black uppercase mb-2">心理归纳 & 诊断</p>
                      <p className="text-xs text-slate-700 font-bold mb-2">[{item.subtext || '潜台词'}]</p>
                      <p className="text-xs text-slate-500 leading-relaxed">{item.coach_comment || '无点评'}</p>
                    </div>
                    <div className="bg-indigo-600 p-5 rounded-2xl shadow-lg relative overflow-hidden group-hover:scale-[1.02] transition-transform">
                      <Target className="absolute top-0 right-0 p-4 opacity-10 w-16 h-16 text-white" />
                      <p className="text-[10px] text-indigo-200 font-black uppercase mb-2 relative z-10">推荐实战话术</p>
                      <p className="text-white text-sm font-bold leading-relaxed relative z-10">
                        {item.coaching_script || '暂无话术'}
                      </p>
                    </div>
                  </div>
                </div>
              )) : null}
            </div>
          </section>

          {/* Performance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-600"><Trophy className="w-4 h-4" /></div>
                <h3 className="font-bold text-slate-800 text-sm">亮点归纳</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4 font-medium leading-relaxed">{performance.pros || '表现平稳'}</p>
              <div className="space-y-2">
                {highlights.map((h: string, i: number) => (
                  <div key={i} className="flex gap-2 items-start p-2.5 bg-emerald-50/50 rounded-xl text-xs text-slate-700 border border-emerald-100/50">
                    <ChevronRight className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-rose-100 rounded-lg text-rose-600"><AlertCircle className="w-4 h-4" /></div>
                <h3 className="font-bold text-slate-800 text-sm">盲点诊断</h3>
              </div>
              <div className="space-y-2">
                {Array.isArray(performance.cons) ? performance.cons.map((con: string, i: number) => (
                  <div key={i} className="bg-rose-50 p-3 rounded-xl border border-rose-100 text-xs text-rose-800 font-bold flex gap-2">
                    <div className="w-1 h-4 bg-rose-300 rounded-full flex-shrink-0"></div>
                    {con}
                  </div>
                )) : null}
              </div>
            </section>
          </div>
        </div>

        {/* Sidebar (Right) */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-6">
              <User className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-800 text-sm">客户画像归纳</h3>
            </div>
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-black uppercase mb-1">定性</p>
                <div className="text-indigo-600 text-base font-black">{portrait.type || '分析中'}</div>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase mb-1">跟进建议</p>
                <p className="text-slate-800 text-xs font-bold">{portrait.urgency || '保持关注'}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase mb-2">核心顾虑归纳</p>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(portrait.concerns) ? portrait.concerns.map((c: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-600 border border-slate-200">{c}</span>
                  )) : null}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm">心态路径归纳</h3>
            </div>
            <div className="space-y-3">
              {Array.isArray(insights.psychological_change) ? insights.psychological_change.map((step: string, idx: number) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-slate-100 text-[9px] font-black flex items-center justify-center text-slate-400 border border-slate-200 flex-shrink-0">
                    {idx + 1}
                  </div>
                  <p className="text-[11px] text-slate-600 font-bold bg-slate-50 flex-1 p-2 rounded-lg border border-slate-100">{step}</p>
                </div>
              )) : null}
            </div>
          </section>

          <section className="bg-slate-900 rounded-[2.5rem] p-6 text-white shadow-xl space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-xs uppercase tracking-widest">防御反击策略</h3>
              </div>
              <p className="text-xs text-slate-300 italic leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                {insights.competitor_defense || '无显性博弈'}
              </p>
            </div>
            <div className="h-px bg-white/10"></div>
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold uppercase tracking-widest text-xs">归纳跟进策略</h3>
              </div>
              <div className="space-y-4">
                <div className="bg-white/5 p-3 rounded-xl">
                  <p className="text-[9px] text-slate-500 font-black uppercase mb-1">触达由头</p>
                  <p className="text-sm font-bold text-indigo-100">{nextSteps.method || '待定'}</p>
                </div>
                <div className="flex justify-between items-center px-1">
                  <div>
                    <p className="text-[9px] text-slate-500 font-black uppercase mb-1">转化目标</p>
                    <p className="text-xs font-bold text-white">{nextSteps.goal || '转化'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-slate-500 font-black uppercase mb-1">责任人</p>
                    <p className="text-xs font-black text-indigo-400">{nextSteps.owner || '销售'}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Transcript Text - Hidden in print by default or shortened */}
      <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 no-print">
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="w-5 h-5 text-slate-400" />
          <h3 className="font-bold text-slate-800 text-base">录音转写归档</h3>
        </div>
        <div className="max-h-[300px] overflow-y-auto pr-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-200">
          {Array.isArray(data.transcript) ? data.transcript.map((line: any, i: number) => (
            <div key={i} className="flex gap-4">
              <div className="w-16 flex-shrink-0 pt-1">
                <p className="text-[9px] font-black text-slate-300 mb-0.5 tracking-widest">{line.time || '00:00'}</p>
                <p className={`text-[10px] font-black truncate uppercase ${String(line.speaker).includes('客户') ? 'text-blue-500' : 'text-slate-900'}`}>
                  {line.speaker || '访客'}
                </p>
              </div>
              <div className="flex-1 bg-slate-50 p-2.5 rounded-lg text-[13px] text-slate-600 border border-transparent">
                {line.text || '...'}
              </div>
            </div>
          )) : null}
        </div>
      </section>
    </div>
  );
};
