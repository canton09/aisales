
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
      return new Response(JSON.stringify({ error: '请在前端配置 API Key' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 调用 DeepSeek 官方标准接口
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        ...deepseekPayload,
        stream: false 
      })
    });

    const data = await response.text();
    const duration = Date.now() - startTime;
    
    console.log(`[DeepSeek Proxy] Status: ${response.status}, Latency: ${duration}ms`);
    
    return new Response(data, {
      status: response.status,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Proxy-Latency': `${duration}ms`
      }
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[DeepSeek Proxy Error] after ${duration}ms:`, error);
    
    return new Response(JSON.stringify({ 
      error: '分析代理请求失败',
      details: error.message || '网络连接异常'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
