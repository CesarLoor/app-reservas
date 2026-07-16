const test = require('node:test');
const assert = require('node:assert/strict');

const router = require('./auth.routes');

test('auth router exposes register, login and me endpoints', () => {
  const routes = router.stack.map((layer) => ({
    path: layer.route.path,
    methods: Object.keys(layer.route.methods).sort()
  }));

  assert.deepEqual(routes, [
    { path: '/register', methods: ['post'] },
    { path: '/login', methods: ['post'] },
    { path: '/me', methods: ['get'] }
  ]);
});
