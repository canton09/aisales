
import { GoogleGenAI, Type } from "@google/genai";
import { SalesVisitAnalysis } from "../types";

export type ModelProvider = 'deepseek' | 'gemini';

const PROXY_ENDPOINT = '/api/deepseek-proxy';
const DEEPSEEK_MODEL = 'deepseek-chat'; // 对应 DeepSeek-V3

const JSON_STRUCTURE_INSTRUCTION = `
你必须返回一个严格的 JSON 对象（不要包含 Markdown 代码块标签）。
JSON 必须包含以下根字段：
1. summary (对象: title, time, location, participants, text)
2. highlights (字符串数组)
3. transcript (对象数组: speaker, time, text)
4. insights (对象: battle_evaluation, customer_intent, customer_portrait, sales_performance, psychological_change, coaching_guidance, competitor_defense, next_steps)
`;

// 官方要求：使用 JSON Mode 时，系统提示词内必须包含 "json" 关键字
const SYSTEM_INSTRUCTION = `你是一位专业的汽车销售复盘教练。请基于销售实战逻辑进行诊断。
你必须以 json 格式输出分析结果。输出结构要求如下：
${JSON_STRUCTURE_INSTRUCTION}
注意：直接输出 JSON 字符串，禁止任何解释性文字或 Markdown 标记。`;

/**
 * 鲁棒的 JSON 提取器
 */
function extractJson(text: string): any {
  let cleaned = text.trim();
  // 去除可能的 Markdown 标签
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '');
  }

  try {
    // 寻找第一个 { 和最后一个 }
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error("未找到 JSON 结构");
    const jsonStr = cleaned.substring(start, end + 1);
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("[JSON Parse Failure]:", text);
    throw new Error("模型响应格式解析失败，请尝试精简对话内容后重试。");
  }
}

async function analyzeWithDeepSeek(transcript: string, apiKey: string): Promise<SalesVisitAnalysis> {
  const controller = new AbortController();
  // 考虑到 Vercel 边缘函数的限制，我们设定 60 秒为前端等待上限
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
          { role: "user", content: `请分析以下对话并输出 json：\n\n${transcript}` }
        ],
        // 核心配置：按照官方文档启用 JSON Mode
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 4000
      })
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = errorData.error?.message || errorData.details || `API 错误 (${response.status})`;
      throw new Error(msg);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    
    if (!content) throw new Error("DeepSeek 返回了空内容。");
    
    return extractJson(content);

  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error("分析请求超时（60s）。DeepSeek 官网目前负载极高，Vercel 已断开连接。请稍后重试，或切换至 Gemini Flash 引擎。");
    }
    throw err;
  }
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
