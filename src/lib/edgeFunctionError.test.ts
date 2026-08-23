import { describe, expect, it } from 'vitest';
import { getEdgeFunctionErrorMessage } from './edgeFunctionError';

describe('getEdgeFunctionErrorMessage', () => {
  it('returns the safe error supplied by an Edge Function response', async () => {
    const error = Object.assign(new Error('Edge Function returned a non-2xx status code'), {
      context: new Response(JSON.stringify({ error: 'AI provider is not configured.' }), {
        headers: { 'Content-Type': 'application/json' },
      }),
    });

    await expect(getEdgeFunctionErrorMessage(error, 'Fallback message')).resolves.toBe('AI provider is not configured.');
  });

  it('uses the fallback for an opaque Edge Function failure', async () => {
    await expect(
      getEdgeFunctionErrorMessage(new Error('Edge Function returned a non-2xx status code'), 'Fallback message'),
    ).resolves.toBe('Fallback message');
  });
});
