var Base = require('./base.js');
var Point = require('../util.js').Point;

/**
 * The pHYs chunk specifies the intended pixel size or aspect ratio for
 * display of the image.
 *
 * [Reference](http://www.w3.org/TR/PNG/#11pHYs)
 */

var PhysicalDimensions = Base.make('pHYs');
PhysicalDimensions.prototype.initialize = function initialize(data) {
  var p = this.getParser(data);
  this.pixelsPerUnit = new Point(p.eatUInt(4), p.eatUInt(4));
  this.unitSpecifier = p.eatUInt(1);
};
PhysicalDimensions.prototype.out = function out(callback) {
  var output = this._outputPrepare();
  output.write32(this.pixelsPerUnit.x)
  output.write32(this.pixelsPerUnit.y)
  output.write8(this.unitSpecifier);
  output.done(callback);
};
PhysicalDimensions.prototype.length = function length() { return 9 };

PhysicalDimensions.UNIT_SPECIFIERS = [ 'unknown', 'meter' ]

module.exports = PhysicalDimensions;