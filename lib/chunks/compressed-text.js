var Base = require('./base.js');
var zlib = require('zlib');

/**
 * Compressed textual metadata.
 */

var CompressedText = Base.make('zTXt');
CompressedText.prototype.initialize = function initialize(data) {
  var p = this.getParser(data);
  this.keyword = p.eatString();
  this.compressionMethod = p.eatUInt(1);
  this.compressedText = p.eatRest();
  this.text = null;
};

CompressedText.prototype.out = function (callback) {
  zlib.deflate(this.text, function (err, data) {
    if (err) {
      err.message = 'there was a problem deflating the text: ' + err.message;
      callback(err);
    }

    var length  = (this.keyword.length + 1) + 1 + data.length;
    var output = this._outputPrepare(length);

    output
      .write(this.keyword)
      .write(this.compressionMethod || 0)
      .write(data)

    output.done(callback);
  }.bind(this));
};

module.exports = CompressedText;