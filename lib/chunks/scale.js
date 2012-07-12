var Base = require('./base.js');

/**
 * [Reference](ftp://ftp.simplesystems.org/pub/png/documents/pngext-1.4.0-pdg.html)
 */

function Scale(data) {
  var p = this.getParser(data);
  var validSpecifiers = ['meters', 'radians'];
  this.type = 'sCAL';
  this.unitSpecifier = p.eatUInt(1);
  this.width = parseFloat(p.eatString());
  this.height = parseFloat(p.eatString());
}
Base.inherits(Scale);

module.exports = Scale;