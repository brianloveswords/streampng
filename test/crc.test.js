var crc32 = require('../lib/util.js').crc32;
var test = require('tap').test;

var known = {
  input: 'IEND',
  output: Buffer([0xAE, 0x42, 0x60, 0x82])
}

test('crc32 gets calculated like a champ', function (t) {
  var out = crc32(known.input);
  t.same(out, known.output);
  t.end();
});
