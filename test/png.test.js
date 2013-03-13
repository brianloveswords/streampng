var fs = require('fs');
var test = require('tap').test;
var StreamPng = require('..');
var http = require('http');

var FILENAME = __dirname + '/pngs/tEXt-iTXt.png';
var BAD_CHUNK_FILENAME = __dirname + '/pngs/unknown-chunk.png';
var SAMPLE_BUFFER = fs.readFileSync(FILENAME);
function newStream(opts) {
  opts = opts || {}
  var file = opts.file || FILENAME;
  return fs.createReadStream(file, opts);
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

test('reading a file with unknown chunks', function (t) {
  var filestream = newStream({ file: BAD_CHUNK_FILENAME });
  var png = new StreamPng(filestream);
  png.once('end', function (chunks) {
    t.same(chunks.filter(function (chunk) {
      return chunk.type == 'roFL';
    }).length, 1);
    t.end();
  });
});


test('writing out', function (t) {
  var png = StreamPng(newStream());
  png.on('end', function () {
    png.out(function (err, output) {
      t.same(output, SAMPLE_BUFFER);
      t.end();
    });
  });
});

test('writing out, not waiting for end event', function (t) {
  var png = StreamPng(newStream());
  png.out(function (err, output) {
    t.same(output, SAMPLE_BUFFER);
    t.end();
  });
});

test('writing out with modified chunks', function (t) {
  var png = StreamPng(newStream());
  png.on('tEXt', function (chunk) {
    chunk.set('keyword', 'Lolware');
  });

  png.out(function (err, output) {
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
    png.out(function (err, buf) {
      t.same(buf, SAMPLE_BUFFER);
      t.end();
    });
  });
});

test('streaming out concurrently with transparent stream', function (t) {
  var fdirect = 'sample.unmodified.png';
  var fmodified = 'sample.png';
  var png = StreamPng(newStream());
  var direct = fs.createWriteStream(fdirect);
  var modded = fs.createWriteStream(fmodified);
  var keyword = 'lolcathost';

  png.pipe(direct);
  png.out().pipe(modded);

  png.on('tEXt', function (chunk) { chunk.set('keyword', keyword) });

  t.plan(2);
  direct.on('close', function () {
    var png = StreamPng(fs.readFileSync(fdirect));
    png.out(function (err, buf) {
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

test('injecting a new chunk', function (t) {
  var png = StreamPng(newStream());
  var text = JSON.stringify({
    url: 'http://localhost:8080/assertion.json'
  });
  var itxt = StreamPng.Chunk.iTXt({
    keyword: 'openbadges',
    compressed: true,
    compressionMethod: 0,
    languageTag: 'json',
    translatedKeyword: '',
    text: text
  });

  png.inject(itxt);

  png.out(function (err, buffer) {
    t.plan(2);
    var modpng = StreamPng(buffer);
    modpng.on('iTXt', function (chunk) {
      if (chunk.keyword !== 'openbadges') return;
      t.same(chunk.languageTag, 'json');
      chunk.inflate(function (err, inflated) {
        t.same(inflated, text);
      });
    });
  });
});

test('conditional chunk injection', function (t) {
  var png = StreamPng(newStream());
  var keyword = 'Software';
  var newChunk = StreamPng.Chunk.tEXt({
    keyword: keyword,
    text: 'should not be entered'
  });
  var expect = ['IHDR', 'tEXt', 'iTXt', 'IDAT', 'IEND'];

  png.inject(newChunk, function (existing) {
    t.same(existing.type, 'tEXt');
    if (existing.keyword === 'Software')
      return false;
  });

  png.on('end', function () {
    var types = png.chunks.map(function (c) { return c.type });
    t.same(types, expect);
    t.end();
  });
});

test('injecting after the stream is finished', function (t) {
  var png = StreamPng(newStream());
  var keyword = 'Other';
  var newChunk = StreamPng.Chunk.tEXt({
    keyword: keyword,
    text: 'text chunk'
  });
  var expect = ['IHDR', 'tEXt', 'tEXt', 'iTXt', 'IDAT', 'IEND'];

  png.on('end', function () {
    png.inject(newChunk);
    var types = png.chunks.map(function (c) { return c.type });
    t.same(types, expect);
    t.end();
  });
});

test('should be unwritable after stream is done', function (t) {
  var png = StreamPng(newStream());
  png.on('end', function () {
    t.same(png.writable, false)
    t.end();
  });
});

test('passthrough pipe chaining', function (t) {
  var png = StreamPng();
  var instream = newStream();
  var outstream = fs.createWriteStream('sample.passthrough.png');

  instream.pipe(png).pipe(outstream);

  outstream.on('close', function () {
    var buffer = fs.readFileSync('sample.passthrough.png');
    t.same(buffer, SAMPLE_BUFFER);
    t.end();
  });
});

test('from the wire', function (t) {
  var server = http.createServer(function (_, r) {
    r.write(SAMPLE_BUFFER);
    r.end();
    server.close();
  });
  var socketPath = __dirname + '/test-server.sock';
  var png = StreamPng();

  server.on('listening', function () {
    var opts = {socketPath: socketPath, path: '/sample.png'};
    var req = http.request(opts, function (res) { res.pipe(png) });
    req.end();
  });

  png.out(function (err, buffer) {
    t.same(buffer, SAMPLE_BUFFER);
    t.end();
  });

  server.listen(socketPath);
});
