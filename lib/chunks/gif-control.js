var Base = require('./base.js');
/**
 * [Reference](ftp://ftp.simplesystems.org/pub/png/documents/pngext-1.4.0-pdg.html)
 */

var GifControl = Base.make('gIFg');
GifControl.prototype.initialize = function initialize(data) {
  var p = this.getParser(data);
  this.disposalMethod = p.eatUInt(1);
  this.userInput = p.eatBool();
  this.delay = p.eatUInt(2);
};
GifControl.prototype.length = function length() { return 4 };
GifControl.prototype.writeData = function writeData(output) {
  output
    .write(this.disposalMethod)
    .write(this.userInput | 0)
    .write16(this.delay)
  return output
};
GifControl.DISPOSAL_METHODS = ['none', 'background', 'previous'];
GifControl.NONE = 0;
GifControl.BACKGROUND = 1;
GifControl.PREVIOUS = 2;

module.exports = GifControl;