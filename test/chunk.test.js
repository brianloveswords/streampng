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
  chunks.forEach(function (valid) {
    var chunk = new Chunk.tEXt(valid.buffer);
    t.same(chunk.keyword, valid.keyword);
    t.same(chunk.text, valid.text);
  });
});

test('zTXt', function (t) {
  var chunks = pngs.valid.zTXt;
  t.plan(4 * chunks.length);
  chunks.forEach(function (valid) {
    var chunk = new Chunk.zTXt(valid.buffer);
    t.same(chunk.keyword, valid.keyword);
    t.same(chunk.compressionMethod, valid.compressionMethod);
    t.same(chunk.compressedText, valid.compressedText);
    chunk.inflateText(function (err, text) {
      t.same(text, valid.text);
    });
  });
});

test('iTXt', function (t) {
  var chunks = pngs.valid.iTXt;
  t.plan(3 * chunks.length);
  chunks.forEach(function (valid) {
    var chunk = new Chunk.iTXt(valid.buffer);
    t.same(chunk.keyword, valid.keyword);
    t.same(chunk.compressed, valid.compressed);
    chunk.inflateText(function (err, text) {
      t.same(chunk.text, text);
    });
  });
});

test('PLTE', function (t) {
  var chunks = pngs.valid.PLTE;
  t.plan(1 * chunks.length);
  chunks.forEach(function (valid) {
    var chunk = new Chunk.PLTE(valid.buffer);
    valid.colours.forEach(function (colour, i) {
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
  chunks.forEach(function (valid) {
    var chunk = new Chunk.cHRM(valid.buffer);
    t.ok(chunk.whitePoint.equals(valid.whitePoint), 'should have same whitePoint');
    t.ok(chunk.red.equals(valid.red), 'should have same red point');
    t.ok(chunk.green.equals(valid.green), 'should have same green point');
    t.ok(chunk.blue.equals(valid.blue), 'should have same blue point');
  });
});

test('gAMA', function (t) {
  var chunks = pngs.valid.gAMA;
  t.plan(1 * chunks.length);
  chunks.forEach(function (valid) {
    var chunk = new Chunk.gAMA(valid.buffer);
    t.same(chunk.gamma, valid.gamma);
  });
});
