
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
      return new Response(JSON.stringify({ error: 'Missing API Key' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 显式指定 API 路径
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        ...deepseekPayload,
        stream: false // 强制关闭流式，确保一次性返回
      })
    });

    const data = await response.text();
    const duration = Date.now() - startTime;
    
    console.log(`[Proxy] DeepSeek 响应耗时: ${duration}ms, 状态: ${response.status}`);
    
    return new Response(data, {
      status: response.status,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Proxy-Duration': `${duration}ms`
      }
    });

  } catch (error: any) {
    console.error('[Proxy Error]:', error);
    return new Response(JSON.stringify({ 
      error: error.message || '代理层通信异常',
      details: '请检查 Vercel 函数运行日志'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
