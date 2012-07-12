var Base = require('./base.js');

/**
 * To simplify decoders, PNG specifies that only certain sample depths
 * may be used, and further specifies that sample values should be
 * scaled to the full range of possible values at the sample depth. The
 * sBIT chunk defines the original number of significant bits (which can
 * be less than or equal to the sample depth). This allows PNG decoders
 * to recover the original data losslessly even if the data had a sample
 * depth not directly supported by PNG.
 *
 * (Reference)[http://www.w3.org/TR/PNG/#11sBIT]
 */

function SignificantBits(data, header) {
  var p = this.getParser(data);
  this.type = 'sBIT';

  var colour = this.colourType = header.colourType;

  if (colour === 0)
    this.greyscale = p.eat(1).readUInt8(0);

  else if (colour === 2 || colour === 3) {
    this.red = p.eatUInt(1);
    this.green = p.eatUInt(1);
    this.blue = p.eatUInt(1);
  }

  else if (colour === 4) {
    this.greyscale = p.eatUInt(1);
    this.alpha = p.eatUInt(1);
  }

  else if (colour === 6) {
    this.red = p.eatUInt(1);
    this.green = p.eatUInt(1);
    this.blue = p.eatUInt(1);
    this.alpha = p.eatUInt(1);
  }
}
Base.inherits(SignificantBits);

module.exports = SignificantBits;