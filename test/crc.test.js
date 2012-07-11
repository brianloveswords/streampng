var crc32 = require('../lib/util.js').crc32;
var test = require('tap').test;

test('simple crc32 is no problem', function (t) {
  var input = Buffer('hey sup bros');
  var expected = Buffer([0x47, 0xfa, 0x55, 0x70]);
  t.same(crc32(input), expected);
  t.end();
});

test('another simple one', function (t) {
  var input = Buffer('IEND');
  var expected = Buffer([0xae, 0x42, 0x60, 0x82]);
  t.same(crc32(input), expected);
  t.end();
});

test('slightly more complex', function (t) {
  var input = Buffer([0x00, 0x00, 0x00]);
  var expected = Buffer([0xff, 0x41, 0xd9, 0x12]);
  t.same(crc32(input), expected);
  t.end();
});

test('complex crc32 gets calculated like a champ', function (t) {
  var input = Buffer('शीर्षक');
  var expected = Buffer([0x17, 0xb8, 0xaf, 0xf1]);
  t.same(crc32(input), expected);
  t.end();
});
