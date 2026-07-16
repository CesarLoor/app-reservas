import test from 'node:test';
import assert from 'node:assert/strict';

import { HOTELES } from './hoteles.ts';

test('HOTELES exposes unique hotel ids with required display fields', () => {
  const ids = new Set(HOTELES.map((hotel) => hotel.id));

  assert.equal(ids.size, HOTELES.length);
  assert.ok(HOTELES.length > 0);

  for (const hotel of HOTELES) {
    assert.ok(hotel.nombre);
    assert.ok(hotel.ciudad);
    assert.match(hotel.imagen, /^\/hotels\/.+\.jpg$/);
  }
});
