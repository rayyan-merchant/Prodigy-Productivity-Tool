import { authenticateAndConsumeQuota, corsHeaders, fetchWithTimeout, jsonResponse, readProviderText } from '../_shared/ai.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const startedAt = Date.now();
  try {
    const auth = await authenticateAndConsumeQuota(request, 'hydration-insights', 100, 5);
    if (auth.blocked) return auth.blocked;
    const body = await request.json();
    if (typeof body.prompt !== 'string' || body.prompt.length < 1 || body.prompt.length > 5_000) {
      return jsonResponse({ success: false, code: 'validation', error: 'Hydration input is invalid.' }, 400);
    }
    const key = Deno.env.get('GROQ_API_KEY') || Deno.env.get('GEMINI_API_KEY');
    if (!key) throw new Error('AI provider is not configured.');
    const isGroq = !!Deno.env.get('GROQ_API_KEY');
    const url = isGroq 
      ? 'https://api.groq.com/openai/v1/chat/completions' 
      : 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
    const model = isGroq ? 'llama-3.1-8b-instant' : 'gemini-2.0-flash-exp';
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        max_tokens: 350,
        messages: [
          { role: 'system', content: 'Give 3 concise hydration observations based only on the supplied logs. Avoid medical claims. Suggest consulting a clinician for individual medical guidance.' },
          { role: 'user', content: body.prompt },
        ],
      }),
    });
    const data = await readProviderText(response);
    const generatedAt = new Date().toISOString();
    console.log(JSON.stringify({ function: 'hydration-insights', userId: auth.user.id, durationMs: Date.now() - startedAt, remaining: auth.remaining }));
    return jsonResponse({ success: true, data, provider: isGroq ? 'Groq' : 'Gemini', generatedAt, remaining: auth.remaining });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Hydration insight failed.';
    console.error(JSON.stringify({ function: 'hydration-insights', message, durationMs: Date.now() - startedAt }));
    return jsonResponse({ success: false, code: message === 'Unauthorized' ? 'auth' : 'provider', error: message }, message === 'Unauthorized' ? 401 : 502);
  }
});
