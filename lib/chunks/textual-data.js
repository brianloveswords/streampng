var Base = require('./base.js');
/**
 * Plaintext metadata
 */

var TextualData = Base.make('tEXt');
TextualData.prototype.initialize = function initialize(data) {
  var p = this.getParser(data);
  this.keyword = p.eatString();
  this.text = p.eatRest().toString();
};
TextualData.prototype.out = function out(callback) {
  var buf = this._outputPrepare();
  buf['data']
    .write(this.keyword)
    .write(this.text)
  return callback(this._output(buf));
};
TextualData.prototype.length = function length() {
  return (this.keyword.length + 1) + Buffer(this.text).length;
};
module.exports = TextualData;