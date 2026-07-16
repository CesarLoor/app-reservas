import test from 'node:test';
import assert from 'node:assert/strict';

import handler from './hello.ts';

test('hello API route returns the default response', () => {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    }
  };

  handler({} as never, res as never);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { name: 'John Doe' });
});
