
import React from 'react';
import { SalesVisitAnalysis } from '../types';
import { Trophy, Target, User, TrendingUp, AlertCircle, MessageSquare, ShieldCheck, ChevronRight, BrainCircuit, Activity } from 'lucide-react';

const Icons = {
  Trophy, Target, User, TrendingUp, AlertCircle, MessageSquare, ShieldCheck, ChevronRight, BrainCircuit, Activity
};

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

  // 提取评级字母
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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header Panel */}
      <section className="bg-slate-900 rounded-[2rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <Icons.BrainCircuit className="w-80 h-80 rotate-12" />
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="bg-indigo-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Diagnostic Report</span>
            <span className="text-slate-400 text-sm font-medium">/ {summary.time || '实时分析'}</span>
          </div>

          <div className="flex flex-col lg:flex-row justify-between gap-8 items-start">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight tracking-tight">
                {summary.title || '销售复盘诊断'}
              </h1>
              <div className="flex flex-wrap gap-6 text-slate-400 text-sm mb-8">
                <span className="flex items-center gap-2"><Icons.Activity className="w-4 h-4" /> {summary.location || '线下中心'}</span>
                <span className="flex items-center gap-2">👥 {Array.isArray(summary.participants) ? summary.participants.join(', ') : '单人接待'}</span>
              </div>
              <div className="text-xl text-indigo-100 font-medium leading-relaxed border-l-4 border-indigo-500 pl-6 py-2">
                {summary.text || '正在生成定性评价...'}
              </div>
            </div>

            <div className="flex gap-6 bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 self-stretch lg:self-auto justify-around lg:justify-start">
              <RatingBadge label="战况评价" rating={insights.battle_evaluation} />
              <div className="w-px bg-white/10 self-stretch"></div>
              <RatingBadge label="客户意向" rating={insights.customer_intent} />
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content (Left) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Coach Advice (The big one) */}
          <section className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-800 px-8 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icons.MessageSquare className="w-6 h-6 text-indigo-400" />
                <h2 className="text-white font-bold text-lg">销售教练实战指导 <span className="text-indigo-400 ml-2 text-sm font-medium">DIAGNOSTIC GUIDANCE</span></h2>
              </div>
            </div>
            <div className="p-8 space-y-10">
              {Array.isArray(insights.coaching_guidance) && insights.coaching_guidance.length > 0 ? (
                insights.coaching_guidance.map((item: any, idx: number) => (
                  <div key={idx} className="group">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100 italic text-slate-700">
                        "{item.original_q || '...'}"
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-12">
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] text-indigo-600 font-black uppercase mb-1">潜台词解析</p>
                          <p className="text-sm text-slate-600 font-medium">{item.subtext || '未识别潜台词'}</p>
                        </div>
                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                          <p className="text-[10px] text-amber-700 font-black uppercase mb-1">教练诊断误区</p>
                          <p className="text-sm text-slate-800 leading-relaxed">{item.coach_comment || '无具体点评'}</p>
                        </div>
                      </div>
                      <div className="bg-indigo-600 p-6 rounded-[1.5rem] shadow-lg shadow-indigo-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Icons.Target className="w-16 h-16 text-white" /></div>
                        <p className="text-[10px] text-indigo-200 font-black uppercase mb-2 relative z-10">推荐实战话术</p>
                        <p className="text-white text-base font-bold leading-relaxed relative z-10">
                          {item.coaching_script || '暂无示范'}
                        </p>
                      </div>
                    </div>
                    {idx < insights.coaching_guidance.length - 1 && <div className="h-px bg-slate-100 mt-10 ml-12"></div>}
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400 italic">正在深度诊断话术逻辑...</div>
              )}
            </div>
          </section>

          {/* Performance Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600"><Icons.Trophy className="w-5 h-5" /></div>
                <h3 className="font-bold text-slate-800">价值重构亮点</h3>
              </div>
              <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">{performance.pros || '暂未发现显著亮点'}</p>
              <div className="space-y-3">
                {highlights.map((h: string, i: number) => (
                  <div key={i} className="flex gap-3 items-start p-3 bg-emerald-50/50 rounded-xl text-sm text-slate-700 border border-emerald-100/50">
                    <Icons.ChevronRight className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-rose-100 rounded-xl text-rose-600"><Icons.AlertCircle className="w-5 h-5" /></div>
                <h3 className="font-bold text-slate-800">核心失分点 <span className="text-rose-500 text-xs">(实战盲点)</span></h3>
              </div>
              <div className="space-y-3">
                {Array.isArray(performance.cons) && performance.cons.length > 0 ? (
                  performance.cons.map((con: string, i: number) => (
                    <div key={i} className="bg-rose-50 p-4 rounded-xl border border-rose-100 text-sm text-rose-800 font-medium">
                      {con}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-300 italic text-xs">表现极其稳健，未发现明显失分点</div>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Sidebar (Right) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Portrait Card */}
          <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600"><Icons.User className="w-5 h-5" /></div>
              <h3 className="font-bold text-slate-800 text-lg">客户画像定性</h3>
            </div>
            <div className="space-y-6">
              <div className="bg-slate-50 p-5 rounded-2xl">
                <p className="text-[10px] text-slate-400 font-black uppercase mb-2">类型识别</p>
                <div className="text-indigo-600 text-lg font-black">{portrait.type || '未知类型'}</div>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase mb-1">成交紧迫度</p>
                <p className="text-slate-800 font-bold">{portrait.urgency || '无法研判'}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase mb-3">核心心理死穴</p>
                <div className="space-y-2">
                  {Array.isArray(portrait.concerns) && portrait.concerns.map((c: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl text-xs text-slate-600 font-medium border border-slate-100">
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                      {c}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Psychological Timeline */}
          <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-xl text-blue-600"><Icons.TrendingUp className="w-5 h-5" /></div>
              <h3 className="font-bold text-slate-800">心态演变轨迹</h3>
            </div>
            <div className="space-y-4">
              {Array.isArray(insights.psychological_change) ? (
                insights.psychological_change.map((step: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-4 group">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-[10px] font-black flex items-center justify-center text-slate-400 border border-slate-200">
                        {idx + 1}
                      </div>
                      {idx < insights.psychological_change.length - 1 && (
                        <div className="absolute top-8 left-1/2 w-px h-4 bg-slate-200 -translate-x-1/2"></div>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 font-bold bg-slate-50 flex-1 p-2 rounded-lg border border-slate-100">{step}</p>
                  </div>
                ))
              ) : null}
            </div>
          </section>

          {/* Defense & Next Steps */}
          <section className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-xl space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Icons.ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold">竞品防御反击</h3>
              </div>
              <p className="text-sm text-slate-300 italic leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                {insights.competitor_defense || '本次沟通未涉及核心竞品博弈'}
              </p>
            </div>
            <div className="h-px bg-white/10"></div>
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Icons.Target className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold uppercase tracking-widest text-sm">Next Step / 跟进策略</h3>
              </div>
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] text-slate-500 font-black uppercase mb-1">触达由头</p>
                  <p className="text-base font-bold text-indigo-100">{nextSteps.method || '制定中...'}</p>
                </div>
                <div className="flex justify-between items-end bg-white/5 p-4 rounded-2xl">
                  <div>
                    <p className="text-[10px] text-slate-500 font-black uppercase mb-1">目标指标</p>
                    <p className="text-sm font-bold">{nextSteps.goal || '转化'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 font-black uppercase mb-1">责任人</p>
                    <p className="text-sm font-black text-indigo-400">{nextSteps.owner || '销售'}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Transcript Text */}
      <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-8">
          <Icons.MessageSquare className="w-6 h-6 text-slate-400" />
          <h3 className="font-bold text-slate-800 text-lg">录音转写原始存档</h3>
        </div>
        <div className="max-h-[400px] overflow-y-auto pr-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-200">
          {Array.isArray(data.transcript) ? data.transcript.map((line: any, i: number) => (
            <div key={i} className="flex gap-6 group">
              <div className="w-24 flex-shrink-0 pt-1">
                <p className="text-[10px] font-black text-slate-300 mb-1 tracking-widest">{line.time || '00:00'}</p>
                <p className={`text-xs font-black truncate uppercase ${String(line.speaker).includes('客户') ? 'text-blue-500' : 'text-slate-900'}`}>
                  {line.speaker || 'UNKNOWN'}
                </p>
              </div>
              <div className="flex-1 bg-slate-50 group-hover:bg-slate-100/80 transition-all p-4 rounded-2xl text-sm text-slate-700 leading-relaxed border border-transparent group-hover:border-slate-200">
                {line.text || '...'}
              </div>
            </div>
          )) : <p className="text-slate-300 text-xs italic">无文本记录</p>}
        </div>
      </section>
    </div>
  );
};
