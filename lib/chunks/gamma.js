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

function Gamma(data) {
  // #TODO: error checking
  var p = this.getParser(data);

  this.type = 'gAMA';
  this.gamma = util.fourByteFraction(p.eat(4));
};

Base.inherits(Gamma);

module.exports = Gamma;