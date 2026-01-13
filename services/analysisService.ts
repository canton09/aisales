
import { GoogleGenAI, Type } from "@google/genai";
import { SalesVisitAnalysis } from "../types";

export type ModelProvider = 'deepseek' | 'gemini';

const PROXY_ENDPOINT = '/api/deepseek-proxy';
const DEEPSEEK_MODEL = 'deepseek-chat';

const JSON_STRUCTURE_INSTRUCTION = `
输出必须是一个严格的 JSON 对象。
结构如下：
1. summary (对象: title, time, location, participants, text)
2. highlights (字符串数组)
3. transcript (对象数组: speaker, time, text)
4. insights (对象: battle_evaluation, customer_intent, customer_portrait, sales_performance, psychological_change, coaching_guidance, competitor_defense, next_steps)
`;

const SYSTEM_INSTRUCTION = `你是一位专业的汽车销售复盘教练。
你必须以 json 格式输出分析结果。
${JSON_STRUCTURE_INSTRUCTION}
直接输出 JSON 字符串，不要包含 Markdown 格式包裹符（如 \`\`\`json）。`;

/**
 * 鲁棒的 JSON 提取器：处理可能夹杂在文本中的 JSON
 */
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
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("[JSON 解析失败的内容]:", text);
    throw new Error("报告内容解析失败，可能是由于 DeepSeek 响应被截断。请尝试减少输入字数。");
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
        { role: "user", content: `请分析此对话并输出 json：\n\n${transcript}` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API 请求失败 (${response.status})`);
  }

  if (!response.body) throw new Error("未收到有效数据流");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullContent = "";
  let buffer = ""; // 缓冲区，处理被切断的行

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    
    // 最后一行可能是不完整的，留到下一次处理
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      
      const dataStr = trimmed.slice(6);
      if (dataStr === '[DONE]') continue;

      try {
        const json = JSON.parse(dataStr);
        const content = json.choices?.[0]?.delta?.content || "";
        fullContent += content;
      } catch (e) {
        // 如果解析失败，说明这一行可能是被截断的 SSE 数据，忽略并等待拼接
      }
    }
  }

  return extractJson(fullContent);
}

async function analyzeWithGemini(transcript: string): Promise<SalesVisitAnalysis> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `请复盘此汽车销售对话：\n\n${transcript}`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      thinkingConfig: { thinkingBudget: 16000 },
      responseMimeType: "application/json",
    }
  });

  return JSON.parse(response.text || '{}');
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
