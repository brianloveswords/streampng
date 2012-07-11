var _crc32 = require('crc').crc32;
var Buffer = require('buffer').Buffer;

exports.crc32 = function(string) {
  if (Buffer.isBuffer(string))
    string = buffer.toString();
  var sum = _crc32(string);
  var buf = Buffer(4);
  buf.writeInt32BE(sum, 0);
  return buf;
};
function Colour(r, g, b) {
  this.r = this.red = this[0] = r;
  this.g = this.green = this[1] = g;
  this.b = this.blue = this[2] = b;
}
Colour.prototype.equals = function equals(c) {
  return (this.r === c.r && this.g === c.g && this.b === c.b)
};


function Point(x, y) {
  this.x = this[0] = x;
  this.y = this[1] = y;
}
Point.prototype.equals = function equals(p) {
  return (this.x === p.x && this.y === p.y);
};

exports.Colour = Colour;
exports.Point = Point;

exports.fourByteFraction = function fourByteFraction(buf) {
  return buf.readUInt32BE(0) / 100000;
};
