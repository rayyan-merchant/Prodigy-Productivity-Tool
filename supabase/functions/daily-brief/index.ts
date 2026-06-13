import { authenticateAndConsumeQuota, corsHeaders, fetchWithTimeout, jsonResponse, readProviderText } from '../_shared/ai.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const startedAt = Date.now();
  try {
    const auth = await authenticateAndConsumeQuota(request, 'daily-brief', 100, 5);
    if (auth.blocked) return auth.blocked;
    const body = await request.json();
    const tasks = Array.isArray(body.tasks) ? body.tasks.slice(0, 40) : [];
    const habits = Array.isArray(body.habits) ? body.habits.slice(0, 30) : [];
    const sessions = Array.isArray(body.sessions) ? body.sessions.slice(0, 10) : [];
    const compact = JSON.stringify({ tasks, habits, sessions });
    if (compact.length > 25_000) return jsonResponse({ success: false, code: 'validation', error: 'Too much source data for one brief.' }, 400);
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
        max_tokens: 600,
        messages: [
          { role: 'system', content: 'Create a concise daily productivity brief from the supplied records. Use short markdown headings, identify up to four priorities, mention habit status and one focus recommendation. Do not invent goals, statistics, or dates.' },
          { role: 'user', content: compact },
        ],
      }),
    });
    const brief = await readProviderText(response);
    const generatedAt = new Date().toISOString();
    console.log(JSON.stringify({ function: 'daily-brief', userId: auth.user.id, durationMs: Date.now() - startedAt, remaining: auth.remaining }));
    return jsonResponse({ success: true, brief, provider: isGroq ? 'Groq' : 'Gemini', generatedAt, remaining: auth.remaining });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Daily brief failed.';
    console.error(JSON.stringify({ function: 'daily-brief', message, durationMs: Date.now() - startedAt }));
    return jsonResponse({ success: false, code: message === 'Unauthorized' ? 'auth' : 'provider', error: message }, message === 'Unauthorized' ? 401 : 502);
  }
});
