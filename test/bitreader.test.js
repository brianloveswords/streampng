var test = require('tap').test;
var BitReader = require('../lib/bitreader.js');
var assert = require('assert');

var data = Buffer('where did you get your _____?');
test('BitReader#eat', function (t) {
  t.test('returns the right values after eating', function (t) {
    var p = new BitReader(data);
    t.same(p.eat(1), Buffer('w'));
    t.same(p.eat(2), Buffer('he'));
    t.same(p.eat(4), Buffer('re d'));
    t.end();
  });

  t.test('updates the length after eating', function (t) {
    var p = new BitReader(data);
    p.eat(10);
    t.same(p.position(), 10);
    t.end();
  });

  t.test('returns sane values when out of bounds', function (t) {
    var p = new BitReader(data);
    t.same(p.eat(Buffer.poolSize), data);
    t.same(p.eat(Buffer.poolSize), null);
    t.end();
  });

  t.test('can cast values to ints', function (t) {
    p = new BitReader(Buffer([0x10, 0x80]));
    t.same(p.eat(2, { integer: true }), 4224);

    p = new BitReader(Buffer([0x30, 0x20, 0x10, 0x80]));
    t.same(p.eatInt(4), 807407744);
    t.end();

    var p = new BitReader(Buffer([0xf6]));
    t.same(p.eatUInt(1), 246);

    p = new BitReader(Buffer([0xff, 0xff, 0xd8, 0xf1]));
    console.dir(p.eatInt(4)); p.rewind();
  });
  t.end();
});

test('BitReader#eatBool', function (t) {
  t.same(true, (new BitReader(Buffer([0x01])).eatBool()));
  t.same(false, (new BitReader(Buffer([0x00])).eatBool()));
  t.end();
});


test('BitReader#rewind', function (t) {
  var p = new BitReader(data);
  p.eat(9);
  p.rewind(3);
  t.same(p.position(), 6, 'should be 9 - 3');
  t.same(p.eat(3), Buffer('did'), 'eating 3 should return `did`');
  t.end();
});

test('BitReader#peak', function (t) {
  var p = new BitReader(data);
  t.same(p.peaks(), 'w', 'should be the first character');

  p.eat(1024);
  t.same(p.peak(), null, 'should be null');

  p.rewind();
  t.same(p.peak(5), Buffer('where'));
  t.end();
});


test('BitReader#eatString', function (t) {
  var data = Buffer('what the who');
  data[4] = 0; data[8] = 0;
  t.test('eats up until it finds a null byte', function (t) {
    var p = new BitReader(data);
    t.same(p.eatString(), 'what');
    t.same(p.eatString(), 'the');
    t.same(p.eatString(), 'who');
    t.end();
  });

  t.test('does not fuck up when it cannot eat', function (t) {
    var p = new BitReader(data);
    p.eat(1024);
    t.same(p.eatString(), null);
    t.end();
  });

  t.test('includes null byte in offset but not string', function (t) {
    var p = new BitReader(data);
    t.same(p.eatString(), 'what');
    t.same(p.eat(3), Buffer('the'));
    t.end();
  });

  t.end();
});

test('BitReader#eatRemaining', function (t) {
  var string = 'how awesome is that?';
  var data = Buffer(string);
  t.test('finish eating the buffer', function (t) {
    var p = new BitReader(data);
    t.same(p.eatRemaining(), Buffer(string));
    t.same(p.eatRemaining(), null);
    p.rewind(5);
    t.same(p.eatRemaining(), Buffer('that?'));
    t.end();
  });

  t.test('digest in chunks', function (t) {
    var p = new BitReader(data);
    var chunks = p.eatRest({ chunkSize: 2 });
    var num = Math.ceil(data.length / 2);
    t.same(chunks.length, num, 'should have right amount of chunks');
    t.same(chunks[0], Buffer('ho'), 'first chunk should match');
    t.end();
  });


  t.end();
});

test('BitReader#write', function (t) {
  var string = 'lol';
  var data = Buffer(string);
  var moar = Buffer('lercoaster');

  t.test('appends another buffer to the internal buffer', function (t) {
    var p = new BitReader();
    t.same(p.getBuffer(), Buffer(''));
    t.same(p.write(data), Buffer('lol'));
    t.same(p.write(moar), Buffer('lollercoaster'));
    t.end();
  });

  t.end();
});

test('BitReader#remaining', function (t) {
  var data = Buffer('lollerskates');
  var p = new BitReader(data);

  t.same(p.remaining(), data.length);
  p.eat(6);
  t.same(p.remaining(), data.length - 6);
  t.end();
});
