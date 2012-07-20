var Base = require('./base.js');
var Point = require('../util.js').Point;

/**
 * [Reference](ftp://ftp.simplesystems.org/pub/png/documents/pngext-1.4.0-pdg.html)
 */

var Offset = Base.make('oFFs');
Offset.prototype.initialize = function initialize(data) {
  var p = this.getParser(data);
  var x = p.eatInt(4);
  var y = p.eatInt(4);
  this.position = new Point(x, y);
  this.unitSpecifier = p.eatUInt(1);
}
Offset.prototype.length = function length() { return 9 };
Offset.prototype.writeData = function (output) {
  output
    .write32(this.position.x)
    .write32(this.position.y)
    .write(this.unitSpecifier);
  return output;
};
Offset.UNIT_SPECIFIERS = [ 'pixels', 'microns' ];
Offset.PIXELS = 0;
Offset.MICRONS = 1;

module.exports = Offset;