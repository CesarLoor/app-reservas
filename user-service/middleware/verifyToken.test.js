import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

import { verifyToken } from './verifyToken.js';

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

test('verifyToken rejects missing authorization headers', () => {
  const res = createResponse();

  verifyToken({ headers: {} }, res, () => {
    throw new Error('next should not be called');
  });

  assert.equal(res.statusCode, 401);
});

test('verifyToken rejects requests when JWT_SECRET is missing', () => {
  const originalSecret = process.env.JWT_SECRET;

  try {
    delete process.env.JWT_SECRET;
    const res = createResponse();

    verifyToken({ headers: { authorization: 'Bearer token-123' } }, res, () => {
      throw new Error('next should not be called');
    });

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { message: 'Error interno del servidor' });
  } finally {
    process.env.JWT_SECRET = originalSecret;
  }
});

test('verifyToken attaches the decoded user and calls next', () => {
  const originalVerify = jwt.verify;
  const originalSecret = process.env.JWT_SECRET;
  const decoded = {
    userId: 'user-1',
    nombre: 'Ana',
    email: 'ana@example.com'
  };

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
  } finally {
    jwt.verify = originalVerify;
    process.env.JWT_SECRET = originalSecret;
  }
});

test('verifyToken rejects invalid signed tokens', () => {
  const originalVerify = jwt.verify;
  const originalSecret = process.env.JWT_SECRET;

  try {
    process.env.JWT_SECRET = 'test-secret';
    jwt.verify = () => {
      throw new Error('bad token');
    };

    const res = createResponse();
    verifyToken({ headers: { authorization: 'Bearer bad-token' } }, res, () => {
      throw new Error('next should not be called');
    });

    assert.equal(res.statusCode, 401);
    assert.match(res.body.message, /Token inv/);
  } finally {
    jwt.verify = originalVerify;
    process.env.JWT_SECRET = originalSecret;
  }
});
