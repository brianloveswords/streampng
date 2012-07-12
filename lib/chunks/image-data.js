var Base = require('./base.js');
/**
 * The compressed datastream is then the concatenation of the contents
 * of the data fields of all the IDAT chunks.
 */

function ImageData(data) {
  var p = this.getParser(data);
  this.type = 'IDAT';
  this.critical = true;
  this.data = p.getBuffer();
}
Base.inherits(ImageData);

module.exports = ImageData;
