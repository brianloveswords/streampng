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

Palette.prototype.buffer = function buffer() {
  var length = this.colours.length * 3;
  var typebuf = this._rawType = BitWriter(this.type);
  var databuf = this._rawData = BitWriter(length);
  var lenbuf = BitWriter(4);
  lenbuf.write32(length);
  this.colours.forEach(function (c) {
    databuf.write8(c.red);
    databuf.write8(c.green);
    databuf.write8(c.blue);
  });
  var crcbuf = this.crcCalculated();
  return Buffer.concat([ lenbuf, typebuf, databuf, crcbuf ]);
};

module.exports = Palette;
