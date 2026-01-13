
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

  try {
    const body = await req.json();
    const { apiKey, ...deepseekPayload } = body;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API Key is required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        ...deepseekPayload,
        stream: true 
      }),
    });

    // 如果 API 直接报错，不返回流，而是返回错误内容
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return new Response(JSON.stringify({
        error: 'DeepSeek API Error',
        status: response.status,
        details: errorData
      }), { 
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 确保流式响应具有正确的头信息
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // 禁用 Nginx 等代理的缓存
      },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ 
      error: 'Proxy Internal Error',
      message: error.message
    }), { 
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
