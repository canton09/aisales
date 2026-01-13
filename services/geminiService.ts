
import { GoogleGenAI, Type } from "@google/genai";
import { SalesVisitAnalysis } from "../types";

/**
 * 销售教练系统指令：定义了 AI 的核心逻辑、角色定位及输出禁忌。
 */
const SYSTEM_INSTRUCTION = `你是一位深耕汽车零售行业的专业“销售教练”。你不仅能精准捕捉客户的潜台词，更能以专业、客观且直接的方式纠正销售人员的实战错误。你的分析基于“客户类型 x 沟通策略 x 行业法则”的多维框架。在输出中，严禁直接复读理论名词（如ACE、FABE、SPIN、LSCPA、N.E.T.S.），你必须将这些底层逻辑转化为犀利、正式且具备高度可落地性的教练指导。你的核心任务是根据客户表现（理性对比、价格敏感、感性体验、决策犹豫、品牌导向）匹配最优的沟通逻辑。输出必须是严格 JSON，禁止输出任何 JSON 之外的文字。`;

/**
 * 使用 Gemini 3 Flash 进行分析
 * 选用 Flash 模型以解决 Pro 模型在部分代理环境下的 500 RPC 响应错误。
 */
export const analyzeTranscript = async (transcript: string): Promise<SalesVisitAnalysis> => {
  // 实时初始化以确保使用最新的 API Key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `请对以下汽车销售对话进行深度复盘。你需要分析销售的行为缺陷，并提供犀利的教练指导。\n\n【转写内容】\n${transcript}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        // 启用推理模式，16000 令牌足以完成复杂的逻辑推演并保持请求稳定性
        thinkingConfig: {
          thinkingBudget: 16000,
        },
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

    const text = response.text;
    if (!text) {
      throw new Error("模型响应为空，请重试。");
    }

    return JSON.parse(text);
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    
    // 针对 RPC 500 错误提供更直观的提示
    if (error.message?.includes('500') || error.message?.includes('Rpc failed')) {
      throw new Error("分析引擎响应超时或服务波动，请尝试精简输入文本后重试。");
    }
    
    throw new Error(error.message || "分析服务暂时不可用。");
  }
};
