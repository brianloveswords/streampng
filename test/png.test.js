var fs = require('fs');
var test = require('tap').test;
var StreamPng = require('..');

var FILENAME = __dirname + '/pngs/tEXt-iTXt.png';
var SAMPLE_BUFFER = fs.readFileSync(FILENAME);
function newStream(opts) {
  opts = opts || {}
  return fs.createReadStream(FILENAME, opts);
}

test('reading the png signature', {skip: false}, function (t) {
  t.test('good png signature', {skip: false}, function (t) {
    t.plan(1);
    var sig = Buffer([137, 80, 78, 71, 13, 10, 26, 10]);
    var png = new StreamPng();
    png.write(sig);
    png.once('signature', t.pass.bind(t, 'should emit signature event'))
  });

  t.test('bad png signature', {skip: false}, function (t) {
    t.plan(1);
    var sig = Buffer([2, 4, 8, 16, 32, 64, 128, 255]);
    var png = new StreamPng();
    png.write(sig);
    png.once('error', t.pass.bind(t, 'should emit error on bad png'));
  });

  t.test('signature with more stuff', {skip: false}, function (t) {
    t.plan(1);
    var sig = Buffer([137, 80, 78, 71, 13, 10, 26, 10, 2, 4, 8, 16, 32, 64]);
    var png = new StreamPng();
    png.write(sig);
    png.once('signature', t.pass.bind(t, 'should emit signature event'));
  });

  t.test('signature in chunks', {skip: false}, function (t) {
    t.plan(1);
    var sigPart1 = Buffer([137, 80, 78, 71, 13]);
    var sigPart2 = Buffer([10, 26, 10, 2, 4, 8, 16, 32, 64]);
    var png = new StreamPng();

    png.once('signature', t.pass.bind(t, 'should emit signature event'));
    png.once('error', function () { t.fail('should not emit error'); });

    png.write(sigPart1);
    process.nextTick(function () { png.write(sigPart2) });
  });

  t.test('signature with stream', function (t) {
    t.plan(1);
    var png = new StreamPng(newStream());
    png.once('signature', t.pass.bind(t, 'should emit signature event'));
    png.once('error', function (err) { t.fail('should not emit error') });
  });

  t.test('signature with buffer', function (t) {
    t.plan(1);
    var png = new StreamPng(SAMPLE_BUFFER);
    png.once('signature', t.pass.bind(t, 'should emit signature event'));
    png.once('error', function () { t.fail('should not emit error'); });
  });

  t.end();
});

test('reading chunks', function (t) {
  t.test('with a buffer', function (t) {
    t.plan(1);
    var png = new StreamPng(SAMPLE_BUFFER);
    png.once('IEND', t.pass.bind(t, 'found the last chunk'));
    png.once('error', function () { t.fail('should not emit error'); });
  });

  t.test('with a low throughput stream', function (t) {
    t.plan(1);
    var png = new StreamPng(newStream({bufferSize: 412}));
    png.once('IEND', t.pass.bind(t, 'found the last chunk'));
    png.once('error', function () { t.fail('should not emit error'); });
  });

  t.test('has all mandatory chunks', function (t) {
    var png = new StreamPng(newStream({bufferSize: 412}));
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
});

test('writing out', function (t) {
  var png = StreamPng(newStream());
  png.on('end', function () {
    png.out(function (output) {
      t.same(output, SAMPLE_BUFFER);
      t.end();
    });
  });
});

test('writing out, not waiting for end event', function (t) {
  var png = StreamPng(newStream());
  png.out(function (output) {
    t.same(output, SAMPLE_BUFFER);
    t.end();
  });
});

test('writing out with modified chunks', function (t) {
  var png = StreamPng(newStream());
  png.on('tEXt', function (chunk) {
    chunk.set('keyword', 'Lolware');
  });

  png.out(function (output) {
    var modpng = StreamPng(output);
    modpng.on('tEXt', function (chunk) {
      t.same(chunk.keyword, 'Lolware');
      t.end();
    });
  });
});

test('writing out, stream style', function (t) {
  var png = StreamPng(newStream());
  var outfile = 'sample.png';
  var instream = fs.createWriteStream(outfile);
  var outstream = png.out();
  outstream.pipe(instream).on('close', function () {
    var png = StreamPng(fs.readFileSync(outfile));
    png.out(function (buf) {
      t.same(buf, SAMPLE_BUFFER);
      t.end();
    });
  });
});

test('streaming out concurrently with transparent stream', function (t) {
  t.plan(2);
  var fdirect = 'sample.unmodified.png';
  var fmodified = 'sample.png';
  var png = StreamPng(newStream());
  var direct = fs.createWriteStream(fdirect);
  var modded = fs.createWriteStream(fmodified);
  var keyword = 'lolcathost';

  png.pipe(direct);
  png.out().pipe(modded);
  png.on('tEXt', function (chunk) { chunk.set('keyword', keyword) });

  direct.on('close', function () {
    var png = StreamPng(fs.readFileSync(fdirect));
    png.out(function (buf) {
      t.same(buf, SAMPLE_BUFFER);
    });
  });

  modded.on('close', function () {
    var png = StreamPng(fs.readFileSync(fmodified));
    png.on('tEXt', function (chunk) {
      t.same(chunk.keyword, keyword);
    });
  });
});
