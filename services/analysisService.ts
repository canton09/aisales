
import { GoogleGenAI, Type } from "@google/genai";
import { SalesVisitAnalysis } from "../types";

export type ModelProvider = 'deepseek' | 'gemini';

const PROXY_ENDPOINT = '/api/deepseek-proxy';
const DEEPSEEK_MODEL = 'deepseek-chat';

const JSON_STRUCTURE_INSTRUCTION = `
你必须返回一个严格的 JSON 对象，包含以下字段：
1. summary: { title, time, location, participants: [], text }
2. highlights: []
3. transcript: [{ speaker, time, text }]
4. insights: { 
     battle_evaluation: "S/A/B/C/D", 
     customer_intent: "S/A/B/C/D",
     customer_portrait: { type, urgency, concerns: [] },
     sales_performance: { pros, style, cons: [] },
     psychological_change: [], 
     coaching_guidance: [{ original_q, subtext, coach_comment, coaching_script }],
     competitor_defense,
     next_steps: { method, owner, goal }
   }
`;

const SYSTEM_INSTRUCTION = `你是一位专业的汽车销售复盘教练。请基于实战逻辑进行诊断。
${JSON_STRUCTURE_INSTRUCTION}
注意：直接输出 JSON，不要包含任何 Markdown 格式（如 \`\`\`json 标签）。`;

/**
 * 强力 JSON 提取器：剥离 Markdown 标签并解析
 */
function extractJson(text: string): any {
  console.log("[Extractor] 原始输出长度:", text.length);
  let cleaned = text.trim();
  
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```json\n?/, '').replace(/\n?```$/, '');
  }

  try {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error("未能在响应中找到 JSON 对象");
    const jsonStr = cleaned.substring(start, end + 1);
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("[Extractor] 解析失败，内容预览:", text.substring(0, 200));
    throw new Error("模型生成的报告格式不规范（非有效 JSON），请重试或更换对话内容。");
  }
}

async function analyzeWithDeepSeek(transcript: string, apiKey: string): Promise<SalesVisitAnalysis> {
  console.log("[DeepSeek] 正在通过代理发起分析...");
  
  // 前端超时设置（略长于代理层，作为最后一道防线）
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(PROXY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        apiKey: apiKey.trim(),
        model: DEEPSEEK_MODEL,
        messages: [
          { role: "system", content: SYSTEM_INSTRUCTION },
          { role: "user", content: `请分析此对话：\n\n${transcript}` }
        ],
        stream: false,
        response_format: { type: "json_object" },
        temperature: 0.3
      })
    });

    clearTimeout(timeoutId);

    if (response.status === 404) {
      throw new Error("后端代理函数 (api/deepseek-proxy) 未找到。请确认已在 Vercel 环境下部署，或正在使用 vercel dev 运行。");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(errorData.error || `接口请求失败 (${response.status})`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    
    if (!content) throw new Error("DeepSeek 未能生成分析内容，请检查账户余额或 API 状态。");

    return extractJson(content);
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error("分析请求超时。DeepSeek 当前服务器拥堵，响应时间超过了 60 秒限制，建议切换至 Gemini Flash 引擎。");
    }
    console.error("[DeepSeek Error]:", err);
    throw err;
  }
}

async function analyzeWithGemini(transcript: string): Promise<SalesVisitAnalysis> {
  console.log("[Gemini] 正在发起分析...");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `分析对话并输出 JSON：\n\n${transcript}`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      thinkingConfig: { thinkingBudget: 16000 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              time: { type: Type.STRING },
              location: { type: Type.STRING },
              participants: { type: Type.ARRAY, items: { type: Type.STRING } },
              text: { type: Type.STRING }
            },
            required: ["title", "time", "location", "participants", "text"]
          },
          highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
          transcript: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                speaker: { type: Type.STRING },
                time: { type: Type.STRING },
                text: { type: Type.STRING }
              }
            }
          },
          insights: {
            type: Type.OBJECT,
            properties: {
              battle_evaluation: { type: Type.STRING },
              customer_intent: { type: Type.STRING },
              customer_portrait: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  urgency: { type: Type.STRING },
                  concerns: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              },
              sales_performance: {
                type: Type.OBJECT,
                properties: {
                  pros: { type: Type.STRING },
                  style: { type: Type.STRING },
                  cons: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              },
              psychological_change: { type: Type.ARRAY, items: { type: Type.STRING } },
              coaching_guidance: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    original_q: { type: Type.STRING },
                    subtext: { type: Type.STRING },
                    coach_comment: { type: Type.STRING },
                    coaching_script: { type: Type.STRING }
                  }
                }
              },
              competitor_defense: { type: Type.STRING },
              next_steps: {
                type: Type.OBJECT,
                properties: {
                  method: { type: Type.STRING },
                  owner: { type: Type.STRING },
                  goal: { type: Type.STRING }
                }
              }
            }
          }
        },
        required: ["summary", "highlights", "transcript", "insights"]
      }
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
    if (!deepseekApiKey) throw new Error("请输入 DeepSeek API Key");
    const data = await analyzeWithDeepSeek(transcript, deepseekApiKey);
    return { data, provider };
  } else {
    const data = await analyzeWithGemini(transcript);
    return { data, provider };
  }
};
