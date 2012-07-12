var Base = require('./base.js');

/**
 * [Reference](ftp://ftp.simplesystems.org/pub/png/documents/pngext-1.4.0-pdg.html)
 */

function GifApplication(data) {
  var p = this.getParser(data);
  this.type = 'gIFx';
  this.appIdentifier = p.eat(8).toString().replace(/\u0000/g, '');
  this.authCode = p.eat(3);
  this.appData = p.eatRest();
}
Base.inherits(GifApplication);

module.exports = GifApplication;
