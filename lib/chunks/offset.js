var Base = require('./base.js');
var Point = require('../util.js').Point;

/**
 * [Reference](ftp://ftp.simplesystems.org/pub/png/documents/pngext-1.4.0-pdg.html)
 */

function Offset(data) {
  var p = this.getParser(data);
  var validSpecifiers = [ 'pixels', 'microns' ];
  var x = p.eatInt(4);
  var y = p.eatInt(4);
  this.type = 'oFFs';
  this.position = new Point(x, y);
  this.specifier = p.eat(1);
}
Base.inherits(Offset, Base);

module.exports = Offset;