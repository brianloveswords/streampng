var crc32 = require('../lib/util.js').crc32;
var B = require('buffer').Buffer;
var test = require('tap').test;
var Chunk = require('../lib/chunk.js');

var testChunk = B.concat([B([0, 0, 0, 0]), B('IEND'), crc32('IEND')]);

test('basic chunk parsing', function (t) {
  var c = new Chunk(testChunk);
  t.same(c.type, 'IEND');
  t.same(c.length , 0);
  t.same(c.data, Buffer(0));
  t.same(c.crc, crc32('IEND'));
  t.end();
});

test('bad chunk', function (t) {
  t.plan(1);
  var badChunk = B(32);
  badChunk.fill(16);
  try {
    var c = new Chunk(badChunk);
  } catch(err) {
    t.pass('caught expected error');
  }
  t.end();
});

