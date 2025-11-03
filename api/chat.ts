import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export default async function handler(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { messages, provider = 'openai', model } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    const claudeApiKey = process.env.ANTHROPIC_API_KEY;

    if (provider === 'openai' && openaiApiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model || 'gpt-3.5-turbo',
            messages,
            temperature: 0.7,
            max_tokens: 2000,
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
      } catch (error) {
        console.log('OpenAI failed, trying Claude fallback:', error);

        if (!claudeApiKey) {
          return NextResponse.json({ error: 'Both OpenAI and Claude APIs unavailable' }, { status: 503 });
        }
      }
    }

    if (claudeApiKey) {
      const claudeMessages = messages.map((msg: any) => ({
        role: msg.role === 'system' ? 'user' : msg.role,
        content: msg.role === 'system' ? `System: ${msg.content}` : msg.content
      }));

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': claudeApiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 2000,
          messages: claudeMessages,
        }),
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`);
      }

      const data = await response.json();

      const openaiFormat = {
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: 'claude-3-sonnet-20240229',
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: data.content[0].text,
          },
          finish_reason: 'stop',
        }],
        usage: {
          prompt_tokens: data.usage?.input_tokens || 0,
          completion_tokens: data.usage?.output_tokens || 0,
          total_tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
        },
      };

      return NextResponse.json(openaiFormat);
    }

    return NextResponse.json({ error: 'No API keys configured' }, { status: 503 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}