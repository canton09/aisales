
import { GoogleGenAI, Type } from "@google/genai";
import { SalesVisitAnalysis } from "../types";

export type ModelProvider = 'deepseek' | 'gemini';

const PROXY_ENDPOINT = '/api/deepseek-proxy';
const DEEPSEEK_MODEL = 'deepseek-chat';

const SYSTEM_INSTRUCTION = `你是一位深耕汽车零售行业的专业“销售教练”。你不仅能精准捕捉客户的潜台词，更能以专业、客观且直接的方式纠正销售人员的实战错误。你的分析基于“客户类型 x 沟通策略 x 行业法则”的多维框架。在输出中，严禁直接复读理论名词（如ACE、FABE、SPIN、LSCPA、N.E.T.S.），你必须将这些底层逻辑转化为犀利、正式且具备高度可落地性的教练指导。你的核心任务是根据客户表现（理性对比、价格敏感、感性体验、决策犹豫、品牌导向）匹配最优的沟通逻辑。输出必须是严格 JSON，禁止输出任何 JSON 之外的文字。`;

const PROMPT_TEMPLATE = (transcript: string) => `
基于以下录音转写，以销售教练的身份直接输出复盘结果。
【转写内容】
${transcript}

【输出要求】
请严格按照以下JSON结构输出：
一、summary：
- title: 带有教练点评色彩的标题
- time: 时间
- location: 地点
- participants: 参与者数组
- text: 100字以内，基于客户类型识别，直接定性这单聊得怎么样。

二、highlights：
提取5-8个真正决定成交走向的关键瞬间（如：策略转换点、价值重构时刻）。

三、transcript：
每段格式为 {"speaker": "说话人", "time": "时间戳", "text": "内容"}

四、insights：
（注意：语气要专业且犀利，拒绝说教）
1. battle_evaluation: 【销售评级】：[S/A/B/C/D]
2. customer_intent: 【客户意向】：[S/A/B/C/D]。点出是否完成了“诊断-匹配-转化”的逻辑闭环，成败关键点在哪。
3. customer_portrait: 
   - type: 从“理性对比/价格敏感/感性体验/决策犹豫/品牌导向”中精准定性。
   - urgency: 【购买紧迫度】：判断其决策周期。
   - concerns: 【他在想什么】：深挖最担心的3个点。
4. sales_performance:
   - pros: 【亮点】：精准夸奖点。
   - style: 【风格/状态】：定性分析。
   - cons: 【核心失分点】：针对本场沟通，必须分段列出至少4个及以上的核心失分点。
5. psychological_change: [进店] -> [转折点] -> [博弈时] -> [走人时] 的真实心态变化数组。
6. coaching_guidance: (针对客户死穴，提供2组示范)
   - original_q: 客户原话。
   - subtext: 【他其实想问】：翻译客户的潜台词。
   - coach_comment: 【教练点评】：指出逻辑误区。
   - coaching_script: 【销售教练实战话术】：直接给出一段【定制版】话术。要求：理性客户给数据，感性客户给场景，价格客户给周期价值，品牌客户给身份认同。
7. competitor_defense: 提了谁、比什么、一句话反击。
8. next_steps:
   - method: 【怎么追】：给出具体的触达由头。
   - owner: 负责人。
   - goal: 【搞定指标】：下一步的具体目的。
`;

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
    // 兼容性处理：如果返回了包裹层 "sales_visit"
    return parsed.sales_visit || parsed;
  } catch (e) {
    console.error("[JSON 解析失败]:", text);
    throw new Error("报告内容解析失败。");
  }
}

async function analyzeWithDeepSeek(transcript: string, apiKey: string): Promise<SalesVisitAnalysis> {
  const response = await fetch(PROXY_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey: apiKey.trim(),
      model: DEEPSEEK_MODEL,
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        { role: "user", content: PROMPT_TEMPLATE(transcript) }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    })
  });

  if (!response.ok) throw new Error(`API 请求失败 (${response.status})`);
  if (!response.body) throw new Error("无数据流");

  const reader = response.body.getReader();
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

async function analyzeWithGemini(transcript: string): Promise<SalesVisitAnalysis> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: PROMPT_TEMPLATE(transcript),
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      thinkingConfig: { thinkingBudget: 16000 },
      responseMimeType: "application/json",
    }
  });
  return extractJson(response.text || '{}');
}

export const runAnalysis = async (
  transcript: string, 
  provider: ModelProvider,
  deepseekApiKey?: string
): Promise<{ data: SalesVisitAnalysis, provider: ModelProvider }> => {
  if (provider === 'deepseek') {
    if (!deepseekApiKey) throw new Error("请输入您的 DeepSeek API Key");
    const data = await analyzeWithDeepSeek(transcript, deepseekApiKey);
    return { data, provider };
  } else {
    const data = await analyzeWithGemini(transcript);
    return { data, provider };
  }
};
