
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

  try {
    const body = await req.json();
    const { apiKey, ...deepseekPayload } = body;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: '未检测到 API Key' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 转发请求到 DeepSeek，强制开启 stream 模式。
    // 流式传输能让 Vercel 立即感知到数据活动，从而维持长连接，避免 504 超时。
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        ...deepseekPayload,
        stream: true 
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(errorText, {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 将 DeepSeek 的 ReadableStream 直接透传给前端
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error(`[DeepSeek Proxy Error]:`, error);
    return new Response(JSON.stringify({ 
      error: '代理网关内部错误',
      details: error.message
    }), { 
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
