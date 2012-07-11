var B = require('buffer').Buffer;
var test = require('tap').test;
var Parser = require('../lib/parser.js');
var assert = require('assert');

var data = Buffer('where did you get your _____?');
test('Parser#eat', function (t) {
  t.test('returns the right values after eating', function (t) {
    var p = new Parser(data);
    t.same(p.eat(1), B('w'));
    t.same(p.eat(2), B('he'));
    t.same(p.eat(4), B('re d'));
    t.end();
  });

  t.test('updates the length after eating', function (t) {
    var p = new Parser(data);
    p.eat(10);
    t.same(p.position(), 10);
    t.end();
  });

  t.test('returns sane values when out of bounds', function (t) {
    var p = new Parser(data);
    t.same(p.eat(Buffer.poolSize), data);
    t.same(p.eat(Buffer.poolSize), null);
    t.end();
  });

  t.end();
});

test('Parser#rewind', function (t) {
  var p = new Parser(data);
  p.eat(9);
  p.rewind(3);
  t.same(p.position(), 6, 'should be 9 - 3');
  t.same(p.eat(3), B('did'), 'eating 3 should return `did`');
  t.end();
});

test('Parser#peak', function (t) {
  var p = new Parser(data);
  t.same(p.peaks(), 'w', 'should be the first character');

  p.eat(1024);
  t.same(p.peak(), null, 'should be null');

  p.rewind();
  t.same(p.peak(5), B('where'));
  t.end();
});


test('Parser#eatString', function (t) {
  var data = B('what the who');
  data[4] = 0; data[8] = 0;
  t.test('eats up until it finds a null byte', function (t) {
    var p = new Parser(data);
    t.same(p.eatString(), 'what');
    t.same(p.eatString(), 'the');
    t.same(p.eatString(), 'who');
    t.end();
  });

  t.test('does not fuck up when it cannot eat', function (t) {
    var p = new Parser(data);
    p.eat(1024);
    t.same(p.eatString(), null);
    t.end();
  });

  t.test('includes null byte in offset but not string', function (t) {
    var p = new Parser(data);
    t.same(p.eatString(), 'what');
    t.same(p.eat(3), B('the'));
    t.end();
  });

  t.end();
});

test('Parser#eatRemaining', function (t) {
  var string = 'how awesome is that?';
  var data = Buffer(string);
  t.test('finish eating the buffer', function (t) {
    var p = new Parser(data);
    t.same(p.eatRemaining(), B(string));
    t.same(p.eatRemaining(), null);
    p.rewind(5);
    t.same(p.eatRemaining(), B('that?'));
    t.end();
  });

  t.test('digest in chunks', function (t) {
    var p = new Parser(data);
    var chunks = p.eatRest({ chunkSize: 2 });
    var num = Math.ceil(data.length / 2);
    t.same(chunks.length, num, 'should have right amount of chunks');
    t.same(chunks[0], B('ho'), 'first chunk should match');
    t.end();
  });


  t.end();
});

test('Parser#write', function (t) {
  var string = 'lol';
  var data = Buffer(string);
  var moar = Buffer('lercoaster');

  t.test('appends another buffer to the internal buffer', function (t) {
    var p = new Parser();
    t.same(p.getBuffer(), B(''));
    t.same(p.write(data), B('lol'));
    t.same(p.write(moar), B('lollercoaster'));
    t.end();
  });

  t.end();
});

test('Parser#remaining', function (t) {
  var data = B('lollerskates');
  var p = new Parser(data);

  t.same(p.remaining(), data.length);
  p.eat(6);
  t.same(p.remaining(), data.length - 6);
  t.end();
});
