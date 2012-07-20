var Base = require('./base.js');

/**
 * [Reference](ftp://ftp.simplesystems.org/pub/png/documents/pngext-1.4.0-pdg.html)
 */

function Stereogram(data) {
  var p = this.getParser(data);
  this.type = 'sTER';
  this.mode = p.eatUInt(1);
}
Base.inherits(Stereogram);
Stereogram.MODES = [ 'cross-fuse', 'diverging-fuse' ];
Stereogram.CROSS_FUSE = 0;
Stereogram.DIVERGING_FUSE = 1;
module.exports = Stereogram;