import { authenticateAndConsumeQuota, corsHeaders, fetchWithTimeout, jsonResponse, readProviderText } from '../_shared/ai.ts';

const allowedTypes = ['motivational-quote', 'weekly-insights', 'prioritize-tasks'] as const;
type RequestType = typeof allowedTypes[number];

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const startedAt = Date.now();
  try {
    const auth = await authenticateAndConsumeQuota(request, 'general', 30, 8);
    if (auth.blocked) return auth.blocked;
    const body = await request.json();
    if (!body || typeof body.prompt !== 'string' || body.prompt.length < 1 || body.prompt.length > 8_000) {
      return jsonResponse({ success: false, code: 'validation', error: 'Prompt must be between 1 and 8,000 characters.' }, 400);
    }
    if (!allowedTypes.includes(body.type as RequestType)) {
      return jsonResponse({ success: false, code: 'validation', error: 'Unsupported AI request type.' }, 400);
    }
    if (body.type === 'prioritize-tasks' && (!Array.isArray(body.context?.tasks) || body.context.tasks.length > 50)) {
      return jsonResponse({ success: false, code: 'validation', error: 'Submit between 1 and 50 tasks.' }, 400);
    }

    const apiKey = Deno.env.get('GROQ_API_KEY') || Deno.env.get('AI_API_KEY') || Deno.env.get('AI API');
    if (!apiKey) throw new Error('AI provider is not configured.');
    const maxTokens = Math.min(Math.max(Number(body.maxTokens) || 400, 64), 700);
    const response = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: body.prompt }],
        max_tokens: maxTokens,
        temperature: body.type === 'prioritize-tasks' ? 0.1 : 0.6,
      }),
    });
    const reply = await readProviderText(response);
    let data: unknown = reply;
    if (body.type === 'prioritize-tasks') {
      const match = reply.match(/\[[\s\S]*?\]/);
      if (!match) throw new Error('AI response did not contain a task order.');
      const parsed = JSON.parse(match[0]);
      if (!Array.isArray(parsed) || parsed.some((id) => typeof id !== 'string')) {
        throw new Error('AI response contained an invalid task order.');
      }
      data = parsed;
    }
    const generatedAt = new Date().toISOString();
    console.log(JSON.stringify({ function: 'ai-service', type: body.type, userId: auth.user.id, durationMs: Date.now() - startedAt, remaining: auth.remaining }));
    return jsonResponse({ success: true, data, provider: 'Groq', generatedAt, remaining: auth.remaining });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI request failed.';
    console.error(JSON.stringify({ function: 'ai-service', message, durationMs: Date.now() - startedAt }));
    return jsonResponse({ success: false, code: message === 'Unauthorized' ? 'auth' : 'provider', error: message }, message === 'Unauthorized' ? 401 : 502);
  }
});
