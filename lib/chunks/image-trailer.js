var Base = require('./base.js');
/**
 * Marks the end of the datastream. Always an empty chunk.
 */

function ImageTrailer(data) {
  var p = this.getParser(data);
  this.type = 'IEND';
  this.critical = true;
}
Base.inherits(ImageTrailer);

module.exports = ImageTrailer;