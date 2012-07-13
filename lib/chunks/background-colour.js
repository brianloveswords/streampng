var Base = require('./base.js');

/**
 * The bKGD chunk specifies a default background colour to present
 * the image against. If there is any other preferred background,
 * either user-specified or part of a larger page (as in a browser),
 * the bKGD chunk should be ignored.
 *
 * [Reference](http://www.w3.org/TR/PNG/#11bKGD)
 */

var BackgroundColour = Base.make('bKGD');
BackgroundColour.prototype.initialize = function initialize(data, header) {
  var p = this.getParser(data);
  this.type = 'bKGD';

  var colour = this.colourType = header.colourType;

  if (colour === 0 || colour === 4)
    this.greyscale = p.eatUInt(2);

  else if (colour === 2 || colour === 6) {
    this.red = p.eatUInt(2);
    this.green = p.eatUInt(2);
    this.blue = p.eatUInt(2);
  }

  else // if (colour === 3)
    this.paletteIndex = p.eatUInt(1);
};
BackgroundColour.prototype.writeData = function writeData(output) {
  var colour = this.colourType;

  if (colour === 0 || colour === 4) {
    output.write8(this.greyscale);
    return output;
  }

  if (colour === 2 || colour === 6) {
    output
      .write16(this.red)
      .write16(this.green)
      .write16(this.blue);
    return output;
  }

  output.write8(this.paletteIndex);
  return output;
};
BackgroundColour.prototype.length = function length() {
  var colour = this.colourType;
  if (colour === 0 || colour === 4) return 2;
  if (colour === 2 || colour === 6) return 6;
  return 1;
};

module.exports = BackgroundColour;