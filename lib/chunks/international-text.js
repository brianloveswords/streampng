var Base = require('./base.js');

/**
 * Internationalized textual metadata
 */

function InternationalText(data) {
  var p = this.getParser(data);
  this.type = 'iTXt';
  this.keyword = p.eatString();
  this.compressed = p.eatBool();
  this.compressionMethod = p.eat(1);
  this.languageTag = p.eatString();
  this.translatedKeyword = p.eatString();
  this.compressedText = p.eatRest();

  if (!this.compressed)
    this.text = this.compressedText.toString().replace(/\u0000$/, '')
}
Base.inherits(InternationalText);

module.exports = InternationalText;