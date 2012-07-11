var _crc32 = require('crc').crc32;
var Buffer = require('buffer').Buffer;

/**
 * Represents a colour by red, green and blue components.
 *
 * @param {Integer} red
 * @param {Integer} green
 * @param {Integer} blue
 */

function Colour(red, green, blue) {
  this.r = this.red = this[0] = red;
  this.g = this.green = this[1] = green;
  this.b = this.blue = this[2] = blue;
}
/**
 * Compare another colour for equality.
 *
 * @param {Colour} c
 * @return {Boolean}
 */

Colour.prototype.equals = function equals(c) {
  return (this.red === c.red &&
          this.green === c.green &&
          this.blue === c.blue);
};


/**
 * Represents a point on a two dimensional plane.
 *
 * @param {Number} x
 * @param {Number} y
 */

function Point(x, y) {
  this.x = this[0] = x;
  this.y = this[1] = y;
}

/**
 * Compare another point for equality
 *
 * @param {Point} p
 * @return {Boolean}
 */

Point.prototype.equals = function equals(p) {
  return (this.x === p.x && this.y === p.y);
};

/**
 * Get fraction from the PNG four byte unsigned integer representation.
 *
 * @param {Buffer[4]} buf should be four bytes
 * @return {Float}
 */

function fourByteFraction(buf) {
  return buf.readUInt32BE(0) / 100000;
}

/**
 * Calculate CRC32 for a string. Uses crc32() method from the crc module to do
 * the initial calculation and writes the result into a buffer as a 32 bit
 * signed integer.
 *
 * @param {String|Buffer} string converts to string if given buffer
 * @return {Buffer}
 * @see crc.crc32
 */

function crc32(string) {
  if (Buffer.isBuffer(string))
    string = buffer.toString();
  var sum = _crc32(string);
  var buf = Buffer(4);
  buf.writeInt32BE(sum, 0);
  return buf;
}

/** Convience for using in maps */
function to16Bit(buf) { return buf.readUInt16BE(0) };

exports.fourByteFraction = fourByteFraction;
exports.crc32 = crc32;
exports.Colour = Colour;
exports.Point = Point;
exports.to16Bit = to16Bit;

