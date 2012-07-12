var Base = require('./base.js');

/**
 * The bKGD chunk specifies a default background colour to present
 * the image against. If there is any other preferred background,
 * either user-specified or part of a larger page (as in a browser),
 * the bKGD chunk should be ignored.
 *
 * [Reference](http://www.w3.org/TR/PNG/#11bKGD)
 */

function BackgroundColour(data, header) {
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
}
Base.inherits(BackgroundColour);

module.exports = BackgroundColour;