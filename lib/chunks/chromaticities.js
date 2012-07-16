var Base = require('./base.js');
var util = require('../util.js');
var Point = util.Point;

/**
  * Each value is encoded as a four-byte PNG unsigned integer,
  * representing the x or y value times 100000.
  *
  * EXAMPLE: A value of 0.3127 would be stored as the integer 31270
  *
  * An sRGB chunk or iCCP chunk, when present and recognized,
  * overrides the cHRM chunk.
  */

var Chromaticities = Base.make('cHRM');
Chromaticities.prototype.initialize = function initialize(data) {
  // #TODO: error checking
  var p = this.getParser(data);

  function chromaPoint() {
    var x = util.fourByteFraction(p.eat(4));
    var y = util.fourByteFraction(p.eat(4));
    return new Point(x, y);
  }

  this.whitePoint = chromaPoint();
  this.red = chromaPoint();
  this.green = chromaPoint();
  this.blue = chromaPoint();
}
Chromaticities.prototype.writeData = function writeData(output) {
  output
    .write32(util.intFromFourByteFraction(this.whitePoint.x))
    .write32(util.intFromFourByteFraction(this.whitePoint.y))
    .write32(util.intFromFourByteFraction(this.red.x))
    .write32(util.intFromFourByteFraction(this.red.y))
    .write32(util.intFromFourByteFraction(this.green.x))
    .write32(util.intFromFourByteFraction(this.green.y))
    .write32(util.intFromFourByteFraction(this.blue.x))
    .write32(util.intFromFourByteFraction(this.blue.y))
  return output;
};
Chromaticities.prototype.length = function length() { return 32 }

module.exports = Chromaticities;