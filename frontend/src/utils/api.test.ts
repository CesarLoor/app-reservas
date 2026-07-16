import test from 'node:test';
import assert from 'node:assert/strict';

test('api helpers call the configured service endpoints', async () => {
  process.env.NEXT_PUBLIC_API_URL = 'http://auth-service';
  process.env.NEXT_PUBLIC_USER_URL = 'http://user-service';
  process.env.NEXT_PUBLIC_BOOKING_URL = 'http://booking-service';

  const calls: Array<{ input: string; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    calls.push({ input: String(input), init });
    return {
      json: async () => ({ ok: true })
    } as Response;
  }) as typeof fetch;

  try {
    const { registerUser, loginUser, getMe, getBookings } = await import('./api.ts');

    assert.deepEqual(await registerUser({ name: 'Ana', email: 'ana@example.com', password: 'secret' }), {
      ok: true
    });
    assert.deepEqual(await loginUser({ email: 'ana@example.com', password: 'secret' }), { ok: true });
    assert.deepEqual(await getMe('token-123'), { ok: true });
    assert.deepEqual(await getBookings('token-123'), { ok: true });

    assert.equal(calls[0].input, 'http://auth-service/register');
    assert.equal(calls[0].init?.method, 'POST');
    assert.equal(calls[1].input, 'http://auth-service/login');
    assert.equal(calls[1].init?.method, 'POST');
    assert.equal(calls[2].input, 'http://user-service/me');
    assert.deepEqual(calls[2].init?.headers, { Authorization: 'Bearer token-123' });
    assert.equal(calls[3].input, 'http://booking-service/bookings');
    assert.deepEqual(calls[3].init?.headers, { Authorization: 'Bearer token-123' });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
