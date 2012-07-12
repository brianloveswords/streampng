var Base = require('./base.js');
var BitWriter = require('../bitwriter.js');
/**
 * The compressed datastream is then the concatenation of the contents
 * of the data fields of all the IDAT chunks.
 */

var ImageData = Base.make('IDAT');
ImageData.prototype.initialize = function initialize(data) {
  var p = this.getParser(data);
  this.type = 'IDAT';
  this.critical = true;
  this.data = p.getBuffer();
};

ImageData.prototype.out = function out(callback) {
  var length = this.data.length;
  var buf = this._outputPrepare(length);
  buf['data'] = this.data;
  return callback(this._output(buf));
};

module.exports = ImageData;
