
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

const SYSTEM_INSTRUCTION = `你是一位专业的汽车销售复盘教练。
${JSON_STRUCTURE_INSTRUCTION}
注意：严禁输出任何 Markdown 标签（如 \`\`\`json），直接以 { 开始，以 } 结束。`;

function extractJson(text: string): any {
  console.log("[Extractor] 原始输出长度:", text.length);
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```json\n?/, '').replace(/\n?```$/, '');
  }

  try {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error("文本中未找到 JSON 对象结构");
    const jsonStr = cleaned.substring(start, end + 1);
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("[Extractor] 解析失败. 内容预览:", text.substring(0, 200));
    throw new Error("模型返回的内容格式无法识别，请重试。");
  }
}

async function analyzeWithDeepSeek(transcript: string, apiKey: string): Promise<SalesVisitAnalysis> {
  console.log("[DeepSeek] 开始分析，引擎:", DEEPSEEK_MODEL);
  
  // 设置 90 秒超时，DeepSeek 生成长 JSON 较慢
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);

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
          { role: "user", content: `分析此对话并输出报告：\n\n${transcript}` }
        ],
        stream: false,
        response_format: { type: "json_object" },
        temperature: 0.3
      })
    });

    clearTimeout(timeoutId);

    // 关键：检测代理是否存在 (404 通常意味着没有部署后端或路径错误)
    if (response.status === 404) {
      throw new Error("后端分析代理(Proxy)未找到。如果你在本地运行，请确保已通过 Vercel CLI 启动；如果在生产环境，请确认部署已包含 api/ 目录。");
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[DeepSeek] 服务器返回错误:", errorText);
      let msg = `接口响应异常 (${response.status})`;
      try {
        const errJson = JSON.parse(errorText);
        msg = errJson.error?.message || errJson.error || msg;
      } catch(e) {}
      throw new Error(msg);
    }

    const result = await response.json();
    console.log("[DeepSeek] 请求成功，正在解析内容...");
    const content = result.choices?.[0]?.message?.content;
    
    if (!content) throw new Error("DeepSeek 未返回有效结果，可能是 API Key 余额不足或被拦截。");

    return extractJson(content);
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      console.error("[DeepSeek] 请求已超时");
      throw new Error("分析请求超时（90秒）。当前 DeepSeek 服务器负载较高，建议精简对话内容或切换到 Gemini。");
    }
    console.error("[DeepSeek] 捕获到异常:", err);
    throw err;
  }
}

async function analyzeWithGemini(transcript: string): Promise<SalesVisitAnalysis> {
  console.log("[Gemini] 开始分析...");
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
