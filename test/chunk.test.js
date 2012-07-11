var crc32 = require('../lib/util.js').crc32;
var B = require('buffer').Buffer;
var test = require('tap').test;
var Chunk = require('../lib/chunk.js');
var pngs = require('./testpngs.js');

var testChunk = B.concat([B([0, 0, 0, 0]), B('IEND'), crc32('IEND')]);

function m(str) { return str + ' should match'; }

test('basic chunk parsing', function (t) {
  var c = new Chunk(testChunk);
  t.same(c.type, 'IEND', m('type'));
  t.same(c.length , 0, m('length'));
  t.same(c._rawData, Buffer(0), m('_rawData'));
  t.same(c.crc, crc32('IEND'), m('crc32'));
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
    t.same(chunk.keyword, valid.keyword, m('keyword'));
    t.same(chunk.text, valid.text, m('text'));
  });
});

test('zTXt', function (t) {
  var chunks = pngs.valid.zTXt;
  t.plan(4 * chunks.length);
  chunks.forEach(function (valid) {
    var chunk = new Chunk.zTXt(valid.buffer);
    t.same(chunk.keyword, valid.keyword, m('keyword'));
    t.same(chunk.compressionMethod, valid.compressionMethod, m('compression method'));
    t.same(chunk.compressedText, valid.compressedText, m('compressed text'));
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
    t.same(chunk.keyword, valid.keyword, m('keyword'));
    t.same(chunk.compressed, valid.compressed, m('compressed boolean'));
    chunk.inflateText(function (err, text) {
      t.same(chunk.text, text, m('inflated text'));
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
        t.fail(m('colours'));
    })
    t.pass(m('colours'));
  });
});

test('cHRM', function (t) {
  var chunks = pngs.valid.cHRM;
  t.plan(4 * chunks.length);
  chunks.forEach(function (valid) {
    var chunk = new Chunk.cHRM(valid.buffer);
    t.ok(chunk.whitePoint.equals(valid.whitePoint), m('whitePoint'));
    t.ok(chunk.red.equals(valid.red), m('red point'));
    t.ok(chunk.green.equals(valid.green), m('green point'));
    t.ok(chunk.blue.equals(valid.blue), m('blue point'));
  });
});

test('gAMA', function (t) {
  var chunks = pngs.valid.gAMA;
  t.plan(1 * chunks.length);
  chunks.forEach(function (valid) {
    var chunk = new Chunk.gAMA(valid.buffer);
    t.same(chunk.gamma, valid.gamma, 'gamma should match');
  });
});

test('tRNS', function (t) {
  var chunks = pngs.valid.tRNS;
  chunks.forEach(function (valid) {
    var chunk = new Chunk.tRNS(valid.buffer, valid);
    if (valid.grey)
      t.same(chunk.grey, valid.grey, 'grey sample value should match');
    else if (valid.red) {
      t.same(chunk.red, valid.red, 'red sample value should match');
      t.same(chunk.green, valid.green, 'green sample value should match');
      t.same(chunk.blue, valid.blue, 'blue sample value should match');
    }
    else
      t.same(chunk.palette, valid.palette)
  });
  t.end();
});

test('iCCP', function (t) {
  var valid = pngs.valid.iCCP[0];
  var chunk = new Chunk.iCCP(valid.buffer);
  t.same(chunk.profileName, valid.profileName, m('profileName'));
  t.same(chunk.compressionMethod, valid.compressionMethod, m('compression method'));
  t.same(chunk.compressedProfile, valid.compressedProfile, m('compressed profile'));
  chunk.inflateProfile(function (err, data) {
    t.ok(data, 'should be able to inflate profile');
    t.end();
  });
});

