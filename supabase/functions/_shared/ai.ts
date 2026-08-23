import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

export const authenticateAndConsumeQuota = async (
  request: Request,
  feature: string,
  limit: number,
  cooldownSeconds: number,
) => {
  const authorization = request.headers.get('Authorization');
  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!authorization || !url || !anonKey) throw new Error('Unauthorized');
  const client = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) throw new Error('Unauthorized');
  const { data, error } = await client.rpc('consume_ai_quota', {
    p_feature: feature,
    p_daily_limit: limit,
    p_cooldown_seconds: cooldownSeconds,
  });
  if (error) throw error;
  const quota = data?.[0];
  if (!quota?.allowed) {
    const retry = quota?.retry_after_seconds || 0;
    const message = retry > 0 ? `Try again in ${retry} seconds.` : 'Daily AI quota reached.';
    return { user, client, blocked: jsonResponse({ success: false, code: 'quota', error: message }, 429) };
  }
  return { user, client, blocked: null, remaining: quota.remaining as number };
};

export const fetchWithTimeout = async (url: string, init: RequestInit, timeoutMs = 12_000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

export const readProviderText = async (response: Response): Promise<string> => {
  if (!response.ok) {
    console.error(JSON.stringify({ providerStatus: response.status, providerBody: (await response.text()).slice(0, 500) }));
    throw new Error(response.status === 429 ? 'AI provider is busy. Try again shortly.' : 'AI provider request failed.');
  }
  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) throw new Error('AI provider returned an empty response.');
  return text.trim();
};

type AiMessage = { role: 'system' | 'user'; content: string };

interface GenerateAiTextOptions {
  messages: AiMessage[];
  maxTokens: number;
  temperature?: number;
}

/**
 * Groq is the primary provider. Gemini is a live fallback rather than merely
 * an alternative for projects where no Groq key has been configured.
 */
export const generateAiText = async ({ messages, maxTokens, temperature }: GenerateAiTextOptions) => {
  const providers = [
    {
      name: 'Groq',
      key: Deno.env.get('GROQ_API_KEY'),
      url: 'https://api.groq.com/openai/v1/chat/completions',
      model: 'openai/gpt-oss-20b',
    },
    {
      name: 'Gemini',
      key: Deno.env.get('GEMINI_API_KEY'),
      url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      model: 'gemini-3.5-flash',
    },
  ].filter((provider): provider is { name: string; key: string; url: string; model: string } => Boolean(provider.key));

  if (providers.length === 0) throw new Error('AI provider is not configured.');

  let lastError: unknown;
  for (const provider of providers) {
    try {
      const response = await fetchWithTimeout(provider.url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${provider.key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: provider.model,
          max_tokens: maxTokens,
          temperature,
          messages,
        }),
      });
      return { text: await readProviderText(response), provider: provider.name };
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : 'Provider request failed.';
      console.warn(JSON.stringify({ event: 'ai_provider_fallback', provider: provider.name, message }));
    }
  }

  throw lastError instanceof Error ? lastError : new Error('AI provider request failed.');
};

