import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import router from './user.routes.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/users', router);
  return app;
}

function request(app, { method, path, body, headers = {} }) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const { port } = server.address();
      const payload = body === undefined ? undefined : JSON.stringify(body);
      const req = http.request(
        {
          method,
          port,
          path,
          host: '127.0.0.1',
          headers: {
            'Content-Type': 'application/json',
            ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
            ...headers
          }
        },
        (res) => {
          let data = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            server.close(() => {
              resolve({
                statusCode: res.statusCode,
                body: data ? JSON.parse(data) : undefined
              });
            });
          });
        }
      );
      req.on('error', (error) => {
        server.close(() => reject(error));
      });
      if (payload) req.write(payload);
      req.end();
    });
  });
}

function withValidToken() {
  const originalVerify = jwt.verify;
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'test-secret';
  jwt.verify = (token, secret) => {
    assert.equal(token, 'token-123');
    assert.equal(secret, 'test-secret');
    return { userId: 'user-1', nombre: 'Ana', email: 'ana@example.com' };
  };
  return () => {
    jwt.verify = originalVerify;
    process.env.JWT_SECRET = originalSecret;
  };
}

test('POST /users creates a synchronized profile', async () => {
  const originalCreate = User.create;

  try {
    User.create = async (payload) => {
      assert.deepEqual(payload, { _id: 'user-1', nombre: 'Ana', email: 'ana@example.com' });
      return { ...payload, preferencias: [] };
    };

    const response = await request(createApp(), {
      method: 'POST',
      path: '/users',
      body: { _id: 'user-1', nombre: 'Ana', email: 'ana@example.com' }
    });

    assert.equal(response.statusCode, 201);
    assert.equal(response.body.email, 'ana@example.com');
  } finally {
    User.create = originalCreate;
  }
});

test('POST /users rejects incomplete profile payloads', async () => {
  const response = await request(createApp(), {
    method: 'POST',
    path: '/users',
    body: { nombre: 'Ana' }
  });

  assert.equal(response.statusCode, 400);
});

test('GET /users/me returns the authenticated profile', async () => {
  const restoreToken = withValidToken();
  const originalFindById = User.findById;

  try {
    User.findById = (id) => {
      assert.equal(id, 'user-1');
      return {
        select: async (projection) => {
          assert.equal(projection, '-password');
          return { _id: 'user-1', nombre: 'Ana', email: 'ana@example.com' };
        }
      };
    };

    const response = await request(createApp(), {
      method: 'GET',
      path: '/users/me',
      headers: { Authorization: 'Bearer token-123' }
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.nombre, 'Ana');
  } finally {
    User.findById = originalFindById;
    restoreToken();
  }
});

test('PUT /users/me/update validates and updates profile fields', async () => {
  const restoreToken = withValidToken();
  const originalFindByIdAndUpdate = User.findByIdAndUpdate;

  try {
    User.findByIdAndUpdate = (id, update, options) => {
      assert.equal(id, 'user-1');
      assert.deepEqual(update, { $set: { nombre: 'Ana Maria', telefono: '0999999999' } });
      assert.deepEqual(options, { new: true });
      return {
        select: async (projection) => {
          assert.equal(projection, '-password');
          return { _id: 'user-1', nombre: 'Ana Maria', telefono: '0999999999' };
        }
      };
    };

    const response = await request(createApp(), {
      method: 'PUT',
      path: '/users/me/update',
      headers: { Authorization: 'Bearer token-123' },
      body: { nombre: 'Ana Maria', telefono: '0999999999' }
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.nombre, 'Ana Maria');
  } finally {
    User.findByIdAndUpdate = originalFindByIdAndUpdate;
    restoreToken();
  }
});

test('PUT /users/me/update rejects invalid email input', async () => {
  const restoreToken = withValidToken();

  try {
    const response = await request(createApp(), {
      method: 'PUT',
      path: '/users/me/update',
      headers: { Authorization: 'Bearer token-123' },
      body: { email: 'invalid-email' }
    });

    assert.equal(response.statusCode, 400);
  } finally {
    restoreToken();
  }
});
