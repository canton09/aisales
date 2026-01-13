
import React from 'react';
import { SalesVisitAnalysis } from '../types';
import { Trophy, Target, User, TrendingUp, AlertCircle, MessageSquare, ShieldCheck, ChevronRight, BrainCircuit } from 'lucide-react';

const Icons = {
  Trophy, Target, User, TrendingUp, AlertCircle, MessageSquare, ShieldCheck, ChevronRight, BrainCircuit
};

interface Props {
  data: SalesVisitAnalysis;
}

const RatingBadge: React.FC<{ rating?: any }> = ({ rating = 'N/A' }) => {
  const getColor = (r: any) => {
    const val = String(r || '').toUpperCase();
    if (val.includes('S')) return 'bg-purple-100 text-purple-700 border-purple-200';
    if (val.includes('A')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (val.includes('B')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (val.includes('C')) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-rose-100 text-rose-700 border-rose-200';
  };

  return (
    <span className={`px-3 py-1 rounded-full text-lg font-bold border ${getColor(rating)}`}>
      {String(rating || 'N/A')}
    </span>
  );
};

export const AnalysisDashboard: React.FC<Props> = ({ data }) => {
  // 极致防御性处理：确保即使 data 为空或结构缺失，页面也不会崩溃
  const summary = data?.summary || { title: '分析报告', time: '-', location: '-', participants: [], text: '未获取到摘要内容' };
  const highlights = data?.highlights || [];
  const insights = data?.insights || {} as any;
  const transcript = data?.transcript || [];

  // 内部嵌套对象的解构与默认值
  const portrait = insights.customer_portrait || { type: '未知', urgency: '未知', concerns: [] };
  const performance = insights.sales_performance || { pros: '未检测到明显优点', style: '常规', cons: [] };
  const nextSteps = insights.next_steps || { method: '待定', owner: '销售本人', goal: '进一步跟进' };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 摘要头部 */}
      <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Icons.BrainCircuit className="w-64 h-64 rotate-12" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
               <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">Diagnostic Report</span>
               <h1 className="text-3xl font-bold text-slate-900">{summary.title || '销售复盘诊断'}</h1>
            </div>
            <div className="flex flex-wrap gap-4 text-slate-500 text-sm">
              <span>📅 {summary.time || '-'}</span>
              <span>📍 {summary.location || '-'}</span>
              <span>👥 {Array.isArray(summary.participants) ? summary.participants.join(', ') : '-'}</span>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">销售评级</p>
              <RatingBadge rating={insights.battle_evaluation} />
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">客户意向</p>
              <RatingBadge rating={insights.customer_intent} />
            </div>
          </div>
        </div>
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 italic text-slate-700 relative z-10">
          "{summary.text || '暂无详细总结内容'}"
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左侧栏：核心洞察 */}
        <div className="lg:col-span-2 space-y-8">
          {/* 教练指导 */}
          <section className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
            <div className="bg-slate-900 px-6 py-4 flex items-center gap-2">
              <Icons.MessageSquare className="w-5 h-5 text-indigo-400" />
              <h2 className="text-white font-bold">销售教练实战指导 (逻辑推理)</h2>
            </div>
            <div className="p-6 space-y-6">
              {Array.isArray(insights.coaching_guidance) && insights.coaching_guidance.length > 0 ? (
                insights.coaching_guidance.map((item: any, idx: number) => (
                  <div key={idx} className="border-b last:border-0 pb-6 last:pb-0">
                    <div className="bg-slate-50 rounded-lg p-3 mb-4">
                      <p className="text-xs text-slate-400 font-bold mb-1 uppercase">客户原话</p>
                      <p className="text-slate-700 font-medium">"{item.original_q || '...'}"</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-rose-500 font-bold mb-1 uppercase">潜台词</p>
                          <p className="text-sm text-slate-600 leading-relaxed">{item.subtext || '未识别'}</p>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                          <p className="text-xs text-amber-700 font-bold mb-1 uppercase">教练点评</p>
                          <p className="text-sm text-slate-700 leading-relaxed">{item.coach_comment || '无'}</p>
                        </div>
                      </div>
                      <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                        <p className="text-xs text-indigo-600 font-bold mb-2 uppercase">实战话术示范</p>
                        <p className="text-sm text-indigo-900 leading-relaxed font-medium">
                          {item.coaching_script || '暂无示范话术'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-sm text-center py-8 italic">暂无针对性话术建议</p>
              )}
            </div>
          </section>

          {/* 表现分析 */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <Icons.Trophy className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-slate-800">高光时刻与亮点</h3>
              </div>
              <p className="text-sm text-slate-600 mb-4 font-medium">{performance.pros}</p>
              <div className="space-y-2">
                {highlights.map((h: string, i: number) => (
                  <div key={i} className="flex gap-2 items-start text-sm text-slate-600">
                    <span className="text-emerald-500 mt-1">•</span>
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <Icons.AlertCircle className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-slate-800">核心失分点</h3>
              </div>
              <div className="space-y-3">
                {Array.isArray(performance.cons) && performance.cons.length > 0 ? (
                  performance.cons.map((con: string, i: number) => (
                    <div key={i} className="bg-rose-50 p-3 rounded-lg border border-rose-100 text-sm text-rose-800">
                      {con}
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-xs italic">未发现明显致命错误</p>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* 右侧栏：画像与推演 */}
        <div className="space-y-8">
          {/* 客户画像 */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-6">
              <Icons.User className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-slate-800">客户精准画像</h3>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase mb-1">客户标签</p>
                <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded text-sm font-bold inline-block">
                  {portrait.type}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase mb-1">紧迫度</p>
                <p className="text-sm text-slate-700">{portrait.urgency}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase mb-1">核心疑虑</p>
                <ul className="space-y-2 mt-2">
                  {Array.isArray(portrait.concerns) && portrait.concerns.map((c: string, i: number) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* 心理变化 */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
             <div className="flex items-center gap-2 mb-4">
                <Icons.TrendingUp className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-slate-800">心态演变</h3>
              </div>
              <div className="space-y-3">
                {Array.isArray(insights.psychological_change) ? (
                  insights.psychological_change.map((step: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-[10px] font-bold flex items-center justify-center text-slate-500 flex-shrink-0">
                        {idx + 1}
                      </div>
                      <p className="text-xs text-slate-600 font-medium">{step}</p>
                    </div>
                  ))
                ) : null}
              </div>
          </section>

          {/* 竞品防御 */}
          <section className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <Icons.ShieldCheck className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold">竞品防御反击</h3>
            </div>
            <p className="text-sm leading-relaxed text-slate-300 italic">
              {insights.competitor_defense || '本次沟通未涉及核心竞品博弈'}
            </p>
          </section>

          {/* 下一步 */}
          <section className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10">
                <Icons.Target className="w-24 h-24" />
             </div>
            <div className="flex items-center gap-2 mb-4">
              <Icons.Target className="w-5 h-5" />
              <h3 className="font-bold">下一步跟进策略</h3>
            </div>
            <div className="space-y-4 relative z-10">
               <div>
                <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider mb-1">具体建议</p>
                <p className="text-sm font-medium">{nextSteps.method}</p>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider mb-1">目标</p>
                  <p className="text-sm font-medium">{nextSteps.goal}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider mb-1">执行</p>
                  <p className="text-sm font-bold">{nextSteps.owner}</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* 转写文本 */}
      <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Icons.MessageSquare className="w-5 h-5 text-slate-500" />
            <h3 className="font-bold text-slate-800">原始录音转写文本</h3>
          </div>
        </div>
        <div className="max-h-[300px] overflow-y-auto pr-4 space-y-4">
          {Array.isArray(transcript) ? transcript.map((line: any, i: number) => (
            <div key={i} className="flex gap-4 group">
              <div className="w-20 flex-shrink-0">
                <p className="text-xs font-bold text-slate-400 mb-0.5">{line.time || '--:--'}</p>
                <p className={`text-xs font-bold truncate ${String(line.speaker).includes('客户') ? 'text-blue-500' : 'text-slate-700'}`}>
                  {line.speaker || '未知'}
                </p>
              </div>
              <div className="flex-1 bg-slate-50 group-hover:bg-slate-100 transition-colors p-3 rounded-lg text-sm text-slate-600">
                {line.text || '...'}
              </div>
            </div>
          )) : <p className="text-slate-300 text-xs italic">无文本记录</p>}
        </div>
      </section>
    </div>
  );
};
