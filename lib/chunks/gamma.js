var Base = require('./base.js');
var util = require('../util.js');
/**
 * The value is encoded as a four-byte PNG unsigned integer,
 * representing gamma times 100000.
 *
 * EXAMPLE A gamma of 1/2.2 would be stored as the integer 45455.
 *
 * An sRGB chunk or iCCP chunk, when present and recognized,
 * overrides the gAMA chunk.
 */

// #TODO: error checking

var Gamma = Base.make('gAMA');
Gamma.prototype.initialize = function initialize(data) {
  var p = this.getParser(data);
  this.gamma = util.fourByteFraction(p.eat(4));
};
Gamma.prototype.writeData = function writeData(output) {
  output.write32(util.intFromFourByteFraction(this.gamma));
  return output;
};
Gamma.prototype.length = function length() { return 4 };


module.exports = Gamma;