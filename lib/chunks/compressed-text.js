var Base = require('./base.js');

/**
 * Compressed textual metadata.
 */

function CompressedText(data) {
  var p = this.getParser(data);
  this.type = 'zTXt';
  this.keyword = p.eatString();
  this.compressionMethod = p.eatUInt(1);
  this.compressedText = p.eatRest();
}
Base.inherits(CompressedText);

module.exports = CompressedText;