var Parser = require('../lib/parser.js');
var assert = require('assert');

var data = Buffer('where did you get your _____?');
describe('Parser#eat', function () {
  it('returns the right values after eating', function () {
    var p = new Parser(data);
    assert.equal(p.eat(1), 'w');
    assert.equal(p.eat(2), 'he');
    assert.equal(p.eat(4), 're d');
  });

  it('updates the length after eating', function () {
    var p = new Parser(data);
    p.eat(10);
    assert.equal(p.position(), 10);
  });

  it('returns sane values when out of bounds', function () {
    var p = new Parser(data);
    assert.equal(p.eat(Buffer.poolSize), data.toString());
    assert.equal(p.eat(Buffer.poolSize), null);
  });
});

describe('Parser#rewind', function () {
  it('rewinds the offset', function () {
    var p = new Parser(data);
    p.eats(9);
    p.rewind(3);
    assert.equal(p.position(), 6);
    assert.equal(p.eats(3), 'did');
  });
});

describe('Parser#peak', function () {
  it('checks what the character is but does not move offset', function () {
    var p = new Parser(data);
    assert.equal(p.peaks(), 'w');
  });
  it('does not fuck up when peaking past the end', function () {
    var p = new Parser(data);
    p.eat(1024);
    assert.equal(p.peak(), null);
  });
});

describe('Parser#eatString', function () {
  var data = Buffer('what the who');
  data[4] = 0; data[8] = 0;
  it('eats up until it finds a null byte', function () {
    var p = new Parser(data);
    assert.equal(p.eatString(), 'what');
    assert.equal(p.eatString(), 'the');
    assert.equal(p.eatString(), 'who');
  });

  it('does not fuck up when it cannot eat', function () {
    var p = new Parser(data);
    p.eat(1024);
    assert.equal(p.eatString(), null);
  });

  it('includes null byte in offset but not string', function () {
    var p = new Parser(data);
    assert.equal(p.eatString(), 'what');
    assert.equal(p.eat(3), 'the');
  });
});

describe('Parser#eatRemaining', function () {
  var string = 'how awesome is that?';
  var data = Buffer(string);
  it('finish eating the buffer', function () {
    var p = new Parser(data);
    assert.equal(p.eatRemaining(), string);
    assert.equal(p.eatRemaining(), null);
    p.rewind(5);
    assert.equal(p.eatRemaining(), 'that?');
  });
});

describe('Parser#write', function () {
  var string = 'lol';
  var data = Buffer(string);
  var moar = Buffer('lercoaster');
  it('appends another buffer to the internal buffer', function () {
    var p = new Parser();
    assert.equal(p.getBuffer(), '');
    assert.equal(p.write(data), 'lol');
    assert.equal(p.write(moar), 'lollercoaster');
  });
});