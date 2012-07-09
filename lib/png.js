var Stream = require('stream').Stream;
var util = require('util');
var bufferEqual = require('buffer-equal');
var Parser = require('./parser.js');
var Chunk = require('./chunk.js');

function Png(pngStream) {
  this.parser = new Parser();
  this.expecting = 'signature';
  this.strict = true;
  this.writable = true;
  this.chunks = [];

  if (pngStream) {
    if (Buffer.isBuffer(pngStream))
      this.write(pngStream);
    else if (typeof pngStream.pipe === 'function')
      pngStream.pipe(this);
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
    this.delayEmit('error', new Error('need to handle signature first'));
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
    var chunk = new Chunk(parser);
  } catch (err) {
    this.delayEmit('error', err);
    return this;
  }

  this.chunks.push(chunk);
  this.delayEmit(chunk.type, chunk);

  if (chunk.type === 'IEND')
    this.delayEmit('end', this.chunks);

  // try to continue processing
  this.process();
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

// var stream = file.createReadStream('somefile.txt');
// var png = new Png({ checksum: false });
// stream.pipe(png);
// png.on('end', fn);
// png.on('error', err);


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

// png.on('PLTE', function () {}); // 1 or 0
// png.on('tRNS', function () {}); // ?, if PLTE exists, must appear after
// png.on('hIST', function () {}); // ?, can only appear with PLTE
// png.on('bKGD', function () {}); // ?, if PLTE exists, must appear after

// png.on('IDAT', function () {}); // +, must appear after all the shit above.
// png.on('IEND', function () {}); // 1, must be the last thing.

// Png.prototype.write = function write(data) {};
