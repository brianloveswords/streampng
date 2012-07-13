var Base = require('./base.js');
var zlib = require('zlib');
/**
 * Internationalized textual metadata
 */

var InternationalText = Base.make('iTXt');
InternationalText.prototype.initialize = function initialize(data) {
  var p = this.getParser(data);
  this.keyword = p.eatString();
  this.compressed = p.eatBool();
  this.compressionMethod = p.eatUInt(1);
  this.languageTag = p.eatString();
  this.translatedKeyword = p.eatString();
  this.compressedText = p.eatRest();
  if (!this.compressed)
    this.text = this.compressedText.toString()
};
InternationalText.prototype.out = function out(callback) {
  var buf;

  if (!this.compressed) {
    buf = this._makeBuffer(this.text);
    return callback(buf.done());
  }

  zlib.deflate(this.text, function (err, data) {
    if (err) throw new Error('there was a problem deflating the text:' + err);
    this.compressedText = data;
    buf = this._makeBuffer(data);
    callback(buf.done());
  }.bind(this));

};

InternationalText.prototype._makeBuffer = function makeBuffer(text) {
  var buf = this._outputPrepare();
  buf.data
    .write(this.keyword)
    .write(!!this.compressed | 0)
    .write(this.compressionMethod)
    .write(this.languageTag)
    .write(this.translatedKeyword)
    .write(text)
  return buf;
};
InternationalText.prototype.length = function () {
  return (
    (this.keyword.length + 1)
      + 1 // compressed
      + 1 // compressionMethod
      + (Buffer(this.languageTag).length + 1)
      + (Buffer(this.translatedKeyword).length + 1)
      + (this.compressed ? this.compressedText.length : Buffer(this.text).length)
  );
};


module.exports = InternationalText;