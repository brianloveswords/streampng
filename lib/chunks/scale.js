var Base = require('./base.js');

/**
 * [Reference](ftp://ftp.simplesystems.org/pub/png/documents/pngext-1.4.0-pdg.html)
 */

var Scale = Base.make('sCAL');
Scale.prototype.initialize = function initialize(data) {
  var p = this.getParser(data);
  this.unitSpecifier = p.eatUInt(1);
  this.width = parseFloat(p.eatString());
  this.height = parseFloat(p.eatString());
}
Scale.prototype.length = function length() {
  var len = 1 // unit specifier;
  len += this.width.toString().length + 1;
  len += this.height.toString().length; // no null
  return len;
};
Scale.prototype.writeData = function writeData(output) {
  output
    .write8(this.unitSpecifier)
    .write(this.width.toString())
    .write(this.height.toString());
  return output;
};
Scale.UNIT_SPECIFIERS = [ 'meters', 'radians' ];
Scale.METERS = 0;
Scale.RADIANS = 1;

module.exports = Scale;