var test = require('tap').test;
var BitWriter = require('../lib/bitwriter');
test('unsigned 8 bit write', function (t) {
  var buf = new BitWriter(4);
  buf.write(0x01);
  t.same(buf.out(), Buffer([0x01, 0x00, 0x00, 0x00]));

  buf.write(0x02);
  t.same(buf.out(), Buffer([0x01, 0x02, 0x00, 0x00]));
  t.end();
});

test('unsigned 16 bit write', function (t) {
  var buf = new BitWriter(4);
  buf.write(0xffff);
  t.same(buf.out(), Buffer([0xff, 0xff, 0x00, 0x00]));

  buf.write(0xdddd);
  t.same(buf.out(), Buffer([0xff, 0xff, 0xdd, 0xdd]));
  t.end();
});

test('unsigned 32 bit write', function (t) {
  var buf = new BitWriter(8);
  buf.write(0xf0f0f0f0);
  t.same(buf.out(), Buffer([0xf0, 0xf0, 0xf0, 0xf0, 0x00, 0x00, 0x00, 0x00]));

  buf.write(0xd1d1d1d1);
  t.same(buf.out(), Buffer([0xf0, 0xf0, 0xf0, 0xf0, 0xd1, 0xd1, 0xd1, 0xd1]));
  t.end();
});

test('signed 8 bit write', function (t) {
  var buf = new BitWriter(4);
  buf.write(-1);
  t.same(buf.out(), Buffer([0xff, 0x00, 0x00, 0x00]));

  buf.write(-2);
  t.same(buf.out(), Buffer([0xff, 0xfe, 0x00, 0x00]));
  t.end();
});

test('signed 16 bit write', function (t) {
  var buf = new BitWriter(4);
  buf.write(-500);
  t.same(buf.out(), Buffer([0xfe, 0x0c, 0x00, 0x00]));

  buf.write(-900);
  t.same(buf.out(), Buffer([0xfe, 0x0c, 0xfc, 0x7c]));
  t.end();
});

test('signed 32 bit write', function (t) {
  var buf = new BitWriter(8);
  buf.write(-90000);
  t.same(buf.out(), Buffer([0xff, 0xfe, 0xa0, 0x70, 0x00, 0x00, 0x00, 0x00]));

  buf.write(-100000);
  t.same(buf.out(), Buffer([0xff, 0xfe, 0xa0, 0x70, 0xff, 0xfe, 0x79, 0x60]));
  t.end();
});

test('8 bits in 16 bit frame', function (t) {
  var buf = new BitWriter(8);
  buf.write(0x11, { size: 32 });
  t.same(buf.out(), Buffer([0x00, 0x00, 0x00, 0x11, 0x00, 0x00, 0x00, 0x00]));

  buf.write(0x22, { size: 32 });
  t.same(buf.out(), Buffer([0x00, 0x00, 0x00, 0x11, 0x00, 0x00, 0x00, 0x22]));
  t.end();
});

test('16 bits in 32 bit frame', function (t) {
  var buf = new BitWriter(8);
  buf.write(0x2211, { size: 32 });
  t.same(buf.out(), Buffer([0x00, 0x00, 0x22, 0x11, 0x00, 0x00, 0x00, 0x00]));

  buf.write(0x1122, { size: 32 });
  t.same(buf.out(), Buffer([0x00, 0x00, 0x22, 0x11, 0x00, 0x00, 0x11, 0x22]));
  t.end();
});

test('8 bits signed in 32 bit frame', function (t) {
  var buf = new BitWriter(8);
  buf.write(-1, { size: 32 });
  t.same(buf.out(), Buffer([0xff, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00]));

  buf.write(-2, { size: 32 });
  t.same(buf.out(), Buffer([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xfe]));
  t.end();
});

test('string writing', function (t) {
  var buf = new BitWriter(8);
  buf.write('sup');
  t.same(buf.out(), Buffer([0x73, 0x75, 0x70, 0x00, 0x00, 0x00, 0x00, 0x00]));

  buf.write('bros');
  t.same(buf.out(), Buffer([0x73, 0x75, 0x70, 0x00, 0x62, 0x72, 0x6f, 0x73]));
  t.end();
});

test('string writing, no null byte', function (t) {
  var buf = new BitWriter(8);
  buf.write('hi', { null: false });
  t.same(buf.out(), Buffer([0x68, 0x69, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));

  buf.write('lol', { null: false });
  t.same(buf.out(), Buffer([0x68, 0x69, 0x6c, 0x6f, 0x6c, 0x00, 0x00, 0x00]));
  t.end();
});

test('raw bytes, array', function (t) {
  var buf = new BitWriter(8);
  buf.write([0x00, 0x00])
  buf.write([0xde, 0xad, 0xbe, 0xef]);
  t.same(buf.out(), Buffer([0x00, 0x00, 0xde, 0xad, 0xbe, 0xef, 0x00, 0x00]));
  t.end();
});

test('raw bytes, buffer', function (t) {
  var buf = new BitWriter(8);
  buf.write(Buffer([0x00, 0x00]))
  buf.write(Buffer([0xde, 0xad, 0xbe, 0xef]));
  t.same(buf.out(), Buffer([0x00, 0x00, 0xde, 0xad, 0xbe, 0xef, 0x00, 0x00]));
  t.end();
});
