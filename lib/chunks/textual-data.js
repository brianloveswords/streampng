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
  var length = (this.keyword.length + 1) + this.text.length;
  var buf = this._outputPrepare(length);
  buf['data']
    .write(this.keyword)
    .write(this.text)
  return callback(this._output(buf));
};
module.exports = TextualData;