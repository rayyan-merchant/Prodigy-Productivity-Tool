import { authenticateAndConsumeQuota, corsHeaders, generateAiText, jsonResponse } from '../_shared/ai.ts';

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
    const { text: data, provider } = await generateAiText({
      maxTokens: 350,
      messages: [
        { role: 'system', content: 'Give 3 concise hydration observations based only on the supplied logs. Avoid medical claims. Suggest consulting a clinician for individual medical guidance.' },
        { role: 'user', content: body.prompt },
      ],
    });
    const generatedAt = new Date().toISOString();
    console.log(JSON.stringify({ function: 'hydration-insights', userId: auth.user.id, durationMs: Date.now() - startedAt, remaining: auth.remaining }));
    return jsonResponse({ success: true, data, provider, generatedAt, remaining: auth.remaining });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Hydration insight failed.';
    console.error(JSON.stringify({ function: 'hydration-insights', message, durationMs: Date.now() - startedAt }));
    return jsonResponse({ success: false, code: message === 'Unauthorized' ? 'auth' : 'provider', error: message }, message === 'Unauthorized' ? 401 : 502);
  }
});
