const test = require('node:test');
const assert = require('node:assert/strict');

const jwt = require('jsonwebtoken');
const verifyToken = require('./verifyToken');

function createResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

test('verifyToken rejects requests without bearer token', () => {
  const res = createResponse();

  verifyToken({ headers: {} }, res, () => {
    throw new Error('next should not be called');
  });

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { message: 'Token no proporcionado' });
});

test('verifyToken attaches decoded user and calls next for valid tokens', () => {
  const originalVerify = jwt.verify;
  const originalSecret = process.env.JWT_SECRET;
  const decoded = { userId: 'user-1', email: 'ana@example.com' };

  try {
    process.env.JWT_SECRET = 'test-secret';
    jwt.verify = (token, secret) => {
      assert.equal(token, 'token-123');
      assert.equal(secret, 'test-secret');
      return decoded;
    };

    const req = { headers: { authorization: 'Bearer token-123' } };
    const res = createResponse();
    let nextCalled = false;

    verifyToken(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.deepEqual(req.user, decoded);
    assert.equal(res.statusCode, 200);
  } finally {
    jwt.verify = originalVerify;
    process.env.JWT_SECRET = originalSecret;
  }
});

test('verifyToken rejects invalid tokens', () => {
  const originalVerify = jwt.verify;

  try {
    jwt.verify = () => {
      throw new Error('bad token');
    };

    const res = createResponse();
    verifyToken({ headers: { authorization: 'Bearer bad-token' } }, res, () => {
      throw new Error('next should not be called');
    });

    assert.equal(res.statusCode, 403);
  } finally {
    jwt.verify = originalVerify;
  }
});
