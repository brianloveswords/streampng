var Base = require('./base.js');

/**
 * The tRNS chunk specifies either alpha values that are associated with
 * palette entries (for indexed-colour images) or a single transparent
 * colour (for greyscale and truecolour images).
 *
 * [Reference](http://www.w3.org/TR/PNG/#11tRNS)
 */

function Transparency(data, header) {
  // #TODO: error checking
  var p = this.getParser(data);
  this.type = 'tRNS';

  var colour = this.colourType = header.colourType;

  if (colour === 0)
    this.grey = p.eatUInt(2);

  else if (colour === 2) {
    this.red = p.eatUInt(2);
    this.green = p.eatUInt(2);
    this.blue = p.eatUInt(2);
  }

  else if (colour === 3) {
    var value;
    this.palette = []
    while ((value = p.eat(1)))
      this.palette.push(value.readUInt8(0));
  }
}
Base.inherits(Transparency);

module.exports = Transparency;