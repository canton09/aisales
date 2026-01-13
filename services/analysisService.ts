
import { GoogleGenAI, Type } from "@google/genai";
import { SalesVisitAnalysis, ScenarioKey } from "../types";

export type ModelProvider = 'deepseek' | 'gemini';

const PROXY_ENDPOINT = '/api/deepseek-proxy';
const DEEPSEEK_MODEL = 'deepseek-chat';

// 优化点：不再要求模型返回 transcript 全文，而是返回 key_moments 关键点
const COMMON_JSON_STRUCTURE = `
请以“深度归纳”为原则，输出纯净的 JSON 字符串（严禁包含任何 Markdown 格式标记如 \`\`\`json 或解释性文字）。
如果文本过长，请聚焦于最具有诊断价值的片段，严禁复读全文。

结构要求：
{
  "summary": {
    "title": "直击痛点的诊断标题",
    "time": "时间",
    "location": "地点",
    "participants": ["角色列表"],
    "text": "一句话深度归纳核心矛盾。"
  },
  "highlights": ["最关键的3-5个高光瞬间"],
  "key_moments": [
    { "speaker": "角色", "time": "出现阶段", "text": "话术摘要", "insight": "为何关键" }
  ],
  "insights": {
    "battle_evaluation": "评级[S-D]",
    "customer_intent": "意向等级[S-D]及核心判断依据",
    "customer_portrait": {
      "type": "归纳定性",
      "urgency": "跟进建议",
      "concerns": ["痛点1", "痛点2"]
    },
    "sales_performance": {
      "pros": "核心优势归纳",
      "style": "表现定性",
      "cons": ["致命失分点1", "致命失分点2", "致命失分点3"]
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
    "competitor_defense": "针对性的反击话术",
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
    system: "你是一位极简主义的电销督导。任务：对通话进行深度归纳，剥离废话，直击销售盲点。仅输出有效 JSON。",
    template: (transcript: string) => `对以下电销对话进行深度归纳诊断：\n\n${transcript}\n\n${COMMON_JSON_STRUCTURE}`
  },
  field_sales_visit: {
    name: "现场销售·归纳诊断版",
    system: "你是一位实战派现场销售教练。任务：归纳客户现场心理变化，识破成交伪装。仅输出有效 JSON。",
    template: (transcript: string) => `对以下现场沟通进行深度归纳诊断：\n\n${transcript}\n\n${COMMON_JSON_STRUCTURE}`
  },
  livestream_sales: {
    name: "直播销售·归纳诊断版",
    system: "你是一位高效直播电商教练。任务：归纳话术节奏断点，提升单坑产产出。仅输出有效 JSON。",
    template: (transcript: string) => `对以下直播话术进行深度归纳诊断：\n\n${transcript}\n\n${COMMON_JSON_STRUCTURE}`
  },
  test_drive_sales: {
    name: "试驾体验·归纳诊断版",
    system: "你是一位性能导向的试驾教练。任务：归纳体感转化效果，指出动态沟通失误。仅输出有效 JSON。",
    template: (transcript: string) => `对以下试驾过程进行深度归纳诊断：\n\n${transcript}\n\n${COMMON_JSON_STRUCTURE}`
  }
};

function extractJson(text: string): any {
  let cleaned = text.trim();
  
  // 1. 尝试直接通过正则定位 JSON 块
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("模型响应格式异常：未能识别到 JSON 结构");
  }
  
  let jsonStr = jsonMatch[0];

  // 2. 自动修复被截断的 JSON（针对长文本常见问题）
  const openBraces = (jsonStr.match(/\{/g) || []).length;
  const closeBraces = (jsonStr.match(/\}/g) || []).length;
  if (openBraces > closeBraces) {
    // 补全缺失的右括号和可能被截断的数组
    jsonStr += '}'.repeat(openBraces - closeBraces);
    console.warn("Detected truncated JSON, attempted auto-fix.");
  }

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    // 3. 二次修复：清理控制字符
    try {
      const fixedJson = jsonStr.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
      return JSON.parse(fixedJson);
    } catch (innerError) {
      console.error("JSON Parse Error Details:", e, "Content:", jsonStr);
      throw new Error("诊断报告解析失败。原因：对话内容过长导致输出被截断，请尝试分段输入。");
    }
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
      temperature: 0.1,
      max_tokens: 4000 // 增加输出限制，确保存储足够的诊断内容
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `DeepSeek 请求失败 (${response.status})`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("无法连接到 DeepSeek 分析流");
  
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

  if (!fullContent.trim()) throw new Error("DeepSeek 未返回任何分析内容。");
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
    if (!deepseekApiKey) throw new Error("请输入您的 DeepSeek API Key");
    const data = await analyzeWithDeepSeek(transcript, scenario, deepseekApiKey);
    return { data, provider };
  } else {
    const data = await analyzeWithGemini(transcript, scenario);
    return { data, provider };
  }
};
