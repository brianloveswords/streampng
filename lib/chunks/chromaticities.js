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

function Chromaticities(data) {
  // #TODO: error checking
  var p = this.getParser(data);

  function chromaPoint() {
    var x = util.fourByteFraction(p.eat(4));
    var y = util.fourByteFraction(p.eat(4));
    return new Point(x, y);
  }

  this.type = 'cHRM';
  this.whitePoint = chromaPoint();
  this.red = chromaPoint();
  this.green = chromaPoint();
  this.blue = chromaPoint();
}
Base.inherits(Chromaticities);

module.exports = Chromaticities;