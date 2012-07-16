var Base = require('./base.js');

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

ImageData.prototype.writeData = function writeData(output) {
  output.write(this.data);
  return output;
};
ImageData.prototype.length = function length() {
  return this.data.length;
};

module.exports = ImageData;
