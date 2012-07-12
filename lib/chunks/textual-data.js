var Base = require('./base.js');
/**
 * Plaintext metadata
 */

function TextualData(data) {
  var p = this.getParser(data);
  this.type = 'tEXt';
  this.keyword = p.eatString();
  this.text = p.eatRest().toString();
}
Base.inherits(TextualData);

module.exports = TextualData;