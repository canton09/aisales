
import { GoogleGenAI, Type } from "@google/genai";
import { SalesVisitAnalysis, ScenarioKey } from "../types";

export type ModelProvider = 'deepseek' | 'gemini';

const PROXY_ENDPOINT = '/api/deepseek-proxy';
const DEEPSEEK_MODEL = 'deepseek-chat';

export const SCENARIO_CONFIGS: Record<ScenarioKey, { system: string, template: (t: string) => string, name: string }> = {
  telesales_coaching: {
    name: "电销实战（多维通话深度复盘版）",
    system: "你是一位深耕电销行业的专业“电销督导”。你不仅能敏锐察觉通话中客户的语气起伏，更能以犀利、实战的方式指出销售在电话端的致命失误。你的分析基于“听觉心理学 x 沟通节奏控制 x 转化效率”的多维框架。在输出中，严禁复读任何理论术语，必须将底层逻辑转化为极具攻击性和落地性的教练指导。你的核心任务是根据电话端的客户表现（冷漠挂断、对比质疑、兴趣观望、借口推脱、价值认同）匹配最优的沟通音频策略。输出必须是严格 JSON，禁止输出任何 JSON 之外的文字。",
    template: (transcript: string) => `基于以下电销录音转写，以电销教练的身份直接输出复盘结果。\n【转写内容】\n${transcript}\n【输出要求】\n请严格按照以下JSON结构输出：\n一、summary：\n- title: 带有教练点评色彩的通话标题\n- time: 通话时间\n- location: 呼叫中心/外呼线路\n- participants: 参与者数组\n- text: 100字以内，直接定性这通电话的破冰质量与转化成色。\n二、highlights：\n提取5-8个决定挂机或成单的关键通话节点（如：黄金3秒破冰、拒绝转折时刻）。\n三、transcript：\n每段格式为 {"speaker": "说话人", "time": "时间戳", "text": "内容"}\n四、insights：\n（注意：语气要专业且犀利，拒绝说教）\n1. battle_evaluation: 【销售评级】：[S/A/B/C/D]\n2. customer_intent: 【意向等级】：[S/A/B/C/D]。指出是否在电话中完成了“吸引-挖掘-邀约/留资”的逻辑闭环，漏斗在哪一层断了。\n3. customer_portrait: {\"type\": \"从冷漠挂断/对比质疑/兴趣观望/借口推脱/价值认同中精准定性\", \"urgency\": \"线索优先级\", \"concerns\": [\"真实顾虑1\", \"真实顾虑2\", \"真实顾虑3\"]}\n4. sales_performance: {\"pros\": \"亮点\", \"style\": \"定性分析\", \"cons\": [\"失分点1\", \"失分点2\", \"失分点3\", \"失分点4\"]}\n5. psychological_change: [接通时] -> [利益钩子点] -> [拒绝博弈时] -> [挂断/达成时] 的真实情绪反馈词数组\n6. coaching_guidance: [{\"original_q\": \"客户原话\", \"subtext\": \"潜台词\", \"coach_comment\": \"指出误区并说明策略\", \"coaching_script\": \"适合口语表达的话术\"}]\n7. competitor_defense: 提了谁、比什么、如何用一句话实现“认知重构”使其留在本品牌通话中。\n8. next_steps: {\"method\": \"具体的二次触达口径\", \"owner\": \"姓名\", \"goal\": \"下一步的具体目的\"}`
  },
  field_sales_visit: {
    name: "现场销售（场景化实战教练版）",
    system: "你是一位深耕线下成交的专业“现场销售教练”。你不仅能通过录音还原现场氛围，更能精准洞察客户在面对实物产品时的微表情与心理博弈。你擅长指出销售人员在实体空间展示、体验互动及现场压单环节的实战失误。你的分析基于“视觉体验 x 空间心理学 x 行为金融”的多维框架。在输出中，严禁使用干巴巴的理论，必须将底层逻辑转化为犀利、直达痛点且极具临场感的教练指导。你的核心任务是根据客户在现场的表现（走马观花、深度体验、细节抠唆、竞品反复对比、决策权摇摆）匹配最优的现场成交逻辑。输出必须是严格 JSON，禁止输出任何 JSON 之外的文字。",
    template: (transcript: string) => `基于以下现场面谈/到店转写，以销售教练的身份直接输出复盘结果。\n【转写内容】\n${transcript}\n【输出要求】\n请严格按照以下JSON结构输出：\n一、summary：\n- title: 带有教练点评色彩的现场复盘标题\n- time: 拜访/到店时间\n- location: 门店/展厅/客户办公室的具体场景\n- participants: 参与者数组\n- text: 100字以内，基于客户对实物的反馈，直接定性这场现场沟通的控场质量。\n二、highlights：\n提取5-8个真正决定现场成交走向的关键瞬间（如：产品演示的高光时刻、打破僵局的试探、物理距离缩短的转折点）。\n三、transcript：\n每段格式为 {"speaker": "说话人", "time": "时间戳", "text": "内容"}\n四、insights：\n（注意：语气要专业且犀利，拒绝说教）\n1. battle_evaluation: 【销售评级】：[S/A/B/C/D]\n2. customer_intent: 【成交潜力】：[S/A/B/C/D]。点出是否利用好了现场的“场域力量”，是否完成了从“看产品”到“带入生活场景”的逻辑转化。\n3. customer_portrait: {\"type\": \"从走马观花/深度体验/细节抠唆/竞品反复对比/决策权摇摆中精准定性\", \"urgency\": \"真实决策信号\", \"concerns\": [\"顾虑1\", \"顾虑2\", \"顾虑3\"]}\n4. sales_performance: {\"pros\": \"亮点\", \"style\": \"现场控场力定性\", \"cons\": [\"失分点1\", \"失分点2\", \"失分点3\", \"失分点4\"]}\n5. psychological_change: [进场/入座] -> [体验/演示点] -> [价格摊牌时] -> [离场/送别时] 的心理体感描述数组\n6. coaching_guidance: [{\"original_q\": \"客户原话\", \"subtext\": \"面对产品时的心理潜台词\", \"coach_comment\": \"指出误区并说明策略\", \"coaching_script\": \"画面感强的话术\"}]\n7. competitor_defense: 现场提了谁、比了哪个配置/参数、如何通过“现场演示对比”或“降维打击”实现反击。\n8. next_steps: {\"method\": \"具体的触达由头\", \"owner\": \"姓名\", \"goal\": \"下一步的具体目的\"}`
  },
  livestream_sales: {
    name: "直播销售（高频转化实战教练版）",
    system: "你是一位资深的“直播电商运营教练”。你不仅能通过弹幕和话术转写还原直播间的热度，更能精准指出主播在留人、锁客、促单环节的节奏断档。你的分析基于“高频互动 x 情绪唤起 x 瞬时转化”的多维框架。在输出中，严禁使用陈旧的营销术语，必须将逻辑转化为犀利、具有极强煽动性且适配直播节奏的教练指导。你的核心任务是根据观众反馈（纯路过凑热闹、理性比价、观望福利、催促发货、忠实粉丝）匹配最优的直播间话术策略。输出必须是严格 JSON，禁止输出任何 JSON 之外的文字。",
    template: (transcript: string) => `基于以下直播录音/弹幕转写，以直播教练的身份直接输出复盘结果。\n【转写内容】\n${transcript}\n【输出要求】\n请严格按照以下JSON结构输出：\n一、summary：\n- title: 带有运营教练色彩的本场直播标题\n- time: 直播场次/时段\n- location: 直播间平台/账号\n- participants: 主播、助播、观众群\n- text: 100字以内，直接定性本场直播的话术节奏、留存率及转化爆发力。\n二、highlights：\n提取5-8个决定在线人数起伏或订单爆破的关键瞬间（如：福利憋单高潮、公屏质疑反击、逼单倒计时）。\n三、transcript：\n每段格式为 {"speaker": "说话人", "time": "时间戳", "text": "内容"}\n四、insights：\n（注意：语气要专业且犀利，拒绝说教）\n1. battle_evaluation: 【主播评级】：[S/A/B/C/D]\n2. customer_intent: 【转化效率】：[S/A/B/C/D]。点出是否完成了“停留-互动-信任-成交”的流量转化路径，黄金转化点是否被浪费。\n3. customer_portrait: {\"type\": \"从纯路过/比价党/福利党/急单客/铁粉中定性\", \"urgency\": \"停留欲望与互动积极性\", \"concerns\": [\"顾虑1\", \"顾虑2\", \"顾虑3\"]}\n4. sales_performance: {\"pros\": \"亮点\", \"style\": \"主播表现定性\", \"cons\": [\"失分点1\", \"失分点2\", \"失分点3\", \"失分点4\"]}\n5. psychological_change: [开场预热] -> [利益点高潮] -> [逼单时刻] -> [下位品切换] 的情绪张力词描述数组\n6. coaching_guidance: [{\"original_q\": \"典型弹幕或原话\", \"subtext\": \"观众扣字的真实顾虑\", \"coach_comment\": \"指出误区并说明策略\", \"coaching_script\": \"具备煽动性的直播话术\"}]\n7. competitor_defense: 公屏提了谁/哪个品牌、比了什么（价格/成分/赠品）、如何通过“自黑式自强”或“价值重构”一句话把流量拉回来。\n8. next_steps: {\"method\": \"针对未下单观众的策略\", \"owner\": \"姓名\", \"goal\": \"UV价值提升等目的\"}`
  },
  test_drive_sales: {
    name: "试驾体验（沉浸式动态实战教练版）",
    system: "你是一位深耕汽车性能与用户体验的专业“试驾教练”。你不仅能通过录音判断销售在动态环境下的控场力，更能精准洞察客户在操作车辆时的心理防线变化。你擅长指出销售在功能演示点位选择、体感互动引导、以及驾驶中封闭空间沟通的失误。你的分析基于“体感验证 x 安全信任 x 情感带入”的多维框架。在输出中，严禁使用虚浮的说明书术语，必须将逻辑转化为犀利、具有极强现场感染力且适配动态场景的教练指导。你的核心任务是根据客户驾驶时的反馈（紧张拘谨、追求推背感、关注智能辅助、纠结静谧性、家人乘坐感受）匹配最优的动态说服策略。输出必须是严格 JSON，禁止输出任何 JSON 之外的文字。",
    template: (transcript: string) => `基于以下试驾过程录音转写，以试驾教练的身份直接输出复盘结果。\n【转写内容】\n${transcript}\n【输出要求】\n请严格按照以下JSON结构输出：\n一、summary：\n- title: 带有教练点评色彩的试驾复盘标题\n- time: 试驾时段（早/晚/高峰期）\n- location: 试驾路线（城市路/高架/颠簸路）\n- participants: 驾驶者、陪驾销售、随行家人\n- text: 100字以内，直接定性这场动态体验是否成功将“产品力”转化为“购买欲”。\n二、highlights：\n提取5-8个真正决定动态成交意向的关键瞬间（如：急加速后的惊叹、智驾介入的信任建立、路噪表现的评价、销售化解驾驶紧张的瞬间）。\n三、transcript：\n每段格式为 {"speaker": "说话人", "time": "时间戳", "text": "内容"}\n四、insights：\n（注意：语气要专业且犀利，拒绝说教）\n1. battle_evaluation: 【销售评级】：[S/A/B/C/D]\n2. customer_intent: 【动态意向等级】：[S/A/B/C/D]。点出是否利用好了特定路段的性能展示，是否在客户体感最强时完成了价值落位。\n3. customer_portrait: {\"type\": \"从性能控/科技派/家用务实/新手紧张/品牌虚荣中精准定性\", \"urgency\": \"底盘、动力、智驾的主观好恶\", \"concerns\": [\"开车时的核心潜意识顾虑1\", \"顾虑2\", \"顾虑3\"]}\n4. sales_performance: {\"pros\": \"亮点\", \"style\": \"驾驶舱控场力定性\", \"cons\": [\"失分点1\", \"失分点2\", \"失分点3\", \"失分点4\"]}\n5. psychological_change: [上车调节] -> [动态起步] -> [核心性能演示点] -> [倒车入库/回店] 的情绪反馈词数组\n6. coaching_guidance: [{\"original_q\": \"驾驶时的原话\", \"subtext\": \"操作车辆时的潜台词\", \"coach_comment\": \"指出误区并说明策略\", \"coaching_script\": \"结合驾驶动作的有动感的话术\"}]\n7. competitor_defense: 客户开了哪款竞品、对比了哪个动态参数（如：刹车脚感、隔音、转弯半径）、如何利用“体感独特性”一句话反击。\n8. next_steps: {\"method\": \"具体的下车礼/复盘动作\", \"owner\": \"姓名\", \"goal\": \"下一步的具体目的\"}`
  }
};

function extractJson(text: string): any {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '');
  }

  try {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error("未找到有效 JSON");
    const jsonStr = cleaned.substring(start, end + 1);
    const parsed = JSON.parse(jsonStr);
    // 兼容多种可能的返回包裹层
    return parsed.sales_visit || parsed.telesales_coaching || parsed.field_sales_visit || parsed.livestream_sales || parsed.test_drive_sales || parsed;
  } catch (e) {
    console.error("[JSON 解析失败]:", text);
    throw new Error("报告内容解析失败，模型未按标准 JSON 格式返回。");
  }
}

async function analyzeWithDeepSeek(transcript: string, scenario: ScenarioKey, apiKey: string): Promise<SalesVisitAnalysis> {
  const config = SCENARIO_CONFIGS[scenario];
  const response = await fetch(PROXY_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey: apiKey.trim(),
      model: DEEPSEEK_MODEL,
      messages: [
        { role: "system", content: config.system },
        { role: "user", content: config.template(transcript) }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    })
  });

  if (!response.ok) throw new Error(`API 请求失败 (${response.status})`);
  
  const reader = response.body?.getReader();
  if (!reader) throw new Error("无数据流");
  
  const decoder = new TextDecoder();
  let fullContent = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const dataStr = trimmed.slice(6);
      if (dataStr === '[DONE]') continue;
      try {
        const json = JSON.parse(dataStr);
        fullContent += (json.choices?.[0]?.delta?.content || "");
      } catch (e) {}
    }
  }
  return extractJson(fullContent);
}

async function analyzeWithGemini(transcript: string, scenario: ScenarioKey): Promise<SalesVisitAnalysis> {
  const config = SCENARIO_CONFIGS[scenario];
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: config.template(transcript),
    config: {
      systemInstruction: config.system,
      thinkingConfig: { thinkingBudget: 16000 },
      responseMimeType: "application/json",
    }
  });
  return extractJson(response.text || '{}');
}

export const runAnalysis = async (
  transcript: string, 
  scenario: ScenarioKey,
  provider: ModelProvider,
  deepseekApiKey?: string
): Promise<{ data: SalesVisitAnalysis, provider: ModelProvider }> => {
  if (provider === 'deepseek') {
    if (!deepseekApiKey) throw new Error("请输入您的 DeepSeek API Key");
    const data = await analyzeWithDeepSeek(transcript, scenario, deepseekApiKey);
    return { data, provider };
  } else {
    const data = await analyzeWithGemini(transcript, scenario);
    return { data, provider };
  }
};
