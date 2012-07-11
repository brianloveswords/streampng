var crc32 = require('../lib/util.js').crc32;
var B = require('buffer').Buffer;
var test = require('tap').test;
var Chunk = require('../lib/chunk.js');
var pngs = require('./testpngs.js');

var testChunk = B.concat([B([0, 0, 0, 0]), B('IEND'), crc32('IEND')]);

test('basic chunk parsing', function (t) {
  var c = new Chunk(testChunk);
  t.same(c.type, 'IEND');
  t.same(c.length , 0);
  t.same(c._rawData, Buffer(0));
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

test('tEXt', function (t) {
  var chunks = pngs.valid.tEXt;
  t.plan(2 * chunks.length);
  chunks.forEach(function (testChunk) {
    var chunk = new Chunk.tEXt(testChunk.buffer);
    t.same(testChunk.keyword, chunk.keyword);
    t.same(testChunk.text, chunk.text);
  });
});

test('zTXt', function (t) {
  var chunks = pngs.valid.zTXt;
  t.plan(4 * chunks.length);
  chunks.forEach(function (testChunk) {
    var chunk = new Chunk.zTXt(testChunk.buffer);
    t.same(testChunk.keyword, chunk.keyword);
    t.same(testChunk.compressionMethod, chunk.compressionMethod);
    t.same(testChunk.compressedText, chunk.compressedText);
    chunk.inflateText(function (err, text) {
      t.same(testChunk.text, text);
    });
  });
});

test('iTXt', function (t) {
  var chunks = pngs.valid.iTXt;
  t.plan(3 * chunks.length);
  chunks.forEach(function (testChunk) {
    var chunk = new Chunk.iTXt(testChunk.buffer);
    t.same(testChunk.keyword, chunk.keyword);
    t.same(testChunk.compressed, chunk.compressed);
    chunk.inflateText(function (err, text) {
      t.same(testChunk.text, text);
    });
  });
});

test('PLTE', function (t) {
  var chunks = pngs.valid.PLTE;
  t.plan(1 * chunks.length);
  chunks.forEach(function (testChunk) {
    var chunk = new Chunk.PLTE(testChunk.buffer);
    testChunk.colours.forEach(function (colour, i) {
      var cc = chunk.colours[i];
      if (!colour.equals(cc))
        t.fail();
    })
    t.pass('should match colours');
  });
});

test('cHRM', function (t) {
  var chunks = pngs.valid.cHRM;
  t.plan(4 * chunks.length);
  chunks.forEach(function (testChunk) {
    var chunk = new Chunk.cHRM(testChunk.buffer);
    t.ok(chunk.whitePoint.equals(testChunk.whitePoint), 'should have same whitePoint');
    t.ok(chunk.red.equals(testChunk.red), 'should have same red point');
    t.ok(chunk.green.equals(testChunk.green), 'should have same green point');
    t.ok(chunk.blue.equals(testChunk.blue), 'should have same blue point');
  });
});
