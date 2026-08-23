type FunctionErrorWithContext = Error & { context?: unknown };

/**
 * Supabase wraps non-2xx Edge Function responses in a generic error. Preserve
 * the safe JSON error returned by our functions so users can act on it.
 */
export const getEdgeFunctionErrorMessage = async (
  error: unknown,
  fallback: string,
): Promise<string> => {
  const context = (error as FunctionErrorWithContext | undefined)?.context;
  if (context && typeof context === 'object' && 'clone' in context) {
    const response = context as Response;
    try {
      const payload = await response.clone().json() as { error?: unknown };
      if (typeof payload.error === 'string' && payload.error.trim()) return payload.error;
    } catch {
      // The function response was not JSON; fall through to the generic error.
    }
  }

  if (error instanceof Error && error.message && error.message !== 'Edge Function returned a non-2xx status code') {
    return error.message;
  }

  return fallback;
};
