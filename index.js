var Stream = require('stream').Stream;
var util = require('util');
var bufferEqual = require('buffer-equal');
var BitReader = require('bitreader');
var Chunk = require('./lib/chunk.js');

/**
 * Constructor
 *
 * @param {Buffer|Stream} input
 * @return instance
 */

function StreamPng(input) {
  if (!(this instanceof StreamPng))
    return new StreamPng(input);

  this.parser = new BitReader();
  this.strict = true;
  this.writable = true;
  this.readable = true;
  this.finished = false;
  this.chunks = [];
  this.injections = []

  // Input can be either a buffer or a stream. When we get a buffer, we can
  // pretend it's a stream by writing the entire buffer at once, as if we just
  // got a single `data` event. If it's not a buffer, check whether input
  // quacks like a stream and pipe it back to this instance. Otherwise throw
  // an error.
  if (input) {

    // is it a buffer?
    if (Buffer.isBuffer(input))
      this.end(input);

    // does it quack like a stream?
    else if (typeof input.pipe === 'function')
      input.pipe(this);

    // can't handle it.
    else {
      var err = new TypeError('PNG constructor takes either a buffer or a stream');
      err.input = input;
      err.inputType = typeof input;
      throw err;
    }
  }
}
util.inherits(StreamPng, Stream);
StreamPng.Chunk = Chunk;

/**
 * Emit on the nextTick to allow for late-bound listeners.
 *
 * @see EventEmitter#emit
 * @return instance
 */

StreamPng.prototype.delayEmit = function delayEmit() {
  var args = arguments;
  process.nextTick(function () {
    this.emit.apply(this, args);
  }.bind(this));
  return this;
};


/**
 * Handle data input. Re-emits incoming data as a `data` event to allow
 * for transparent piping to another Writable Stream.
 *
 * @param {Buffer} data
 * @emits {'data', Buffer} same as incoming data
 * @return instance
 */

StreamPng.prototype.write = function write(data) {
  if (!data) return this;
  this.delayEmit('data', data);
  this.parser.write(data);
  this.process();
  return this;
};

/**
 * Called when either the input or output stream has ended.
 *
 * When the `data` argument exists, call `Stream#write` first. Sets
 * `this.writable` to false so no more data can be piped in and
 * `this.finished` to true so methods that require the fully parsed PNG
 * like `StreamPng#out` and `StreamPng#inject` know that they can execute
 * immediately instead of listening for the `end` event.
 *
 * @see StreamPng#write
 * @see StreamPng#processInjections
 * @return instance
 */

StreamPng.prototype.end = function end(data) {
  if (data) this.write(data);
  this.writable = false;
  this.finished = true;
  this.delayEmit('end', this.chunks);
  this.processInjections();
  return this;
};

/**
 * Pushes a chunk to main internal list and chunk-specific list.
 *
 * @return instance
 */

StreamPng.prototype.addChunk = function (chunk) {
  this.chunks.push(chunk);
  if (this[chunk.type]) {
    this[chunk.type].push(chunk);
  } else {
    this[chunk.type] = [chunk];
  }
  return this;
};

/**
 * Ensure that this is valid png by checking the signature. Emits a
 * `signature` event if successful, an `error` event if the signature
 * is not valid. Calls `this.process` to continue processing when a valid
 * signature is found.
 *
 * @emits {'signature'}
 * @emits {'error', TypeError}
 * @return instance
 * @see StreamPng#process
 */

StreamPng.prototype._readSignature = function readSignature() {
  var parser = this.parser;
  var validSignature = StreamPng.SIGNATURE;
  var bufferLength = parser.getBuffer().length;
  var signatureLength = validSignature.length;
  var possibleSignature;

  // Make sure we have enough bytes to read the signature, then get the
  // signature and compare it to the known valid PNG signature. Emit an
  // error and set this stream to be non-writable if there's a mismatch,
  // otherwise emit a `signature` event and continue processing.
  if (bufferLength < signatureLength)
    return this;

  possibleSignature = parser.eat(signatureLength);
  if (!bufferEqual(possibleSignature, validSignature)) {
    this.delayEmit('error', new TypeError('Signature mismatch, not a PNG'));
    this.writable = false;
    return this;
  }

  this.delayEmit('signature');
  this.process();
  return this;
};

/**
 * Attempt to parse a chunk. Recurses until there aren't enough bytes
 * in the parser to be able to read a new chunk or until the end of the
 * PNG has been reached.
 *
 * @emits {chunkType, Chunk}
 * @emits {'chunk', Chunk}
 * @emits {'imagedata begin'}
 * @return instance
 * @see StreamPng#_readSignature
 * @see StreamPng#addChunk
 */

StreamPng.prototype.process = function process() {
  var parser = this.parser;

  if (parser.position() < 8)
    return this._readSignature();

  // We need to make sure there are enough bytes in the buffer to read
  // the entire chunk. If there are less than four bytes, we can't even
  // read the length of the chunk, so we'll return and wait for the next
  // `write`.
  var remaining = parser.remaining();
  if (!remaining || remaining < 4)
    return this;

  // If we can read the length but there aren't enough bytes to read
  // through the end of the chunk, wait for the next `write`.
  var dataLength = parser.peak(4).readUInt32BE(0);
  dataLength += StreamPng.TYPE_LENGTH + StreamPng.CRC_LENGTH;
  if (remaining < dataLength)
    return this;

  // #XXX: Until we can think of something better to do, just pass errors
  // straight through.
  try {
    var chunk = new Chunk(parser, this.IHDR);
  } catch (err) {
    this.delayEmit('error', err);
    return this;
  }

  // When we detect the first image data chunk, process the chunk injection
  // list before adding the image data chunk to the internal list. Also emit
  // convenience events so the user knows when the metadata section ended.
  if (chunk.type === 'IDAT' && !this.IDAT)
    this.delayEmit('imagedata begin');

  // #TODO: Give an option for reading `transparently`, to save memory,
  // meaning that we don't store the chunks and only emit them. Useful if
  // the user doesn't care about re-writing the PNG.
  this.addChunk(chunk);
  this.delayEmit('chunk', chunk);
  this.delayEmit(chunk.type, chunk);

  if (chunk.type !== 'IEND')
    this.process();

  return this;
};

/**
 * Queues a new chunk for injection into the stream with an optional
 * condition for inclusion.
 *
 * If the input stream is finished parsing, processes the chunk immediately.
 *
 * The condition will be called once for every chunk that exists with the
 * parameter `existingChunk`. It should return either `true` or `false`.
 * If any `condition(existingChunk)` call returns `false`, injection
 * will not occur.
 *
 * @param {Chunk} chunk
 * @param {Function} condition `function(existingChunk) {...}`
 * @return instance
 * @see `StreamPng#processInjections`
 */

StreamPng.prototype.inject = function inject(chunk, opts, condition) {
  var defaults = { test: 'same' };
  if (typeof opts === 'function')
    condition = opts, opts = defaults;
  if (!condition) condition = true;
  this.injections.push({ chunk: chunk, opts: opts, condition: condition });
  if (this.finished) this.processInjections();
  return this;
};


/**
 * Process the queued injections. Inserts all chunks right
 * after the IHDR chunk.
 *
 * #TODO: make sure inserting after the IHDR chunk is the most reasonable
 * thing to do. This obviously won't work for things like IDAT chunks, but
 * those probably shouldn't be supported by `inject()`.
 *
 * @return instance
 */

StreamPng.prototype.processInjections = function () {
  if (!this.injections.length) return;
  var all = this.chunks;
  var additions = [];
  var idx;

  this.injections.forEach(function (chunk) {
    var options = chunk.opts;
    var chunkType = chunk.chunk.type;
    var condition = chunk.condition;

    if (condition === true)
      return additions.push(chunk.chunk);

    for (idx = 0; idx < all.length; idx++) {
      if (options.test === 'same' && all[idx].type !== chunkType)
        continue;
      if (condition(all[idx]) === false)
        return false;
    }

    additions.push(chunk.chunk);
  });
  this.injections = [];

  // Splice in the new chunks right after the the IHDR chunk.
  var splicer = all.splice.bind(all, 1, 0);
  splicer.apply(null, additions);
  return this;
};

/**
 * Output the buffer for the PNG. Works either callback or stream style.
 *
 * Callback example:
 * ```
 * png.out(function (buf) {
 *   fs.writeFile('example.png', buf, function() {
 *     console.log('done');
 *    });
 * });
 * ```
 *
 * Stream example:
 * ```
 * var infile = fs.createWriteStream('example.png');
 * png.out().pipe(infile).once('close', function() {
 *   console.log('done');
 * });
 * ```
 *
 * @param {Function} callback `function(buffer) { ... }`
 * @param {Stream} _stream internal, should not use.
 * @return {Stream} a `Readable Stream` ready to be piped somewhere
 */

StreamPng.prototype.out = function out(callback, _stream) {
  var stream = _stream || new Stream();
  stream.readable = true;

  var chunks = this.chunks;
  var expect = chunks.length;
  var hits = 0;
  var buffers = [];
  var signature = StreamPng.SIGNATURE;

  // We don't want to force the user to manually listen for the end
  // event before calling `out`. If we know it's not done parsing yet,
  // bind the callback  and the output stream to this function and setup
  // a listener for them.
  if (!this.finished) {
    var boundFn = this.out.bind(this, callback, stream);
    this.once('end', boundFn);
    return stream;
  }

  // Loop over all of the chunks in order and get their buffers. Whenever
  // their callback returns, stick them in an array, indexed by their
  // original order. We expect `chunks.length` hits and once that
  // expectation has been met, we push the PNG signature to the beginning
  // of the array, `Buffer.concat` the whole thing and send it off.
  function proceed(buffer, idx) {
    buffers[idx] = buffer;
    if (++hits !== expect) return;

    var output;
    buffers.unshift(signature);
    output = Buffer.concat(buffers)

    if (callback) callback(null, output);
    process.nextTick(function () {
      stream.emit('data', output);
      stream.emit('end', output);
      stream.readable = false;
    });
  }

  chunks.forEach(function (chunk, idx) {
    if (chunk._buffer) return proceed(chunk._buffer, idx);
    chunk.out(function (buf) { proceed(buf, idx) });
  });

  return stream;
};
StreamPng.prototype.destroy = function noop() {};
StreamPng.SIGNATURE = Buffer([137, 80, 78, 71, 13, 10, 26, 10]);
StreamPng.TYPE_LENGTH = 4;
StreamPng.CRC_LENGTH = 4;


module.exports = StreamPng;

