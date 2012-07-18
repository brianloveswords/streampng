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
  this.parser = new BitReader();
  this.expecting = 'signature';
  this.strict = true;
  this.writable = true;
  this.chunks = [];
  this.finished = !(input);

  // Input can be either a buffer or a stream. When we get a buffer, we can
  // pretend it's a stream by writing the entire buffer at once, as if we just
  // got a single `data` event. If it's not a buffer, check whether input
  // quacks like a stream and pipe it back to this instance. Otherwise emit
  // an error. We don't want to throw an error because the object is still
  // salvageable.
  if (input) {
    if (Buffer.isBuffer(input))
      this.write(input);
    else if (typeof input.pipe === 'function')
      input.pipe(this);
    else {
      var err = new TypeError('PNG constructor takes either a buffer or a stream');
      this.emit('error', err);
    }
  }
}
util.inherits(StreamPng, Stream);

/**
 * Emit on the nextTick to allow for late-bound listeners.
 *
 * @see EventEmitter#emit
 */

StreamPng.prototype.delayEmit = function delayEmit() {
  var args = arguments;
  process.nextTick(function () {
    this.emit.apply(this, args);
  }.bind(this));
  return this;
};

/**
 * Ensure that this is valid png by checking the signature. Emits a
 * `signature` event if successful, an `error` event if the signature
 * is not valid.
 */

StreamPng.prototype._signature = function signature() {
  var parser = this.parser;
  var validSignature = StreamPng.SIGNATURE;

  if (parser.getBuffer().length < validSignature.length)
    return this;

  var possibleSignature = parser.eat(validSignature.length)

  // #TODO: if this is true, stop the stream, clean things up
  if (!bufferEqual(possibleSignature, validSignature)) {
    this.delayEmit('error', new Error('Not a PNG, whaddya doin?'));
    return this;
  }

  this.expecting = 'chunk';
  this.delayEmit('signature');

  // continue processing
  this.process();
};

StreamPng.prototype._chunk = function chunk() {
  var parser = this.parser;

  if (parser.position() < 8) {
    var err = new Error('Need to handle signature first');
    this.delayEmit('error', err);
    return this;
  }

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

  // until we can think of something better to do, just pass errors
  // straight through.
  try {
    var chunk = new Chunk(parser, this.IHDR);
  } catch (err) {
    this.delayEmit('error', err);
    return this;
  }

  // #TODO: We should give an option for reading `transparently`, to
  // save memory, meaning that we don't store the chunks and only emit
  // them. Useful if the user doesn't care about re-writing the PNG.
  this.storeChunk(chunk);
  this.delayEmit(chunk.type, chunk);

  if (chunk.type === 'IDAT' && !this.IDAT) {
    this.delayEmit('metadata end');
    this.delayEmit('imagedata start');
  }

  else if (chunk.type === 'IEND') {
    this.finished = true;
    this.delayEmit('end', this.chunks);
  }

  this.process();
};

StreamPng.prototype.storeChunk = function (chunk) {
  // #TODO: chunks should know whether they are multi or singular and
  // should be stored as an array or singularly accordingly.
  this.chunks.push(chunk);
  if (this[chunk.type]) {
    this[chunk.type] = [this[chunk.type]]
    this[chunk.type].push(chunk);
  } else {
    this[chunk.type] = chunk;
  }
};

StreamPng.prototype.process = function process() {
  if (this.expecting === 'signature')
    return this._signature();
  if (this.expecting === 'chunk')
    return this._chunk();
};

StreamPng.prototype.write = function write(data) {
  if (!data) return;
  var parser = this.parser;
  parser.write(data);
  this.process();
};

StreamPng.prototype.out = function out(callback) {
  var chunks = this.chunks;
  var expect = chunks.length;
  var hits = 0;
  var buffers = [];
  var signature = StreamPng.SIGNATURE;

  // We don't want to force the user to manually listen for the end
  // event before calling `out`. If we know it's not done parsing yet,
  // bind the callback to this function and setup a listener for them.
  if (!this.finished) {
    var boundFn = this.out.bind(this, callback);
    return this.once('end', boundFn);
  }

  // Loop over all of the chunks in order and get their buffers. Whenever
  // their callback returns, stick them in an array, indexed by their
  // original order. We expect `chunks.length` hits and once that
  // expectation has been met, we push the PNG signature to the beginning
  // of the array, `Buffer.concat` the whole thing and send it off.
  function proceed(buffer, idx) {
    buffers[idx] = buffer;
    if (++hits !== expect) return;
    buffers.unshift(signature);
    callback(Buffer.concat(buffers));
  }

  chunks.forEach(function (chunk, idx) {
    if (chunk._buffer) return proceed(chunk._buffer, idx);
    chunk.out(function (buf) { proceed(buf, idx) });
  });
};

StreamPng.prototype.end = StreamPng.prototype.write;
StreamPng.prototype.destroy = function noop() {};

StreamPng.SIGNATURE = Buffer([137, 80, 78, 71, 13, 10, 26, 10]);
StreamPng.TYPE_LENGTH = 4;
StreamPng.CRC_LENGTH = 4;

module.exports = StreamPng;

