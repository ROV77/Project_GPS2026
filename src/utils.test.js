const { sumar } = require('./utils');

test('suma 1 + 2 para ser igual a 3', () => {
  expect(sumar(1, 2)).toBe(3);
});
