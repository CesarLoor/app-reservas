const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const Booking = require('../models/Booking');
const router = require('./booking.routes');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(router);
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
    return { userId: 'user-1', email: 'ana@example.com', nombre: 'Ana' };
  };
  return () => {
    jwt.verify = originalVerify;
    process.env.JWT_SECRET = originalSecret;
  };
}

test('GET /bookings returns formatted bookings for the authenticated user', async () => {
  const restoreToken = withValidToken();
  const originalFind = Booking.find;

  try {
    Booking.find = async (query) => {
      assert.deepEqual(query, { userId: 'user-1' });
      return [
        {
          toObject: () => ({
            _id: 'booking-1',
            userId: 'user-1',
            fecha: new Date('2026-07-16T15:00:00.000Z'),
            servicio: 'Hotel',
            estado: 'activo'
          })
        }
      ];
    };

    const response = await request(createApp(), {
      method: 'GET',
      path: '/bookings',
      headers: { Authorization: 'Bearer token-123' }
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.body[0].servicio, 'Hotel');
    assert.match(response.body[0].fechaFormateada, /^16\/07\/2026/);
  } finally {
    Booking.find = originalFind;
    restoreToken();
  }
});

test('POST /bookings creates a booking and notifies the user', async () => {
  const restoreToken = withValidToken();
  const originalSave = Booking.prototype.save;
  const originalPost = axios.post;
  const notifications = [];

  try {
    Booking.prototype.save = async function save() {
      this._id = 'booking-1';
      return this;
    };
    axios.post = async (url, payload) => {
      notifications.push({ url, payload });
      return { data: { ok: true } };
    };

    const response = await request(createApp(), {
      method: 'POST',
      path: '/bookings',
      headers: { Authorization: 'Bearer token-123' },
      body: { fecha: '2026-07-16T10:00:00', servicio: 'Hotel' }
    });

    assert.equal(response.statusCode, 201);
    assert.equal(response.body.message, 'Reserva creada');
    assert.equal(notifications[0].url, 'http://notification-service:5002/notify/reserva');
    assert.equal(notifications[0].payload.email, 'ana@example.com');
  } finally {
    Booking.prototype.save = originalSave;
    axios.post = originalPost;
    restoreToken();
  }
});

test('PUT /reservas/:id/cancelar cancels a booking and prunes old cancellations', async () => {
  const restoreToken = withValidToken();
  const originalFindOne = Booking.findOne;
  const originalFind = Booking.find;
  const originalDeleteMany = Booking.deleteMany;
  const originalPost = axios.post;
  const deletedQueries = [];

  try {
    const reserva = {
      _id: 'booking-7',
      userId: 'user-1',
      fecha: new Date('2026-07-16T15:00:00.000Z'),
      servicio: 'Hotel',
      estado: 'activo',
      save: async function save() {
        assert.equal(this.estado, 'cancelada');
      }
    };
    Booking.findOne = async (query) => {
      assert.deepEqual(query, { _id: 'booking-7', userId: 'user-1' });
      return reserva;
    };
    Booking.find = () => ({
      sort: async () => [1, 2, 3, 4, 5, 6].map((id) => ({ _id: `old-${id}` }))
    });
    Booking.deleteMany = async (query) => {
      deletedQueries.push(query);
    };
    axios.post = async () => ({ data: { ok: true } });

    const response = await request(createApp(), {
      method: 'PUT',
      path: '/reservas/booking-7/cancelar',
      headers: { Authorization: 'Bearer token-123' }
    });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, { message: 'Reserva cancelada correctamente' });
    assert.deepEqual(deletedQueries[0], { _id: { $in: ['old-1'] } });
  } finally {
    Booking.findOne = originalFindOne;
    Booking.find = originalFind;
    Booking.deleteMany = originalDeleteMany;
    axios.post = originalPost;
    restoreToken();
  }
});

test('DELETE /bookings/:id removes a booking owned by the authenticated user', async () => {
  const restoreToken = withValidToken();
  const originalFindOneAndDelete = Booking.findOneAndDelete;

  try {
    Booking.findOneAndDelete = async (query) => {
      assert.deepEqual(query, { _id: 'booking-1', userId: 'user-1' });
      return { _id: 'booking-1', servicio: 'Hotel' };
    };

    const response = await request(createApp(), {
      method: 'DELETE',
      path: '/bookings/booking-1',
      headers: { Authorization: 'Bearer token-123' }
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.message, 'Reserva eliminada correctamente');
  } finally {
    Booking.findOneAndDelete = originalFindOneAndDelete;
    restoreToken();
  }
});

test('GET /reservas/proximas returns the next active bookings', async () => {
  const restoreToken = withValidToken();
  const originalFind = Booking.find;

  try {
    Booking.find = (query) => {
      assert.equal(query.userId, 'user-1');
      assert.equal(query.estado, 'activo');
      return {
        sort(sortQuery) {
          assert.deepEqual(sortQuery, { fecha: 1 });
          return {
            limit: async (limit) => {
              assert.equal(limit, 5);
              return [{ _id: 'booking-1', servicio: 'Hotel' }];
            }
          };
        }
      };
    };

    const response = await request(createApp(), {
      method: 'GET',
      path: '/reservas/proximas',
      headers: { Authorization: 'Bearer token-123' }
    });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, [{ _id: 'booking-1', servicio: 'Hotel' }]);
  } finally {
    Booking.find = originalFind;
    restoreToken();
  }
});
