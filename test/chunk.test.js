var crc32 = require('buffer-crc32');
var test = require('tap').test;
var Chunk = require('../lib/chunk.js');
var pngs = require('./testpngs.js');

var testChunk = Buffer.concat([
  Buffer([0, 0, 0, 0]),
  Buffer('IEND'),
  crc32('IEND')
]);

function msgr(c) { return function m(str) { return c.file + ': ' + str + ' should match' }}
function m(str) { return str + ' should match'; }
function chunktest(type, fields, crc, additional) {
  if (typeof crc === 'function')
    additional = crc, crc = true;

  crc = typeof crc === 'undefined' ? true : crc;

  var chunks = pngs.valid[type];
  if (!chunks) throw new Error(type + ' not defined in testpngs');
  test(type, function (t) {
    chunks.forEach(function (valid) {
      var m = msgr(valid);
      var chunk = new Chunk(valid.buffer, valid);
      fields.forEach(function (f) {
        t.same(chunk[f], valid[f], m(f));
      });

      if (crc)
        t.same(chunk.getComputedCrc(), chunk.crc, m('crc'));

      if (additional)
        t.test(type + ' additional tests', function (t) { additional(t, m, chunk, valid); });
    });
    t.end();
  });
}

test('basic chunk parsing', function (t) {
  var c = new Chunk(testChunk);
  t.same(c.type, 'IEND', m('type'));
  t.same(c._rawData, Buffer(0), m('_rawData'));
  t.same(c.crc, crc32('IEND'), m('crc32'));
  t.end();
});

test('bad chunk', function (t) {
  var badChunk = Buffer(32);
  badChunk.fill(16);
  try {
    var c = new Chunk(badChunk);
  } catch(err) {
    t.pass('caught expected error');
  }
  t.end();
});
chunktest('IHDR', ['width', 'height', 'bitDepth', 'colourType', 'compressionMethod', 'filterMethod', 'interlaceMethod'], false);
chunktest('tEXt', ['keyword', 'text']);
chunktest('zTXt', ['keyword', 'compressionMethod', 'compressedText'], function (t, m, chunk, valid) {
  chunk.inflate(function (err, text) {
    t.same(text, valid.text, m('inflated text'));
    t.end();
  });
});
chunktest('iTXt', ['keyword', 'compressed', 'compressionMethod'], function (t, m, chunk, valid) {
  chunk.inflate(function (err, text) {
    t.same(text, valid.text, m('inflated text'));
    t.end();
  });
});
chunktest('PLTE', ['colours']);
chunktest('cHRM', ['whitePoint', 'red', 'green', 'blue']);
chunktest('gAMA', ['gamma']);
chunktest('tRNS', ['grey', 'red', 'blue', 'palette'])
chunktest('iCCP', ['profileName', 'compressionMethod', 'compressedProfile'], function (t, m, chunk, valid) {
  chunk.inflate(function (err, data) {
    t.ok(data, 'should be able to inflate profile');
    t.end();
  });
});
chunktest('bKGD', ['greyscale', 'red', 'green', 'blue', 'paletteIndex']);
chunktest('pHYs', ['unitSpecifier', 'pixelsPerUnit']);
chunktest('sRGB', ['renderingIntent']);
chunktest('sBIT', ['greyscale', 'red', 'green', 'blue', 'alpha']);
chunktest('hIST', ['frequencies']);
chunktest('sPLT', ['paletteName', 'sampleDepth'], function (t, m, chunk, valid) {
  t.same(chunk.palette.length, valid.entries, m('number of entries'));
  t.end();
});
chunktest('tIME', ['year', 'month', 'day', 'minute', 'second', 'date']);
chunktest('oFFs', ['position', 'unitSpecifier'], false)
chunktest('pCAL', ['name', 'originalZero, originalMaximum', 'equationType', 'parameters'], false);
chunktest('sCAL', ['unitSpecifier', 'width', 'height'], false);
chunktest('gIFg', ['disposalMethod', 'userInput', 'delay'], false);
chunktest('gIFx', ['appIdentifier', 'authCode', 'appData'], false);
chunktest('sTER', ['mode'], false);
chunktest('IDAT', ['data']);
chunktest('IEND', []);

function creationtest(type) {
  test('creating ' + type, function (t) {
    var chunks = pngs.valid[type];
    if (!chunks) throw new Error('could not find valid chunk by name: ' + type);

    chunks.forEach(function (valid) {
      t.test('create', function (t) {
        var m = msgr(valid);
        var chunk = new Chunk[type](valid);
        chunk.out(function (buf) {
          t.same(buf, valid.buffer, m('buffers'));
          t.end();
        });
      })
    });
  });
}
creationtest('IDAT');
creationtest('IHDR');
creationtest('IEND');
creationtest('tIME');
creationtest('PLTE');
creationtest('tEXt');
creationtest('zTXt');
creationtest('iTXt');
creationtest('cHRM');
creationtest('gAMA');
creationtest('tRNS');
creationtest('iCCP');
creationtest('bKGD');
creationtest('pHYs');
creationtest('sRGB');
creationtest('sBIT');
creationtest('hIST');
// creationtest('sPLT');
creationtest('oFFs');
creationtest('pCAL');
creationtest('sCAL');
creationtest('gIFg');
creationtest('gIFx');

test('Chunk#set', function (t) {
  var textChunk = Chunk.tEXt({ keyword: 'wut' });
  textChunk.set('text', 'lol');
  t.same(textChunk.text, 'lol');
  t.end();
});

test('Chunk#get', function (t) {
  var textChunk = Chunk.tEXt({ keyword: 'wut' });
  t.same(textChunk.get('keyword'), 'wut');
  t.end();
});
