var Base = require('./base.js');
var Point = require('../util.js').Point;

/**
 * The pHYs chunk specifies the intended pixel size or aspect ratio for
 * display of the image.
 *
 * [Reference](http://www.w3.org/TR/PNG/#11pHYs)
 */

function PhysicalDimensions(data) {
  var p = this.getParser(data);
  this.type = 'pHYs';
  this.pixelsPerUnit = new Point(p.eatUInt(4), p.eatUInt(4));
  this.unitSpecifier = p.eatUInt(1);
}
Base.inherits(PhysicalDimensions);
PhysicalDimensions.UNIT_SPECIFIERS = [ 'unknown', 'meter' ]

module.exports = PhysicalDimensions;