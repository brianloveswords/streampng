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

var SignificantBits = Base.make('sBIT');
SignificantBits.prototype.initialize = function initialize(data, header) {
  var p = this.getParser(data);

  var colour = this.colourType = header.colourType;

  if (colour === 0)
    this.greyscale = p.eatUInt(1);

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
SignificantBits.prototype.length = function length() {
  var colour = this.colourType;
  if (colour === 0)
    return 1
  if (colour === 2 || colour === 3)
    return 3;
  if (colour === 4)
    return 2;
  if (colour === 6)
    return 4;
};
SignificantBits.prototype.writeData = function writeData(output) {
  var colour = this.colourType;
  if (colour === 0)
    return output.write(this.greyscale);
  if (colour === 2 || colour === 3) {
    output
      .write(this.red)
      .write(this.green)
      .write(this.blue)
    return output;
  }
  if (colour === 4) {
    output
      .write(this.greyscale)
      .write(this.alpha);
    return output;
  }
  if (colour === 6) {
    output
      .write(this.red)
      .write(this.green)
      .write(this.blue)
      .write(this.alpha);
    return output;
  }
}

module.exports = SignificantBits;