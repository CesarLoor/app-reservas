const test = require('node:test');
const assert = require('node:assert/strict');

const mailer = require('../services/mailer');

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

function loadControllerWithMailer(mockEnviarCorreo) {
  const originalEnviarCorreo = mailer.enviarCorreo;
  const controllerPath = require.resolve('./mail.controller');

  mailer.enviarCorreo = mockEnviarCorreo;
  delete require.cache[controllerPath];

  return {
    controller: require('./mail.controller'),
    restore() {
      mailer.enviarCorreo = originalEnviarCorreo;
      delete require.cache[controllerPath];
    }
  };
}

test('enviarCorreoReserva sends a reservation email', async () => {
  const sentMessages = [];
  const { controller, restore } = loadControllerWithMailer(async (message) => {
    sentMessages.push(message);
  });

  try {
    const res = createResponse();
    await controller.enviarCorreoReserva(
      {
        body: {
          email: 'ana@example.com',
          nombre: 'Ana',
          servicio: 'Hotel',
          fecha: '2026-07-16 10:00'
        }
      },
      res
    );

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { message: 'Correo enviado correctamente' });
    assert.equal(sentMessages[0].to, 'ana@example.com');
    assert.match(sentMessages[0].subject, /Reserva/);
    assert.match(sentMessages[0].html, /Hotel/);
  } finally {
    restore();
  }
});

test('enviarCorreoCancelacion returns 500 when mailer fails', async () => {
  const { controller, restore } = loadControllerWithMailer(async () => {
    throw new Error('smtp failed');
  });

  try {
    const res = createResponse();
    await controller.enviarCorreoCancelacion(
      {
        body: {
          email: 'ana@example.com',
          nombre: 'Ana',
          servicio: 'Hotel',
          fecha: '2026-07-16 10:00'
        }
      },
      res
    );

    assert.equal(res.statusCode, 500);
  } finally {
    restore();
  }
});

test('enviarCorreoCancelacion sends a cancellation email', async () => {
  const sentMessages = [];
  const { controller, restore } = loadControllerWithMailer(async (message) => {
    sentMessages.push(message);
  });

  try {
    const res = createResponse();
    await controller.enviarCorreoCancelacion(
      {
        body: {
          email: 'ana@example.com',
          nombre: 'Ana',
          servicio: 'Hotel',
          fecha: '2026-07-16 10:00'
        }
      },
      res
    );

    assert.equal(res.statusCode, 200);
    assert.match(res.body.message, /Correo de cancelaci/);
    assert.equal(sentMessages[0].to, 'ana@example.com');
    assert.match(sentMessages[0].subject, /Cancelaci/);
  } finally {
    restore();
  }
});

test('enviarCorreoReserva returns 500 when mailer fails', async () => {
  const { controller, restore } = loadControllerWithMailer(async () => {
    throw new Error('smtp failed');
  });

  try {
    const res = createResponse();
    await controller.enviarCorreoReserva(
      {
        body: {
          email: 'ana@example.com',
          nombre: 'Ana',
          servicio: 'Hotel',
          fecha: '2026-07-16 10:00'
        }
      },
      res
    );

    assert.equal(res.statusCode, 500);
  } finally {
    restore();
  }
});
