var Base = require('./base.js');

/**
 * [Reference](ftp://ftp.simplesystems.org/pub/png/documents/pngext-1.4.0-pdg.html)
 */

var GifApplication = Base.make('gIFx');
GifApplication.prototype.initialize = function initialize(data) {
  var p = this.getParser(data);
  this.appIdentifier = p.eat(8).toString().replace(/\u0000/g, '');
  this.authCode = p.eat(3);
  this.appData = p.eatRest();
}
GifApplication.prototype.length = function length() {
  var len = 8; // appIdentifier
  len += 3 // auth code
  len += this.appData.length
  return len;
};
GifApplication.prototype.writeData = function writeData(output) {
  output
    .writeString(this.appIdentifier, { size: 8 })
    .write(this.authCode)
    .write(this.appData)
  return output;
};
module.exports = GifApplication;
