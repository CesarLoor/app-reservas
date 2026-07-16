const test = require('node:test');
const assert = require('node:assert/strict');

const nodemailer = require('nodemailer');

test('enviarCorreo delegates to the configured nodemailer transporter', async () => {
  const originalCreateTransport = nodemailer.createTransport;
  const originalEmailUser = process.env.EMAIL_USER;
  const originalEmailPass = process.env.EMAIL_PASS;
  const mailerPath = require.resolve('./mailer');
  const sentMessages = [];

  try {
    process.env.EMAIL_USER = 'reservas@example.com';
    process.env.EMAIL_PASS = 'secret';
    nodemailer.createTransport = (config) => {
      assert.equal(config.auth.user, 'reservas@example.com');
      assert.equal(config.auth.pass, 'secret');
      return {
        sendMail: async (message) => {
          sentMessages.push(message);
          return { accepted: [message.to] };
        }
      };
    };
    delete require.cache[mailerPath];

    const { enviarCorreo } = require('./mailer');
    const result = await enviarCorreo({
      to: 'ana@example.com',
      subject: 'Reserva',
      html: '<p>Confirmada</p>'
    });

    assert.deepEqual(result, { accepted: ['ana@example.com'] });
    assert.deepEqual(sentMessages[0], {
      from: '"Sistema de Reservas" <reservas@example.com>',
      to: 'ana@example.com',
      subject: 'Reserva',
      html: '<p>Confirmada</p>'
    });
  } finally {
    nodemailer.createTransport = originalCreateTransport;
    process.env.EMAIL_USER = originalEmailUser;
    process.env.EMAIL_PASS = originalEmailPass;
    delete require.cache[mailerPath];
  }
});
