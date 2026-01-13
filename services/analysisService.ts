
import { GoogleGenAI, Type } from "@google/genai";
import { SalesVisitAnalysis } from "../types";

export type ModelProvider = 'deepseek' | 'gemini';

const PROXY_ENDPOINT = '/api/deepseek-proxy';
const DEEPSEEK_MODEL = 'deepseek-chat';

const JSON_STRUCTURE_INSTRUCTION = `
必须返回严格 JSON 格式。包含以下字段：
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

const SYSTEM_INSTRUCTION = `你是一位犀利的汽车销售复盘教练。请基于实战对话进行诊断。
${JSON_STRUCTURE_INSTRUCTION}
注意：严禁输出 Markdown 标签，仅输出 JSON 原文。`;

function extractJson(text: string): any {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```json\n?/, '').replace(/\n?```$/, '');
  }

  try {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error("无法从输出中提取 JSON 结构");
    const jsonStr = cleaned.substring(start, end + 1);
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("[JSON Parser Error] Raw Content:", text);
    throw new Error("AI 返回的报告格式有误，可能由于负载过高导致生成中断。建议重试。");
  }
}

async function analyzeWithDeepSeek(transcript: string, apiKey: string): Promise<SalesVisitAnalysis> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s 前端超时

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
          { role: "user", content: `分析对话：\n\n${transcript}` }
        ],
        temperature: 0.3
      })
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      let msg = `接口请求失败 (${response.status})`;
      try {
        const errJson = JSON.parse(errorText);
        msg = errJson.error?.message || errJson.error || msg;
      } catch(e) {}
      throw new Error(msg);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    
    if (!content) throw new Error("DeepSeek 未返回任何分析内容。");
    return extractJson(content);

  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error("分析超时（60s）。DeepSeek 服务器当前响应过慢，建议切换至 Gemini Flash 引擎。");
    }
    throw err;
  }
}

async function analyzeWithGemini(transcript: string): Promise<SalesVisitAnalysis> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `分析汽车销售对话并输出 JSON：\n\n${transcript}`,
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
