var Base = require('./base.js');

/**
 * [Reference](ftp://ftp.simplesystems.org/pub/png/documents/pngext-1.4.0-pdg.html)
 */

function Stereogram(data) {
  var p = this.getParser(data);
  var validModes = ['cross-fuse', 'diverging-fuse'];
  this.type = 'sTER';
  this.mode = p.eatUInt(1);
}
Base.inherits(Stereogram);

module.exports = Stereogram;