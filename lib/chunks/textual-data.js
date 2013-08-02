var Base = require('./base.js');
/**
 * Plaintext metadata
 */

var TextualData = Base.make('tEXt');
TextualData.prototype.initialize = function initialize(data) {
  var p = this.getParser(data);
  this.keyword = p.eatString();
  var rest = p.eatRest();
  this.text = (rest && rest !== null)? rest.toString(): '';
};
TextualData.prototype.writeData = function writeData(output) {
  output
    .write(this.keyword)
    .write(this.text)
  return output;
};
TextualData.prototype.length = function length() {
  return (this.keyword.length + 1) + Buffer(this.text).length;
};
module.exports = TextualData;
