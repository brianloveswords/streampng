var Base = require('./base.js');
/**
 * [Reference](ftp://ftp.simplesystems.org/pub/png/documents/pngext-1.4.0-pdg.html)
 */

function GifControl(data) {
  var p = this.getParser(data);
  this.type = 'gIFg';
  this.disposalMethod = p.eatUInt(1);
  this.userInput = p.eatBool();
  this.delay = p.eatUInt(2);
}
Base.inherits(GifControl);
GifControl.DISPOSAL_METHODS = ['none', 'background', 'previous'];

module.exports = GifControl;