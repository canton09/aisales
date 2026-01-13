
import { GoogleGenAI, Type } from "@google/genai";
import { SalesVisitAnalysis, ScenarioKey } from "../types";

export type ModelProvider = 'deepseek' | 'gemini';

const PROXY_ENDPOINT = '/api/deepseek-proxy';
const DEEPSEEK_MODEL = 'deepseek-chat';

const COMMON_JSON_STRUCTURE = `
请以“深度归纳”为原则，严格按照以下 JSON 结构输出，严禁多余废话：
{
  "summary": {
    "title": "直击痛点的诊断标题",
    "time": "时间",
    "location": "地点",
    "participants": ["角色列表"],
    "text": "一句话深度归纳：定性本场表现及其核心矛盾。"
  },
  "highlights": ["最关键的3-5个高光/转折瞬间"],
  "transcript": [
    { "speaker": "角色", "time": "00:00", "text": "内容" }
  ],
  "insights": {
    "battle_evaluation": "评级[S-D]",
    "customer_intent": "意向等级[S-D]及核心判断依据",
    "customer_portrait": {
      "type": "归纳定性",
      "urgency": "跟进建议",
      "concerns": ["痛点归纳1", "痛点归纳2"]
    },
    "sales_performance": {
      "pros": "核心优势归纳",
      "style": "表现定性",
      "cons": ["最致命的失分点1", "最致命的失分点2", "最致命的失分点3"]
    },
    "psychological_change": ["入场心态", "转折心态", "离场心态"],
    "coaching_guidance": [
      {
        "original_q": "典型原话",
        "subtext": "心理归纳",
        "coach_comment": "犀利诊断",
        "coaching_script": "实战话术"
      }
    ],
    "competitor_defense": "针对性的降维打击话术",
    "next_steps": {
      "method": "触达动作",
      "owner": "责任人",
      "goal": "转化目标"
    }
  }
}
`;

export const SCENARIO_CONFIGS: Record<ScenarioKey, { system: string, template: (t: string) => string, name: string }> = {
  telesales_coaching: {
    name: "电销实战·归纳诊断版",
    system: "你是一位极简主义的电销督导。任务：对通话进行深度归纳，剥离废话，直击销售盲点。输出必须是严格 JSON。",
    template: (transcript: string) => `对以下电销对话进行深度归纳诊断：\n\n${transcript}\n\n${COMMON_JSON_STRUCTURE}`
  },
  field_sales_visit: {
    name: "现场销售·归纳诊断版",
    system: "你是一位实战派现场销售教练。任务：归纳客户现场心理变化，识破成交伪装。输出必须是严格 JSON。",
    template: (transcript: string) => `对以下现场沟通进行深度归纳诊断：\n\n${transcript}\n\n${COMMON_JSON_STRUCTURE}`
  },
  livestream_sales: {
    name: "直播销售·归纳诊断版",
    system: "你是一位高效直播电商教练。任务：归纳话术节奏断点，提升单坑产出。输出必须是严格 JSON。",
    template: (transcript: string) => `对以下直播话术进行深度归纳诊断：\n\n${transcript}\n\n${COMMON_JSON_STRUCTURE}`
  },
  test_drive_sales: {
    name: "试驾体验·归纳诊断版",
    system: "你是一位性能导向的试驾教练。任务：归纳体感转化效果，指出动态沟通失误。输出必须是严格 JSON。",
    template: (transcript: string) => `对以下试驾过程进行深度归纳诊断：\n\n${transcript}\n\n${COMMON_JSON_STRUCTURE}`
  }
};

function extractJson(text: string): any {
  let cleaned = text.trim();
  if (cleaned.includes('```')) {
    const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) cleaned = match[1];
  }
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error("解析失败：AI 未按归纳格式返回 JSON");
  const jsonStr = cleaned.substring(start, end + 1);
  try {
    const parsed = JSON.parse(jsonStr);
    return parsed.sales_visit || parsed.telesales_coaching || parsed.field_sales_visit || parsed.livestream_sales || parsed.test_drive_sales || parsed;
  } catch (e) {
    const fixedJson = jsonStr.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
    return JSON.parse(fixedJson);
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
      temperature: 0.1,
    })
  });
  if (!response.ok) throw new Error(`API 繁忙，请重试 (${response.status})`);
  const reader = response.body?.getReader();
  if (!reader) throw new Error("数据流异常");
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
      if (!line.trim().startsWith('data: ')) continue;
      const dataStr = line.trim().slice(6);
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
      thinkingConfig: { thinkingBudget: 0 },
      responseMimeType: "application/json",
      temperature: 0.1,
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
    if (!deepseekApiKey) throw new Error("请输入 DeepSeek Key");
    const data = await analyzeWithDeepSeek(transcript, scenario, deepseekApiKey);
    return { data, provider };
  } else {
    const data = await analyzeWithGemini(transcript, scenario);
    return { data, provider };
  }
};
