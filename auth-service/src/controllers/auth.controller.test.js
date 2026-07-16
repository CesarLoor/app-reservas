const test = require('node:test');
const assert = require('node:assert/strict');

const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authController = require('./auth.controller');

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

function loadControllerWithFetch(mockFetch) {
  const controllerPath = require.resolve('./auth.controller');
  const fetchPath = require.resolve('node-fetch');
  const originalFetch = require.cache[fetchPath].exports;

  require.cache[fetchPath].exports = mockFetch;
  delete require.cache[controllerPath];

  return {
    controller: require('./auth.controller'),
    restore() {
      require.cache[fetchPath].exports = originalFetch;
      delete require.cache[controllerPath];
    }
  };
}

test('register creates an auth user and syncs it with user-service', async () => {
  const originalFindOne = User.findOne;
  const originalCreate = User.create;
  const originalHash = bcrypt.hash;
  const syncCalls = [];
  const { controller, restore } = loadControllerWithFetch(async (url, options) => {
    syncCalls.push({ url, options });
    return { ok: true };
  });

  try {
    User.findOne = async (query) => {
      assert.deepEqual(query, { email: 'ana@example.com' });
      return null;
    };
    bcrypt.hash = async (password, rounds) => {
      assert.equal(password, 'secret');
      assert.equal(rounds, 10);
      return 'hashed-secret';
    };
    User.create = async (payload) => {
      assert.deepEqual(payload, {
        name: 'Ana',
        email: 'ana@example.com',
        password: 'hashed-secret'
      });
      return { _id: 'user-1', name: payload.name, email: payload.email };
    };

    const res = createResponse();
    await controller.register(
      { body: { name: 'Ana', email: 'ana@example.com', password: 'secret' } },
      res
    );

    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.body, { message: 'Usuario registrado correctamente', userId: 'user-1' });
    assert.equal(syncCalls[0].url, 'http://user-service:5003/users');
    assert.deepEqual(JSON.parse(syncCalls[0].options.body), {
      _id: 'user-1',
      nombre: 'Ana',
      email: 'ana@example.com'
    });
  } finally {
    User.findOne = originalFindOne;
    User.create = originalCreate;
    bcrypt.hash = originalHash;
    restore();
  }
});

test('register rejects an already registered email', async () => {
  const originalFindOne = User.findOne;

  try {
    User.findOne = async () => ({ _id: 'existing-user' });

    const res = createResponse();
    await authController.register(
      { body: { name: 'Ana', email: 'ana@example.com', password: 'secret' } },
      res
    );

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { message: 'Correo ya registrado' });
  } finally {
    User.findOne = originalFindOne;
  }
});

test('login returns a signed token when credentials are valid', async () => {
  const originalFindOne = User.findOne;
  const originalCompare = bcrypt.compare;
  const originalSign = jwt.sign;
  const originalSecret = process.env.JWT_SECRET;

  const existingUser = {
    _id: 'user-1',
    name: 'Ana',
    email: 'ana@example.com',
    password: 'hashed-password'
  };

  try {
    process.env.JWT_SECRET = 'test-secret';
    User.findOne = async (query) => {
      assert.deepEqual(query, { email: existingUser.email });
      return existingUser;
    };
    bcrypt.compare = async (password, hashedPassword) => {
      assert.equal(password, 'plain-password');
      assert.equal(hashedPassword, existingUser.password);
      return true;
    };
    jwt.sign = (payload, secret, options) => {
      assert.deepEqual(payload, {
        userId: existingUser._id,
        nombre: existingUser.name,
        email: existingUser.email
      });
      assert.equal(secret, 'test-secret');
      assert.deepEqual(options, { expiresIn: '1d' });
      return 'signed-token';
    };

    const res = createResponse();
    await authController.login(
      { body: { email: existingUser.email, password: 'plain-password' } },
      res
    );

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
      token: 'signed-token',
      user: { id: 'user-1', name: 'Ana', email: 'ana@example.com' }
    });
  } finally {
    User.findOne = originalFindOne;
    bcrypt.compare = originalCompare;
    jwt.sign = originalSign;
    process.env.JWT_SECRET = originalSecret;
  }
});

test('login returns 404 when the email does not exist', async () => {
  const originalFindOne = User.findOne;

  try {
    User.findOne = async () => null;

    const res = createResponse();
    await authController.login(
      { body: { email: 'missing@example.com', password: 'plain-password' } },
      res
    );

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { message: 'Usuario no encontrado' });
  } finally {
    User.findOne = originalFindOne;
  }
});

test('login returns 401 when the password is invalid', async () => {
  const originalFindOne = User.findOne;
  const originalCompare = bcrypt.compare;

  try {
    User.findOne = async () => ({ _id: 'user-1', password: 'hashed-password' });
    bcrypt.compare = async () => false;

    const res = createResponse();
    await authController.login(
      { body: { email: 'ana@example.com', password: 'bad-password' } },
      res
    );

    assert.equal(res.statusCode, 401);
  } finally {
    User.findOne = originalFindOne;
    bcrypt.compare = originalCompare;
  }
});

test('me rejects requests without authorization header', async () => {
  const res = createResponse();

  await authController.me({ headers: {} }, res);

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { message: 'No autorizado' });
});

test('me returns the user resolved from the token payload', async () => {
  const originalVerify = jwt.verify;
  const originalFindById = User.findById;
  const originalSecret = process.env.JWT_SECRET;

  try {
    process.env.JWT_SECRET = 'test-secret';
    jwt.verify = (token, secret) => {
      assert.equal(token, 'token-123');
      assert.equal(secret, 'test-secret');
      return { userId: 'user-1' };
    };
    User.findById = (id) => {
      assert.equal(id, 'user-1');
      return {
        select: async (projection) => {
          assert.equal(projection, '-password');
          return { _id: 'user-1', name: 'Ana', email: 'ana@example.com' };
        }
      };
    };

    const res = createResponse();
    await authController.me({ headers: { authorization: 'Bearer token-123' } }, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { _id: 'user-1', name: 'Ana', email: 'ana@example.com' });
  } finally {
    jwt.verify = originalVerify;
    User.findById = originalFindById;
    process.env.JWT_SECRET = originalSecret;
  }
});

test('me rejects invalid tokens', async () => {
  const originalVerify = jwt.verify;

  try {
    jwt.verify = () => {
      throw new Error('bad token');
    };

    const res = createResponse();
    await authController.me({ headers: { authorization: 'Bearer bad-token' } }, res);

    assert.equal(res.statusCode, 401);
    assert.match(res.body.message, /Token inv/);
  } finally {
    jwt.verify = originalVerify;
  }
});
