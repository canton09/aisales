
import { GoogleGenAI, Type } from "@google/genai";
import { SalesVisitAnalysis } from "../types";

export type ModelProvider = 'deepseek' | 'gemini';

/**
 * DeepSeek 官方配置
 * 官方文档: https://api-docs.deepseek.com/zh-cn/
 */
const DEEPSEEK_CONFIG = {
  endpoint: 'https://api.deepseek.com/chat/completions',
  model: 'deepseek-chat' 
};

/**
 * 结构化输出指令：确保 DeepSeek 理解所需的 JSON 架构
 */
const JSON_STRUCTURE_INSTRUCTION = `
你的任务是分析汽车销售对话。你必须返回一个严格的 JSON 对象，包含以下字段：
1. summary: { title, time, location, participants: [], text }
2. highlights: [] (关键亮点列表)
3. transcript: [{ speaker, time, text }] (对话还原)
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

const SYSTEM_INSTRUCTION = `你是一位深耕汽车零售行业的专业“销售教练”。你擅长从对话中洞察人性，指出销售失分点并提供话术改进建议。
${JSON_STRUCTURE_INSTRUCTION}
注意：严禁在输出中包含任何 Markdown 标签（如 \`\`\`json）或除 JSON 之外的任何解释文字。`;

/**
 * 健壮的 JSON 提取器
 */
function extractJson(text: string): any {
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) {
      throw new Error("AI 返回内容不包含有效的 JSON 结构。");
    }
    const jsonStr = text.substring(start, end + 1);
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("解析失败的原始内容:", text);
    throw new Error("JSON 数据解析失败，AI 输出格式不正确。");
  }
}

/**
 * DeepSeek API 调用实现
 */
async function analyzeWithDeepSeek(transcript: string, apiKey: string): Promise<SalesVisitAnalysis> {
  try {
    const response = await fetch(DEEPSEEK_CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: DEEPSEEK_CONFIG.model,
        messages: [
          { role: "system", content: SYSTEM_INSTRUCTION },
          { role: "user", content: `请基于以下对话内容，生成一份详细的销售诊断报告（必须输出 json 格式）：\n\n${transcript}` }
        ],
        // DeepSeek 官方建议：开启 json_object 模式
        response_format: { type: "json_object" },
        stream: false,
        temperature: 0.3, 
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      let errorMessage = `接口请求失败 (HTTP ${response.status})`;
      try {
        const errorData = await response.json();
        if (response.status === 402) errorMessage = "DeepSeek 账户余额不足，请在平台充值。";
        else if (response.status === 429) errorMessage = "请求过于频繁，DeepSeek 接口已限流。";
        else if (response.status === 503) errorMessage = "DeepSeek 服务器繁忙，请稍后再试。";
        else errorMessage = errorData.error?.message || errorMessage;
      } catch (e) {}
      throw new Error(errorMessage);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("模型未返回任何内容。");
    }

    return extractJson(content);
  } catch (err: any) {
    console.error("DeepSeek 接入异常:", err);
    
    // 浏览器环境下的常见 CORS 错误提示
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error("【连接失败】无法直接从浏览器访问 DeepSeek。由于其 API 未开启跨域(CORS)许可，当前前端无法直连。建议检查网络或使用 Gemini 引擎。");
    }
    
    throw err;
  }
}

/**
 * Gemini API 调用实现
 */
async function analyzeWithGemini(transcript: string): Promise<SalesVisitAnalysis> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `分析对话并输出 JSON：\n\n${transcript}`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      thinkingConfig: { thinkingBudget: 16000 },
      responseMimeType: "application/json",
      // Gemini 专用 Schema 校验
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

/**
 * 统一执行入口
 */
export const runAnalysis = async (
  transcript: string, 
  provider: ModelProvider,
  deepseekApiKey?: string
): Promise<{ data: SalesVisitAnalysis, provider: ModelProvider }> => {
  if (provider === 'deepseek') {
    if (!deepseekApiKey) throw new Error("缺少 DeepSeek API Key");
    const data = await analyzeWithDeepSeek(transcript, deepseekApiKey);
    return { data, provider };
  } else {
    const data = await analyzeWithGemini(transcript);
    return { data, provider };
  }
};
