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
 * Turn a four byte fraction back into an int
 *
 * @param {Float} flt
 * @return {Integer}
 */

function intFromFourByteFraction(flt) {
  return Math.ceil(flt * 100000);
}

/** Convience for using in maps */
function to16Bit(buf) { return buf.readUInt16BE(0) };

exports.fourByteFraction = fourByteFraction;
exports.intFromFourByteFraction = intFromFourByteFraction;
exports.Colour = Colour;
exports.Point = Point;
exports.to16Bit = to16Bit;
