var Base = require('./base.js');

/**
 * The tRNS chunk specifies either alpha values that are associated with
 * palette entries (for indexed-colour images) or a single transparent
 * colour (for greyscale and truecolour images).
 *
 * [Reference](http://www.w3.org/TR/PNG/#11tRNS)
 */

var Transparency = Base.make('tRNS');
Transparency.prototype.initialize = function initialize(data, header) {
  // #TODO: error checking
  var p = this.getParser(data);
  this.type = 'tRNS';

  var colour = this.colourType = header.colourType;

  if (colour === 0)
    this.greyscale = p.eatUInt(2);

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
};
Transparency.prototype.length = function length() {
  var colour = this.colourType;
  if (colour === 0) return 2;
  if (colour === 2) return 6;
  return this.palette.length;
};
Transparency.prototype.writeData = function writeData(output) {
  var colour = this.colourType;

  if (colour === 0) {
    output.write16(this.greyscale);
    return output;
  }

  if (colour === 2) {
    output
      .write16(this.red)
      .write16(this.green)
      .write16(this.blue)
    return output;
  }

  this.palette.forEach(output.write8);
  return output;
};
module.exports = Transparency;