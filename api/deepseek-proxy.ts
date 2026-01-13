
export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: '仅支持 POST 请求' }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const startTime = Date.now();

  try {
    const body = await req.json();
    const { apiKey, ...deepseekPayload } = body;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: '未检测到 API Key' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 官方 Endpoint: https://api.deepseek.com/chat/completions
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        ...deepseekPayload,
        // 确保禁用流式输出，以便一次性返回 JSON
        stream: false 
      })
    });

    const data = await response.text();
    const duration = Date.now() - startTime;
    
    console.log(`[DeepSeek Proxy] Status: ${response.status}, Time: ${duration}ms`);
    
    return new Response(data, {
      status: response.status,
      headers: { 
        'Content-Type': 'application/json',
        'X-Response-Time': `${duration}ms`
      }
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[DeepSeek Proxy Error] ${duration}ms:`, error);
    
    return new Response(JSON.stringify({ 
      error: '代理网关错误',
      details: error.message
    }), { 
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
