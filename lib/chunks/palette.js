var Base = require('./base');
var Colour = require('../util.js').Colour;

/**
 * Palette for indexed images.
 */
var Palette = Base.make('PLTE');
Palette.prototype.initialize = function initialize(data) {
// #TODO: make sure data.length is divisible by 3
  var p = this.getParser(data);
  this.critical = true;
  this.colours = []

  var rgb;
  while ((rgb = p.eat(3)))
    this.colours.push(new Colour(rgb[0], rgb[1], rgb[2]));
};

Palette.prototype.writeData = function writeData(output) {
  var colours = this.colours || this.colors;
  colours.forEach(function (c) {
    output
      .write8(c.red)
      .write8(c.green)
      .write8(c.blue);
  });
  return output
};
Palette.prototype.length = function length() {
  return this.colours.length * 3;
};

module.exports = Palette;
