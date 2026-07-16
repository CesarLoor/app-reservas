const test = require('node:test');
const assert = require('node:assert/strict');

const router = require('./mail.routes');

test('mail router exposes reservation and cancellation notification endpoints', () => {
  const routes = router.stack.map((layer) => ({
    path: layer.route.path,
    methods: Object.keys(layer.route.methods).sort()
  }));

  assert.deepEqual(routes, [
    { path: '/reserva', methods: ['post'] },
    { path: '/cancelacion', methods: ['post'] }
  ]);
});
