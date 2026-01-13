
import React from 'react';
import { SalesVisitAnalysis } from '../types';
import { Trophy, Target, User, TrendingUp, AlertCircle, MessageSquare, ShieldCheck, ChevronRight, BrainCircuit, Printer, Zap } from 'lucide-react';

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
    <div className="flex items-center gap-2 md:flex-col md:gap-0">
      {label && <p className="text-[9px] text-slate-400 font-black uppercase tracking-tight md:mb-1">{label}</p>}
      <div className={`w-8 h-8 md:w-12 md:h-12 flex items-center justify-center rounded-lg md:rounded-xl text-sm md:text-xl font-black shadow-inner border-b-2 md:border-b-4 ${getColor(displayRating)}`}>
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
  const keyMoments = data?.key_moments || [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 print-container">
      {/* Header Panel */}
      <section className="bg-slate-900 md:rounded-[2.5rem] p-5 md:p-10 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none no-print hidden md:block">
          <BrainCircuit className="w-64 h-64 rotate-12" />
        </div>
        
        <div className="relative z-10 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Report</span>
              <span className="text-slate-500 text-[10px] truncate max-w-[150px]">/ {summary.time || '实时'} / {summary.location || '线下'}</span>
            </div>
            <button 
              onClick={handlePrint}
              className="no-print p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4 md:space-y-0 md:flex md:flex-row md:justify-between md:items-start md:gap-8">
            <div className="max-w-3xl">
              <h1 className="text-xl md:text-4xl font-black mb-2 leading-tight">
                {summary.title || '销售复盘诊断'}
              </h1>
              <div className="text-sm md:text-lg text-indigo-100 font-medium leading-snug border-l-2 border-indigo-500 pl-4 py-1 bg-white/5 rounded-r-lg">
                {summary.text || '分析生成中...'}
              </div>
            </div>

            <div className="flex justify-between md:justify-around gap-2 bg-black/30 backdrop-blur-md p-3 md:p-5 rounded-2xl border border-white/10">
              <RatingBadge label="战况" rating={insights.battle_evaluation} />
              <div className="w-px bg-white/10 self-stretch"></div>
              <RatingBadge label="意向" rating={insights.customer_intent} />
            </div>
          </div>
        </div>
      </section>

      <div className="px-3 md:px-0 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        {/* Left Content */}
        <div className="lg:col-span-8 space-y-4 md:space-y-6">
          <section className="bg-white rounded-2xl md:rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-800 px-5 md:px-8 py-3 md:py-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <h2 className="text-white font-bold text-sm md:text-base uppercase tracking-wide">诊断与教练话术</h2>
            </div>
            <div className="p-4 md:p-8 space-y-6 md:space-y-8">
              {Array.isArray(insights.coaching_guidance) ? insights.coaching_guidance.map((item: any, idx: number) => (
                <div key={idx} className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-black text-[9px] flex-shrink-0 border">
                      {idx + 1}
                    </div>
                    <div className="flex-1 bg-slate-50 p-2.5 rounded-lg italic text-slate-600 text-xs leading-relaxed border border-slate-100">
                      "{item.original_q}"
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-8">
                    <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                      <p className="text-[9px] text-indigo-600 font-black uppercase mb-1">心理 & 诊断</p>
                      <p className="text-[11px] text-slate-700 font-bold mb-1">[{item.subtext}]</p>
                      <p className="text-[11px] text-slate-500 leading-tight">{item.coach_comment}</p>
                    </div>
                    <div className="bg-indigo-600 p-3 md:p-4 rounded-xl shadow-md">
                      <p className="text-[9px] text-indigo-200 font-black uppercase mb-1">推荐话术</p>
                      <p className="text-white text-[11px] font-bold leading-relaxed">{item.coaching_script}</p>
                    </div>
                  </div>
                </div>
              )) : null}
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <section className="bg-white rounded-2xl md:rounded-[2rem] p-5 shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4 text-emerald-500" />
                <h3 className="font-bold text-slate-800 text-xs">亮点提炼</h3>
              </div>
              <div className="space-y-2">
                {highlights.map((h: string, i: number) => (
                  <div key={i} className="flex gap-2 items-start p-2 bg-emerald-50/50 rounded-lg text-[11px] text-slate-700 border border-emerald-100/50">
                    <ChevronRight className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white rounded-2xl md:rounded-[2rem] p-5 shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                <h3 className="font-bold text-slate-800 text-xs">改进盲点</h3>
              </div>
              <div className="space-y-2">
                {Array.isArray(performance.cons) ? performance.cons.map((con: string, i: number) => (
                  <div key={i} className="bg-rose-50 p-2.5 rounded-lg border border-rose-100 text-[11px] text-rose-800 font-bold flex gap-2">
                    <div className="w-1 h-3 bg-rose-300 rounded-full flex-shrink-0 mt-0.5"></div>
                    {con}
                  </div>
                )) : null}
              </div>
            </section>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-4 md:space-y-6">
          <section className="bg-white rounded-2xl md:rounded-[2rem] p-5 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-800 text-xs uppercase">客户画像</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[9px] text-slate-400 font-black uppercase mb-1">类型</p>
                <div className="text-indigo-600 text-sm font-black truncate">{portrait.type}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[9px] text-slate-400 font-black uppercase mb-1">跟进建议</p>
                <p className="text-slate-800 text-[11px] font-bold truncate">{portrait.urgency}</p>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-[9px] text-slate-400 font-black uppercase mb-2">核心顾虑</p>
              <div className="flex flex-wrap gap-1.5">
                {Array.isArray(portrait.concerns) ? portrait.concerns.map((c: string, i: number) => (
                  <span key={i} className="px-2 py-0.5 bg-slate-100 rounded-md text-[9px] font-bold text-slate-600 border border-slate-200">{c}</span>
                )) : null}
              </div>
            </div>
          </section>

          <section className="bg-slate-900 rounded-2xl md:rounded-[2rem] p-5 text-white shadow-xl space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <h3 className="font-bold text-[10px] uppercase tracking-widest text-slate-400">防御策略</h3>
              </div>
              <p className="text-[11px] text-slate-300 italic leading-relaxed bg-white/5 p-2.5 rounded-lg border border-white/5">
                {insights.competitor_defense || '维持常规策略'}
              </p>
            </div>
            <div className="h-px bg-white/10"></div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-3.5 h-3.5 text-indigo-400" />
                <h3 className="font-bold uppercase tracking-widest text-[10px] text-slate-400">跟进计划</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/5 p-2.5 rounded-lg">
                  <p className="text-[8px] text-slate-500 font-black uppercase mb-0.5">动作</p>
                  <p className="text-[11px] font-bold text-indigo-100 truncate">{nextSteps.method}</p>
                </div>
                <div className="bg-white/5 p-2.5 rounded-lg">
                  <p className="text-[8px] text-slate-500 font-black uppercase mb-0.5">目标</p>
                  <p className="text-[11px] font-bold text-white truncate">{nextSteps.goal}</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <section className="px-3 md:px-0 bg-white md:rounded-[2rem] p-5 md:p-8 shadow-sm border-t md:border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-indigo-500" />
          <h3 className="font-bold text-slate-800 text-sm uppercase">诊断关键时刻</h3>
        </div>
        <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
          {keyMoments.map((moment: any, i: number) => (
            <div key={i} className="flex flex-col gap-1.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center">
                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${String(moment.speaker).includes('客户') ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-600'}`}>
                  {moment.speaker} - {moment.time}
                </span>
              </div>
              <p className="text-[11px] text-slate-700 font-bold leading-normal">"{moment.text}"</p>
              <p className="text-[10px] text-indigo-500 italic mt-1 bg-white/50 p-1.5 rounded-md border border-slate-100">
                <span className="font-black uppercase text-[8px] mr-1">点评:</span> {moment.insight}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
