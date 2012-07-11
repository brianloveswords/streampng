var Stream = require('stream').Stream;
var util = require('util');
var bufferEqual = require('buffer-equal');
var Parser = require('./parser.js');
var Chunk = require('./chunk.js');

/**
 * Constructor
 *
 * @param {Buffer|Stream} input
 * @return instance
 */

function Png(input) {
  this.parser = new Parser();
  this.expecting = 'signature';
  this.strict = true;
  this.writable = true;
  this.chunks = [];

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
util.inherits(Png, Stream);

/**
 * Emit on the nextTick to allow for late-bound listeners.
 *
 * @see EventEmitter#emit
 */

Png.prototype.delayEmit = function delayEmit() {
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

Png.prototype._signature = function signature() {
  var parser = this.parser;
  var validSignature = Png.SIGNATURE;

  if (parser.getBuffer().length < validSignature.length)
    return this;

  var possibleSignature = parser.eat(validSignature.length)

  // #TODO: if this is true, stop the stream, clean things up
  if (!bufferEqual(possibleSignature, validSignature)) {
    this.delayEmit('error', new Error('Not a fuckin Png, whaddya doin?'));
    return this;
  }

  this.expecting = 'chunk';
  this.delayEmit('signature');

  // continue processing
  this.process();
};

Png.prototype._chunk = function chunk() {
  var parser = this.parser;

  if (parser.position() < 8) {
    var err = new Error('Need to handle signature first');
    this.delayEmit('error', err);
    return this;
  }

  // We need to make sure there are enough bytes in the buffer to read the
  // entire chunk. If there are less than four bytes, we can't even read the
  // length of the chunk, so we'll return and wait for the next `write`.
  var remaining = parser.remaining()
  if (!remaining || remaining < 4) return this;

  // If we can read the length but there aren't enough bytes to read through
  // the end of the chunk, wait for the next `write`.
  var dataLength = parser.peak(4).readUInt32BE(0);
  dataLength += Png.TYPE_LENGTH + Png.CRC_LENGTH;
  if (remaining < dataLength) return this;

  try {
    var chunk = new Chunk(parser, this.IHDR);
  } catch (err) {
    this.delayEmit('error', err);
    return this;
  }

  this.storeChunk(chunk);
  this.delayEmit(chunk.type, chunk);

  if (chunk.type === 'IDAT')
    this.delayEmit('metadata end');

  else if (chunk.type === 'IEND')
    this.delayEmit('end', this.chunks);

  this.process();
};

Png.prototype.storeChunk = function (chunk) {
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

Png.prototype.process = function process() {
  if (this.expecting === 'signature')
    return this._signature();
  if (this.expecting === 'chunk')
    return this._chunk();
};

Png.prototype.write = function write(data) {
  if (!data) return;
  var parser = this.parser;
  parser.write(data);
  this.process();
};
Png.prototype.end = Png.prototype.write;
Png.prototype.destroy = function noop() {};

Png.SIGNATURE = Buffer([137, 80, 78, 71, 13, 10, 26, 10]);
Png.TYPE_LENGTH = 4;
Png.CRC_LENGTH = 4;

module.exports = Png;

// png.on('IHDR', function () {}); // 1, must appear first
// png.on('tIME', function () {}); // ?
// png.on('zTXt', function () {}); // *
// png.on('tEXt', function () {}); // *
// png.on('iTXt', function () {}); // *
// png.on('pHYs', function () {}); // ?
// png.on('sPLT', function () {}); // *
// png.on('iCCP', function () {}); // ? (mutually exclusive with sRGB)
// png.on('sRGB', function () {}); // ? (mutually exclusive with iCCP)
// png.on('sBIT', function () {}); // ?
// png.on('gAMA', function () {}); // ?
// png.on('cHRM', function () {}); // ?
// png.on('dSIG', function () {}); // 0 or 2
// png.on('oFFs', function () {}); // ?
// png.on('pCAL', function () {}); // ?
// png.on('sCAL', function () {}); // ?
// png.on('gIFg', function () {}); // *
// png.on('gIFx', function () {}); // *
// png.on('sTER', function () {}); // ?

// png.on('PLTE', function () {}); // 1 or 0
// png.on('tRNS', function () {}); // ?, if PLTE exists, must appear after
// png.on('hIST', function () {}); // ?, can only appear with PLTE
// png.on('bKGD', function () {}); // ?, if PLTE exists, must appear after

// png.on('IDAT', function () {}); // +, must appear after all the shit above.
// png.on('IEND', function () {}); // 1, must be the last thing.
