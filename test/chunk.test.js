var B = require('buffer').Buffer;
var crc32 = require('buffer-crc32');
var test = require('tap').test;
var Chunk = require('../lib/chunk.js');
var pngs = require('./testpngs.js');

var testChunk = B.concat([B([0, 0, 0, 0]), B('IEND'), crc32('IEND')]);

function msgr(c) {
  return function m(str) { return c.file + ': ' + str + ' should match' }
}

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
  chunks.forEach(function (valid) {
    var m = msgr(valid);
    var chunk = new Chunk(valid.buffer, valid);
    t.same(chunk.keyword, valid.keyword, m('keyword'));
    t.same(chunk.text, valid.text, m('text'));
    t.same(chunk.crcCalculated(), chunk.crc, m('crc checks out'));
  });
  t.end();
});

test('zTXt', function (t) {
  var chunks = pngs.valid.zTXt;
  t.plan(5 * chunks.length);
  chunks.forEach(function (valid) {
    var m = msgr(valid);
    var chunk = new Chunk(valid.buffer, valid);
    t.same(chunk.keyword, valid.keyword, m('keyword'));
    t.same(chunk.compressionMethod, valid.compressionMethod, m('compression method'));
    t.same(chunk.compressedText, valid.compressedText, m('compressed text'));
    t.same(chunk.crcCalculated(), chunk.crc, m('crc'));
    chunk.inflateText(function (err, text) {
      t.same(text, valid.text);
    });
  });
});

test('iTXt', function (t) {
  var chunks = pngs.valid.iTXt;
  t.plan(3 * chunks.length);
  chunks.forEach(function (valid) {
    var m = msgr(valid);
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
    var m = msgr(valid);
    var chunk = new Chunk(valid.buffer, valid);
    valid.colours.forEach(function (colour, i) {
      var cc = chunk.colours[i];
      if (!colour.equals(cc))
        t.fail(m('colours'));
    })
    t.same(chunk.crcCalculated(), chunk.crc, m('crc'));
  });
});

test('cHRM', function (t) {
  var chunks = pngs.valid.cHRM;
  chunks.forEach(function (valid) {
    var m = msgr(valid);
    var chunk = new Chunk(valid.buffer);
    t.ok(chunk.whitePoint.equals(valid.whitePoint), m('whitePoint'));
    t.ok(chunk.red.equals(valid.red), m('red point'));
    t.ok(chunk.green.equals(valid.green), m('green point'));
    t.ok(chunk.blue.equals(valid.blue), m('blue point'));
    t.same(chunk.crcCalculated(), chunk.crc, m('crc'));
  });
  t.end();
});

test('gAMA', function (t) {
  var chunks = pngs.valid.gAMA;
  chunks.forEach(function (valid) {
    var m = msgr(valid);
    var chunk = new Chunk(valid.buffer);
    t.same(chunk.gamma, valid.gamma, m('gamma'));
    t.same(chunk.crcCalculated(), chunk.crc, m('crc'));
  });
  t.end();
});

test('tRNS', function (t) {
  var chunks = pngs.valid.tRNS;
  chunks.forEach(function (valid) {
    var m = msgr(valid);
    var chunk = new Chunk(valid.buffer, valid);
    var colour = valid.colourType;

    if (colour === 0)
      t.same(chunk.grey, valid.grey, m('grey sample value'));

    else if (colour === 2) {
      t.same(chunk.red, valid.red, m('red sample value'));
      t.same(chunk.green, valid.green, m('green sample value'));
      t.same(chunk.blue, valid.blue, m('blue sample value'));
    }

    else
      t.same(chunk.palette, valid.palette)
    t.same(chunk.crcCalculated(), chunk.crc, m('crc'));
  });
  t.end();
});

test('iCCP', function (t) {
  var valid = pngs.valid.iCCP[0];
  var chunk = new Chunk(valid.buffer, valid);
  var m = msgr(valid);
  t.same(chunk.profileName, valid.profileName, m('profileName'));
  t.same(chunk.compressionMethod, valid.compressionMethod, m('compression method'));
  t.same(chunk.compressedProfile, valid.compressedProfile, m('compressed profile'));
  chunk.inflateProfile(function (err, data) {
    t.ok(data, 'should be able to inflate profile');
    t.end();
  });
});

test('bKGD', function (t) {
  var chunks = pngs.valid.bKGD;
  chunks.forEach(function (valid) {
    var m = msgr(valid);
    var chunk = new Chunk(valid.buffer, valid);
    t.same(chunk.crcCalculated(), chunk.crc, m('crc checks out'));

    var colour = valid.colourType;
    if (colour === 0 || colour === 4)
      t.same(chunk.greyscale, valid.greyscale, m('greyscale'));

    else if (colour === 2 || colour === 6) {
      t.same(chunk.red, valid.red, m('red'));
      t.same(chunk.green, valid.green, m('green'));
      t.same(chunk.blue, valid.blue, m('blue'));
    }

    else // if (colour === 3)
      t.same(chunk.paletteIndex, valid.paletteIndex, m('paletteIndex'));
  });
  t.end();
});

test('pHYs', function (t) {
  var chunks = pngs.valid.pHYs;
  chunks.forEach(function (valid) {
    var m = msgr(valid);
    var chunk = new Chunk(valid.buffer, valid);
    t.same(chunk.unitSpecifier, valid.unitSpecifier, m('unit specifier'));
    t.ok(chunk.pixelsPerUnit.equals(valid.pixelsPerUnit), m('pixels per unit'));
    t.same(chunk.crcCalculated(), chunk.crc, m('crc'));
  });
  t.end();
});

test('sRGB', function (t) {
  var chunks = pngs.valid.sRGB;
  chunks.forEach(function (valid) {
    var m = msgr(valid);
    var chunk = new Chunk(valid.buffer, valid);
    t.same(chunk.crcCalculated(), chunk.crc, m('crc'));
    t.same(chunk.renderingIntent, valid.renderingIntent, m('rendering intent'));
  });
  t.end();
});

test('sBIT', function (t) {
  var chunks = pngs.valid.sBIT;
  chunks.forEach(function (valid) {
    var m = msgr(valid);
    var chunk = new Chunk.sBIT(valid.buffer, valid);
    var colour = valid.colourType;
    if (colour === 0)
      t.same(chunk.greyscale, valid.greyscale, m('greyscale bits'));

    else if (colour === 2 || colour === 3) {
      t.same(chunk.red, valid.red, m('red bits'));
      t.same(chunk.green, valid.green, m('green bits'));
      t.same(chunk.blue, valid.blue, m('blue bits'));
    }

    else if (colour === 4) {
      t.same(chunk.greyscale, valid.greyscale, m('greyscale bits'));
      t.same(chunk.alpha, valid.alpha, m('alpha bits'));
    }

    else if (colour === 6) {
      t.same(chunk.red, valid.red, m('red bits'));
      t.same(chunk.green, valid.green, m('green bits'));
      t.same(chunk.blue, valid.blue, m('blue bits'));
      t.same(chunk.alpha, valid.alpha, m('alpha bits'));
    }
  });
  t.end();
});

test('hIST', function (t) {
  var chunks = pngs.valid.hIST;
  chunks.forEach(function (valid) {
    var m = msgr(valid);
    var chunk = new Chunk(valid.buffer, valid);
    t.same(chunk.frequencies, valid.frequencies, m('frequencies'));
    t.same(chunk.crcCalculated(), chunk.crc, m('crc'));
  });
  t.end();
});

test('sPLT', function (t) {
  var chunks = pngs.valid.sPLT;
  chunks.forEach(function (valid) {
    var m = msgr(valid);
    var chunk = new Chunk(valid.buffer);
    t.same(chunk.crcCalculated(), chunk.crc, m('crc'));
    t.same(chunk.paletteName, valid.paletteName, m('palette name'));
    t.same(chunk.sampleDepth, valid.sampleDepth, m('sample depth'));
    t.same(chunk.palette.length, valid.entries, m('number of entries'));
  });
  t.end();
});

test('tIME', function (t) {
  var chunks = pngs.valid.tIME;
  chunks.forEach(function (valid) {
    var m = msgr(valid);
    var chunk = new Chunk.tIME(valid.buffer, valid);
    var date = new Date(valid.year, valid.month, valid.day, valid.hour, valid.minute, valid.second);
    t.same(chunk.year, valid.year, m('year'));
    t.same(chunk.month, valid.month, m('month'));
    t.same(chunk.day, valid.day, m('day'));
    t.same(chunk.hour, valid.hour, m('hour'));
    t.same(chunk.minute, valid.minute, m('minute'));
    t.same(chunk.second, valid.second, m('second'));
    t.same(chunk.date, date, m('date'));
  });
  t.end();
});

test('creating chunks from thin air', function (t) {
  t.test('tIME', function (t) {
    // var chunk = new Chunk.tIME({
    //   year: 2000,
    //   month: 1,
    //   day: 1,
    //   hour: 12,
    //   minute: 34,
    //   second: 56
    // });
    var length = B([0x00, 0x00, 0x00, 0x08]);
    var type = B('tIME');
    var data = B([0x07, 0xd0, 0x01, 0x01, 0x0c, 0x22, 0x38]);
    var crc = crc32(B.concat([type, data]))
    var validBuffer = B.concat([length, type, data, crc]);

    console.dir(validBuffer);

    t.end();
  });



  t.end();
});
