
export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const startTime = Date.now();

  try {
    const body = await req.json();
    const { apiKey, ...deepseekPayload } = body;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: '请提供 API Key' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 使用 AbortController 为内部 fetch 设置超时（25秒，以符合 Vercel Edge Runtime 的限制）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Accept': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        ...deepseekPayload,
        stream: false // 强制禁用流式输出，确保一次性获取完整 JSON
      })
    });

    clearTimeout(timeoutId);

    const data = await response.text();
    const duration = Date.now() - startTime;
    
    return new Response(data, {
      status: response.status,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Proxy-Duration': `${duration}ms`
      }
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[Proxy Error] after ${duration}ms:`, error);
    
    let errorMessage = '代理层通信异常';
    if (error.name === 'AbortError') {
      errorMessage = 'DeepSeek 接口响应超时（代理层限制 25s）。由于 DeepSeek 模型近期负载极高，请精简输入内容或切换至 Gemini Flash 引擎。';
    }

    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: error.message
    }), { 
      status: 504, // Gateway Timeout
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
