var fs = require('fs');
var test = require('tap').test;
var Png = require('../lib/png.js');

var buffer = fs.readFileSync(__dirname + '/pngs/bear-axe.png');
function newStream(opts) {
  opts = opts || {}
  return fs.createReadStream(__dirname + '/pngs/bear-axe.png', opts);
}

test('reading the png signature', {skip: false}, function (t) {
  t.test('good png signature', {skip: false}, function (t) {
    t.plan(1);
    var sig = Buffer([137, 80, 78, 71, 13, 10, 26, 10]);
    var png = new Png();
    png.write(sig);
    png.once('signature', t.pass.bind(t, 'should emit signature event'))
  });

  t.test('bad png signature', {skip: false}, function (t) {
    t.plan(1);
    var sig = Buffer([2, 4, 8, 16, 32, 64, 128, 255]);
    var png = new Png();
    png.write(sig);
    png.once('error', t.pass.bind(t, 'should emit error on bad png'));
  });

  t.test('signature with more stuff', {skip: false}, function (t) {
    t.plan(1);
    var sig = Buffer([137, 80, 78, 71, 13, 10, 26, 10, 2, 4, 8, 16, 32, 64]);
    var png = new Png();
    png.write(sig);
    png.once('signature', t.pass.bind(t, 'should emit signature event'));
  });

  t.test('signature in chunks', {skip: false}, function (t) {
    t.plan(1);
    var sigPart1 = Buffer([137, 80, 78, 71, 13]);
    var sigPart2 = Buffer([10, 26, 10, 2, 4, 8, 16, 32, 64]);
    var png = new Png();

    png.once('signature', t.pass.bind(t, 'should emit signature event'));
    png.once('error', function () { t.fail('should not emit error'); });

    png.write(sigPart1);
    process.nextTick(function () { png.write(sigPart2) });
  });

  t.test('signature with stream', function (t) {
    t.plan(1);
    var png = new Png(newStream());
    png.once('signature', t.pass.bind(t, 'should emit signature event'));
    png.once('error', function () { t.fail('should not emit error'); });
  });

  t.test('signature with buffer', function (t) {
    t.plan(1);
    var png = new Png(buffer);
    png.once('signature', t.pass.bind(t, 'should emit signature event'));
    png.once('error', function () { t.fail('should not emit error'); });
  });

  t.end();
});

test('reading chunks', function (t) {
  t.test('with a buffer', function (t) {
    t.plan(1);
    var png = new Png(buffer);
    png.once('IEND', t.pass.bind(t, 'found the last chunk'));
    png.once('error', function () { t.fail('should not emit error'); });
  });

  t.test('with a low throughput stream', function (t) {
    t.plan(1);
    var png = new Png(newStream({bufferSize: 412}));
    png.once('IEND', t.pass.bind(t, 'found the last chunk'));
    png.once('error', function () { t.fail('should not emit error'); });
  });

  t.test('has all mandatory chunks', function (t) {
    var png = new Png(newStream({bufferSize: 412}));
    png.once('end', function (chunks) {
      var chunksByType = chunks.reduce(function (accum, c) {
        accum[c.type] = c;
        return accum
      }, {});
      t.ok('IHDR' in chunksByType, 'should find IHDR');
      t.ok('IDAT' in chunksByType, 'should find IDAT');
      t.ok('IEND' in chunksByType, 'should find IEND');
      t.end();
    });
    png.once('error', function () { t.fail('should not emit error'); });
  });

  t.test('IHDR chunk data', function (t) {
    var png = new Png(newStream());
    png.once('IHDR', function (chunk) {
      console.dir(chunk);
      t.end();
    });
    png.once('error', function () { t.fail('should not emit error'); });
  });

});
