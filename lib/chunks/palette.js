var Base = require('./base');
var Colour = require('../util.js').Colour;

/**
 * Palette for indexed images.
 */
function Palette(data) {
  // #TODO: make sure data.length is divisible by 3
  var p = this.getParser(data);

  this.critical = true;
  this.colours = []

  var rgb;
  while ((rgb = p.eat(3)))
    this.colours.push(new Colour(rgb[0], rgb[1], rgb[2]));
}
Base.inherits(Palette);

module.exports = Palette;
