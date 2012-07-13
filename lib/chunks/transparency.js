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
};
Transparency.prototype.length = function length() {
  if (this.colourType === 0) return 2;
  if (this.colourType === 2) return 6;
  return this.palette.length;
};
Transparency.prototype.out = function out(callback) {
  var buf = this._outputPrepare();
  if (this.colourType === 0) {
    buf['data'].write16(this.grey);
    return callback(this._output(buf));
  }
  if (this.colourType === 2) {
    buf['data']
      .write16(this.red)
      .write16(this.green)
      .write16(this.blue)
    return callback(this._output(buf));
  }
  this.palette.forEach(function (v) {
    buf['data'].write8(v);
  });
  return callback(this._output(buf));
};
module.exports = Transparency;