var Base = require('./base');
var Colour = require('../util.js').Colour;
var BitWriter = require('../bitwriter.js');

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

Palette.prototype.out = function out(callback) {
  var buf = this._outputPrepare();
  this.colours.forEach(function (c) {
    buf['data']
      .write8(c.red)
      .write8(c.green)
      .write8(c.blue);
  });
  return callback(this._output(buf));
};
Palette.prototype.length = function length() {
  return this.colours.length * 3;
};

module.exports = Palette;
